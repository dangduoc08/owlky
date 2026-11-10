import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** Stories checked at every viewport (one entry per reference section). */
export const STORIES: [component: string, story: string][] = [
  ...["left", "right", "alternating", "filled", "outlined", "opposite", "customized"].map(
    (s) => ["timeline", s] as [string, string],
  ),
  ...["controlled", "read-only", "disabled", "custom", "ten-stars", "hover", "half", "sizes"].map(
    (s) => ["rating", s] as [string, string],
  ),
  ...[
    "volume",
    "disabled",
    "temperature",
    "sizes",
    "small-steps",
    "custom-marks",
    "restricted",
    "range",
    "vertical",
    "colors",
  ].map((s) => ["slider", s] as [string, string]),
  ...["simple", "enhanced"].map((s) => ["transfer-list", s] as [string, string]),
  ...["simple", "rich", "custom-icons", "checkbox", "custom-styling"].map(
    (s) => ["tree-view", s] as [string, string],
  ),
  ["autocomplete", "playground"],
  ["autocomplete", "country"],
  ...["grouped", "asynchronous", "single-value", "virtualization"].map(
    (s) => ["autocomplete", s] as [string, string],
  ),
  ...[
    "in-view",
    "text",
    "scroll",
    "dialog-story",
    "background",
    "tap-hover",
    "path",
    "count-up-story",
    "logo",
    "avatar-story",
    "border",
  ].map((s) => ["motion", s] as [string, string]),
  ["datagrid", "basic"],
  ["datagrid", "custom"],
  ["datagrid", "advanced"],
  ["datagrid", "large"],
  ["datagrid", "server"],
  ["datagrid", "layout"],
  ["datagrid", "validation"],
  ["datagrid", "tree-data"],
  ["datagrid", "master-detail"],
  ["datagrid", "ordering"],
  ["datagrid", "column-groups"],
  ["datagrid", "list-view"],
  ["datagrid", "lazy-loading"],
  ["datagrid", "charts"],
];

interface Box {
  width: number;
  height: number;
}

const PARTS =
  "[data-ok-timeline-item], [data-ok-timeline-content], [data-ok-rating], [data-ok-slider], [data-ok-transfer-list-panel], [data-ok-tree-item-content], [data-ok-autocomplete], [data-ok-motion], [data-ok-motion-text], [data-ok-count-up], [data-ok-motion-border], [data-ok-data-grid], [data-ok-data-grid-toolbar]";
const TARGETS = "[data-ok-slider-thumb]";

function measure(page: Page) {
  return page.evaluate(
    ({ parts, targets }) => {
      const problems: string[] = [];
      if (document.documentElement.scrollWidth > window.innerWidth)
        problems.push(`page overflows: ${document.documentElement.scrollWidth}px`);
      // Parts inside a data grid's scroll area may sit beyond the viewport: the grid scrolls.
      const found = [...document.querySelectorAll<HTMLElement>(parts)].filter(
        (p) => p.getClientRects().length > 0 && !p.closest("[data-ok-data-grid-main]"),
      );
      for (const [i, part] of found.entries()) {
        const box = part.getBoundingClientRect();
        if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
          problems.push(`${part.tagName}#${i}: beyond viewport`);
        if (
          part.scrollWidth > part.clientWidth + 1 &&
          getComputedStyle(part).overflowX !== "visible"
        )
          problems.push(`${part.tagName}#${i}: clipped`);
      }
      for (const [i, target] of [...document.querySelectorAll<HTMLElement>(targets)].entries()) {
        const box = target.getBoundingClientRect();
        if (box.height < 16 || box.width < 16)
          problems.push(`thumb #${i}: ${box.width}×${box.height}`);
      }
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
  test.describe(`composites responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
  });
}
