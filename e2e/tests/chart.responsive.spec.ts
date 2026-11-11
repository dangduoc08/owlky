import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

const STORIES = [
  "line",
  "area",
  "column-single",
  "column-multiple",
  "column-stacked",
  "column-negative",
  "bar",
  "mixed",
  "scatter",
  "pie",
  "donut",
  "radial-bar",
  "radar",
  "semi-circle-gauge",
  "stroked-gauge",
  "box-plot",
  "heatmap",
  "treemap",
  "bubble",
  "range-area",
  "funnel",
  "pyramid",
  "slope",
  "sparklines",
  "live-data",
  "candlestick",
  "range-bar",
  "timeline",
  "polar-area",
  "zoom",
  "synchronized",
  "brush",
  "annotations",
  "data-labels",
  "donut-legend",
  "heatmap-ranges",
  "box-plot-horizontal",
  "localized",
  "animations",
  "sankey",
  "sankey-vertical",
  "sankey-cycles",
  "sankey-alluvial",
  "sankey-links",
  "tree",
  "sunburst",
  "icicle",
  "geo",
  "geo-projections",
  "geo-hex",
  "stock",
  "stock-overlays",
  "stock-oscillators",
  "stock-line",
];

interface Measure {
  width: number;
  height: number;
  svgWidth: string | null;
  legend: { width: number; height: number; below: boolean } | null;
  labels: number;
}

/** Layout checks of the story's chart; returns its measured boxes for React ↔ HTML parity. */
function measure(page: Page) {
  return page.evaluate(() => {
    const problems: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth) problems.push(`page overflows: ${doc.scrollWidth}px`);
    const root = document.querySelector<HTMLElement>("[data-ok-chart]");
    if (!root) return { problems: ["no chart"], result: null };
    const box = root.getBoundingClientRect();
    if (box.right > window.innerWidth + 0.5 || box.left < -0.5)
      problems.push("chart beyond viewport");
    const plot = root.querySelector<HTMLElement>("[data-ok-chart-plot]") as HTMLElement;
    const svg = plot.querySelector("svg") as SVGSVGElement;
    // Drawn at the plot's width: no scaling, so text keeps its size.
    if (svg.getAttribute("width") !== String(Math.round(plot.clientWidth)))
      problems.push(`svg ${svg.getAttribute("width")} ≠ plot ${plot.clientWidth}`);
    // Axis labels stay inside the SVG and never overlap each other.
    const svgBox = svg.getBoundingClientRect();
    const labels = [...svg.querySelectorAll<SVGTextElement>("[data-ok-chart-tick]")].map((t) =>
      t.getBoundingClientRect(),
    );
    for (const [i, label] of labels.entries()) {
      if (label.left < svgBox.left - 1 || label.right > svgBox.right + 1)
        problems.push(`label ${i} clipped`);
      for (const other of labels.slice(0, i)) {
        const overlaps =
          label.left < other.right - 0.5 &&
          other.left < label.right - 0.5 &&
          label.top < other.bottom - 0.5 &&
          other.top < label.bottom - 0.5;
        if (overlaps) problems.push(`label ${i} overlaps another`);
      }
    }
    // Legend buttons: 24px targets, nothing covering them, inside the chart.
    const items = [...root.querySelectorAll<HTMLElement>("[data-ok-chart-legend-item]")];
    for (const [i, item] of items.entries()) {
      const r = item.getBoundingClientRect();
      if (r.height < 24 || r.width < 24) problems.push(`legend ${i}: ${r.width}×${r.height} < 24`);
      if (r.right > box.right + 0.5) problems.push(`legend ${i} beyond the chart`);
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!hit || !item.contains(hit)) problems.push(`legend ${i} covered`);
    }
    const legend = root.querySelector<HTMLElement>("[data-ok-chart-legend]");
    const legendBox = legend?.getBoundingClientRect();
    const plotBox = plot.getBoundingClientRect();
    return {
      problems,
      result: {
        width: Math.round(box.width),
        height: Math.round(box.height),
        svgWidth: svg.getAttribute("width"),
        legend: legendBox
          ? {
              width: Math.round(legendBox.width),
              height: Math.round(legendBox.height),
              below: legendBox.top >= plotBox.bottom - 0.5,
            }
          : null,
        labels: labels.length,
      },
    };
  });
}

for (const viewport of viewports) {
  test.describe(`chart responsive @ ${viewport.name} ${viewport.width}×${viewport.height}`, () => {
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
        const results: Record<string, Measure | null> = {};
        for (const impl of implementations) {
          const page = await context.newPage();
          await openStory(page, storyId(impl, "chart", story));
          await expect(page.locator("[data-ok-chart][data-ok-ready]")).toHaveCount(
            story === "sparklines" || story === "synchronized" || story === "tree"
              ? 3
              : story === "brush" ||
                  story === "sunburst" ||
                  story === "icicle" ||
                  story === "geo-projections"
                ? 2
                : 1,
          );
          const { problems, result } = await measure(page);
          expect(problems, `${impl} ${story}`).toEqual([]);
          results[impl] = result;
          // A right legend sits below the plot under 600px and beside it from 600px.
          if (story === "column-stacked") expect(result?.legend?.below).toBe(viewport.width < 600);
        }
        expect(results["html"]).toEqual(results["react"]);
        await context.close();
      });
    }
  });
}
