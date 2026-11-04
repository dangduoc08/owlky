import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

export type Implementation = "react" | "html";
export const implementations: Implementation[] = ["react", "html"];

/** Opens one story in the bare Storybook iframe (no manager UI). */
export async function openStory(page: Page, id: string, theme: "light" | "dark" = "light") {
  // Components animate color changes; reduced motion (honored by the CSS) makes reads instant.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    `/apps/storybook/storybook-static/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
  );
  await page.locator("#storybook-root > *").first().waitFor();
  await page.waitForFunction((t) => document.documentElement.dataset["mtTheme"] === t, theme);
  // Let the HTML runtime's MutationObserver flush (it mounts on a microtask).
  await page.evaluate(() => new Promise((r) => setTimeout(r, 0)));
}

export const storyId = (impl: Implementation, component: string, story: string) =>
  `${impl}-${component}--${story}`;

export interface NormalizedNode {
  tag: string;
  attrs: Record<string, string>;
  children: (NormalizedNode | string)[];
}

/**
 * Serializes the story DOM into a structure that must be identical for both implementations:
 * tags, data-mt-* / ARIA / type attributes, live form state and text. Generated ids, React's
 * runtime opt-out and HTML-only behavior hooks are normalized away.
 */
export function normalizeStory(page: Page): Promise<NormalizedNode> {
  return page.evaluate(() => {
    const IGNORED = new Set([
      "class",
      "style",
      "id",
      "checked",
      "data-mt-runtime",
      // HTML runtime hooks and options; React expresses these as event handlers and props.
      "data-mt-dialog-open",
      "data-mt-dialog-close",
      "data-mt-escape-close",
      "data-mt-backdrop-close",
      "data-mt-open",
    ]);
    const REFERENCES = new Set(["aria-labelledby", "aria-describedby", "aria-controls", "for"]);

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
      const children: (NormalizedNode | string)[] = [];
      if (element.localName !== "svg") {
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.replace(/\s+/g, " ") ?? "";
            const last = children[children.length - 1];
            if (typeof last === "string") children[children.length - 1] = last + text;
            else children.push(text);
          } else if (child instanceof Element) {
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

/** Story ids from the built Storybook index (run `pnpm storybook:build` first). */
export function storyIds(prefix: string): string[] {
  const index = JSON.parse(
    readFileSync(
      new URL("../../apps/storybook/storybook-static/index.json", import.meta.url),
      "utf8",
    ),
  ) as { entries: Record<string, { id: string; type: string }> };
  return Object.values(index.entries)
    .filter((entry) => entry.type === "story" && entry.id.startsWith(prefix))
    .map((entry) => entry.id);
}
