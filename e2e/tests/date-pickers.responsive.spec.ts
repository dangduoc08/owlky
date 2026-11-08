import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** Date pickers at every viewport, React and HTML (spec: specs/components/date-picker.md → Responsive). */
const STORIES = ["date-story", "calendars", "validation", "shortcuts", "localization"];

const PARTS =
  "[data-ok-date-field], [data-ok-date-calendar], [data-ok-picker-layout], [data-ok-month-calendar], [data-ok-year-calendar]";
const TARGETS =
  "[data-ok-picker-day], [data-ok-date-picker-open], [data-ok-picker-action], [data-ok-date-calendar-prev], [data-ok-date-calendar-next]";

function measure(page: Page) {
  return page.evaluate(
    ({ parts, targets }) => {
      const problems: string[] = [];
      if (document.documentElement.scrollWidth > window.innerWidth)
        problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
      const visible = (el: Element) => el.getClientRects().length > 0;
      const boxes = [...document.querySelectorAll<HTMLElement>(parts)]
        .filter(visible)
        .map((part) => {
          const box = part.getBoundingClientRect();
          if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
            problems.push(`${part.tagName} outside the viewport`);
          return { width: Math.round(box.width), height: Math.round(box.height) };
        });
      for (const target of document.querySelectorAll<HTMLElement>(targets)) {
        if (!visible(target)) continue;
        const box = target.getBoundingClientRect();
        // WCAG 2.2 2.5.8: targets at least 24 × 24 CSS px.
        if (box.width < 24 || box.height < 24)
          problems.push(`small target ${box.width}×${box.height}`);
      }
      return { problems, boxes };
    },
    { parts: PARTS, targets: TARGETS },
  );
}

for (const viewport of viewports) {
  test.describe(`date pickers at ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
    });

    for (const story of STORIES) {
      test(`${story}: no overflow, clipping or small targets; React = HTML`, async ({ page }) => {
        const results = [];
        for (const impl of implementations) {
          await openStory(page, storyId(impl, "date-pickers", story));
          const result = await measure(page);
          expect(result.problems, `${impl}`).toEqual([]);
          results.push(result.boxes);
        }
        expect(results[0]).toEqual(results[1]);
      });
    }

    test("an open picker stays inside the screen", async ({ page }) => {
      for (const impl of implementations) {
        await openStory(page, storyId(impl, "date-pickers", "date-story"));
        const open = page.locator("[data-ok-date-picker-open]").first();
        if (viewport.touch) await open.tap();
        else await open.click();
        const paper = page.locator(
          "[data-ok-date-picker-paper][data-ok-open], dialog[open] > [data-ok-dialog-paper]",
        );
        await expect(paper).toBeVisible();
        const box = await paper.boundingBox();
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
        // The calendar keeps its 320px.
        const calendar = await paper.locator("[data-ok-date-calendar]").boundingBox();
        expect(Math.round(calendar?.width ?? 0)).toBe(320);
        await page.keyboard.press("Escape");
      }
    });
  });
}
