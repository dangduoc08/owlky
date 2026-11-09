import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = ["radios", "checkboxes", "switches", "show-error", "states", "standalone"];

/**
 * No page overflow; form controls inside the viewport; labels and helper texts not clipped; every
 * control at least 24px and reachable at its center (nothing covers it).
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const roots = [...document.querySelectorAll<HTMLElement>("[data-ok-form-control]")];
    const boxes = roots.map((root) => root.getBoundingClientRect());
    for (const [i, box] of boxes.entries())
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`form control ${i}: beyond viewport`);
    for (const part of document.querySelectorAll<HTMLElement>(
      "[data-ok-form-label], [data-ok-form-helper-text], [data-ok-form-control-label-text]",
    ))
      if (part.scrollWidth > part.clientWidth + 0.5) problems.push(`clipped: ${part.textContent}`);
    for (const input of document.querySelectorAll<HTMLInputElement>(
      "[data-ok-form-control] input",
    )) {
      const target = input.parentElement as HTMLElement;
      const box = input.getBoundingClientRect();
      const name = input.labels?.[0]?.textContent ?? input.name;
      if (box.width < 24 || box.height < 24) problems.push(`small target: ${name}`);
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (box.top + box.height / 2 < window.innerHeight && (!hit || !target.contains(hit)))
        problems.push(`covered: ${name}`);
    }
    return {
      problems,
      sizes: boxes.map((box) => ({ width: Math.round(box.width), height: Math.round(box.height) })),
    };
  });
}

for (const viewport of viewports) {
  test.describe(`form control responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
        const results: Record<string, unknown> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "form-control", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, sizes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = sizes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
