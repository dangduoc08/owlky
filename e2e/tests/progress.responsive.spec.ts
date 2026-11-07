import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES: [component: "circular-progress" | "linear-progress", story: string][] = [
  ["circular-progress", "indeterminate"],
  ["circular-progress", "determinate"],
  ["circular-progress", "sizes"],
  ["linear-progress", "indeterminate"],
  ["linear-progress", "determinate"],
  ["linear-progress", "buffer"],
  ["linear-progress", "query"],
];

interface Box {
  width: number;
  height: number;
  top: number;
  left: number;
}

/** Layout checks for every progress of the story; returns the measured boxes for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth) problems.push(`page overflows: ${doc.scrollWidth}px`);
    const roots = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-ok-circular-progress], [data-ok-linear-progress]",
      ),
    ];
    const boxes: Box[] = roots.map((root, i) => {
      const box = root.getBoundingClientRect();
      const linear = root.hasAttribute("data-ok-linear-progress");
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`#${i}: beyond viewport`);
      if (linear) {
        const row = root.parentElement?.getBoundingClientRect();
        if (Math.abs(box.height - 4) > 0.5) problems.push(`#${i}: height ${box.height} ≠ 4`);
        if (row && Math.abs(box.width - row.width) > 0.5) problems.push(`#${i}: not full width`);
      } else {
        const size = Number(root.dataset["okSize"] ?? 40);
        // Layout box (the rotation doesn't change offsetWidth).
        if (root.offsetWidth !== size || root.offsetHeight !== size)
          problems.push(`#${i}: ${root.offsetWidth}×${root.offsetHeight} ≠ ${size}`);
      }
      for (let j = 0; j < i; j++) {
        const other = roots[j]?.getBoundingClientRect() as DOMRect;
        const overlaps =
          box.left < other.right - 0.5 &&
          other.left < box.right - 0.5 &&
          box.top < other.bottom - 0.5 &&
          other.top < box.bottom - 0.5;
        if (overlaps && !linear) problems.push(`#${i}: overlaps #${j}`);
        if (linear && Math.abs(box.top - other.top) < 1) problems.push(`#${i}: bars share a row`);
      }
      return {
        width: Math.round(root.offsetWidth),
        height: Math.round(root.offsetHeight),
        top: Math.round(root.offsetTop),
        left: Math.round(root.offsetLeft),
      };
    });
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`progress responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${component} ${story}`).toEqual([]);
          expect(boxes.length).toBeGreaterThan(0);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
