import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["html-content", "markdown-content"];

interface Box {
  tag: string;
  width: number;
  height: number;
}

/** No page overflow, nothing clipped or beyond the root, every block's box for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const root = document.querySelector<HTMLElement>("[data-ok-markdown]") as HTMLElement;
    const frame = root.getBoundingClientRect();
    const blocks = [...root.querySelectorAll<HTMLElement>("*")].filter(
      (element) => element.getClientRects().length > 0,
    );
    for (const block of blocks) {
      const box = block.getBoundingClientRect();
      if (box.right > frame.right + 0.5 || box.left < frame.left - 0.5)
        problems.push(`${block.tagName} beyond the root`);
      if (["PRE", "TABLE", "TD", "TH", "P", "BLOCKQUOTE"].includes(block.tagName))
        if (block.scrollWidth > block.clientWidth + 1) problems.push(`${block.tagName} clipped`);
    }
    const boxes = [...root.querySelectorAll<HTMLElement>(":scope > :not([hidden])")].map((e) => ({
      tag: e.tagName,
      width: Math.round(e.getBoundingClientRect().width),
      height: Math.round(e.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`markdown responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          await openStory(page, storyId(impl, "markdown", story));
          await expect(page.locator("[data-ok-markdown] .hljs-keyword").first()).toBeVisible();
          await page.waitForFunction(() =>
            [...document.images].every((image) => image.complete && image.naturalWidth > 0),
          );
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = boxes;
          if (viewport.touch) {
            // Links work with a tap (no hover needed); they open a new tab (its request stops).
            await context.route(/example\.com|react\.dev/, (route) => route.abort());
            const link = page.locator("[data-ok-markdown] a").first();
            const opened = page.context().waitForEvent("page");
            await link.tap();
            await (await opened).close();
          }
          await page.close();
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
