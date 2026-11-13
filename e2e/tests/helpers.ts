import { readFileSync } from "node:fs";
import { type BrowserContext, expect, type Locator, type Page } from "@playwright/test";

export type Implementation = "react" | "html";
export const implementations: Implementation[] = ["react", "html"];

/**
 * Opens one story in the bare Storybook iframe (no manager UI). Component stories render the
 * framework chosen in the toolbar (ADR-0018): their ids carry it as `<story id>@<framework>`.
 */
export async function openStory(
  page: Page,
  id: string,
  theme: "light" | "dark" = "light",
  /** Storybook URL args, e.g. `size:lg;disabled:!true`. */
  args = "",
  /** Extra Storybook globals, e.g. `fontSize:20` (the toolbar's theme settings). */
  globals = "",
) {
  // Components animate color changes; reduced motion (honored by the CSS) makes reads instant.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await routeMapTiles(page);
  const [story, framework] = id.split("@");
  const all = [
    `theme:${theme}`,
    "a11y.manual:!true",
    framework && `framework:${framework}`,
    globals,
  ]
    .filter(Boolean)
    .join(";");
  await page.goto(
    `/apps/storybook/storybook-static/iframe.html?id=${story}&viewMode=story&globals=${all}${args ? `&args=${args}` : ""}`,
  );
  await page.locator("#storybook-root > *").first().waitFor();
  await page.waitForFunction((t) => document.documentElement.dataset["okTheme"] === t, theme);
  // Let the HTML runtime's MutationObserver flush (it mounts on a microtask).
  await page.evaluate(() => new Promise((r) => setTimeout(r, 0)));
}

/**
 * Repaints the story from scratch before a pixel comparison. Pixels depend on raster history, not
 * only on the DOM: a picture decoded after the first paint is drawn into its own rectangle later,
 * and the anti-aliased edges that overlap it (a selected carousel thumbnail's rounded ring) come
 * out a few levels different from a page painted in one go. Which happens is a race per page load,
 * so identical markup gave different pixels about once in 30 loads under load. Hiding the story
 * for a frame (after every loaded picture is decoded) makes the next paint a full one. Skipped
 * when the focus is inside the story: hiding it would blur the focused element.
 */
export async function repaintFromScratch(page: Page) {
  await page.evaluate(async () => {
    const frames = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const root = document.getElementById("storybook-root");
    if (!root || root.contains(document.activeElement)) return;
    // Lazy pictures that never loaded (off screen) would never decode: only loaded ones.
    const loaded = [...document.images].filter((image) => image.complete && image.naturalWidth);
    await Promise.all(loaded.map((image) => image.decode().catch(() => {})));
    root.style.visibility = "hidden";
    await frames();
    root.style.removeProperty("visibility");
    await frames();
  });
}

/**
 * Map stories (ADR-0025) load OpenFreeMap styles: tests serve an offline style instead (Natural
 * Earth land, public domain; no tiles, no glyphs), so they never depend on the network.
 */
const LAND = readFileSync(new URL("../fixtures/map/land.geojson", import.meta.url), "utf8");
const MAP_COLORS: Record<string, [water: string, land: string]> = {
  positron: ["#d4dadc", "#f8f8f6"],
  dark: ["#1c2329", "#3a4148"],
  liberty: ["#a0c8f0", "#f2efe9"],
};
const routed = new WeakSet<BrowserContext>();
export async function routeMapTiles(page: Page) {
  const context = page.context();
  if (routed.has(context)) return;
  routed.add(context);
  await context.route(/^https:\/\/tiles\.openfreemap\.org\//, (route) => {
    const name = /\/styles\/([a-z]+)/.exec(route.request().url())?.[1] ?? "";
    const colors = MAP_COLORS[name];
    if (!colors) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        version: 8,
        name: `Offline ${name}`,
        glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
        sources: {
          land: { type: "geojson", data: JSON.parse(LAND), attribution: "Natural Earth" },
        },
        layers: [
          { id: "background", type: "background", paint: { "background-color": colors[0] } },
          { id: "land", type: "fill", source: "land", paint: { "fill-color": colors[1] } },
        ],
      }),
    });
  });
}

