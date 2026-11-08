import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Date pickers: the same interactions in both implementations (spec: specs/components/date-picker.md). */
for (const impl of implementations) {
  test.describe(`date pickers (${impl})`, () => {
    test("desktop: the open button, keys and Enter pick a day", async ({ page, isMobile }) => {
      test.skip(isMobile, "the touch project covers the mobile form");
      await openStory(page, storyId(impl, "date-pickers", "date-story"));
      const picker = page.locator("[data-ok-date-picker]").nth(1);
      await picker.locator("[data-ok-date-picker-open]").click();
      await expect(picker.locator("[data-ok-date-picker-paper]")).toHaveAttribute(
        "data-ok-open",
        "",
      );
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-date", "2025-05-25");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("PageDown");
      await page.keyboard.press("Enter");
      await expect(picker).not.toHaveAttribute("data-ok-open", "");
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "2025-06-26",
      );
      // Focus returns to the open button.
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-date-picker-open", "");
    });

    test("field: typing, arrows and select-all", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "date-story"));
      const field = page.locator("[data-ok-date-field]").nth(3);
      const sections = field.locator('[role="spinbutton"]');
      await sections.first().click();
      await page.keyboard.press("ArrowUp");
      await expect(field).toHaveAttribute("data-ok-value", "2025-06-25");
      await page.keyboard.press("Control+a");
      await page.keyboard.press("Backspace");
      await expect(sections).toHaveText(["MM", "DD", "YYYY"]);
      await page.keyboard.type("12312024");
      await expect(field).toHaveAttribute("data-ok-value", "2024-12-31");
      await expect(field.locator("input[type=hidden]")).toHaveValue("2024-12-31");
    });

    test("mobile form: a dialog with Cancel and OK (touch)", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "date-pickers", "date-story"));
      const picker = page.locator("[data-ok-date-picker]").nth(2);
      const open = picker.locator("[data-ok-date-picker-open]");
      if (isMobile) await open.tap();
      else await open.click();
      const dialog = picker.locator("dialog");
      await expect(dialog).toBeVisible();
      const day = dialog.locator('[data-ok-date="2025-05-03"]');
      if (isMobile) await day.tap();
      else await day.click();
      await expect(dialog.locator("[data-ok-picker-toolbar-title]")).toHaveText("Sat, May 3");
      await dialog.getByRole("button", { name: "OK" }).click();
      await expect(dialog).toBeHidden();
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "2025-05-03",
      );
    });

    test("calendar: the year view and back", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "calendars"));
      const calendar = page.locator("[data-ok-date-calendar]").first();
      await calendar.locator("[data-ok-date-calendar-switch]").click();
      await expect(calendar).toHaveAttribute("data-ok-view", "year");
      await calendar.getByRole("radio", { name: "2027" }).click();
      await expect(calendar).toHaveAttribute("data-ok-view", "day");
      await expect(calendar.getByRole("grid", { name: "May 2027" })).toBeVisible();
    });

    test("static picker: shortcuts and actions", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "shortcuts"));
      const picker = page.locator("[data-ok-date-picker]");
      await picker.getByRole("button", { name: "Christmas 2025" }).click();
      await expect(picker.getByRole("grid", { name: "December 2025" })).toBeVisible();
      await expect(picker.locator("[data-ok-picker-toolbar-title]")).toHaveText("Thu, Dec 25");
      await picker.getByRole("button", { name: "Clear" }).click();
      await expect(picker.locator("[data-ok-picker-toolbar-title]")).toHaveText("––");
    });
  });
}
