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

    test("desktop time picker: columns, a pick and OK", async ({ page, isMobile }) => {
      test.skip(isMobile, "the touch project covers the mobile form");
      await openStory(page, storyId(impl, "date-pickers", "time"));
      const picker = page.locator("[data-ok-date-picker]").nth(1);
      await picker.locator("[data-ok-date-picker-open]").click();
      const paper = picker.locator("[data-ok-date-picker-paper]");
      await expect(paper).toHaveAttribute("data-ok-open", "");
      await expect(page.locator(":focus")).toHaveText("09");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      // Focus moves to the minutes column.
      await expect(page.locator(":focus")).toHaveText("30");
      await paper.getByRole("button", { name: "OK" }).click();
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "10:30:00",
      );
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-date-picker-open", "");
    });

    test("mobile time picker: the clock face, the toolbar and Cancel (touch)", async ({
      page,
      isMobile,
    }) => {
      await openStory(page, storyId(impl, "date-pickers", "time"));
      const picker = page.locator("[data-ok-date-picker]").nth(2);
      const open = picker.locator("[data-ok-date-picker-open]");
      if (isMobile) await open.tap();
      else await open.click();
      const dialog = picker.locator("dialog");
      await expect(dialog).toBeVisible();
      // The numbers let presses through to the face: press where 3 o'clock is.
      const face = dialog.locator("[data-ok-time-clock-dial]");
      const three = { x: 200, y: 110 };
      if (isMobile) await face.tap({ position: three });
      else await face.click({ position: three });
      await expect(dialog.locator("[data-ok-time-clock]")).toHaveAttribute(
        "data-ok-view",
        "minutes",
      );
      await expect(
        dialog.locator('[data-ok-picker-toolbar-button][data-ok-view="hours"]'),
      ).toHaveText("03");
      await dialog.getByRole("button", { name: "PM" }).click();
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toBeHidden();
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "09:30:00",
      );
    });

    test("static date time picker: tabs and Next", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "date-time"));
      const picker = page.locator("[data-ok-date-picker][data-ok-picker-variant=static]").first();
      await picker.getByRole("tab", { name: "pick time" }).click();
      await expect(picker.locator("[data-ok-time-clock]")).toBeVisible();
      await expect(picker.locator("[data-ok-date-calendar]")).toBeHidden();
      await picker.getByRole("button", { name: "Next", exact: true }).click();
      await expect(picker.locator("[data-ok-time-clock]")).toHaveAttribute(
        "data-ok-view",
        "minutes",
      );
      await expect(picker.getByRole("button", { name: "OK", exact: true })).toBeVisible();
      await picker.getByRole("tab", { name: "pick date" }).click();
      await expect(picker.locator("[data-ok-date-calendar]")).toBeVisible();
    });

    test("time clock: keys move the hand, Enter opens the minutes", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "clocks"));
      const clock = page.locator("[data-ok-time-clock]");
      await clock.getByRole("listbox").focus();
      await page.keyboard.press("ArrowUp");
      await expect(clock).toHaveAttribute("data-ok-value", "10:30:00");
      await page.keyboard.press("Enter");
      await expect(clock).toHaveAttribute("data-ok-view", "minutes");
      await expect(clock.getByRole("listbox")).toHaveAttribute(
        "aria-label",
        "Select minutes. Selected time is 10:30 AM",
      );
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
