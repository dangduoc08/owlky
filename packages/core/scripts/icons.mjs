/**
 * Writes src/icons/solar.ts: the Solar icons (480 Design, CC BY 4.0) that components draw, as
 * SVG data read from `@iconify-json/solar` (ADR-0070 § 9). One export per icon (tree-shakable):
 * the root's presentation attributes and the shapes, with Solar's `stroke-width` removed (CSS
 * sets `--ok-icon-stroke`). Edit NAMES, then run `pnpm --filter @owlky/core icons` (the core
 * build runs it too). `--check` fails when the committed file is stale (`pnpm check:icons`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const set = require("@iconify-json/solar/icons.json");
const { version } = require("@iconify-json/solar/package.json");

/** Every Solar icon a component draws (inventory § 4). Linear, except deliberate state glyphs. */
export const NAMES = [
  "add-linear",
  "align-horizontal-center-linear",
  "align-left-linear",
  "align-right-linear",
  "alt-arrow-down-linear",
  "alt-arrow-left-linear",
  "alt-arrow-right-linear",
  "arrow-down-linear",
  "arrow-up-linear",
  "calendar-linear",
  "camera-linear",
  "chart-2-linear",
  "check-circle-linear",
  "check-linear",
  "clock-circle-linear",
  "close-circle-linear",
  "close-linear",
  "cloud-upload-linear",
  "code-linear",
  "code-square-linear",
  "columns-3-linear",
  "danger-circle-linear",
  "danger-linear",
  "danger-triangle-linear",
  "double-alt-arrow-left-linear",
  "double-alt-arrow-right-linear",
  "download-minimalistic-linear",
  "eraser-linear",
  "file-linear",
  "filter-linear",
  "full-screen-linear",
  "gallery-linear",
  "gallery-remove-linear",
  "gallery-wide-linear",
  "global-linear",
  "gps-linear",
  "hamburger-menu-linear",
  "info-circle-linear",
  "link-broken-linear",
  "link-linear",
  "list-linear",
  "list-ordered-linear",
  "magnifier-linear",
  "magnifier-zoom-in-linear",
  "magnifier-zoom-out-linear",
  "map-point-bold",
  "maximize-square-minimalistic-linear",
  "menu-dots-linear",
  "menu-dots-vertical-linear",
  "minus-linear",
  "move-linear",
  "panorama-linear",
  "paragraph-spacing-linear",
  "pause-circle-linear",
  "pause-linear",
  "play-circle-linear",
  "play-linear",
  "quit-full-screen-linear",
  "quote-linear",
  "reorder-linear",
  "restart-linear",
  "ruler-linear",
  "separator-horizontal-linear",
  "share-linear",
  "star-bold",
  "subtitles-linear",
  "table-linear",
  "table-properties-linear",
  "text-bold-linear",
  "text-cross-linear",
  "text-italic-linear",
  "text-underline-linear",
  "undo-left-linear",
  "undo-left-round-linear",
  "undo-right-linear",
  "undo-right-round-linear",
  "user-bold",
];

/** Presentation attributes that move from the top-level shape or group onto the `<svg>`. */
const ROOT = ["fill", "stroke", "stroke-linecap", "stroke-linejoin"];
const TAGS = new Set(["path", "circle", "rect"]);
/** Geometry attributes whose numbers are rounded. */
const ROUNDED = new Set([
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "width",
  "height",
  "transform",
]);

/** The body of an icon (aliases resolve to their parent's body). */
export function iconBody(name) {
  const icon = set.icons[name] ?? set.icons[set.aliases?.[name]?.parent];
  if (!icon) throw new Error(`Solar has no icon "${name}"`);
  return icon.body;
}

/**
 * Numbers rounded to 2 decimals (inventory § 7, answer 6): Solar's 4–5 decimals cost bytes that no
 * screen shows. `icons.test.ts` rounds the set the same way before comparing.
 */
