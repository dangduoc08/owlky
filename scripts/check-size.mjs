// Gzip size budgets for what users download. Raise a budget only with a reason in the PR.
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const budgets = [
  // 130 kB once the chart's phase 4 merged after the date pickers' phase 3 (120.7 kB).
  // 120 kB since the chart's phase 4 (ADR-0031: candlestick, range bar, timeline and polar area
  // layouts, zoom and gesture controller, linked charts, annotations, export, toolbar; about
  // 9.2 kB): 114.6 kB.
  // 120 kB since the date pickers' phase 3 (ADR-0028: range model, range calendar, range fields,
  // range pickers and drag editing; about 6 kB), merged after the chart's phase 3 (111.5 kB).
  // 110 kB once the chart's phase 3 merged on top of the data grid's phase 6 (105.4 kB).
  // 100 kB since the chart's phase 3 (ADR-0029: box plot, heatmap, treemap, bubble, range area,
  // funnel, slope and sparkline layouts, multi-value tables, in-place SVG and table patching,
  // updateSeries / appendData; about 5.7 kB): 93.6 kB.
  // 105 kB since the data grid's phase 6 (row grouping, aggregation, pivoting, Excel export with
  // its own ZIP writer, clipboard, cell selection, header filters, charts integration; about
  // 12 kB), merged after both phase 2 merges below (99.8 kB).
  // 95 kB since the chart's phase 2 (pie, donut, radial bar, radar, gauges, data labels; about
  // 3.4 kB) and the date pickers' phase 2 (ADR-0026: time fields, clocks, time pickers; about 6.9 kB),
  // merged together (87.9 kB).
  // 85 kB since the data grid's phase 5 (tree data, detail panels, row reordering, pinned rows,
  // column groups, list view, column virtualization, lazy loading; about 10 kB).
  // 75 kB since the Chart (phase 1 of ADR-0024: scales, layout, legend, tooltip, runtime; about
  // 9.5 kB minified). CSS stays within 33 kB (the chart adds about 1.7 kB).
  // 65 kB since the date pickers' phase 1 (ADR-0022: date engine, sectioned field, calendar,
  // five runtimes, English and Vietnamese texts; about 13 kB).
  // 52 kB since the data grid's phase 4 (spans, row heights, autosizing, validation, events, state,
  // formats, print and CSV options; about 49 kB); 44 kB after its phase 2 (filters, resizing,
  // reordering, pinning, editing, print);
  // 40 kB after its phase 1 (grid engine, keyboard navigation, runtime; ADR-0020); 34 kB after
  // Motion (trigger, count-up and five runtimes, the 62 variant names); 31 kB after
  // the composite inputs, 24 kB after the navigation components, 22 kB after the overlays. The CDN bundle carries every component; the npm ESM build
  // (`@owlky/html`) is tree-shaken.
  ["packages/html/dist/owlky.js", 130_000, "HTML runtime + all components (IIFE)"],
  ["packages/html/dist/esm/runtime/runtime.js", 3_000, "HTML core runtime"],
  // The Editor is opt-in (ADR-0023): Tiptap, ProseMirror and its starter kit are about 125 kB of
  // it; owlky.js stays free of them.
  ["packages/html/dist/owlky-editor.js", 135_000, "Editor + Tiptap (IIFE, loaded after owlky.js)"],
  // 36 kB since the chart's phase 4 (ADR-0031: toolbar, candles, annotations, brush selection,
  // opt-in animations; about 0.5 kB): 35.0 kB.
  // 38 kB since the date pickers' phase 3 (range calendar and range picker styles; about 0.7 kB)
  // merged after the chart's phase 3 (35.2 kB).
  // 35 kB since the date pickers' phase 2 (ADR-0026: time clock, digital clocks, time toolbar,
  // tabs layout; about 1.5 kB in the bundle). The JS runtimes of phase 2 (about 5 kB) fit the
  // CDN budget above.
  // 33 kB since the date pickers' phase 1 (field sections, calendar, month / year views, layout;
  // about 2.5 kB).
  // 30 kB since the Editor (content typography, code blocks, toolbar; about 1.7 kB).
  // 28 kB since the data grid (phase 1); 27 kB after Motion (entrance, loop, draw and border
  // keyframes); 25 kB after the composite
  // inputs, 22 kB after the navigation components, 20 kB after the form, display and list
  // components. Per-component files (`@owlky/styles/components/*`) let apps
  // load only what they use.
  ["packages/styles/dist/owlky.min.css", 38_000, "All CSS (tokens + components)"],
];

let failed = false;
for (const [file, limit, label] of budgets) {
  const size = gzipSync(await readFile(file)).length;
  const ok = size <= limit;
  failed ||= !ok;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${label}: ${(size / 1000).toFixed(2)} kB / ${limit / 1000} kB gzip`,
  );
}
if (failed) process.exit(1);
