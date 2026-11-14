// Reports the JavaScript each page loads up front (scripts in its HTML), gzipped.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { app } from "./content.mjs";

// Prerendered pages live in .next/server/app; `/_next/static/…` is served from .next/static/.
const pages = join(app, ".next/server/app");
const out = join(app, ".next");
for (const page of [
  "index.html",
  "get-started.html",
  "foundations/colors.html",
  "components/button.html",
  "search.html",
  "account.html",
]) {
  const html = readFileSync(join(pages, page), "utf8");
  const scripts = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]),
    ),
  ];
  let raw = 0;
  let gz = 0;
  for (const src of scripts) {
    const file = join(out, src.replace(/^\/_next\//, ""));
    raw += statSync(file).size;
    gz += gzipSync(readFileSync(file)).length;
  }
  console.log(
    `${page}: ${scripts.length} scripts, ${Math.round(raw / 1024)} kB, ${Math.round(gz / 1024)} kB gzip`,
  );
}
