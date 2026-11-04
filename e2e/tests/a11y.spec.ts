import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CONTRAST_EXEMPT, openStory, storyIds } from "./helpers.js";

const stories = storyIds("");

for (const theme of ["light", "dark"] as const) {
  for (const id of stories) {
    test(`${id} (${theme}) has no WCAG 2.2 AA violations`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "axe results are engine-independent.");
      await openStory(page, id, theme);
      // Brand-colored text follows the reference look (ADR-0014): exempt from color-contrast
      // only; every other rule, soft buttons and neutral text are still checked.
      const all = await new AxeBuilder({ page })
        .include("#storybook-root")
        .exclude("[data-demo-disabled]")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .disableRules(["color-contrast"])
        .analyze();
      let contrast = new AxeBuilder({ page })
        .include("#storybook-root")
        .exclude("[data-demo-disabled]")
        .withRules(["color-contrast"]);
      for (const selector of CONTRAST_EXEMPT) contrast = contrast.exclude(selector);
      const results = { violations: [...all.violations, ...(await contrast.analyze()).violations] };
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
}
