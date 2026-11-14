// The client JavaScript each prerendered page loads up front: the gzip size of every module
// <script src> in its HTML (`noModule` polyfills don't load in supported browsers), after
// `next build`. Fails when a page is over its budget. Runs at the end of `pnpm build`.
//
// Budgets are the measurement plus a few kB (roadmap-0.1.0.md › M5); lower them when a page gets
// lighter, never raise them to make a change pass: find the module first
// (`OWLKY_SOURCE_MAPS=1 pnpm build`, then read the chunk's source map).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { app } from "./content.mjs";

/** kB gzip. The landing page shows live Data grid, Chart and Motion previews. */
const BUDGETS = { "/": 390 };
/** Every other page: docs, legal, sign-in and consent. */
const DEFAULT_BUDGET = 195;

const rendered = join(app, ".next/server/app");
const staticRoot = join(app, ".next/static");
const pages = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".html")) pages.push(path);
  }
};
walk(rendered);

const sizes = new Map();
const gzipped = (file) => {
  if (!sizes.has(file)) sizes.set(file, gzipSync(readFileSync(file), { level: 9 }).length);
  return sizes.get(file);
};

const rows = [];
for (const page of pages.sort()) {
  const html = readFileSync(page, "utf8");
  const sources = new Set(
    [...html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"[^>]*>/g)]
      .filter((match) => !/\snomodule\b/i.test(match[0]))
      .map((match) => match[1].split("?")[0]),
  );
  let bytes = 0;
  for (const src of sources) {
    const file = join(staticRoot, src.replace(/^\/_next\/static\//, ""));
    if (existsSync(file)) bytes += gzipped(file);
  }
  if (bytes === 0) continue; // the HTML demo sandboxes load no Next.js scripts
  const route = `/${relative(rendered, page).replace(/\.html$/, "")}`.replace(/^\/index$/, "/");
  if (route.startsWith("/_")) continue; // Next.js's own error pages
  rows.push({ route, kB: bytes / 1000, budget: BUDGETS[route] ?? DEFAULT_BUDGET });
}

let failed = false;
for (const { route, kB, budget } of rows) {
  const over = kB > budget;
  failed ||= over;
  console.log(
    `${over ? "✗" : " "} ${route.padEnd(28)} ${kB.toFixed(1).padStart(6)} kB  (budget ${budget})`,
  );
}
if (failed) {
  console.error("website: a page loads more JavaScript than its budget (scripts/check-js.mjs).");
  process.exit(1);
}
