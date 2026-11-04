import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openStory, storyIds } from "./helpers.js";

const stories = storyIds("foundations-");

for (const theme of ["light", "dark"] as const) {
  for (const id of stories) {
    test(`${id} (${theme}) has no WCAG 2.2 AA violations`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "axe results are engine-independent.");
      await openStory(page, id, theme);
      const results = await new AxeBuilder({ page })
        .include("#storybook-root")
        // The "Text disabled" sample demonstrates the disabled color, which is low-contrast by design.
        .exclude("[data-demo-disabled]")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
}
