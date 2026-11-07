import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES: [component: string, story: string][] = [
  ["avatar", "letter"],
  ["avatar", "grouped"],
  ["avatar", "sizes"],
  ["badge", "standard"],
  ["badge", "status"],
  ["chip", "filled"],
  ["chip", "soft"],
  ["label", "filled"],
  ["label", "with-icon"],
];

interface Box {
  width: number;
  height: number;
}

/** No page overflow, nothing beyond the viewport, buttons ≥ 24px and uncovered; sizes for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const parts = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-avatar], [data-ok-badge], [data-ok-chip], [data-ok-label]",
      ),
    ];
    for (const [i, part] of parts.entries()) {
      const box = part.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`#${i}: beyond viewport`);
    }
    for (const [i, button] of [
      ...document.querySelectorAll<HTMLElement>("[data-ok-chip] > button"),
    ].entries()) {
      const box = button.getBoundingClientRect();
      if (box.height < 24 || box.width < 24)
        problems.push(`button #${i}: ${box.width}×${box.height}`);
      button.scrollIntoView({ block: "center" });
      const c = button.getBoundingClientRect();
      const hit = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
      if (!hit || !button.contains(hit)) problems.push(`button #${i}: covered by ${hit?.tagName}`);
    }
    const boxes: Box[] = parts.map((p) => ({
      width: Math.round(p.getBoundingClientRect().width),
      height: Math.round(p.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`display responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const [component, story] of STORIES) {
      test(`${component} ${story}: layout checks pass and React matches HTML`, async ({
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
          await openStory(page, storyId(impl, component, story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${component} ${story}`).toEqual([]);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
