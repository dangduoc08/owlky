import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["basic", "bar-labels", "selection", "task-list-columns"];

/**
 * Layout checks: the page never scrolls sideways (the timeline scrolls inside the Gantt), list
 * cells keep their text on one line inside their box, the header and the task list stay put
 * while the timeline scrolls, toolbar buttons are 24px targets nothing covers.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const boxes: number[][] = [];
    for (const root of document.querySelectorAll<HTMLElement>("[data-ok-gantt]")) {
      const viewport = root.querySelector<HTMLElement>("[data-ok-gantt-viewport]");
      if (!viewport) continue;
      if (viewport.getBoundingClientRect().right > root.getBoundingClientRect().right + 1)
        problems.push("viewport wider than the Gantt");
      const visible = [...root.querySelectorAll<HTMLElement>("[data-ok-gantt-cell]")].filter(
        (cell) =>
          cell.getAttribute("data-ok-gantt-cell") !== "timeline" && cell.offsetParent !== null,
      );
      for (const cell of visible) {
        const box = cell.getBoundingClientRect();
        boxes.push([Math.round(box.width), Math.round(box.height)]);
        if (box.height > Number.parseFloat(getComputedStyle(cell).height) + 1)
          problems.push(`cell wraps: ${cell.textContent}`);
      }
      // Scrolled to the end, the name column and the header stay in place.
      const name = root.querySelector<HTMLElement>(
        '[data-ok-gantt-row] [data-ok-gantt-cell="name"]',
      );
      const head = root.querySelector<HTMLElement>("[data-ok-gantt-head]");
      if (name && head) {
        const before = name.getBoundingClientRect().left;
        viewport.scrollLeft = viewport.scrollWidth;
        viewport.scrollTop = viewport.scrollHeight;
        const after = name.getBoundingClientRect().left;
        if (Math.abs(after - before) > 1) problems.push("name column scrolled away");
        if (Math.abs(head.getBoundingClientRect().top - viewport.getBoundingClientRect().top) > 2)
          problems.push("header scrolled away");
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
      }
    }
    return { problems, boxes };
  });
}

async function targets(page: Page) {
  const problems: string[] = [];
  const buttons = page.locator("[data-ok-gantt-toolbar] button");
  for (const button of await buttons.all()) {
    await button.scrollIntoViewIfNeeded();
    const result = await button.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { width: box.width, height: box.height, onTop: hit !== null && el.contains(hit) };
    });
    if (result.width < 24 || result.height < 24) problems.push("button too small");
    if (!result.onTop) problems.push("button covered");
  }
  return problems;
}

for (const viewport of viewports) {
  test.describe(`gantt responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
      test(`${story}: layout checks pass and React matches HTML`, async ({
        browser,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
        });
        const results: number[][][] = [];
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "gantt", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          expect(await targets(page), `${impl} ${story}`).toEqual([]);
          // Below 600px only the name column shows; from 600px every column.
          const columns = await page
            .locator("[data-ok-gantt]")
            .first()
            .locator("[data-ok-gantt-head] [data-ok-gantt-column]:visible")
            .count();
          if (viewport.width < 600) expect(columns, `${impl} ${story}`).toBe(2);
          else expect(columns, `${impl} ${story}`).toBeGreaterThan(2);
          results.push(boxes);
          await page.close();
        }
        expect(results[1]).toEqual(results[0]);
        await context.close();
      });
    }
  });
}
