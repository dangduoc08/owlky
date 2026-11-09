import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["usage", "theme-keys", "semantic-element", "colors", "alignment"];

interface Box {
  width: number;
  height: number;
}

/**
 * No page overflow; text stays in the viewport and wraps (no word overflows its box) unless it is
 * `noWrap`, which keeps one line and clips with an ellipsis. Box sizes for React ↔ HTML parity.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const parts = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-typography], .sb-typography-theme-keys"),
    ];
    for (const [i, part] of parts.entries()) {
      const box = part.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`#${i}: beyond viewport`);
      const noWrap = part.hasAttribute("data-ok-no-wrap");
      if (!noWrap && part.scrollWidth > part.clientWidth + 1)
        problems.push(`#${i}: text overflows`);
      if (noWrap) {
        const lineHeight = Number.parseFloat(getComputedStyle(part).lineHeight);
        if (Math.round(box.height) !== Math.round(lineHeight)) problems.push(`#${i}: not one line`);
      }
    }
    const boxes: Box[] = parts.map((p) => ({
      width: Math.round(p.getBoundingClientRect().width),
      height: Math.round(p.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`typography responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          await openStory(page, storyId(impl, "typography", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}

test("headings grow at the token breakpoints", async ({ page }) => {
  const sizes: number[] = [];
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await openStory(page, storyId("react", "typography", "usage"));
    sizes.push(
      await page
        .locator('[data-ok-variant="h1"]')
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
    );
  }
  expect(sizes[0]).toBeLessThan(sizes[1] as number);
  expect(sizes[1]).toBeLessThan(sizes[2] as number);
});
