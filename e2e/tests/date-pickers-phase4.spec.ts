import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/**
 * Date pickers phase 4 (ADR-0030): time zones, calendar systems, right to left and view
 * renderers, the same in both implementations (spec: specs/components/date-picker.md).
 */
for (const impl of implementations) {
  test.describe(`date pickers phase 4 (${impl})`, () => {
    test("time zones: each field shows its zone's wall time", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "time-zones"));
      const hours = (id: string) => page.locator(`#${id} [data-ok-section="hours"]`).textContent();
      expect(await hours("tz-utc")).toBe("01");
      expect(await hours("tz-ny")).toBe("09");
      expect(await hours("tz-hcm")).toBe("08");
      const ny = page.locator("#tz-ny");
      await ny.locator('[data-ok-section="hours"]').click();
      await page.keyboard.press("ArrowUp");
      await expect(page.locator("[data-ok-date-field]:has(#tz-ny)")).toHaveAttribute(
        "data-ok-value",
        "2025-05-25T10:30:00",
      );
    });

    test("calendar systems: Persian months", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "calendar-systems"));
      const calendar = page.locator("#cal-fa-month");
      await expect(calendar).toHaveAttribute("data-ok-month", "2025-05-22");
      await expect(calendar.locator('[data-ok-date="2025-05-25"]')).toHaveText("4");
      await calendar.locator("[data-ok-date-calendar-next]").click();
      await expect(calendar).toHaveAttribute("data-ok-month", "2025-06-22");
    });

    test("right to left: arrows follow the reading direction", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "right-to-left"));
      const sections = page.locator('#rtl-field [role="spinbutton"]');
      await sections.first().click();
      await page.keyboard.press("ArrowLeft");
      await expect(sections.nth(1)).toBeFocused();
      const day = page.locator('#rtl-range [data-ok-date="2025-05-20"]');
      await day.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator(":focus")).toHaveAttribute("data-ok-date", "2025-05-21");
    });

    test("view renderers: the analog clock on desktop, a field alone", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "desktop pickers");
      await openStory(page, storyId(impl, "date-pickers", "customization"));
      const fieldOnly = page.locator("[data-ok-date-picker]:has(#custom-field-only)");
      await expect(fieldOnly.locator("[data-ok-date-picker-open]")).toHaveCount(0);
      const analog = page.locator("[data-ok-date-picker]:has(#custom-analog)");
      await analog.locator("[data-ok-date-picker-open]").click();
      await expect(analog.locator("[data-ok-time-clock]")).toBeVisible();
      await page.keyboard.press("Escape");
    });

    test("custom days: dots on event days, also after a month change", async ({ page }) => {
      await openStory(page, storyId(impl, "date-pickers", "customization"));
      const calendar = page.locator("#custom-day");
      await expect(calendar.locator(".sb-day-dot")).toHaveCount(5);
      await calendar.locator("[data-ok-date-calendar-next]").click();
      await expect(calendar.locator('[data-ok-date="2025-06-09"] .sb-day-dot')).toHaveCount(1);
    });
  });
}
