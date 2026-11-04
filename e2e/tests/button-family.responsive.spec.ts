import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** Every story of the components added with Button (React and HTML share story ids). */
const STORIES = [
  ["icon-button", ["base", "colors", "sizes", "with-animate"]],
  ["fab", ["default", "outlined", "soft", "with-animate"]],
  ["button-group", ["contained", "outlined", "text", "soft", "sizes", "orientation"]],
  ["toggle-button", ["exclusive", "multiple", "sizes", "disabled", "colors", "vertical"]],
] as const;

interface Measure {
  name: string;
  width: number;
  height: number;
}

/** Layout checks for every button of the story; returns the measured boxes for parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth) problems.push(`page overflows: ${doc.scrollWidth}px`);
    const buttons = [...document.querySelectorAll<HTMLElement>("#storybook-root button")];
    const boxes = buttons.map((button) => button.getBoundingClientRect());
    const measures = buttons.map((button, i) => {
      const box = boxes[i] as DOMRect;
      const name = button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "";
      if (button.scrollWidth > button.clientWidth + 1) problems.push(`${name}: clipped`);
      if (box.width < 24 || box.height < 24)
        problems.push(`${name}: target ${box.width}×${box.height}`);
      if (box.right > window.innerWidth + 0.5) problems.push(`${name}: beyond viewport`);
      for (let j = 0; j < i; j++) {
        const other = boxes[j] as DOMRect;
        const overlaps =
          box.left < other.right - 0.5 &&
          other.left < box.right - 0.5 &&
          box.top < other.bottom - 0.5 &&
          other.top < box.bottom - 0.5;
        if (overlaps) problems.push(`${name}: overlaps #${j}`);
      }
      button.scrollIntoView({ block: "center" });
      const center = button.getBoundingClientRect();
      const hit = document.elementFromPoint(
        center.x + center.width / 2,
        center.y + center.height / 2,
      );
      if (!hit || !button.contains(hit)) problems.push(`${name}: covered by ${hit?.tagName}`);
      return { name, width: Math.round(box.width), height: Math.round(box.height) };
    });
    return { problems, measures };
  });
}

for (const viewport of viewports) {
  test.describe(`button family responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const [component, stories] of STORIES) {
      for (const story of stories) {
        test(`${component} / ${story}: layout checks pass and React matches HTML`, async ({
          browser,
          browserName,
        }) => {
          test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            hasTouch: viewport.touch,
            isMobile: viewport.touch,
          });
          const results: Record<string, Measure[]> = {};
          for (const impl of implementations) {
            const page = await context.newPage();
            await openStory(page, storyId(impl, component, story));
            await page.evaluate(() => document.fonts.ready);
            const { problems, measures } = await measure(page);
            expect(problems, `${impl} ${component}/${story}`).toEqual([]);
            results[impl] = measures;
            if (viewport.touch) {
              const enabled = page.locator("#storybook-root button:not([disabled])");
              if ((await enabled.count()) > 0) await enabled.first().tap();
            }
            await page.close();
          }
          expect(results["react"]).toEqual(results["html"]);
          await context.close();
        });
      }
    }
  });
}
