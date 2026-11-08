import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES: [component: string, story: string][] = [
  ["tabs", "text"],
  ["tabs", "icon"],
  ["tabs", "colors"],
  ["tabs", "scrollable"],
  ["tabs", "vertical"],
  ["tabs", "custom"],
  ["breadcrumbs", "text"],
  ["breadcrumbs", "with-icon"],
  ["breadcrumbs", "customized"],
  ["stepper", "horizontal"],
  ["stepper", "alternative-label"],
  ["stepper", "vertical"],
  ["stepper", "customized"],
  ["stepper", "mobile"],
];

interface Box {
  width: number;
  height: number;
}

const PARTS =
  "[role=tab], [data-ok-breadcrumbs-item]:not([hidden]), [data-ok-step], [data-ok-mobile-stepper]";
const TARGETS =
  "[role=tab], [data-ok-breadcrumbs-item] > a, [data-ok-breadcrumbs-expand], [data-ok-mobile-stepper] button, .sb-stepper-actions button";

/** No page overflow, parts inside the viewport and not clipped, targets ≥ 24px and uncovered. */
function measure(page: Page) {
  return page.evaluate(
    ({ parts, targets }) => {
      const problems: string[] = [];
      if (document.documentElement.scrollWidth > window.innerWidth)
        problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
      const found = [...document.querySelectorAll<HTMLElement>(parts)].filter(
        (p) => p.getClientRects().length > 0,
      );
      for (const [i, part] of found.entries()) {
        const box = part.getBoundingClientRect();
        // Tabs in a scroller may sit past its edge: only the scroller must stay in the page.
        const scroller = part.closest("[data-ok-tabs-scroller]");
        const frame = scroller ? scroller.getBoundingClientRect() : box;
        if (frame.right > window.innerWidth + 0.5 || frame.left < -0.5)
          problems.push(`${part.tagName}#${i}: beyond viewport`);
        if (!scroller && part.scrollWidth > part.clientWidth + 1)
          problems.push(`${part.tagName}#${i}: clipped`);
      }
      for (const [i, target] of [...document.querySelectorAll<HTMLElement>(targets)].entries()) {
        if (target.getClientRects().length === 0) continue;
        const box = target.getBoundingClientRect();
        if (box.height < 24 || box.width < 24)
          problems.push(`target #${i}: ${box.width}×${box.height}`);
        if ((target as HTMLButtonElement).disabled) continue;
        target.scrollIntoView({ block: "center", inline: "nearest" });
        const c = target.getBoundingClientRect();
        const hit = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
        if (!hit || !(target.contains(hit) || hit.contains(target)))
          problems.push(`target #${i}: covered by ${hit?.tagName}`);
      }
      window.scrollTo(0, 0);
      const boxes: Box[] = found.map((p) => ({
        width: Math.round(p.getBoundingClientRect().width),
        height: Math.round(p.getBoundingClientRect().height),
      }));
      return { problems, boxes };
    },
    { parts: PARTS, targets: TARGETS },
  );
}

for (const viewport of viewports) {
  test.describe(`navigation responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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

    test("scrollable tabs: scroll buttons only from 600px (auto)", async ({
      browser,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.touch,
        isMobile: viewport.touch,
      });
      for (const impl of implementations) {
        const page = await context.newPage();
        await openStory(page, storyId(impl, "tabs", "scrollable"));
        const display = await page
          .locator('[data-ok-tabs-scroll-button="end"]')
          .evaluate((el) => getComputedStyle(el).display);
        expect(display, impl).toBe(viewport.width < 600 ? "none" : "flex");
      }
      await context.close();
    });
  });
}
