import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

interface Box {
  part: string;
  width: number;
  height: number;
}

/** No page overflow; controls, markers and panels inside the map, ≥ 24px and uncovered. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth)
      problems.push(
        `page overflows: ${document.documentElement.scrollWidth} > ${window.innerWidth}`,
      );
    const boxes: { part: string; width: number; height: number }[] = [];
    for (const [index, map] of [
      ...document.querySelectorAll<HTMLElement>("[data-ok-map]"),
    ].entries()) {
      const frame = map.getBoundingClientRect();
      boxes.push({
        part: `map ${index}`,
        width: Math.round(frame.width),
        height: Math.round(frame.height),
      });
      const inside = (rect: DOMRect) =>
        rect.left >= frame.left - 0.5 &&
        rect.right <= frame.right + 0.5 &&
        rect.top >= frame.top - 0.5 &&
        rect.bottom <= frame.bottom + 0.5;
      for (const part of map.querySelectorAll<HTMLElement>(
        "[data-ok-map-control], [data-ok-map-panel], [data-ok-map-scale], [data-ok-map-attribution], [data-ok-map-legend]",
      )) {
        const rect = part.getBoundingClientRect();
        if (rect.width === 0) continue;
        // In split screen, the left map's right half is clipped away on purpose.
        if (!inside(rect) && !map.closest(".sb-map-compare--split-screen"))
          problems.push(
            `map ${index}: ${part.getAttribute("data-ok-map-panel") === null ? part.tagName : "panel"} outside the map`,
          );
        if (part.hasAttribute("data-ok-map-panel"))
          boxes.push({
            part: `panel ${index}`,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
      }
      for (const target of map.querySelectorAll<HTMLElement>(
        "[data-ok-map-action], [data-ok-map-marker][role=button], [data-ok-map-attribution] > summary, button[data-ok-map-legend-class]",
      )) {
        const rect = target.getBoundingClientRect();
        if (rect.width === 0) continue;
        if (rect.width < 24 || rect.height < 24)
          problems.push(
            `map ${index}: ${target.getAttribute("aria-label")} is ${rect.width}×${rect.height}`,
          );
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight || !inside(rect)) continue;
        const hit = document.elementFromPoint(x, y);
        if (hit && !target.contains(hit))
          problems.push(`map ${index}: ${target.getAttribute("aria-label")} is covered`);
      }
    }
    return { problems, boxes };
  });
}

const STORIES = [
  "change-theme",
  "markers-popups",
  "interaction",
  "heatmap",
  "side-by-side",
  "choropleth",
];

for (const viewport of viewports) {
  test.describe(`map responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    test("layout checks pass and React matches HTML", async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "Touch emulation (isMobile) is Chromium-only.");
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.touch,
        isMobile: viewport.touch,
      });
      for (const story of STORIES) {
        const results: Record<string, Box[]> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "map", story));
          await expect(page.locator("[data-ok-map]:not([data-ok-ready])")).toHaveCount(0);
          await page.evaluate(() => document.fonts.ready);
          const { problems, boxes } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = boxes;
          // Touch: a marker opens its popup with a tap.
          if (viewport.touch && story === "markers-popups") {
            await page.getByRole("button", { name: "Kenya" }).tap();
            await expect(page.getByRole("dialog", { name: "Kenya" })).toBeVisible();
          }
          await page.close();
        }
        expect(results["html"], story).toEqual(results["react"]);
      }
      await context.close();
    });
  });
}