/** Storybook folder of each component (sidebar `Components/<Folder>/<Component>`), if nested. */
const FOLDERS: Record<string, string> = {
  button: "button",
  "icon-button": "button",
  fab: "button",
  "button-group": "button",
  "toggle-button": "button",
  "circular-progress": "progress",
  "linear-progress": "progress",
};

/** Foundations whose stories have both frameworks (ADR-0018 toolbar): `foundations-<name>--…`. */
const FRAMEWORK_FOUNDATIONS = ["illustrations"];

/** A component story rendered by one framework: `components-<folder>-<component>--<story>@<impl>`. */
export const storyId = (impl: Implementation, component: string, story: string) => {
  if (FRAMEWORK_FOUNDATIONS.includes(component))
    return `foundations-${component}--${story}@${impl}`;
  const folder = FOLDERS[component];
  return `components-${folder ? `${folder}-` : ""}${component}--${story}@${impl}`;
};

export interface NormalizedNode {
  tag: string;
  attrs: Record<string, string>;
  children: (NormalizedNode | string)[];
}

/**
 * Serializes the story DOM into a structure that must be identical for both implementations:
 * tags, data-ok-* / ARIA / type attributes, live form state and text. Generated ids, React's
 * runtime opt-out and HTML-only behavior hooks are normalized away.
 */
export function normalizeStory(page: Page): Promise<NormalizedNode> {
  return page.evaluate(() => {
    const IGNORED = new Set([
      "class",
      "style",
      "id",
      "checked",
      "data-ok-runtime",
      // HTML runtime hooks and options; React expresses these as event handlers and props.
      "data-ok-dialog-open",
      "data-ok-dialog-close",
      "data-ok-open",
      "data-ok-drawer-open",
      "data-ok-drawer-close",
      "data-ok-lightbox-open",
      "data-ok-walktour-start",
      "data-ok-popover-open",
      "data-ok-popover-hover",
      "data-ok-toast-open",
      "data-ok-toaster-position",
      "data-ok-backdrop-open",
      "data-ok-backdrop-close",
      "data-ok-collapse-toggle",
      "data-ok-select-open",
      "data-ok-current-placement",
      "data-ok-sortable-add",
      // HTML runtime state and options (React keeps them in props / state).
      "data-ok-count",
      "data-ok-page",
      "data-ok-sibling-count",
      "data-ok-boundary-count",
      "data-ok-label-page",
      "data-ok-label-current",
      "data-ok-rows-per-page",
      "data-ok-table-dense",
      "data-ok-text-field-reveal",
      "data-ok-clipboard-copy",
      "data-ok-clipboard-trigger",
      "data-ok-clipboard-text",
      "data-ok-clipboard-toast",
      "data-ok-clipboard-error-toast",
      "data-ok-stepper-next",
      "data-ok-stepper-back",
      "data-ok-stepper-reset",
      "data-ok-stepper-panel",
      "data-ok-stepper-panel-step",
      "data-ok-mobile-stepper-next",
      "data-ok-mobile-stepper-back",
      "data-ok-mobile-stepper-panel",
      "data-ok-label-step",
      "data-ok-expand-text",
      // Countdown triggers (React: `paused` and `key`).
      "data-ok-countdown-toggle",
      "data-ok-countdown-restart",
      // Code editor: Monaco loads asynchronously (parity waits for `ready` where it matters).
      "data-ok-status",
      // Map (ADR-0025): HTML triggers; React opens popups and flies the map from handlers.
      "data-ok-map-popup-open",
      "data-ok-map-fly-to",
      "data-ok-geometry",
      // React sets <option> selection as a property (compared through the select's :value).
      "selected",
    ]);
    const REFERENCES = new Set([
      "aria-labelledby",
      "aria-describedby",
      "aria-controls",
      "for",
      "data-ok-table-pagination",
      "data-ok-pagination",
      "data-ok-table-expand",
    ]);

    function walk(element: Element): NormalizedNode {
      const attrs: Record<string, string> = {};
      // Monaco's DOM (instance ids, measured layout) is the engine's: e2e code-editor specs cover
      // it. Its mount element keeps only Owlky's own attributes.
      const engine =
        element.hasAttribute("data-ok-code-editor-content") ||
        element.hasAttribute("data-ok-diff-editor-content");
      // A Map fly-to trigger's view and duration are HTML-only too (scoped: Motion and Snackbar
      // use `data-ok-duration` as an option).
      const flyTo = element.hasAttribute("data-ok-map-fly-to");
      for (const { name, value } of Array.from(element.attributes).sort((a, b) =>
        a.name.localeCompare(b.name),
      )) {
        if (IGNORED.has(name) || (engine && !name.startsWith("data-ok-"))) continue;
        if (flyTo && (name === "data-ok-view" || name === "data-ok-duration")) continue;
        attrs[name] = REFERENCES.has(name) ? "<ref>" : value;
      }
      if (element instanceof HTMLInputElement) {
        attrs[":checked"] = String(element.checked);
        attrs[":disabled"] = String(element.disabled);
      }
      if (element instanceof HTMLSelectElement) attrs[":value"] = element.value;
      const children: (NormalizedNode | string)[] = [];
      if (element.localName !== "svg" && !engine) {
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.replace(/\s+/g, " ") ?? "";
            const last = children[children.length - 1];
            if (typeof last === "string") children[children.length - 1] = last + text;
            else children.push(text);
          } else if (
            child instanceof Element &&
            child.localName !== "template" &&
            // React 19 adds <link rel="preload"> resource hints next to images.
            child.localName !== "link" &&
            !child.hasAttribute("hidden")
          ) {
            // <template> holds HTML-only markup for new items (React renders them from state);
            // hidden rows are pages the HTML runtime keeps in the DOM (React renders one page).
            children.push(walk(child));
          }
        }
      }
      return {
        tag: element.localName,
        attrs,
        children: children
          .map((c) => (typeof c === "string" ? c.trim() : c))
          .filter((c) => c !== ""),
      };
    }

    const root = document.querySelector("#storybook-root > *");
    if (!root) throw new Error("Story did not render");
    return walk(root);
  });
}

