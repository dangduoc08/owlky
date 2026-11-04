import { expect, test } from "@playwright/test";
import { openStory } from "./helpers.js";

/**
 * Visual regression baselines. Run only in the Playwright Docker image (pnpm test:visual) so
 * fonts and anti-aliasing match CI. React/HTML pixel parity is covered by parity.spec.ts.
 */
const shots: [id: string, open?: string][] = [
  ["react-button--all-variants-and-colors"],
  ["html-switch--states"],
  ["html-dialog--basic", "Open dialog"],
];

for (const theme of ["light", "dark"] as const) {
  for (const [id, open] of shots) {
    test(`${id} (${theme}) @visual`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Baselines are kept for Chromium only.");
      await openStory(page, id, theme);
      if (open) await page.getByRole("button", { name: open }).click();
      await expect(page).toHaveScreenshot(`${id}-${theme}.png`, { fullPage: true });
    });
  }
}
