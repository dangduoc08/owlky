import { expect, type Locator, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** The progress a scroll progress shows (0–1). */
const shown = (locator: Locator) =>
  locator.evaluate((element) =>
    Number(getComputedStyle(element).getPropertyValue("--_ok-scroll-progress")),
  );

for (const impl of implementations) {
  test.describe(`scroll progress (${impl})`, () => {
    test("container scroll-y: both indicators follow the area, decorative", async ({
      page,
      browserName,
    }) => {
      await openStory(page, storyId(impl, "scroll-progress", "container-scroll-y"));
      const progresses = page.locator("[data-ok-scroll-progress]");
      await expect(progresses).toHaveCount(2);
      for (const progress of await progresses.all()) {
        await expect(progress).toHaveAttribute("aria-hidden", "true");
        await expect(progress).not.toHaveAttribute("aria-valuenow", /.*/);
        // Chromium and WebKit draw natively; Firefox has no scroll timelines.
        if (browserName === "firefox") await expect(progress).toHaveAttribute("data-ok-fallback");
        else await expect(progress).not.toHaveAttribute("data-ok-fallback");
      }
      const area = page.getByRole("region", { name: "Numbered cards" });
      await area.evaluate((element) => {
        element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
      });
      for (const progress of await progresses.all())
        await expect.poll(() => shown(progress)).toBeCloseTo(0.5, 1);
      await area.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      for (const progress of await progresses.all())
        await expect.poll(() => shown(progress)).toBeCloseTo(1, 2);
    });

    test("container scroll-x: the keyboard scrolls the row and the bar follows", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "scroll-progress", "container-scroll-x"));
      const bar = page.locator("[data-ok-linear-progress]");
      const row = page.getByRole("region", { name: "Numbered cards in a row" });
      await row.focus();
      await page.keyboard.press("End");
      await expect.poll(() => shown(bar)).toBeCloseTo(1, 2);
      await page.keyboard.press("Home");
      await expect.poll(() => shown(bar)).toBeCloseTo(0, 2);
    });

    test("scroll document: the fixed bar follows the page", async ({ page }) => {
      await openStory(page, storyId(impl, "scroll-progress", "scroll-document"));
      const bar = page.locator("[data-ok-scroll-progress]");
      await expect(bar).toHaveCSS("position", "fixed");
      await page.evaluate(() => {
        const root = document.documentElement;
        window.scrollTo(0, (root.scrollHeight - root.clientHeight) / 2);
      });
      await expect.poll(() => shown(bar)).toBeCloseTo(0.5, 1);
    });
  });
}
