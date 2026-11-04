// Gzip size budgets for what users download. Raise a budget only with a reason in the PR.
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const budgets = [
  ["packages/html/dist/owlky.js", 15_000, "HTML runtime + all components (IIFE)"],
  ["packages/html/dist/esm/runtime/runtime.js", 3_000, "HTML core runtime"],
  ["packages/styles/dist/owlky.min.css", 12_000, "All CSS (tokens + components)"],
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
