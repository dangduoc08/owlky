import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = [
  "basics",
  "outlined",
  "complex-interaction",
  "media",
  "primary-action",
  "ui-controls",
  "active-state",
];

/**
 * No page overflow; cards inside the viewport; no card covering another; header and content text
 * not clipped; every control at least 24px and reachable at its center (nothing covers it).
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const cards = [...document.querySelectorAll<HTMLElement>("[data-ok-card]")];
    const boxes = cards.map((card) => card.getBoundingClientRect());
    for (const [i, box] of boxes.entries()) {
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`card ${i}: beyond viewport`);
      for (const [j, other] of boxes.entries())
        if (
          j > i &&
          box.left < other.right - 0.5 &&
          other.left < box.right - 0.5 &&
          box.top < other.bottom - 0.5 &&
          other.top < box.bottom - 0.5
        )
          problems.push(`card ${i} overlaps card ${j}`);
    }
    for (const part of document.querySelectorAll<HTMLElement>(
      "[data-ok-card-header-content], [data-ok-card-content]:not([hidden])",
    ))
      if (part.scrollWidth > part.clientWidth + 0.5) problems.push(`clipped: ${part.textContent}`);
    for (const control of document.querySelectorAll<HTMLElement>(
      "[data-ok-card] :is(button, a[href])",
    )) {
      const box = control.getBoundingClientRect();
      const name = control.getAttribute("aria-label") ?? control.textContent?.slice(0, 20);
      if (box.width < 24 || box.height < 24) problems.push(`small target: ${name}`);
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (y < 0 || y > window.innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit || !control.contains(hit)) problems.push(`covered: ${name}`);
    }
    return {
      problems,
      sizes: boxes.map((box) => ({ width: Math.round(box.width), height: Math.round(box.height) })),
    };
  });
}

for (const viewport of viewports) {
  test.describe(`card responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
        const results: Record<string, unknown> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "card", story));
          await page.evaluate(() => document.fonts.ready);
          await page.waitForLoadState("networkidle");
          await page.waitForFunction(() => [...document.images].every((image) => image.complete));
          const { problems, sizes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = sizes;
          if (story === "complex-interaction") {
            await page.getByRole("button", { name: "Show the method" }).click();
            const open = await measure(page);
            expect(open.problems, `${impl} ${story} open`).toEqual([]);
            results[`${impl}-open`] = open.sizes;
          }
        }
        expect(results["html"]).toEqual(results["react"]);
        if (story === "complex-interaction")
          expect(results["html-open"]).toEqual(results["react-open"]);
        await context.close();
      });
    }
  });
}
