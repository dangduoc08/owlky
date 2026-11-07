import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES: [component: "text-field" | "radio", story: string][] = [
  ["text-field", "outlined"],
  ["text-field", "filled"],
  ["text-field", "standard"],
  ["radio", "basic"],
  ["radio", "sizes"],
  ["radio", "placement"],
  ["radio", "colors"],
];

interface Box {
  width: number;
  height: number;
  top: number;
  left: number;
}

/** Layout checks for every field / radio of the story; returns the measured boxes for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const parts = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-text-field-control], [data-ok-radio]"),
    ];
    const boxes: Box[] = parts.map((part, i) => {
      const box = part.getBoundingClientRect();
      const input = part.querySelector<HTMLElement>("input, textarea, select") as HTMLElement;
      const name = input.id || input.getAttribute("aria-label") || `#${i}`;
      if (box.height < 24) problems.push(`${name}: target ${box.width}×${box.height}`);
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`${name}: beyond viewport`);
      const label = part.parentElement?.querySelector(":scope > [data-ok-text-field-label]");
      if (label && label.getBoundingClientRect().right > box.right + 0.5)
        problems.push(`${name}: label overflows the field`);
      for (let j = 0; j < i; j++) {
        const other = parts[j]?.getBoundingClientRect() as DOMRect;
        if (
          box.left < other.right - 0.5 &&
          other.left < box.right - 0.5 &&
          box.top < other.bottom - 0.5 &&
          other.top < box.bottom - 0.5
        )
          problems.push(`${name}: overlaps #${j}`);
      }
      input.scrollIntoView({ block: "center" });
      const center = input.getBoundingClientRect();
      const hit = document.elementFromPoint(
        center.x + center.width / 2,
        center.y + center.height / 2,
      );
      if (!hit || !(hit === input || part.contains(hit)))
        problems.push(`${name}: covered by ${hit?.tagName}`);
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        top: Math.round(part.offsetTop),
        left: Math.round(part.offsetLeft),
      };
    });
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`text field / radio responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          expect(boxes.length).toBeGreaterThan(0);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
