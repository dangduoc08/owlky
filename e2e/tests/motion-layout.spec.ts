import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/**
 * Records the elements that start a layout animation (a script animation whose first frame is a
 * transform), by their class and text: checked after the fact, so a fast animation that already
 * ended still counts.
 */
const recordLayout = (page: Page) =>
  page.evaluate(() => {
    const started: string[] = [];
    (window as unknown as { layoutStarted: string[] }).layoutStarted = started;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, ...args: Parameters<Element["animate"]>) {
      const [frames] = args;
      const first = Array.isArray(frames) ? frames[0] : undefined;
      if (String(first?.["transform"] ?? "").startsWith("translate("))
        started.push(`${this.className}:${this.textContent?.trim()}`);
      return animate.apply(this, args);
    };
  });
const started = (page: Page) =>
  page.evaluate(() => (window as unknown as { layoutStarted: string[] }).layoutStarted);

for (const impl of implementations) {
  test.describe(`motion layout (${impl})`, () => {
    test.beforeEach(async ({ page }) => {
      await openStory(page, storyId(impl, "motion", "layout"));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await recordLayout(page);
    });

    test("moves a task up with an animation and keeps the focus on its button", async ({
      page,
    }) => {
      const items = page.getByRole("list", { name: "Tasks" }).getByRole("listitem");
      // The button of one task (not a position: the tasks move).
      const button = page.locator('button[aria-describedby="layout-task-ship-the-release"]');
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(items.nth(1)).toContainText("Ship the release");
      await expect(button).toBeFocused();
      await expect
        .poll(() => started(page))
        .toEqual(
          expect.arrayContaining([
            expect.stringContaining("Ship the release"),
            expect.stringContaining("Review the design"),
          ]),
        );
      // The first task moves to the end.
      await items.nth(0).getByRole("button", { name: "Move up" }).click();
      await expect(items.nth(3)).toContainText("Write the brief");
    });

    test("expands a card and slides the cards under it", async ({ page }) => {
      const details = page.getByRole("button", { name: "Details" });
      const second = page.locator(".sb-layout-card").nth(1);
      const before = (await second.boundingBox())?.y ?? 0;
      await details.first().click();
      await expect(details.first()).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText("Start with the free plan.", { exact: false })).toBeVisible();
      await expect
        .poll(() => started(page))
        .toEqual(expect.arrayContaining([expect.stringContaining("Can I cancel at any time?")]));
      await expect.poll(async () => (await second.boundingBox())?.y ?? 0).toBeGreaterThan(before);
    });

    test("hands the highlight to the pressed button", async ({ page }) => {
      const yearly = page.getByRole("button", { name: "Yearly" });
      await yearly.click();
      await expect(yearly).toHaveAttribute("aria-pressed", "true");
      await expect(yearly.locator(".sb-layout-highlight")).toHaveCount(1);
      await expect(page.locator(".sb-layout-highlight")).toHaveCount(1);
      await expect
        .poll(() => started(page))
        .toEqual(expect.arrayContaining([expect.stringContaining("sb-layout-highlight")]));
    });

    test("jumps with reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const items = page.getByRole("list", { name: "Tasks" }).getByRole("listitem");
      await items.nth(1).getByRole("button", { name: "Move up" }).click();
      await expect(items.nth(0)).toContainText("Review the design");
      expect(await started(page)).toEqual([]);
    });
  });
}
