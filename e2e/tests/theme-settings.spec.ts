import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CONTRAST_EXEMPT, openStory, storyId } from "./helpers.js";

/** Stories where primary shows up: fills, outlined / soft text, selection, styled components. */
const STORIES = [
  storyId("react", "button", "contained"),
  storyId("html", "button", "soft"),
  storyId("html", "toggle-button", "colors"),
  storyId("react", "table", "sorting-selecting"),
  "foundations-settings--styled",
];

test.describe("theme settings (ADR-0070)", () => {
  // Each test scans several stories with axe.
  test.describe.configure({ timeout: 120_000 });
  test.skip(({ browserName }) => browserName !== "chromium", "axe results are engine-independent.");

  for (const theme of ["light", "dark"] as const) {
    test(`${theme}: no WCAG 2.2 AA violations`, async ({ page }) => {
      for (const id of STORIES) {
        await openStory(page, id, theme);
        let axe = new AxeBuilder({ page })
          .include("#storybook-root")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
        for (const selector of CONTRAST_EXEMPT) axe = axe.exclude(selector);
        const { violations } = await axe.analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.help}`),
          id,
        ).toEqual([]);
      }
    });
  }

  test("root font size", async ({ page }) => {
    await openStory(page, "foundations-typography--body-1", "light", "", "fontSize:20");
    await expect(page.locator("html")).toHaveCSS("font-size", "20px");
    await expect(page.locator("#storybook-root p").first()).toHaveCSS("font-size", "20px");
  });

  for (const fontSize of [12, 20]) {
    test(`font size ${fontSize}px: no page overflow at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      for (const id of [
        storyId("react", "table", "basic"),
        storyId("react", "alert", "actions"),
        storyId("html", "button-group", "sizes"),
      ]) {
        await openStory(page, id, "light", "", `fontSize:${fontSize}`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, id).toBeLessThanOrEqual(0);
      }
    });
  }
});
