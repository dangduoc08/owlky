import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** One entry per reference section, plus fit / position and loading. */
const STORIES = ["list", "aspect-ratio", "overlay", "fit-and-position", "loading"];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Grid columns of the stories' demo grid at each breakpoint (2 / 3 from 600px / 4 from 900px). */
const columns = (width: number) => (width >= 900 ? 4 : width >= 600 ? 3 : 2);

/**
 * Layout checks: no sideways page scroll, every image keeps its ratio at every width, images of
 * one grid never overlap, captions aren't clipped, and the grid has the breakpoint's columns.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    const roots = [...document.querySelectorAll<HTMLElement>("[data-ok-image]")];
    for (const [i, root] of roots.entries()) {
      const box = root.getBoundingClientRect();
      boxes.push({
        x: Math.round(box.left),
        y: Math.round(box.top + window.scrollY),
        width: Math.round(box.width),
        height: Math.round(box.height),
      });
      const ratio = root.dataset["okRatio"];
      if (ratio) {
        const [w, h] = ratio.split("/").map(Number) as [number, number];
        if (Math.abs(box.height - (box.width * h) / w) > 1)
          problems.push(`image ${i}: ${box.width}×${box.height} isn't ${ratio}`);
      }
      const img = root.querySelector(":scope > img") as HTMLElement;
      const inner = img.getBoundingClientRect();
      if (Math.abs(inner.width - box.width) > 1 || Math.abs(inner.height - box.height) > 1)
        problems.push(`image ${i}: picture doesn't fill its box`);
    }
    for (let a = 0; a < roots.length; a++)
      for (let b = a + 1; b < roots.length; b++) {
        const p = roots[a]?.getBoundingClientRect() as DOMRect;
        const q = roots[b]?.getBoundingClientRect() as DOMRect;
        if (
          p.left < q.right - 0.5 &&
          q.left < p.right - 0.5 &&
          p.top < q.bottom - 0.5 &&
          q.top < p.bottom - 0.5
        )
          problems.push(`images ${a} and ${b} overlap`);
      }
    for (const caption of document.querySelectorAll<HTMLElement>(".sb-image-caption"))
      if (caption.scrollWidth > caption.clientWidth + 1)
        problems.push(`caption "${caption.textContent}" clipped`);
    const grid = document.querySelector(".sb-image-grid") as Element;
    const tracks = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    return { problems, boxes, tracks };
  });
}

for (const viewport of viewports) {
  test.describe(`image responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
        const results: Record<string, Box[]> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "image", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes, tracks } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          // The story page has padding: the grid follows the viewport's breakpoint.
          expect(tracks, `${impl} ${story}`).toBe(columns(viewport.width));
          results[impl] = boxes;
          await page.close();
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
