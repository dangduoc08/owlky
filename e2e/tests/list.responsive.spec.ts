import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["simple", "nested", "folder", "selected", "controls", "switch"];

interface Box {
  width: number;
  height: number;
}

/** No page overflow, rows inside the viewport, targets ≥ 24px and uncovered; boxes for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const parts = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-list-item], [data-ok-list-item-button], [data-ok-list-subheader]",
      ),
    ].filter((p) => p.getClientRects().length > 0);
    for (const [i, part] of parts.entries()) {
      const box = part.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`#${i}: beyond viewport`);
      if (part.scrollWidth > part.clientWidth + 1) problems.push(`#${i}: clipped`);
    }
    const targets = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-list-item-button], [data-ok-list] [data-ok-icon-button], [data-ok-list] input",
      ),
    ];
    for (const [i, target] of targets.entries()) {
      const box = target.getBoundingClientRect();
      if (box.height < 24 || box.width < 24)
        problems.push(`target #${i}: ${box.width}×${box.height}`);
      target.scrollIntoView({ block: "center" });
      const c = target.getBoundingClientRect();
      const hit = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
      if (
        !hit ||
        !(target.contains(hit) || hit.contains(target) || target.parentElement?.contains(hit))
      )
        problems.push(`target #${i}: covered by ${hit?.tagName}`);
    }
    const boxes: Box[] = parts.map((p) => ({
      width: Math.round(p.getBoundingClientRect().width),
      height: Math.round(p.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`list responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of STORIES) {
      test(`list ${story}: layout checks pass and React matches HTML`, async ({
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
          await openStory(page, storyId(impl, "list", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} list ${story}`).toEqual([]);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
