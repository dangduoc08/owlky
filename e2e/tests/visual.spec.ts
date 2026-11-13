import { defaultTheme, styleNames } from "@owlky/tokens";
import { expect, test } from "@playwright/test";
import { openStory, storyIds } from "./helpers.js";
import { openStyled, STYLE_SAMPLE } from "./style-sample.js";
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

/**
 * One baseline per opt-in design style (ST6) for a sample of stories, light and dark, at the
 * laptop width: the default style is covered by the full set above. Baselines come from the
 * `Visual baselines` workflow (docs/testing.md), never from a local run.
 */
const laptop = viewports.find((viewport) => viewport.name === "laptop") ?? viewports[0];
for (const style of styleNames.filter((name) => name !== defaultTheme.style)) {
  for (const theme of ["light", "dark"] as const) {
    for (const sample of STYLE_SAMPLE) {
      const id = sample.id.replace("@", "-");
      test(`${style} style: ${sample.name} (${theme}) @visual`, async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Baselines are kept for Chromium only.");
        await page.setViewportSize({ width: laptop.width, height: laptop.height });
        await openStyled(page, sample, style, theme);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(["styles", style, `${id}-${theme}.png`], {
          fullPage: true,
        });
      });
    }
  }
}
