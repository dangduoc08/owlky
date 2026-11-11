import { expect, test } from "@playwright/test";
import { openStory, storyIds } from "./helpers.js";
import { viewports } from "./viewports.js";

/**
 * Visual regression baselines: every story × theme × viewport. Run only in the Playwright Docker
 * image (pnpm test:visual) so fonts and anti-aliasing match CI; update only after approval.
 */
const shots = storyIds("");

for (const theme of ["light", "dark"] as const) {
  for (const id of shots) {
    for (const viewport of viewports) {
      test(`${id} (${theme}, ${viewport.width}) @visual`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Baselines are kept for Chromium only.");
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        // Stories that show the time (Countdown) keep the time of their first render.
        if (id.includes("countdown") || id === "components-motion--docs")
          await page.clock.setFixedTime(new Date("2026-11-09T09:30:15Z"));
        await openStory(page, id, theme);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${id}-${theme}-${viewport.width}.png`, {
          fullPage: true,
        });
      });
    }
  }
}
