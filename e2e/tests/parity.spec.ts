import { expect, test } from "@playwright/test";
import { normalizeStory, openStory, storyId } from "./helpers.js";

/**
 * React ↔ HTML parity: the same story in both implementations must produce the same DOM
 * anatomy and the same pixels. This is the contract that lets both share one stylesheet.
 */
const pairs: [component: string, story: string][] = [
  ["button", "contained"],
  ["button", "outlined"],
  ["button", "text"],
  ["button", "soft"],
  ["icon-button", "base"],
  ["icon-button", "colors"],
  ["icon-button", "sizes"],
  ["icon-button", "with-animate"],
  ["fab", "default"],
  ["fab", "outlined"],
  ["fab", "soft"],
  ["fab", "with-animate"],
  ["button-group", "contained"],
  ["button-group", "outlined"],
  ["button-group", "text"],
  ["button-group", "soft"],
  ["button-group", "sizes"],
  ["button-group", "orientation"],
  ["toggle-button", "exclusive"],
  ["toggle-button", "multiple"],
  ["toggle-button", "sizes"],
  ["toggle-button", "disabled"],
  ["toggle-button", "colors"],
  ["toggle-button", "vertical"],
  ["accordion", "simple"],
  ["accordion", "controlled"],
  ["accordion", "custom-styles"],
  ["alert", "standard"],
  ["alert", "filled"],
  ["alert", "outlined"],
  ["alert", "description"],
  ["alert", "actions"],
  ["drawer", "anchor"],
  ["drawer", "variants"],
  ["sortable", "grid"],
  ["pagination", "shapes"],
  ["pagination", "variants"],
  ["pagination", "sizes"],
  ["pagination", "buttons"],
  ["pagination", "ranges"],
  ["pagination", "custom-icons"],
  ["pagination", "table"],
  ["table", "basic"],
  ["table", "sorting-selecting"],
  ["table", "grouping-fixed-header"],
  ["table", "collapsible"],
  ["table", "pagination-with-api"],
  ["scrollbar", "vertical"],
  ["scrollbar", "horizontal"],
  ["scrollbar", "layout"],
  ["sortable", "vertical"],
  ["sortable", "horizontal"],
  ["circular-progress", "indeterminate"],
  ["circular-progress", "determinate"],
  ["circular-progress", "sizes"],
  ["linear-progress", "indeterminate"],
  ["linear-progress", "determinate"],
  ["linear-progress", "buffer"],
  ["linear-progress", "query"],
  ["checkbox", "basic"],
  ["checkbox", "sizes"],
  ["checkbox", "custom-icons"],
  ["checkbox", "placement"],
  ["checkbox", "colors"],
  ["checkbox", "indeterminate"],
  ["switch", "basic"],
  ["switch", "sizes"],
  ["switch", "placements"],
  ["switch", "colors"],
  ["radio", "basic"],
  ["radio", "sizes"],
  ["radio", "placement"],
  ["radio", "colors"],
  ["text-field", "outlined"],
  ["text-field", "filled"],
  ["text-field", "standard"],
  ["avatar", "image"],
  ["avatar", "icon"],
  ["avatar", "letter"],
  ["avatar", "variant"],
  ["avatar", "grouped"],
  ["avatar", "with-badge"],
  ["avatar", "sizes"],
  ["badge", "standard"],
  ["badge", "dot"],
  ["badge", "status"],
  ["badge", "maximum-value"],
  ["badge", "badge-overlap"],
  ["chip", "filled"],
  ["chip", "outlined"],
  ["chip", "soft"],
  ["label", "filled"],
  ["label", "outlined"],
  ["label", "soft"],
  ["label", "inverted"],
  ["label", "with-icon"],
  ["divider", "variants"],
  ["divider", "orientation"],
  ["divider", "flex-item"],
  ["divider", "with-children"],
  ["divider", "icon-grouping"],
  ["list", "simple"],
  ["list", "nested"],
  ["list", "folder"],
  ["list", "selected"],
  ["list", "controls"],
  ["list", "switch"],
  ["popover", "click-hover"],
  ["popover", "custom-arrow"],
  ["tooltip", "simple"],
  ["tooltip", "arrow"],
  ["tooltip", "variable-width"],
  ["tooltip", "transitions"],
  ["tooltip", "positioned"],
  ["menu", "simple"],
  ["menu", "selected"],
  ["menu", "max-height"],
  ["dialog", "simple"],
  ["dialog", "alerts"],
  ["dialog", "transitions"],
  ["dialog", "form"],
  ["dialog", "full-screen"],
  ["dialog", "max-width"],
  ["dialog", "scrolling-content"],
  ["snackbar", "default"],
  ["snackbar", "status"],
  ["snackbar", "custom"],
  ["snackbar", "anchor-origin"],
  ["backdrop", "example"],
];

for (const [component, story] of pairs) {
  test.describe(`${component} / ${story}`, () => {
    test("has identical anatomy in React and HTML", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Structure is browser-independent.");
      await openStory(page, storyId("react", component, story));
      const react = await normalizeStory(page);
      await openStory(page, storyId("html", component, story));
      const html = await normalizeStory(page);
      expect(react).toEqual(html);
    });

    test("renders identical pixels in React and HTML", async ({ page }) => {
      for (const theme of ["light", "dark"] as const) {
        await openStory(page, storyId("react", component, story), theme);
        const react = await page.locator("#storybook-root").screenshot({ animations: "disabled" });
        await openStory(page, storyId("html", component, story), theme);
        const html = await page.locator("#storybook-root").screenshot({ animations: "disabled" });
        expect(html.equals(react), `${theme} theme screenshots differ`).toBe(true);
      }
    });
  });
}
