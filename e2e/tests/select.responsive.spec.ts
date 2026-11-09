import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = [
  "basic",
  "variants",
  "labels-helper-text",
  "auto-width",
  "small-size",
  "other-props",
  "native-select",
  "multiple-default",
  "chips",
  "placeholder",
  "multiple-native",
  "grouping",
];

/**
 * No page overflow; every field inside the viewport, at least 24px high and reachable at its
 * center; labels and helper texts not clipped.
 */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
    const fields = [...document.querySelectorAll<HTMLElement>("[data-ok-select][data-ok-variant]")];
    const boxes = fields.map((field) => field.getBoundingClientRect());
    for (const [i, box] of boxes.entries()) {
      if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
        problems.push(`field ${i}: beyond viewport`);
      if (box.height < 24) problems.push(`field ${i}: ${box.height}px high`);
      const target = fields[i]?.querySelector<HTMLElement>(
        ":scope > [data-ok-select-display], :scope > select",
      ) as HTMLElement;
      const center = target.getBoundingClientRect();
      const x = center.left + center.width / 2;
      const y = center.top + center.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (y < window.innerHeight && (!hit || !(fields[i] as HTMLElement).contains(hit)))
        problems.push(`field ${i}: covered`);
    }
    for (const part of document.querySelectorAll<HTMLElement>("[data-ok-form-helper-text]"))
      if (part.scrollWidth > part.clientWidth + 0.5) problems.push(`clipped: ${part.textContent}`);
    return {
      problems,
      sizes: boxes.map((box) => ({ width: Math.round(box.width), height: Math.round(box.height) })),
    };
  });
}

for (const viewport of viewports) {
  test.describe(`select responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
          await openStory(page, storyId(impl, "select", story));
          await page.evaluate(() => document.fonts.ready);
          const { problems, sizes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = sizes;
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }

    test("the open menu stays inside the viewport (tap)", async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.touch,
        isMobile: viewport.touch,
      });
      for (const impl of implementations) {
        const page = await context.newPage();
        await openStory(page, storyId(impl, "select", "multiple-default"));
        const field = page.locator("#select-multiple");
        if (viewport.touch) await field.tap();
        else await field.click();
        const paper = page.locator("#select-multiple-menu");
        await expect(paper).toBeVisible();
        const box = await paper.boundingBox();
        const fieldBox = await field.boundingBox();
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(Math.floor(fieldBox?.width ?? 0) - 1);
      }
      await context.close();
    });
  });
}
