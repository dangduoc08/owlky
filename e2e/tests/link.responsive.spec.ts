import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["basic-links", "underline", "colors", "accessibility"];

interface Box {
  width: number;
  height: number;
}

/**
 * No page overflow; every link inside the viewport, not covering another link and reachable at
 * the center of its first line box (nothing covers it); link text never overflows its box.
 * Box sizes for React ↔ HTML parity.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const links = [...document.querySelectorAll<HTMLElement>("[data-ok-link]")];
    const rects = links.map((link) => link.getClientRects()[0] as DOMRect);
    for (const [i, link] of links.entries()) {
      const box = link.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`link ${i}: beyond viewport`);
      if (link.scrollWidth > link.clientWidth + 1 && link.clientWidth > 0)
        problems.push(`link ${i}: text overflows`);
      const first = rects[i] as DOMRect;
      for (const [j, other] of rects.entries())
        if (
          j > i &&
          first.left < other.right - 0.5 &&
          other.left < first.right - 0.5 &&
          first.top < other.bottom - 0.5 &&
          other.top < first.bottom - 0.5
        )
          problems.push(`link ${i} overlaps link ${j}`);
      link.scrollIntoView({ block: "center" });
      const line = link.getClientRects()[0] as DOMRect;
      const hit = document.elementFromPoint(line.left + line.width / 2, line.top + line.height / 2);
      if (!hit || !link.contains(hit)) problems.push(`link ${i}: covered`);
    }
    const boxes: Box[] = links.map((l) => ({
      width: Math.round(l.getBoundingClientRect().width),
      height: Math.round(l.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`link responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          await openStory(page, storyId(impl, "link", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = boxes;
          if (viewport.touch && story === "accessibility") {
            // Touch: the button link answers a tap.
            await page.getByRole("button", { name: "Show more details" }).tap();
          }
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
