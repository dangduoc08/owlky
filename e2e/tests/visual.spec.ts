import { expect, test } from "@playwright/test";
import { openStory, storyIds } from "./helpers.js";

/**
 * Visual regression baselines. Run only in the Playwright Docker image (pnpm test:visual) so
 * fonts and anti-aliasing match CI.
 */
const shots = storyIds("foundations-");

for (const theme of ["light", "dark"] as const) {
  for (const id of shots) {
    test(`${id} (${theme}) @visual`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Baselines are kept for Chromium only.");
      await page.setViewportSize({ width: 1440, height: 900 });
      await openStory(page, id, theme);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${id}-${theme}.png`, { fullPage: true });
    });
  }
}
