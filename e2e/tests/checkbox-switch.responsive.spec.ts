import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES: [component: "checkbox" | "switch", story: string][] = [
  ["checkbox", "basic"],
  ["checkbox", "sizes"],
  ["checkbox", "custom-icons"],
  ["checkbox", "placement"],
  ["checkbox", "colors"],
  ["checkbox", "indeterminate"],
  ["switch", "basic"],
  ["switch", "sizes"],
  ["switch", "placements"],
  ["switch", "colors"],
];

interface Box {
  width: number;
  height: number;
  top: number;
  left: number;
}

/** Layout checks for every control of the story; returns the measured boxes for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const controls = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-checkbox], [data-ok-switch]"),
    ];
    const boxes: Box[] = controls.map((control, i) => {
      const box = control.getBoundingClientRect();
      const input = control.querySelector("input") as HTMLInputElement;
      const name =
        input.getAttribute("aria-label") ?? control.closest("label")?.textContent?.trim();
      if (box.width < 24 || box.height < 24)
        problems.push(`${name}: target ${box.width}×${box.height}`);
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`${name}: beyond viewport`);
      const inputBox = input.getBoundingClientRect();
      if (Math.abs(inputBox.width - box.width) > 0.5)
        problems.push(`${name}: input doesn't cover the target`);
      for (let j = 0; j < i; j++) {
        const other = controls[j]?.getBoundingClientRect() as DOMRect;
        if (
          box.left < other.right - 0.5 &&
          other.left < box.right - 0.5 &&
          box.top < other.bottom - 0.5 &&
          other.top < box.bottom - 0.5
        )
          problems.push(`${name}: overlaps #${j}`);
      }
      control.scrollIntoView({ block: "center" });
      const center = control.getBoundingClientRect();
      const hit = document.elementFromPoint(
        center.x + center.width / 2,
        center.y + center.height / 2,
      );
      if (hit !== input) problems.push(`${name}: covered by ${hit?.tagName}`);
      const text = control.closest("label")?.querySelector("[data-ok-form-control-label-text]");
      if (text && text.scrollWidth > (text as HTMLElement).clientWidth + 1)
        problems.push(`${name}: label text overflows`);
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        top: Math.round(control.offsetTop),
        left: Math.round(control.offsetLeft),
      };
    });
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`checkbox / switch responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