/**
 * Story ids from the built Storybook index (run `pnpm storybook:build` first). Component stories
 * come once per framework (`…@react`, `…@html`), so every check still covers both.
 */
export function storyIds(prefix: string): string[] {
  const index = JSON.parse(
    readFileSync(
      new URL("../../apps/storybook/storybook-static/index.json", import.meta.url),
      "utf8",
    ),
  ) as { entries: Record<string, { id: string; type: string }> };
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story" && entry.id.startsWith(prefix))
    .flatMap((entry) =>
      entry.id.startsWith("components-") ||
      FRAMEWORK_FOUNDATIONS.some((name) => entry.id.startsWith(`foundations-${name}--`))
        ? implementations.map((impl) => `${entry.id}@${impl}`)
        : [entry.id],
    );
}

/**
 * Parts exempt from axe `color-contrast`: only inactive (disabled) ones, as WCAG 1.4.3 allows.
 * Every other color pair, brand colors included, meets AA (ADR-0070 § 7).
 */
export const CONTRAST_EXEMPT = [
  // Only inactive parts (WCAG 1.4.3 exception): every other color pair meets AA (ADR-0070 § 7).
  "[data-ok-label][data-ok-disabled]",
  // Disabled text (Typography and Link `textDisabled`) marks inactive content.
  '[data-ok-typography][data-ok-color="textDisabled"]',
  // A disabled upload zone is an inactive component.
  "[data-ok-upload-zone]:has(> [data-ok-upload-input]:disabled)",
  // The label of a disabled Select is inactive, like TextField's.
  "[data-ok-form-control]:has(> [data-ok-select] > [data-ok-select-input]:disabled) > [data-ok-input-label]",
];

/** Waits until ProseMirror has read the DOM selection (WebKit reports it on a later task). */
export async function editorSelected(textbox: Locator) {
  await expect
    .poll(() =>
      textbox.evaluate(
        (element) =>
          (element as unknown as { editor: { state: { selection: { empty: boolean } } } }).editor
            .state.selection.empty,
      ),
    )
    .toBe(false);
}
