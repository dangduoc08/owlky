import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

for (const impl of implementations) {
  test.describe(`dialog (${impl})`, () => {
    test.beforeEach(async ({ page }) => {
      await openStory(page, storyId(impl, "dialog", "basic"));
    });

    test("opens from the trigger with focus inside and the page locked", async ({ page }) => {
      await page.getByRole("button", { name: "Open dialog" }).click();
      const dialog = page.getByRole("dialog", { name: "Delete project?" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription(/permanently deletes/);
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
    });

    test("Escape closes and returns focus to the trigger", async ({ page }) => {
      const trigger = page.getByRole("button", { name: "Open dialog" });
      await trigger.click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
    });

    test("a backdrop click closes; a click inside does not", async ({ page }) => {
      await page.getByRole("button", { name: "Open dialog" }).click();
      await page.getByRole("heading", { name: "Delete project?" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.mouse.click(5, 5);
      await expect(page.getByRole("dialog")).toBeHidden();
    });

    test("Tab never reaches the page behind", async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "WebKit's default Tab skips buttons (macOS setting).");
      await page.getByRole("button", { name: "Open dialog" }).click();
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(
          () =>
            !document.activeElement ||
            document.activeElement === document.body ||
            Boolean(document.activeElement.closest("dialog")),
        );
        expect(inside).toBe(true);
      }
    });

    test("fits small screens", async ({ page }) => {
      await page.getByRole("button", { name: "Open dialog" }).click();
      const viewport = page.viewportSize();
      const box = await page.locator("[data-mt-dialog-content]").boundingBox();
      expect(box && viewport).toBeTruthy();
      if (box && viewport) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      }
    });

    test("not-dismissible ignores Escape and backdrop clicks", async ({ page }) => {
      await openStory(page, storyId(impl, "dialog", "not-dismissible"));
      await page.getByRole("button", { name: "Review terms" }).click();
      await page.keyboard.press("Escape");
      await page.mouse.click(5, 5);
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "I accept" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
    });
  });
}

test("React and the HTML runtime coexist: each manages only its own dialogs", async ({ page }) => {
  const managed = () =>
    page.evaluate(() => {
      const slot = (
        globalThis as unknown as Record<
          symbol,
          { runtime: { get(e: Element, n: string): unknown } }
        >
      )[Symbol.for("minimal-tailwind.runtime")];
      const dialog = document.querySelector("[data-mt-dialog]");
      return {
        runtime: Boolean(slot),
        managed: Boolean(dialog && slot?.runtime.get(dialog, "dialog")),
      };
    });

  await openStory(page, storyId("react", "dialog", "basic"));
  expect(await managed()).toEqual({ runtime: true, managed: false });
  await openStory(page, storyId("html", "dialog", "basic"));
  expect(await managed()).toEqual({ runtime: true, managed: true });
});