export const roundNumbers = (value) =>
  value.replace(/-?\d*\.\d+/g, (number) => {
    const rounded = String(Number(Number(number).toFixed(2)));
    return rounded.replace(/^(-?)0\./, "$1.");
  });

/** `<g a><path b/></g>` → { attrs (the root's), nodes: [[tag, attrs]] }, without `stroke-width`. */
export function parseIcon(body) {
  const elements = [...body.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)].map((m) => ({
    close: m[1] === "/",
    tag: m[2],
    attrs: Object.fromEntries([...m[3].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
    selfClosing: m[4] === "/",
  }));
  const opens = elements.filter((e) => !e.close);
  let shapes = opens;
  const root = {};
  const first = opens[0];
  if (first?.tag === "g") {
    if (opens.slice(1).some((e) => e.tag === "g")) throw new Error("nested groups");
    Object.assign(root, first.attrs);
    shapes = opens.slice(1);
  } else if (opens.length === 1) {
    for (const key of ROOT) if (key in first.attrs) root[key] = first.attrs[key];
    shapes = [
      {
        ...first,
        attrs: Object.fromEntries(Object.entries(first.attrs).filter(([k]) => !ROOT.includes(k))),
      },
    ];
  }
  delete root["stroke-width"];
  const nodes = shapes.map((shape) => {
    if (!TAGS.has(shape.tag)) throw new Error(`unexpected <${shape.tag}>`);
    const attrs = Object.fromEntries(
      Object.entries(shape.attrs).map(([name, value]) => [
        name,
        ROUNDED.has(name) ? roundNumbers(value) : value,
      ]),
    );
    delete attrs["stroke-width"];
    return [shape.tag, attrs];
  });
  return { attrs: root, nodes };
}

const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const literal = (value) => JSON.stringify(value);
const object = (attrs) =>
  `{ ${Object.entries(attrs)
    .map(([k, v]) => `${/^[a-z]+$/i.test(k) ? k : literal(k)}: ${literal(v)}`)
    .join(", ")} }`;

/** Shared root attribute sets, so each icon names one instead of repeating it. */
function rootConstants(icons) {
  const seen = new Map();
  for (const { attrs } of icons) {
    const key = object(attrs);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([key], index) => [key, `R${index}`]);
}

export function generate() {
  const icons = NAMES.map((name) => ({ name, ...parseIcon(iconBody(name)) }));
  const roots = new Map(rootConstants(icons));
  const lines = [
    "/*",
    ` * Solar icons by 480 Design (CC BY 4.0), from @iconify-json/solar ${version}. Generated by`,
    " * scripts/icons.mjs, do not edit: add a name to NAMES and run `pnpm --filter @owlky/core icons`.",
    " * Each icon is the root's presentation attributes and its shapes, without Solar's",
    " * `stroke-width` (icon.css sets `--ok-icon-stroke`), numbers rounded to 2 decimals.",
    " */",
    'import type { IconData } from "./icon.js";',
    "",
    ...[...roots].map(([key, id]) => `const ${id} = ${key} as const;`),
    "",
  ];
  for (const icon of icons) {
    const nodes = icon.nodes
      .map(([tag, attrs]) => `[${literal(tag)}, ${object(attrs)}]`)
      .join(", ");
    lines.push(
      `export const ${camel(icon.name)}: IconData = { name: ${literal(icon.name)}, attrs: ${roots.get(object(icon.attrs))}, nodes: [${nodes}] };`,
    );
  }
  return `${lines.join("\n")}\n`;
}

const target = new URL("../src/icons/solar.ts", import.meta.url);
if (import.meta.url === `file://${process.argv[1]}`) {
  const next = generate();
  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(target, "utf8");
    } catch {}
    if (current !== next) {
      console.error("core: src/icons/solar.ts is stale. Run `pnpm --filter @owlky/core icons`.");
      process.exit(1);
    }
    console.log(`icons: src/icons/solar.ts is up to date (${NAMES.length} icons)`);
  } else {
    writeFileSync(target, next);
    console.log(`icons: wrote src/icons/solar.ts (${NAMES.length} icons)`);
  }
}
