// Reports the JavaScript each page loads up front (scripts in its HTML), gzipped.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { app } from "./content.mjs";

const out = join(app, "out");
for (const page of [
  "index.html",
  "get-started/index.html",
  "foundations/colors/index.html",
  "components/button/index.html",
  "search/index.html",
]) {
  const html = readFileSync(join(out, page), "utf8");
  const scripts = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]),
    ),
  ];
  let raw = 0;
  let gz = 0;
  for (const src of scripts) {
    const file = join(out, src);
    raw += statSync(file).size;
    gz += gzipSync(readFileSync(file)).length;
  }
  console.log(
    `${page}: ${scripts.length} scripts, ${Math.round(raw / 1024)} kB, ${Math.round(gz / 1024)} kB gzip`,
  );
}
