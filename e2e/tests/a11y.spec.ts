import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const stories: [component: string, story: string, open?: string][] = [
  ["button", "variants"],
  ["button", "colors"],
  ["button", "icons"],
  ["switch", "colors"],
  ["switch", "states"],
  ["dialog", "basic", "Open dialog"],
];

for (const impl of implementations) {
  for (const theme of ["light", "dark"] as const) {
    for (const [component, story, open] of stories) {
      test(`${impl} ${component}/${story} (${theme}) has no WCAG 2.2 AA violations`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "axe results are engine-independent.");
        await openStory(page, storyId(impl, component, story), theme);
        if (open) await page.getByRole("button", { name: open }).click();
        const results = await new AxeBuilder({ page })
          .include("#storybook-root")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });
    }
  }
}
