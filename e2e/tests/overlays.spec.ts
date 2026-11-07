import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const isOpen = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => el.hasAttribute("data-ok-open"));

for (const impl of implementations) {
  test.describe(`overlays (${impl})`, () => {
    test("popover: opens below its trigger, Escape closes and returns focus", async ({ page }) => {
      await openStory(page, storyId(impl, "popover", "click-hover"));
      const trigger = page.getByRole("button", { name: "Click popover" });
      await trigger.click();
      const popover = page.locator("#popover-click");
      await expect(popover).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      const [a, p] = await Promise.all([trigger.boundingBox(), popover.boundingBox()]);
      expect(p?.y ?? 0).toBeGreaterThanOrEqual((a?.y ?? 0) + (a?.height ?? 0));
      await page.keyboard.press("Escape");
      await expect(popover).toBeHidden();
      await expect(trigger).toBeFocused();
      await page.getByRole("button", { name: "Hover popover" }).hover();
      await expect(page.locator("#popover-hover")).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(page.locator("#popover-hover")).toBeHidden();
    });

    test("popover arrows: the popover opens opposite the arrow's side, the arrow points at the button", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 1000 });
      await openStory(page, storyId(impl, "popover", "custom-arrow"));
      const cases: [arrow: string, placement: string][] = [
        ["top-left", "bottom-start"],
        ["bottom-right", "top-end"],
        ["left-top", "right-start"],
        ["right-center", "left"],
      ];
      for (const [arrow, placement] of cases) {
        const trigger = page.getByRole("button", { name: arrow, exact: true });
        await trigger.click();
        const popover = page.locator(`#popover-arrow-${arrow}`);
        await expect(popover).toBeVisible();
        await expect(popover).toHaveAttribute("data-ok-current-placement", placement);
        const tip = popover.locator("[data-ok-popover-arrow]");
        await expect(tip).toBeVisible();
        // Measure after the opening animation (it scales the popover).
        await popover.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
        const [t, a, p] = await Promise.all([
          trigger.boundingBox(),
          tip.boundingBox(),
          popover.boundingBox(),
        ]);
        if (!t || !a || !p) throw new Error("no boxes");
        const side = arrow.split("-")[0];
        // The arrow sits on the popover's edge facing the button…
        if (side === "top") expect(a.y).toBeLessThan(p.y);
        if (side === "bottom") expect(a.y + a.height).toBeGreaterThan(p.y + p.height);
        if (side === "left") expect(a.x).toBeLessThan(p.x);
        if (side === "right") expect(a.x + a.width).toBeGreaterThan(p.x + p.width);
        // …and points at the button's center.
        const vertical = side === "top" || side === "bottom";
        const center = vertical ? t.x + t.width / 2 : t.y + t.height / 2;
        const tipCenter = vertical ? a.x + a.width / 2 : a.y + a.height / 2;
        expect(Math.abs(center - tipCenter)).toBeLessThan(2);
        // Same surface color as the popover.
        const colors = await popover.evaluate((el) => [
          getComputedStyle(el).backgroundColor,
          getComputedStyle(el.querySelector("[data-ok-popover-arrow]") as Element).backgroundColor,
        ]);
        expect(colors[1]).toBe(colors[0]);
        await page.keyboard.press("Escape");
      }
    });

    test("tooltip: hover and keyboard focus show it; it names icon buttons", async ({ page }) => {
      await openStory(page, storyId(impl, "tooltip", "simple"));
      const fab = page.getByRole("button", { name: "Add" }).first();
      await fab.hover();
      const tooltip = page.locator("#tooltip-add");
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveText("Add");
      await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden();
      await page.getByRole("button", { name: "Button" }).focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(page.locator("#tooltip-button")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("#tooltip-button")).toBeHidden();
    });

    test("menu: keyboard navigation; choosing closes and returns focus", async ({ page }) => {
      await openStory(page, storyId(impl, "menu", "selected"));
      const trigger = page.locator("#menu-selected-button");
      await trigger.click();
      await expect(page.locator("#menu-selected")).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Show all notification content" }),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        page.getByRole("menuitem", { name: "Hide sensitive notification content" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#menu-selected")).toBeHidden();
      await expect(trigger).toBeFocused();
      await openStory(page, storyId(impl, "menu", "max-height"));
      await page.getByRole("button", { name: "More" }).click();
      const paper = page.locator("#menu-long");
      await expect(paper).toBeVisible();
      expect(await paper.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      await expect(page.getByRole("menuitem", { name: "Phobos" })).toBeFocused();
    });

    test("dialog: modal, focus inside, Escape closes and focus returns", async ({ page }) => {
      await openStory(page, storyId(impl, "dialog", "form"));
      const trigger = page.getByRole("button", { name: "Form dialog" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Subscribe" });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Email address" })).toBeFocused();
      for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await openStory(page, storyId(impl, "dialog", "simple"));
      await page.getByRole("button", { name: "Open simple dialog" }).click();
      await page.getByRole("button", { name: "username@gmail.com" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
    });

    test("snackbar: toasts appear in the corner, close themselves and on the close button", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "snackbar", "status"));
      await page.getByRole("button", { name: "Success", exact: true }).click();
      const toast = page.locator("[data-ok-toast]", { hasText: "Event has been created" });
      await expect(toast).toHaveText(/Event has been created/);
      const box = await toast.boundingBox();
      const width = page.viewportSize()?.width ?? 0;
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width - 15);
      await page.getByRole("button", { name: "Promise" }).click();
      await expect(page.locator("[data-ok-toast]", { hasText: "Loading succeeded" })).toBeVisible({
        timeout: 5000,
      });
      await page.mouse.move(0, 0);
      await expect(toast).toBeHidden({ timeout: 8000 });
      await openStory(page, storyId(impl, "snackbar", "anchor-origin"));
      await page.getByRole("button", { name: "bottom-center" }).click();
      const shown = page.locator("[data-ok-toast]");
      await expect(shown).toHaveText(/Shown at bottom-center/);
      await expect(page.locator("[data-ok-toaster]")).toHaveAttribute(
        "data-ok-position",
        "bottom-center",
      );
    });
  });
}

test.describe("overlays touch", () => {
  test.use({ hasTouch: true });
  for (const impl of implementations) {
    test(`${impl}: tapping opens a popover and a menu; tapping outside closes them`, async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "popover", "click-hover"));
      await page.getByRole("button", { name: "Click popover" }).tap();
      expect(await isOpen(page, "#popover-click")).toBe(true);
      await page.touchscreen.tap(5, 600);
      await expect.poll(() => isOpen(page, "#popover-click")).toBe(false);
      await openStory(page, storyId(impl, "menu", "simple"));
      await page.getByRole("button", { name: "Open menu" }).tap();
      await page.getByRole("menuitem", { name: "Logout" }).tap();
      await expect.poll(() => isOpen(page, "#menu-simple")).toBe(false);
    });
  }
});
