// Gzip size budgets for what users download. Raise a budget only with a reason in the PR.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";

/** An ES module and every file it imports statically (what the browser loads before it runs). */
async function withImports(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const code = await readFile(file, "utf8");
  const imports = [...code.matchAll(/(?:from|import)\s*"(\.{1,2}\/[^"]+\.js)"/g)].map((m) =>
    join(dirname(file), m[1]),
  );
  return [file, ...(await Promise.all(imports.map((each) => withImports(each, seen)))).flat()];
}

const budgets = [
  // 239 kB since the tree chart type (4.18.7, ADR-0058: the hierarchy model and table, tidy /
  // cluster / radial layouts, keyboard over the hierarchy, collapse): 235.5 kB; size work is
  // deferred to 1.0 prep. 235 kB since the ApexTree rows (4.18.3, .5, .6, ADR-0056: grouped leaves, zoom / fit / center
  // with a toolbar and a core controller, per-node lines) on top of the range charts: 230.4 kB.
  // Phase 4 batch E's data grid range charts (4.18.12, ADR-0055: createRangeChart and
  // Alt + F1, cross-filtering, chartsToJSON / restoreCharts, chart regions built by the runtime;
  // about 1.9 kB): 226.1 kB.
  // 230 kB since the batch E coulds (sortable swap, Embla v9 names, lightbox render functions,
  // walktour offset) on top of the chart types and crossfilter: 225.7 kB.
  // 225 kB since the sortable and data grid shoulds merged together: 221.0 kB.
  // 221 kB since Phase 4 batch E's sortable shoulds (4.18.75-76, ADR-0053: moves between lists,
  // one session per document, move-to triggers; auto scroll, disabled items, drag events, HTML
  // messages; about 1.6 kB): 217.6 kB. Optimization is deferred to 1.0 prep.
  // 221 kB since Phase 4 batch E's data grid shoulds (4.18.10 set filter, 4.18.51-54: column
  // options, selection propagation, layout options, footer counts, Tab navigation; about 3.5 kB):
  // 217.6 kB. Optimization is deferred to 1.0 prep.
  // 217 kB since Phase 4 batch E's chart shoulds (4.18.61-64: 100% stacks, totals, background bars,
  // marker shapes, patterns, color blind mode, tooltip modes and templates, legend and grid
  // options; about 5.3 kB): 213.6 kB. Optimization is deferred to 1.0 prep.
  // 210 kB since Phase 4 batch E (chart value axes and selection; data grid sort comparators, status
  // bar, custom editors and edit modes, undo / redo): 206.8 kB.
  // Batch E row 4.18.1 (Organization chart collapsible nodes: the expand / collapse controller,
  // badges, lazy children and eight methods; about 1.4 kB) fits it: 208.3 kB.
  // 205 kB since Phase 4 batch D: the data grid's row 4.15 (multiple grouping columns, grouping
  // values, group footers, server-side aggregation, derived pivot fields, the pivot panel's drag and
  // drop, several charts per grid; about 2.7 kB) on top of the Editor merge: 200.0 kB.
  // 200 kB since Phase 4 batches B and C together (submenus, popover anchoring, tooltip cursor,
  // stepper, tabs links on top of the Snackbar and Tree view work): 195.1 kB. Size optimization is
  // planned for 1.0 prep (roadmap.md step 9).
  // 196 kB since Phase 4 batch C: the Snackbar's swipe, hotkey and per-position lists (about
  // 1.9 kB, 189.0 kB) and the Tree view's drag and keyboard reordering, label editing, lazy
  // children, selection propagation, highlight and methods (about 3.5 kB): 192.5 kB.
  // 190 kB since the Gantt's phases 2 and 3 (ADR-0048: drag and keyboard editing, row
  // virtualization, SVG / PNG / CSV downloads; about 4.9 kB): 184.3 kB.
  // 172 kB since Sankey and stock charts (ADR-0047: the Sankey layout, 13 indicators, panes, the
  // navigator and its gestures): 164.1 kB after Sankey, 168.5 kB after stock charts.
  // 185 kB since the Gantt (ADR-0048 phase 1: dates, model with roll-ups and the critical path,
  // scales, the node layout with dependency routing, controller, data table, runtime; about
  // 10.5 kB) on top of the charts: 179.4 kB.
  // 165 kB since the Select (ADR-0045: select-only combobox controller, the runtime with chips,
  // placeholder and checkmarks, the TablePagination listbox; about 1.5 kB): 159.1 kB.
  // 160 kB since the Upload (ADR-0037: drop, folders, paste, picker, checks, the runtime with
  // previews, list and rejections; about 6.4 kB): 150.2 kB.
  // 150 kB since the Lightbox (ADR-0032: modal around the Carousel, zoom and pan gestures,
  // rotate, fullscreen, download, share, toggles, the runtime; about 4 kB): 143.3 kB.
  // 140 kB since the Carousel (ADR-0033: snap model, controller with loop, drag, wheel, keys,
  // fade, tweens, auto height, autoplay and auto scroll, and the runtime; about 9.5 kB): 134.4 kB.
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
  ["packages/html/dist/owlky.js", 239_000, "HTML runtime + all components (IIFE)"],
  ["packages/html/dist/esm/runtime/runtime.js", 3_000, "HTML core runtime"],
  // The Editor is opt-in (ADR-0023): Tiptap, ProseMirror and its starter kit are about 125 kB of
  // it; owlky.js stays free of them. 155.1 kB after ADR-0050 (from 130.8 kB): tables
  // (prosemirror-tables + Tiptap's table nodes, about 13 kB), mentions (Tiptap's Mention and
  // Suggestion, about 4 kB; Floating UI is stubbed out), the bubble menu and the popover controller.
  ["packages/html/dist/owlky-editor.js", 163_000, "Editor + Tiptap (IIFE, loaded after owlky.js)"],
  // The Code editor is opt-in (ADR-0034): owlky-code-editor.js holds the runtimes, the controller,
  // the Owlky themes and the loader (about 10.7 kB); Monaco loads on demand from dist/monaco/.
  ["packages/html/dist/owlky-code-editor.js", 12_000, "Code editor runtime + loader (IIFE)"],
  // Monaco itself (0.57): the editor, its 80+ language tokenizers' registrations and its CSS are
  // about 1.15 MB gzip when the first editor mounts (tokenizers and language features load later,
  // per language). Budgets track Monaco upgrades; they are not Owlky code.
  [
    [
      ...(await withImports("packages/html/dist/monaco/monaco.js")),
      "packages/html/dist/monaco/monaco.css",
    ],
    1_250_000,
    "Monaco engine, first editor (monaco.js + static imports + monaco.css)",
  ],
  // TypeScript / JavaScript language service (the TypeScript compiler), only for those languages.
  [
    await withImports("packages/html/dist/monaco/typescript.worker.js"),
    1_600_000,
    "Monaco TypeScript worker (+ shared worker chunk)",
  ],
  // The Map is opt-in (ADR-0025): MapLibre GL JS is about 295 kB of owlky-map.js (main thread)
  // and all of owlky-map-worker.js (its tile worker, about 147 kB, loaded by the map itself);
  // owlky.js stays free of them.
  ["packages/html/dist/owlky-map.js", 310_000, "Map + MapLibre (IIFE, loaded after owlky.js)"],
  ["packages/html/dist/owlky-map-worker.js", 155_000, "MapLibre tile worker (loaded by the map)"],
  // Markdown is opt-in (ADR-0035): unified, micromark with GFM, parse5 (raw HTML), the sanitizer
  // and property-information are nearly all of owlky-markdown.js (about 102 kB measured);
  // owlky.js stays free of them.
  ["packages/html/dist/owlky-markdown.js", 110_000, "Markdown + unified (IIFE, after owlky.js)"],
  // Illustrations are opt-in (ADR-0041): the 16 pictures' node trees are nearly all of
  // owlky-illustrations.js (10.3 kB measured; 5.5 kB minified ESM); owlky.js stays free
  // of them.
  ["packages/html/dist/owlky-illustrations.js", 12_000, "Illustrations (IIFE, after owlky.js)"],
  // 42 kB once the Map, the Carousel and the Code editor merged together (about 2.1 + 2 + 0.3 kB
  // on 38 kB): 40.4 kB.
  // 36.1 kB with the Code editor (ADR-0034: frame, loading state and fallback textareas; about
  // 0.3 kB). Monaco's own CSS ships in dist/monaco/monaco.css, budgeted above.
  // 40 kB since the Carousel (ADR-0033: viewport, slides, effects, arrows, dots, progress,
  // thumbnails, overlay placements; about 2 kB): 37.8 kB.
  // 40 kB since the Map (ADR-0025: controls, markers, popups, panels, scale, credits and MapLibre's
  // canvas essentials, so maplibre-gl.css isn't needed; about 2.1 kB): 37.97 kB.
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
  // 48 kB since the Illustrations (ADR-0041: tones mapped to tokens for six palettes, sizing; about
  // 0.5 kB once the Upload's own tone rules moved there): 46.7 kB.
  // 47 kB since the Upload (zone, previews, list rows and tiles, file icons; about 2.3 kB): 44.7 kB.
  // 45 kB since the Image (ratios, fits, positions, overlays, placeholder; about 0.95 kB): 44.2 kB.
  // 44 kB since the Lightbox (toolbar, captions, thumbnails, zoom frame; about 1.4 kB): 42.1 kB;
  // 43.25 kB once merged with Markdown and the Organization chart.
  // 50 kB since the Card (on Paper: header, media, content, actions, action area; about 0.5 kB
  // in the bundle): 47.8 kB, after Paper and Typography; the rest of wave 8 adds small files.
  // 52 kB since the Select (field box mirroring TextField's three variants, InputLabel, the
  // TablePagination and TextField compositions; about 1.3 kB): 49.6 kB.
  // 56 kB since Phase 4 batch C's Snackbar (stacked toasts, swipe, rich colors, invert, a list
  // per position, offsets; about 0.6 kB): 52.27 kB, before the Tree view's drag and drop,
  // editing and loading states.
  // 60 kB since Phase 4 batch E (organization chart directions and highlight, data grid layout,
  // footer, set filter and selection options, chart stacks and cues; about 2 kB): 56.2 kB.
  ["packages/styles/dist/owlky.min.css", 60_000, "All CSS (tokens + components)"],
  // The MCP server's data (ADR-0046, downloaded by `npx -y @owlky/mcp`): 0.69 MB gzip (6 MB raw)
  // at first, most of it the HTML of the date picker and data grid stories. 1 MB since the API
  // reference (ADR-0049: every prop, attribute, part, event, method, type and CSS variable per
  // component; about 145 kB gzip, 0.77 → 0.92 MB): gzip's 32 kB window can't share the props
  // that the date picker family repeats per component, and agents need each one whole. 1.15 MB
  // since the docs examples became complete (roadmap 3.4, `check:docs`): the guides' HTML repeats
  // whole snippets (data grids, date pickers, the editor, the lightbox) instead of shortened
  // copies, about 0.1 MB gzip.
  // 1.35 MB since the range charts and the ApexTree rows (stories, docs sections, API entries): 1298.7 kB.
  // 1.3 MB since the data grid and sortable shoulds (stories, docs sections, API entries): 1249.6 kB.
  // 1.25 MB since Phase 4 batch E shoulds (chart stacks, cues, tooltips, legends; button, text field,
  // select and picker field options: their stories, docs sections and API entries): 1202.0 kB.
  // 1.2 MB since Phase 4 batch E (new chart and data grid stories, sections and API entries): 1154.6 kB.
  ["packages/mcp/manifest.json", 1_350_000, "MCP manifest (npm tarball, not a browser download)"],
];

