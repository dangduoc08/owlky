import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = [
  "align",
  "progress",
  "opacity",
  "scale",
  "fade",
  "parallax",
  "autoplay",
  "auto-scroll",
  "thumbs-x",
  "thumbs-y",
  "variable-widths",
  "auto-height",
  "y-axis",
  "dots-number",
  "animation",
  "custom",
  "drag-free",
  "slides-to-scroll",
  "right-to-left",
];

interface Box {
  width: number;
  height: number;
}

const TARGETS =
  "[data-ok-carousel-prev], [data-ok-carousel-next], [data-ok-carousel-dot], [data-ok-carousel-thumb], [data-ok-carousel-play]";

/**
 * No page overflow, carousels inside the page, controls ≥ 24px and uncovered (thumbnails may sit
 * past the edge of their scrolling row), and the slide boxes to compare React with HTML.
 */
function measure(page: Page) {
  return page.evaluate((targets) => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    for (const root of document.querySelectorAll<HTMLElement>("[data-ok-carousel]")) {
      const box = root.getBoundingClientRect();
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push("carousel beyond viewport");
    }
    for (const [i, target] of [...document.querySelectorAll<HTMLElement>(targets)].entries()) {
      const list = target.closest("[data-ok-carousel-thumbs]");
      if (list) {
        const a = list.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        if (
          b.right > a.right + 1 ||
          b.left < a.left - 1 ||
          b.bottom > a.bottom + 1 ||
          b.top < a.top - 1
        )
          continue;
      }
      const box = target.getBoundingClientRect();
      if (box.height < 24 || box.width < 24)
        problems.push(`target #${i}: ${box.width}×${box.height}`);
      target.scrollIntoView({ block: "center", inline: "nearest" });
      const c = target.getBoundingClientRect();
      const hit = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
      if (!hit || !(target.contains(hit) || hit.contains(target)))
        problems.push(
          `target #${i} (${target.getAttribute("aria-label")}): covered by ${hit?.tagName}.${hit?.className}`,
        );
    }
    window.scrollTo(0, 0);
    const boxes: Box[] = [
      ...document.querySelectorAll<HTMLElement>("[data-ok-carousel-slide]"),
    ].map((slide) => ({
      width: Math.round(slide.getBoundingClientRect().width),
      height: Math.round(slide.getBoundingClientRect().height),
    }));
    return { problems, boxes };
  }, TARGETS);
}

for (const viewport of viewports) {
  test.describe(`carousel responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          await openStory(page, storyId(impl, "carousel", story));
          await page.evaluate(() => document.fonts.ready);
          // Slide pictures are lazy Images (a ratio box, so their size doesn't wait for them):
          // wait for each one's state to match its picture, and for the eager pictures.
          await page.waitForFunction(() =>
            [...document.images].every((img) => {
              const root = img.parentElement?.closest("[data-ok-image]");
              if (!root) return img.complete;
              const state = !img.complete ? "loading" : img.naturalWidth > 0 ? "loaded" : "error";
              return root.getAttribute("data-ok-state") === state;
            }),
          );
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = boxes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }

    test("dots number: one, two or three cards per view by breakpoint", async ({
      browser,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.touch,
        isMobile: viewport.touch,
      });
      const expected = viewport.width >= 900 ? 3 : viewport.width >= 600 ? 2 : 1;
      for (const impl of implementations) {
        const page = await context.newPage();
        await openStory(page, storyId(impl, "carousel", "dots-number"));
        const ratio = await page.evaluate(() => {
          const view = document.querySelector("[data-ok-carousel-viewport]") as HTMLElement;
          const slide = document.querySelector("[data-ok-carousel-slide]") as HTMLElement;
          return view.clientWidth / slide.getBoundingClientRect().width;
        });
        expect(Math.round(ratio), impl).toBe(expected);
      }
      await context.close();
    });
  });
}
