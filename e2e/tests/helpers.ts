import { readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";

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
  /** Extra Storybook globals, e.g. `preset:cyan;fontSize:20` (ADR-0017 toolbar). */
  globals = "",
) {
  // Components animate color changes; reduced motion (honored by the CSS) makes reads instant.
  await page.emulateMedia({ reducedMotion: "reduce" });
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

/** A component story rendered by one framework: `components-<folder>-<component>--<story>@<impl>`. */
export const storyId = (impl: Implementation, component: string, story: string) => {
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
      "data-ok-popover-open",
      "data-ok-popover-hover",
      "data-ok-toast-open",
      "data-ok-toaster-position",
      "data-ok-backdrop-open",
      "data-ok-backdrop-close",
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
      for (const { name, value } of Array.from(element.attributes).sort((a, b) =>
        a.name.localeCompare(b.name),
      )) {
        if (IGNORED.has(name)) continue;
        attrs[name] = REFERENCES.has(name) ? "<ref>" : value;
      }
      if (element instanceof HTMLInputElement) {
        attrs[":checked"] = String(element.checked);
        attrs[":disabled"] = String(element.disabled);
      }
      if (element instanceof HTMLSelectElement) attrs[":value"] = element.value;
      const children: (NormalizedNode | string)[] = [];
      if (element.localName !== "svg") {
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
      entry.id.startsWith("components-")
        ? implementations.map((impl) => `${entry.id}@${impl}`)
        : [entry.id],
    );
}

/**
 * Brand-colored text follows the reference look, not AA (ADR-0014): colored contained / outlined /
 * text buttons, fabs, pressed colored toggles and swatches are exempt from `color-contrast` only.
 */
export const CONTRAST_EXEMPT = [
  '[data-ok-button][data-ok-color]:not([data-ok-color="inherit"]):not([data-ok-variant="soft"])',
  '[data-ok-fab]:not([data-ok-variant="soft"])',
  '[data-ok-toggle-button][aria-pressed="true"]:not([data-ok-color="standard"])',
  '[data-ok-alert]:not([data-ok-variant="standard"])',
  '[data-ok-pagination]:not([data-ok-color="standard"]):not([data-ok-variant="soft"]) [aria-current="page"]',
  '[data-ok-avatar]:not([data-ok-color="default"])',
  '[data-ok-badge]:not([data-ok-color="default"]) > [data-ok-badge-badge]',
  '[data-ok-chip]:not([data-ok-color="default"]):not([data-ok-variant="soft"])',
  '[data-ok-chip][data-ok-color="white"]',
  '[data-ok-label][data-ok-variant="filled"]:not([data-ok-color="default"])',
  '[data-ok-label][data-ok-variant="outlined"]:not([data-ok-color="default"])',
  '[data-ok-label][data-ok-color="white"]',
  '[data-ok-chip][data-ok-color="black"]',
  '[data-ok-label][data-ok-color="black"]',
  "[data-swatch]",
  '[data-ok-list-subheader][data-ok-color="primary"]',
  '[data-ok-tabs]:not([data-ok-text-color="inherit"]) [role="tab"][aria-selected="true"]',
  '[data-ok-picker-day][aria-selected="true"]',
  '[data-ok-picker-month][aria-checked="true"]',
  '[data-ok-picker-year][aria-checked="true"]',
  '[data-ok-digital-clock-item][aria-selected="true"]',
  '[data-ok-time-clock-number][aria-selected="true"]',
  '[data-ok-time-clock-meridiem][aria-pressed="true"]',
  "[data-ok-editor-content] a",
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
