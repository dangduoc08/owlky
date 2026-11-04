import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["contained", "outlined", "text", "soft"] as const;
const HEIGHTS: Record<string, number> = { sm: 30, md: 36, lg: 48, xl: 56 };

interface Measure {
  label: string;
  width: number;
  height: number;
}

/** Layout checks for every button of the story; returns the measured boxes for parity. */
async function measure(page: Page) {
  return page.evaluate((heights) => {
    const problems: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth) problems.push(`page overflows: ${doc.scrollWidth}px`);
    const buttons = [...document.querySelectorAll<HTMLElement>("[data-ok-button]")];
    const boxes = buttons.map((button) => button.getBoundingClientRect());
    const measures = buttons.map((button, i) => {
      const box = boxes[i] as DOMRect;
      const label = button.querySelector<HTMLElement>("[data-ok-button-label]");
      const name = label?.textContent?.trim() ?? "";
      const size = button.dataset["okSize"] ?? "md";
      if (button.scrollWidth > button.clientWidth + 1)
        problems.push(`${name}: clipped horizontally`);
      if (Math.abs(box.height - (heights[size] ?? 0)) > 0.5) {
        problems.push(`${name}: height ${box.height} ≠ ${heights[size]} (${size})`);
      }
      if (box.width < 24 || box.height < 24)
        problems.push(`${name}: target ${box.width}×${box.height}`);
      if (label && label.getClientRects().length > 1) problems.push(`${name}: label wraps`);
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
      return { label: name, width: Math.round(box.width), height: Math.round(box.height) };
    });
    return { problems, measures };
  }, HEIGHTS);
}

for (const viewport of viewports) {
  test.describe(`button responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
        const results: Record<string, Measure[]> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "button", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, measures } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = measures;
          if (viewport.touch) {
            const primary = page.getByRole("button", { name: "Primary", exact: true }).first();
            await primary.tap();
          }
          await page.close();
        }
        expect(results["react"]).toEqual(results["html"]);
        await context.close();
      });
    }
  });
}
