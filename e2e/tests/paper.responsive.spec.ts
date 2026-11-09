import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["basic", "elevation", "variants", "corners"];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** No page overflow, no paper beyond the viewport or clipping its text, no overlapping papers. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const papers = [...document.querySelectorAll<HTMLElement>("[data-ok-paper]")];
    const boxes = papers.map((paper) => {
      const r = paper.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    });
    for (const [i, paper] of papers.entries()) {
      const box = paper.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`#${i}: beyond viewport`);
      if (paper.scrollWidth > paper.clientWidth || paper.scrollHeight > paper.clientHeight)
        problems.push(`#${i}: content clipped`);
      for (const [j, other] of boxes.entries()) {
        const a = boxes[i] as Box;
        if (
          j > i &&
          a.x < other.x + other.width &&
          other.x < a.x + a.width &&
          a.y < other.y + other.height &&
          other.y < a.y + a.height
        )
          problems.push(`#${i} overlaps #${j}`);
      }
    }
    return { problems, sizes: boxes.map(({ width, height }) => ({ width, height })) };
  });
}

for (const viewport of viewports) {
  test.describe(`paper responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          await openStory(page, storyId(impl, "paper", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, sizes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = sizes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
