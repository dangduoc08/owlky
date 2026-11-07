import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`avatar, badge, chip and label (${impl})`, () => {
    test("avatars load their pictures and size from data-ok-size / size", async ({ page }) => {
      await openStory(page, storyId(impl, "avatar", "sizes"));
      const avatars = page.locator("[data-ok-avatar]");
      await expect(avatars).toHaveCount(7);
      const widths = await avatars.evaluateAll((all) =>
        all.map((a) => a.getBoundingClientRect().width),
      );
      expect(widths).toEqual([24, 32, 48, 56, 64, 80, 128]);
      await expect
        .poll(() =>
          page
            .locator("[data-ok-avatar] > img")
            .evaluateAll((all) => all.every((i) => (i as HTMLImageElement).naturalWidth > 0)),
        )
        .toBe(true);
    });

    test("an avatar group shows a +N surplus", async ({ page }) => {
      await openStory(page, storyId(impl, "avatar", "grouped"));
      const surplus = page.locator("[data-ok-avatar-surplus]");
      await expect(surplus).toHaveCount(4);
      await expect(surplus.first()).toHaveText("+5");
    });

    test("badges sit on the corner; statuses show", async ({ page }) => {
      await openStory(page, storyId(impl, "badge", "standard"));
      const first = page.locator("[data-ok-badge]").first();
      const [dx, dy] = await first.evaluate((root) => {
        const r = root.getBoundingClientRect();
        const b = (root.querySelector("[data-ok-badge-badge]") as Element).getBoundingClientRect();
        return [
          Math.round(b.left + b.width / 2 - r.right),
          Math.round(b.top + b.height / 2 - r.top),
        ];
      });
      expect([dx, dy]).toEqual([0, 0]);
      await openStory(page, storyId(impl, "badge", "maximum-value"));
      await expect(page.locator("[data-ok-badge-badge]")).toHaveText(["99", "99+", "999+"]);
    });

    test("chips: clickable chips are buttons; delete buttons are named", async ({ page }) => {
      await openStory(page, storyId(impl, "chip", "filled"));
      await expect(page.getByRole("button", { name: "Clickable" })).toHaveCount(9);
      await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible();
      const action = page.getByRole("button", { name: "Clickable" }).first();
      await action.focus();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name: "Deletable" }).first()).toHaveCount(0);
    });

    test("dividers are separators: 1px lines, text between two lines", async ({ page }) => {
      await openStory(page, storyId(impl, "divider", "with-children"));
      const separators = page.getByRole("separator");
      await expect(separators).toHaveCount(4);
      await expect(separators.first()).toHaveText("Center");
      await openStory(page, storyId(impl, "divider", "icon-grouping"));
      const line = page.locator("[data-ok-divider]");
      expect(
        await line.evaluate((el) => [
          el.getBoundingClientRect().width,
          el.getAttribute("aria-orientation"),
        ]),
      ).toEqual([1, "vertical"]);
      await openStory(page, storyId(impl, "drawer", "variants"));
      await expect(page.locator("nav [data-ok-divider]").first()).toBeAttached();
    });

    test("labels are 24px tags", async ({ page }) => {
      await openStory(page, storyId(impl, "label", "soft"));
      const heights = await page
        .locator("[data-ok-label]")
        .evaluateAll((all) => all.map((l) => l.getBoundingClientRect().height));
      expect(new Set(heights)).toEqual(new Set([24]));
    });
  });
}

test("HTML: deleting a chip fires ok:chip:delete and hides it", async ({ page }) => {
  await openStory(page, storyId("html", "chip", "soft"));
  const chip = page.locator("[data-ok-chip]").nth(1);
  await page.evaluate(() => {
    (window as unknown as { deleted: number }).deleted = 0;
    document.addEventListener("ok:chip:delete", () => {
      (window as unknown as { deleted: number }).deleted++;
    });
  });
  await chip.getByRole("button", { name: "Remove" }).click();
  await expect(chip).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { deleted: number }).deleted)).toBe(1);
});

test("touch: tapping a clickable chip and a delete button", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await openStory(page, storyId("html", "chip", "outlined"));
  const chip = page.locator("[data-ok-chip]").nth(1);
  await chip.getByRole("button", { name: "Remove" }).tap();
  await expect(chip).toBeHidden();
  await context.close();
});
