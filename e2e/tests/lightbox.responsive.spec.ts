import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

interface Box {
  width: number;
  height: number;
}

const TARGETS =
  "dialog[open] [data-ok-lightbox-toolbar] > button, dialog[open] [data-ok-lightbox-nav], dialog[open] [data-ok-carousel-thumb], [data-ok-inline] [data-ok-lightbox-toolbar] > button, [data-ok-inline] [data-ok-lightbox-nav]";

/**
 * No page overflow, the lightbox fills the viewport (or its box inline), the visible controls are
 * at least 24px and uncovered (thumbnails may sit past the edge of their scrolling row), the title
 * ends before the toolbar, and the boxes to compare React with HTML.
 */
function measure(page: Page) {
  return page.evaluate((targets) => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const open = document.querySelector<HTMLElement>("dialog[open][data-ok-lightbox]");
    if (open) {
      const box = open.getBoundingClientRect();
      if (
        Math.round(box.width) !== window.innerWidth ||
        Math.round(box.height) !== window.innerHeight
      )
        problems.push(`lightbox ${box.width}×${box.height}`);
    }
    for (const root of document.querySelectorAll<HTMLElement>(
      "[data-ok-lightbox][data-ok-inline]",
    )) {
      const box = root.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push("inline beyond viewport");
    }
    for (const [i, target] of [...document.querySelectorAll<HTMLElement>(targets)].entries()) {
      if (!target.checkVisibility()) continue;
      const list = target.closest("[data-ok-carousel-thumbs]");
      if (list) {
        const a = list.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        if (b.right > a.right + 1 || b.left < a.left - 1) continue;
      }
      const box = target.getBoundingClientRect();
      if (box.height < 24 || box.width < 24)
        problems.push(`target #${i}: ${box.width}×${box.height}`);
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      if (!hit || !(target.contains(hit) || hit.contains(target)))
        problems.push(
          `target #${i} (${target.getAttribute("aria-label")}): covered by ${hit?.tagName}`,
        );
    }
    const title = document.querySelector<HTMLElement>(
      "[data-ok-lightbox-slide]:not([inert]) [data-ok-lightbox-caption='title']",
    );
    const toolbar = title
      ?.closest("[data-ok-lightbox]")
      ?.querySelector("[data-ok-lightbox-toolbar]");
    if (title && toolbar && title.checkVisibility()) {
      // The title's text box: its padding keeps it clear of the toolbar (long text ends in "…").
      const style = getComputedStyle(title);
      const outer = title.getBoundingClientRect();
      const text = {
        left: outer.left + Number.parseFloat(style.paddingLeft),
        right: outer.right - Number.parseFloat(style.paddingRight),
        top: outer.top + Number.parseFloat(style.paddingTop),
        bottom: outer.bottom - Number.parseFloat(style.paddingBottom),
      };
      const bar = toolbar.getBoundingClientRect();
      const rtl = getComputedStyle(title).direction === "rtl";
      const overlaps = rtl ? text.left < bar.right - 1 : text.right > bar.left + 1;
      if (overlaps && text.bottom > bar.top && text.top < bar.bottom)
        problems.push("title under the toolbar");
    }
    const boxes: Box[] = [
      ...document.querySelectorAll<HTMLElement>(
        "dialog[open] [data-ok-lightbox-slide], [data-ok-inline] [data-ok-lightbox-slide], [data-ok-lightbox-trigger]",
      ),
    ].map((element) => ({
      width: Math.round(element.getBoundingClientRect().width),
      height: Math.round(element.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  }, TARGETS);
}

for (const viewport of viewports) {
  test.describe(`lightbox responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    for (const story of ["basic", "inline", "toolbar"]) {
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
          await openStory(page, storyId(impl, "lightbox", story));
          await page.evaluate(() => document.fonts.ready);
          const trigger = page.locator("[data-ok-lightbox-trigger]").first();
          if (story !== "inline") {
            const before = await measure(page);
            expect(before.problems, `${impl} ${story} closed`).toEqual([]);
            if (viewport.touch) await trigger.tap();
            else await trigger.click();
            await expect(page.locator("dialog[open][data-ok-lightbox]")).toBeVisible();
          }
          await page.waitForFunction(() =>
            [
              ...document.querySelectorAll<HTMLImageElement>(
                "[data-ok-lightbox-slide]:not([inert]) img",
              ),
            ].every((image) => image.complete),
          );
          await page.evaluate(
            () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))),
          );
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
