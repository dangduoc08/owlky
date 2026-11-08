import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Range pickers (ADR-0028): the same interactions in both implementations. */
for (const impl of implementations) {
  test.describe(`date range pickers (${impl})`, () => {
    test("desktop: the start, then the end, closes and returns focus", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "the touch test covers the dialog");
      await openStory(page, storyId(impl, "date-pickers", "range"));
      const picker = page.locator("[data-ok-date-range-picker]").first();
      const open = picker.locator("[data-ok-date-picker-open]");
      await open.click();
      const paper = picker.locator("[data-ok-date-picker-paper]");
      await expect(paper).toHaveAttribute("data-ok-open", "");
      await expect(paper.locator("[data-ok-date-range-calendar-month]")).toHaveCount(2);
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-date", "2025-05-20");
      // Keys: the next day is the start, two days later the end.
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Enter");
      await expect(picker).not.toHaveAttribute("data-ok-open", "");
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "2025-05-21/2025-05-23",
      );
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-date-picker-open", "");
    });

    test("hover previews and dragging the end moves it", async ({ page, isMobile }) => {
      test.skip(isMobile, "the touch test drags with a finger");
      await openStory(page, storyId(impl, "date-pickers", "range"));
      const calendar = page.locator("#dr-calendar");
      await calendar.locator('[data-ok-date="2025-05-12"]').click();
      await calendar.locator('[data-ok-date="2025-05-15"]').hover();
      await expect(calendar.locator('[data-ok-date="2025-05-14"]')).toHaveAttribute(
        "data-ok-in-preview",
        "",
      );
      await calendar.locator('[data-ok-date="2025-05-15"]').click();
      await expect(calendar).toHaveAttribute("data-ok-value", "2025-05-12/2025-05-15");
      const from = await calendar.locator('[data-ok-date="2025-05-15"]').boundingBox();
      const to = await calendar.locator('[data-ok-date="2025-05-28"]').boundingBox();
      if (!from || !to) throw new Error("days not shown");
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
      await page.mouse.up();
      await expect(calendar).toHaveAttribute("data-ok-value", "2025-05-12/2025-05-28");
    });

    test("touch: the dialog, the toolbar's end and OK", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "date-pickers", "range"));
      const picker = page.locator("[data-ok-date-range-picker]").nth(2);
      const open = picker.locator("[data-ok-date-picker-open]");
      if (isMobile) await open.tap();
      else await open.click();
      const dialog = picker.locator("dialog");
      await expect(dialog).toBeVisible();
      const end = dialog.locator('[data-ok-picker-toolbar-button][data-ok-range-position="end"]');
      if (isMobile) await end.tap();
      else await end.click();
      await expect(end).toHaveAttribute("aria-pressed", "true");
      const day = dialog.locator('[data-ok-date="2025-05-28"]');
      if (isMobile) await day.tap();
      else await day.click();
      await expect(end).toHaveText("May 28");
      await dialog.getByRole("button", { name: "OK" }).click();
      await expect(dialog).toBeHidden();
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "2025-05-20/2025-05-28",
      );
    });

    test("multi input: typing an end before the start marks both fields", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "range-fields"));
      const group = page.locator("[data-ok-multi-input-range-field]").first();
      const end = group.locator("[data-ok-date-field]").nth(1);
      await end.locator('[role="spinbutton"]').nth(1).click();
      await page.keyboard.type("10");
      await expect(group).toHaveAttribute("data-ok-value", "2025-05-20/2025-05-10");
      await expect(group.locator("[data-ok-date-field][data-ok-error]")).toHaveCount(2);
    });

    test("shortcuts set a dashboard range", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "range-shortcuts"));
      const filter = page.locator('[data-ok-date-range-picker][data-ok-picker-variant="static"]');
      await filter.getByRole("button", { name: "Last 7 days" }).click();
      await expect(filter.locator("[data-ok-date-range-calendar]")).toHaveAttribute(
        "data-ok-value",
        "2025-05-19/2025-05-25",
      );
      await filter.getByRole("button", { name: "Current month" }).click();
      await expect(
        filter.locator('[data-ok-picker-toolbar-button][data-ok-range-position="end"]'),
      ).toHaveText("May 31");
    });

    test("time range: the start's last column moves on to the end", async ({ page, isMobile }) => {
      test.skip(isMobile, "the desktop popover holds the digital clocks");
      await openStory(page, storyId(impl, "date-pickers", "time-ranges"));
      const picker = page.locator("[data-ok-date-range-picker]").first();
      await picker.locator("[data-ok-date-picker-open]").click();
      const paper = picker.locator("[data-ok-date-picker-paper]");
      await paper.locator('[data-ok-digital-clock-section="hours"] [data-ok-value="8"]').click();
      await paper.locator('[data-ok-digital-clock-section="minutes"] [data-ok-value="30"]').click();
      await paper.locator('[data-ok-digital-clock-section="meridiem"] [data-ok-value="0"]').click();
      await expect(paper.getByRole("tab", { name: "End" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await paper.getByRole("button", { name: "OK" }).click();
      await expect(picker.locator("[data-ok-date-field]")).toHaveAttribute(
        "data-ok-value",
        "08:30:00/17:30:00",
      );
    });
  });
}

test("touch: dragging the end with a finger (React and HTML)", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    hasTouch: true,
  });
  const page = await context.newPage();
  for (const impl of implementations) {
    await openStory(page, storyId(impl, "date-pickers", "range-calendars"));
    const calendar = page.locator("#rc-one");
    // Pointer coordinates are the viewport's: bring the calendar into view first.
    await calendar.locator('[data-ok-date="2025-05-29"]').scrollIntoViewIfNeeded();
    const from = await calendar.locator('[data-ok-date="2025-05-25"]').boundingBox();
    const to = await calendar.locator('[data-ok-date="2025-05-29"]').boundingBox();
    if (!from || !to) throw new Error("days not shown");
    // A touch drag as pointer events (the end has touch-action: none, so the page doesn't scroll).
    await calendar.locator('[data-ok-date="2025-05-25"]').dispatchEvent("pointerdown", {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: from.x + from.width / 2,
      clientY: from.y + from.height / 2,
    });
    for (const target of [from, to])
      await calendar.locator('[data-ok-date="2025-05-25"]').dispatchEvent("pointermove", {
        pointerId: 2,
        pointerType: "touch",
        isPrimary: true,
        clientX: target.x + target.width / 2,
        clientY: target.y + target.height / 2,
      });
    await calendar.locator('[data-ok-date="2025-05-25"]').dispatchEvent("pointerup", {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: to.x + to.width / 2,
      clientY: to.y + to.height / 2,
    });
    await expect(calendar).toHaveAttribute("data-ok-value", "2025-05-20/2025-05-29");
    expect(
      await calendar
        .locator('[data-ok-date="2025-05-29"]')
        .evaluate((el) => getComputedStyle(el).touchAction),
    ).toBe("none");
  }
  await context.close();
});
