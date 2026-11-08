// Gzip size budgets for what users download. Raise a budget only with a reason in the PR.
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const budgets = [
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
  ["packages/html/dist/owlky.js", 85_000, "HTML runtime + all components (IIFE)"],
  ["packages/html/dist/esm/runtime/runtime.js", 3_000, "HTML core runtime"],
  // The Editor is opt-in (ADR-0023): Tiptap, ProseMirror and its starter kit are about 125 kB of
  // it; owlky.js stays free of them.
  ["packages/html/dist/owlky-editor.js", 135_000, "Editor + Tiptap (IIFE, loaded after owlky.js)"],
  // 33 kB since the date pickers' phase 1 (field sections, calendar, month / year views, layout;
  // about 2.5 kB).
  // 30 kB since the Editor (content typography, code blocks, toolbar; about 1.7 kB).
  // 28 kB since the data grid (phase 1); 27 kB after Motion (entrance, loop, draw and border
  // keyframes); 25 kB after the composite
  // inputs, 22 kB after the navigation components, 20 kB after the form, display and list
  // components. Per-component files (`@owlky/styles/components/*`) let apps
  // load only what they use.
  ["packages/styles/dist/owlky.min.css", 33_000, "All CSS (tokens + components)"],
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
