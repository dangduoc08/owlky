import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["grid", "vertical", "horizontal"] as const;

const order = (page: Page) =>
  page
    .locator("[data-mt-sortable] > [data-mt-sortable-item] > span")
    .evaluateAll((spans) => spans.map((span) => span.textContent).join(","));
const handle = (page: Page, n: number) =>
  page.getByRole("button", { name: `Reorder item ${n}`, exact: true });

for (const impl of implementations) {
  test.describe(`sortable (${impl})`, () => {
    test("drags with the mouse onto another item", async ({ page, isMobile }) => {
      test.skip(isMobile, "Covered by taps on touch devices.");
      await openStory(page, storyId(impl, "sortable", "grid"));
      const from = await handle(page, 1).boundingBox();
      const to = await page.locator("[data-mt-sortable-item]").nth(2).boundingBox();
      if (!from || !to) throw new Error("no boxes");
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
      await expect(page.locator("[data-mt-dragging]").first()).toBeAttached();
      await page.mouse.up();
      await expect(page.locator("[data-mt-dragging]")).toHaveCount(0);
      expect((await order(page)).startsWith("2,3,1,4")).toBe(true);
    });

    test("reorders with the keyboard and announces it", async ({ page }) => {
      await openStory(page, storyId(impl, "sortable", "vertical"));
      await handle(page, 1).focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Space");
      expect((await order(page)).startsWith("2,3,1,4")).toBe(true);
      await expect(page.locator("[data-mt-sortable-announcer]")).toHaveText(
        /Dropped at position 3 of 12/,
      );
      await expect(handle(page, 1)).toBeFocused();
    });

    test("moves with two taps; removes and adds items", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "sortable", "horizontal"));
      const press = (locator: ReturnType<typeof handle>) =>
        isMobile ? locator.tap() : locator.click();
      await press(handle(page, 3));
      await press(handle(page, 1));
      expect((await order(page)).startsWith("3,1,2,4")).toBe(true);
      const remove = page.getByRole("button", { name: "Remove item 2", exact: true });
      if (!isMobile) await page.locator("[data-mt-sortable-item]").nth(2).hover();
      await press(remove);
      await expect(remove).toHaveCount(0);
      await press(page.getByRole("button", { name: "Add item" }));
      await expect(page.locator("[data-mt-sortable-item]")).toHaveCount(12);
      expect((await order(page)).endsWith(",13")).toBe(true);
      await expect(handle(page, 13)).toBeAttached();
    });
  });
}

for (const viewport of viewports) {
  test.describe(`sortable responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
      test(`${story}: no overflow, items fit, targets ≥ 24px, React matches HTML`, async ({
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
          await openStory(page, storyId(impl, "sortable", story));
          await page.evaluate(() => document.fonts.ready);
          const m = await page.evaluate(() => {
            const list = document.querySelector("[data-mt-sortable]") as HTMLElement;
            const box = list.getBoundingClientRect();
            const items = [...list.querySelectorAll<HTMLElement>("[data-mt-sortable-item]")].map(
              (item) => {
                const r = item.getBoundingClientRect();
                return [Math.round(r.width), Math.round(r.height)];
              },
            );
            const targets = [...list.querySelectorAll("button")].map((b) => {
              const r = b.getBoundingClientRect();
              return Math.min(r.width, r.height);
            });
            return {
              overflow: document.documentElement.scrollWidth > window.innerWidth,
              list: [Math.round(box.width), Math.round(box.height)],
              listInside: box.left >= 0 && box.right <= window.innerWidth + 0.5,
              items,
              smallestTarget: Math.min(...targets),
            };
          });
          expect(m.overflow, `${impl} page overflow`).toBe(false);
          expect(m.listInside, `${impl} list in viewport`).toBe(true);
          expect(m.smallestTarget).toBeGreaterThanOrEqual(24);
          results[impl] = m;
          if (viewport.touch) {
            await handle(page, 2).tap();
            await expect(handle(page, 2)).toHaveAttribute("aria-pressed", "true");
          }
          await page.close();
        }
        expect(results["react"]).toEqual(results["html"]);
        await context.close();
      });
    }
  });
}
