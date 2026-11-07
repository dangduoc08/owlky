import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** Opens an overlay story and returns the open surface's box and the page overflow. */
const CASES: [component: string, story: string, trigger: string, surface: string][] = [
  ["popover", "click-hover", "Click popover", "#popover-click"],
  ["popover", "custom-arrow", "right-bottom", "#popover-arrow-right-bottom"],
  ["menu", "max-height", "More", "#menu-long"],
  ["dialog", "max-width", "xl", "#dialog-width-xl [data-ok-dialog-paper]"],
  ["dialog", "scrolling-content", "Scroll=paper", "#dialog-scroll-paper [data-ok-dialog-paper]"],
  ["snackbar", "default", "Message", "[data-ok-toast]"],
  ["backdrop", "example", "Show backdrop", "#backdrop-example"],
];

async function measure(page: Page, surface: string) {
  return page
    .locator(surface)
    .first()
    .evaluate((el) => {
      const box = el.getBoundingClientRect();
      return {
        inside:
          box.left >= -0.5 &&
          box.top >= -0.5 &&
          box.right <= window.innerWidth + 0.5 &&
          box.bottom <= window.innerHeight + 0.5,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    });
}

for (const viewport of viewports) {
  test.describe(`overlays responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const [component, story, trigger, surface] of CASES) {
      test(`${component} ${story}: the open surface stays in the viewport; React matches HTML`, async ({
        browser,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
        });
        const results: Record<string, unknown> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, component, story));
          const button = page.getByRole("button", { name: trigger, exact: true });
          if (viewport.touch) await button.tap();
          else await button.click();
          await expect(page.locator(surface).first()).toBeVisible();
          await page.waitForTimeout(300);
          const result = await measure(page, surface);
          expect(result.inside, `${impl} ${component} ${story}`).toBe(true);
          expect(result.overflow, `${impl} page overflow`).toBe(false);
          results[impl] = { width: result.width, height: result.height };
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
