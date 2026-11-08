// Gzip size budgets for what users download. Raise a budget only with a reason in the PR.
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const budgets = [
  // 31 kB since the composite inputs (slider and tree controllers, autocomplete, rating, transfer
  // list runtimes); 24 kB after the navigation components, 22 kB after the overlays. The CDN bundle carries every component; the npm ESM build
  // (`@owlky/html`) is tree-shaken.
  ["packages/html/dist/owlky.js", 31_000, "HTML runtime + all components (IIFE)"],
  ["packages/html/dist/esm/runtime/runtime.js", 3_000, "HTML core runtime"],
  // 25 kB since the composite inputs (rating, slider, timeline, transfer list, tree view,
  // autocomplete); 22 kB after the navigation components, 20 kB after the form, display and list
  // components. Per-component files (`@owlky/styles/components/*`) let apps
  // load only what they use.
  ["packages/styles/dist/owlky.min.css", 25_000, "All CSS (tokens + components)"],
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