let failed = false;
for (const [file, limit, label] of budgets) {
  // A list of files is downloaded together: each is gzipped on its own, as servers send them.
  const files = Array.isArray(file) ? file : [file];
  let size = 0;
  for (const each of files) size += gzipSync(await readFile(each)).length;
  const ok = size <= limit;
  failed ||= !ok;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${label}: ${(size / 1000).toFixed(2)} kB / ${limit / 1000} kB gzip`,
  );
}

// Tree shaking (ADR-0041): `@owlky/core/illustrations` has one export per picture, so an app that
// imports one picture bundles that one only, plus the parts it composes (parts.ts, about 0.1 to
// 0.5 kB: sparkles, the backdrop, people). Each must stay under 3 kB gzip once minified, and its
// bundle must hold no other picture.
{
  const require = createRequire(import.meta.url);
  const { build } = await import(
    require.resolve("esbuild", { paths: [join(process.cwd(), "node_modules/.pnpm/node_modules")] })
  );
  const entry = join(process.cwd(), "packages/core/dist/illustrations/index.js");
  const bundled = async (names) => {
    const result = await build({
      stdin: {
        contents: `export { ${names} } from ${JSON.stringify(entry)};`,
        loader: "js",
        resolveDir: process.cwd(),
      },
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      logLevel: "error",
    });
    const file = result.outputFiles[0];
    return { size: gzipSync(file.contents).length, text: file.text };
  };
  const { illustrations } = await import(entry);
  const exportName = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const all = (await bundled("illustrations")).size;
  for (const { name } of illustrations) {
    const { size, text } = await bundled(exportName(name));
    const others = illustrations.filter(
      (item) => item.name !== name && text.includes(`"${item.name}"`),
    );
    const ok = size <= 3_000 && others.length === 0;
    failed ||= !ok;
    console.log(
      `${ok ? "ok  " : "FAIL"} Illustration ${name} alone: ${(size / 1000).toFixed(2)} kB / 3 kB gzip (all ${(all / 1000).toFixed(2)} kB)${others.length ? `, also bundles ${others.map((item) => item.name).join(", ")}` : ""}`,
    );
  }
}
if (failed) process.exit(1);
