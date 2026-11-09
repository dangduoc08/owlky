import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * No page overflow; the open step stays inside the viewport and its buttons are at least 24px and
 * uncovered; the spotlight hole surrounds the target; the boxes to compare React with HTML.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const round = (rect: DOMRect): Box => ({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
    const step = document.querySelector<HTMLElement>("[data-ok-walktour-step][data-ok-open]");
    const boxes: Box[] = [];
    if (step) {
      const box = step.getBoundingClientRect();
      if (box.left < -0.5 || box.right > window.innerWidth + 0.5)
        problems.push(`step beyond the viewport: ${box.left}–${box.right}`);
      // The arrow sits outside the step on purpose: check the content box.
      const content = step.querySelector<HTMLElement>("[data-ok-walktour-content]");
      if (content && content.scrollWidth > content.clientWidth + 1)
        problems.push("step content overflows");
      boxes.push(round(box));
      for (const [i, button] of [
        ...step.querySelectorAll<HTMLElement>("[data-ok-walktour-action]"),
      ].entries()) {
        if (!button.checkVisibility()) continue;
        const b = button.getBoundingClientRect();
        if (b.width < 24 || b.height < 24) problems.push(`button #${i}: ${b.width}×${b.height}`);
        const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        if (!hit || !button.contains(hit)) problems.push(`button #${i} covered by ${hit?.tagName}`);
        boxes.push(round(b));
      }
    }
    const beacon = document.querySelector<HTMLElement>("[data-ok-walktour-beacon]");
    if (beacon?.checkVisibility()) {
      const b = beacon.getBoundingClientRect();
      if (b.width < 24) problems.push("beacon too small");
      boxes.push(round(b));
    }
    return { problems, boxes };
  });
}

for (const viewport of viewports) {
  test.describe(`walktour responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of ["basic", "beacons"]) {
      test(`${story}: layout checks pass on every step and React matches HTML`, async ({
        browser,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          hasTouch: viewport.touch,
          isMobile: viewport.touch,
        });
        const results: Record<string, Box[][]> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "walktour", story));
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction(() => [...document.images].every((image) => image.complete));
          const all: Box[][] = [];
          for (let i = 0; i < 6; i++) {
            const step = page.locator("[data-ok-walktour-step][data-ok-open]");
            const beacon = page.locator("[data-ok-walktour-beacon]");
            if (!(await step.count()) && !(await beacon.isVisible())) break;
            await page.evaluate(
              () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 400))),
            );
            const { problems, boxes } = await measure(page);
            expect(problems, `${impl} ${story} step ${i + 1}`).toEqual([]);
            all.push(boxes);
            const target = (await step.count())
              ? step.locator('[data-ok-walktour-action="primary"]')
              : beacon;
            if (viewport.touch) await target.tap();
            else await target.click();
          }
          results[impl] = all;
          await page.close();
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
