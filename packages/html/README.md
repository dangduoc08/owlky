# @owlky/html

Framework-free [Owlky](../../README.md) components: copy-paste HTML snippets plus a
~2 kB (gzip) Core Runtime that wires behavior up through `data-ok-*` attributes.

Components: **Accordion** (native `<details>`; runtime: `accordion`, events
`ok:accordion:beforetoggle|toggle`, `name` fallback) **Alert** (runtime: `alert`, close button
`data-ok-alert-close`, event `ok:alert:close`) **Button**, **Icon button**, **Fab**, **Button group** (CSS only — no JavaScript
needed) **Drawer** (runtime: `drawer`, triggers `data-ok-drawer-open="<id>"` / `data-ok-drawer-close`,
events `ok:drawer:beforeopen|open|beforeclose|close`) **Pagination** (runtime: `pagination`; `data-ok-count`, `data-ok-page`, `data-ok-sibling-count`,
`data-ok-boundary-count`, label templates `data-ok-label-page|current`; event `ok:pagination:change`)
**Checkbox** (runtime: `checkbox` — keeps `data-ok-indeterminate` and the input's mixed state in
step; a checkbox with `aria-controls="<ids>"` checks / clears those and shows mixed) **Switch**
and **Form control label** (CSS only: native checkbox with `role="switch"`;
`label[data-ok-form-control-label][data-ok-label-placement]`)
**Form control** (CSS only: `div|fieldset[data-ok-form-control]` with the shared states `data-ok-disabled`,
`data-ok-error`, `data-ok-required`, `data-ok-focused` and `data-ok-color|size|variant|margin`, `data-ok-full-width`;
parts `label|legend[data-ok-form-label]` (› `span[data-ok-form-label-asterisk]`), `div[data-ok-form-group][data-ok-row]`,
`p[data-ok-form-helper-text]`)
**Avatar** (runtime `avatar`: `data-ok-size`, broken images fall back to the alt's letter; group:
`data-ok-avatar-group`, `data-ok-spacing` `medium` · `small` · px (runtime `avatar-group`), surplus `data-ok-avatar-surplus`) **Badge** and **Label** (CSS only) **Chip**
(runtime `chip`: delete button / Backspace → cancelable `ok:chip:delete`, then hidden)
**Divider** (CSS only: `hr[data-ok-divider]`, with text `div[role=separator][data-ok-divider] › span[data-ok-divider-text]`)
**Card** (CSS only, a Paper root: `data-ok-paper data-ok-card` + Paper's attributes, `data-ok-raised`; parts
`data-ok-card-header` (`-avatar`, `-content`, `-title`, `-subheader`, `-action`), `data-ok-card-media`
(› `img[data-ok-card-media-image]` on non-media elements), `data-ok-card-content`, `data-ok-card-actions`
(`data-ok-disable-spacing`), `button|a[data-ok-card-action-area]`)
**Paper** (CSS only: `data-ok-paper` on any element, `data-ok-variant`, `data-ok-elevation` 0–24, `data-ok-square`)
**Link** (CSS only, a Typography root: `a[href]|button[type=button]` with `data-ok-typography data-ok-link` + Typography's
attributes (`data-ok-variant` default `inherit`, `data-ok-color` default `primary` or `inherit`), `data-ok-underline`
`always|hover|none`; write `rel="noopener noreferrer"` with `target="_blank"`)
**List** (CSS only: `ul[data-ok-list]` › `li[data-ok-list-item]` › `button|a[data-ok-list-item-button]`, icon, avatar,
text, subheader, `data-ok-list-item-secondary-action`; runtime `list` opens / closes nested lists from
`aria-expanded` + `aria-controls`, event `ok:list:toggle`)
**Popover** (runtime `popover`: `div[data-ok-popover][popover=manual]`, triggers `data-ok-popover-open` /
`data-ok-popover-hover`; events `ok:popover:beforeopen|open|beforeclose|close`) **Menu** (runtime `menu`:
`ul[data-ok-menu][role=menu]` in a popover, keyboard navigation, event `ok:menu:select`) **Tooltip**
(runtime `tooltip`: `div[data-ok-tooltip][role=tooltip]`, found from `aria-labelledby` / `aria-describedby`)
**Dialog** (runtime `dialog`: `dialog[data-ok-dialog]`, triggers `data-ok-dialog-open` / `data-ok-dialog-close`,
events `ok:dialog:*`) **Snackbar** (runtime `toaster`: `section[data-ok-toaster]`, `<template>` toasts shown by
`data-ok-toast-open` (`data-ok-toast-toaster` picks a toaster), instance `show()` / `promise()` / `dismiss()` / `getToasts()` / `getHistory()`, swipe to dismiss, `data-ok-expand="false"` stack + `data-ok-hotkey`, `data-ok-rich-colors`, `data-ok-invert`, `data-ok-offset` / `data-ok-gap`, events `ok:toaster:*`)
**Radio** (CSS only: `div[role=radiogroup][data-ok-radio-group]` › `span[data-ok-radio]` › native radio)
**Text field** (CSS only, plus runtime `text-field` for `data-ok-min-rows` / `data-ok-max-rows` and the
`data-ok-text-field-reveal` password button; inputs keep a `placeholder`, " " when none)
**Select** (runtime `select`: `div[data-ok-select]` › `[data-ok-select-display][role=combobox]`, a hidden
`input[data-ok-select-input]` and a Popover with `ul[data-ok-select-listbox][role=listbox]` of MenuItems;
`template[data-ok-select-chip]` / `[data-ok-select-placeholder]`, opener `data-ok-select-open`, events
`ok:select:change|open|close`; `select[data-ok-select-native]` needs no JavaScript)
**Circular progress** / **Linear progress** (runtime: `circular-progress`, `linear-progress` —
draws `aria-valuenow` / `-valuemin` / `-valuemax`, `data-ok-size`, `data-ok-thickness`,
`data-ok-value-buffer` and redraws when they change; indeterminate needs no JavaScript)
**Scrollbar** (CSS only: `section[data-ok-scrollbar][aria-label][tabindex=0]`, `data-ok-auto-hide="false"`; wrap a table, drawer content or a sortable list in it) **Table** (runtime: `table` + `table-pagination` — sorts, selects, pages and expands rows in the
DOM; events `ok:table:sort|select|expand`, `ok:table-pagination:change`; pagination linked with
`data-ok-table-pagination="<table id>"`) **Sortable** (runtime: `sortable`, events `ok:sortable:move|remove|add`, add trigger
`data-ok-sortable-add="<list id>"` + `<template data-ok-sortable-template>`) and **Toggle button** (runtime: `toggle-button` + `toggle-group`, events
`ok:toggle-button:change` / `ok:toggle-group:change`)
**Tabs** (runtime `tabs`: `div[data-ok-tabs]` › scroller › `[role=tablist]` › `button[role=tab]` + indicator;
arrow keys, scroll buttons, panels via `aria-controls`; event `ok:tabs:change`) **Breadcrumbs** (runtime
`breadcrumbs`: `nav[data-ok-breadcrumbs]` › `ol` › items and `aria-hidden` separators; `data-ok-max-items`
collapses long trails, event `ok:breadcrumbs:expand`) **Stepper** (runtime `stepper`: `ol[data-ok-stepper]`
states from `data-ok-active-step`, triggers `data-ok-stepper-next|back|reset="<id>"`, panels
`data-ok-stepper-panel`, event `ok:stepper:change`; runtime `mobile-stepper`: text / dots / progress,
event `ok:mobile-stepper:change`)
**Timeline** (CSS only: `ul[data-ok-timeline]` › items › separator, dot, connector, content)
**Organization chart** (CSS only: `ul[data-ok-organization-chart]` › `li` nodes › label + children
`ul`; runtime `organization-chart` only writes `data-ok-line-height|width|border-radius` and
`data-ok-node-padding` as private CSS properties)
**Image** (`span[data-ok-image]` › placeholder span, optional overlay span, native `img` with
`loading="lazy"`; ratios, fit, position, effect and overlays are CSS; runtime `image` writes the
load state `data-ok-state`, adds an error icon, events `ok:image:load` and `ok:image:error`)
**Rating** (runtime `rating`: a radio per value plus an "Empty" radio; a second click clears; events
`ok:rating:change` (cancelable) and `ok:rating:active`) **Slider** (runtime `slider`: native range
inputs as thumbs, `data-ok-min|max|step`, marks, value labels from `data-ok-label-value`; events
`ok:slider:change` (cancelable) and `ok:slider:commit`) **Transfer list** (runtime `transfer-list`:
two checkbox lists and move buttons; event `ok:transfer-list:change` (cancelable)) **Tree view**
(runtime `tree-view`: `ul[role=tree]` › `li[role=treeitem]`; WAI-ARIA keyboard and typeahead; events
`ok:tree-view:expand`, `select`, `labelchange`, `move` (cancelable), `selectiontoggle`, `itemclick`,
`itemfocus`, `positionchange`; label editing `data-ok-editable`, reordering
`data-ok-items-reordering` (drag or Ctrl / ⌘ + Shift + arrows), `data-ok-selection-propagation`,
`data-ok-highlight`, lazy children through `setDataSource()`, `expandAll()` / `expandToDepth()`)
**Autocomplete** (runtime
`autocomplete`: a TextField combobox with a Popover listbox; chips from
`<template data-ok-autocomplete-tag>`; events `ok:autocomplete:change` (cancelable),
`ok:autocomplete:open|close`) **Motion** (runtimes `motion`, `motion-group`, `motion-text`:
`data-ok-motion data-ok-variant="fadeInUp"` plays when scrolled into view, on mount or on
`data-ok-in`; the runtime writes `data-ok-state`, so without it nothing is hidden; event
`ok:motion:end`, `replay()`; `count-up` counts `data-ok-count-up-value` to `data-ok-end`;
`motion-border` writes the width and speed of a turning gradient border) **Data grid** (runtime
`data-grid`: an ARIA grid whose rows are in the markup; sorts by moving rows, filters, searches and
pages with `hidden`, selects, hides columns, sets the density and exports CSV; events
`ok:data-grid:sort|filter|selection|columns|density|order|pinned|edit`, cancelable, and `ok:data-grid:resize`; filter rows with and / or, resizing, reordering, pinning, editing and print; renders only the visible rows of a grid with a fixed height; `setRows(rows)` builds rows from `<template data-ok-data-grid-row>` as text, `setDataSource(source)` loads them from a server, `data-ok-loading` shows progress, `ok:data-grid:scrollend` and `ok:data-grid:datasourceerror`; spans, row heights, single selection, autosizing, `ok:data-grid:validate` for edits, click events, `exportState` / `restoreState`, `print(options)`, `data-ok-format` value formats and `setLocaleText`; tree data, detail panels from templates, row reordering, pinned rows, column groups, list view, column virtualization and lazy loading; phase 6: row grouping, aggregation, pivoting, Excel export, clipboard, cell selection, header filters and a chart, with `ok:data-grid:rowgrouping|aggregation|pivot|cellselection|chart|clipboardpaste` (cancelable) and `ok:data-grid:clipboardcopy`) **Date pickers** (runtimes
`date-field`, `date-calendar`, `month-calendar`, `year-calendar`, `date-picker`: a sectioned field
with a hidden ISO input, a calendar rebuilt with DOM methods, a picker in a Popover or a Dialog;
values are ISO 8601 (`data-ok-value`); `data-ok-locale` on any ancestor; events
`ok:date-picker:change|accept|open|close`, `ok:date-field:change` and `ok:date-calendar:change`
(cancelable); `setShortcuts`, `setShouldDisableDate`, `setLocaleText`; time and date time fields
and pickers with `data-ok-value-type="time" | "date-time"`, runtimes `time-clock`,
`digital-clock`, `multi-section-digital-clock` with `ok:<name>:change`, `setShouldDisableTime`;
range pickers with runtimes `date-range-calendar`, `multi-input-range-field`, `date-range-picker`
and single input range fields (`data-ok-range` on a date field): ISO 8601 intervals
(`2025-05-20/2025-05-25`), `ok:date-range-picker:change|accept|open|close|rangepositionchange`,
cancelable `ok:date-range-calendar:change` and `ok:multi-input-range-field:change`, drag editing,
range shortcuts with `setShortcuts`; phase 4: `data-ok-timezone` and `data-ok-calendar` on any
ancestor, ISO input with offsets, `date` / `setDate` / `setDateAdapter(adapter)` on every picker
instance for Day.js, date-fns, Luxon or Moment dates, `setDayRenderer` on calendars and pickers,
locale packs through `setLocaleText`, right-to-left keys) **Carousel** (runtime `carousel`: a native scroll-snapping viewport plus Embla's options and plugins as `data-ok-*` attributes — loop, align, axis, drag free, slides to scroll and show per breakpoint, fade / opacity / scale / parallax, auto height, autoplay, auto scroll, wheel gestures, `data-ok-breakpoints`; keeps one dot per snap; events `ok:carousel:select|settle|scroll|slidesinview|reinit|autoplay|autoscroll|slidefocus|pointerdown|pointerup`; instance methods `scrollNext`, `scrollPrev`, `scrollTo`, `canScrollNext`, `selectedScrollSnap`, `scrollSnapList`, `scrollProgress`, `slidesInView`, `reInit`, `autoplay`, `autoScroll`) **Lightbox** (runtime `lightbox`: a `<dialog>` around a Carousel opened by `data-ok-lightbox-open` + `data-ok-index` triggers, or inline with `data-ok-inline`; zoom, rotate, slideshow, fullscreen, download, share, captions and thumbnails as `data-ok-*` options; events `ok:lightbox:beforeopen|open|beforeclose|close|view|click|zoom|rotate|fullscreen|slideshow|captions|thumbnails|download|share`; instance methods `open`, `close`, `goTo`, `prev`, `next`, `zoomIn`, `zoomOut`, `changeZoom`, `rotateClockwise`, `enterFullscreen`, `play`, `pause`, `showCaptions`, `showThumbnails`, `download`, `share`) **Upload** (runtime `upload`: a drop zone around a native file input; drops, folders, paste, `data-ok-upload-open` triggers, react-dropzone's options as attributes — `accept` and `multiple` on the input, `data-ok-max-files`, `data-ok-max-size`, `data-ok-min-size`, `data-ok-no-click`, `data-ok-no-keyboard`, `data-ok-no-drag`, `data-ok-no-paste` …; list rows cloned from `<template data-ok-upload-template>`; files mirrored into the input; events `ok:upload:drop|change|remove|upload|dialogopen|dialogcancel|drag|error`; instance `files`, `rejections`, `open`, `setFiles`, `removeFile`, `clearFiles`, `setValidator`, `setErrorMessage`, `setFilesFromEvent`) **Collapse** (runtime `collapse`: `hidden` is the state, the height or width animates whenever it changes, whoever writes it; `data-ok-orientation`, `data-ok-collapsed-size`, `data-ok-timeout` (ms or `auto`), `data-ok-easing`; `data-ok-collapse-toggle` triggers on checkboxes and buttons; events `ok:collapse:enter|entering|entered|exit|exiting|exited`; instance `in`, `status`, `show`, `hide`, `toggle`) **Walktour** (runtime `walktour`: steps as Popovers over a Backdrop with an SVG spotlight, beacons, `data-ok-run`, tour options on the root and per step, `data-ok-walktour-start` triggers; events `ok:walktour:beforechange|change|event`; instance methods `start`, `stop`, `reset`, `next`, `prev`, `go`, `close`, `skip`, `open` and `state`) **Gantt** (runtime `gantt`: draws a task list and a timeline as one treegrid from its `<table data-ok-gantt-data>`, which stays visible without JavaScript; zoom presets and `data-ok-pixels-per-day`, summary tasks, milestones, dependency arrows, baselines, the critical path, non-working days, a today line, a zoom toolbar, selection and tooltips; events `ok:gantt:toggle|selectionchange|zoom` (cancelable), which write `data-ok-collapsed` / `data-ok-selected` on the table rows; instance `tasks`, `collapsed`, `setCollapsed`, `selected`, `setSelected`, `pixelsPerDay`, `zoomIn`, `zoomOut`, `scrollToTask`, `setLocaleText`, `refresh`) **Chart** (runtime `chart`: draws an SVG
line, area, bar, scatter, pie, donut, radial bar, radar, box plot, heatmap, treemap, bubble, range area, funnel, slope, candlestick, range bar, timeline, polar area or Sankey chart (a table of links) or sparkline from its `<table data-ok-chart-data>`, which stays visible without
JavaScript; legend buttons toggle series; events `ok:chart:toggle` (cancelable) and
`ok:chart:active`; `setHiddenSeries`, `setActive`, `setFormatters`, `refresh()`, `updateSeries(series, categories?)` and `appendData(data, { categories, limit })` for live data, which rewrite the table in place; zoom and pan (`data-ok-zoom`, `ok:chart:zoom`, `zoomRange`, `setZoomRange`), a toolbar with SVG / PNG / CSV downloads (`data-ok-toolbar`, `exportChart`), synchronized groups (`data-ok-group`), brush charts (`data-ok-brush-target`), annotations in `ul[data-ok-chart-annotations]`, animations and `setLocaleText`; stock charts with `data-ok-indicators`, panes and `data-ok-navigator`, whose indicator columns the runtime writes). Snippets ship in
`@owlky/html/snippets/<component>/<story>-<group>.html` and in Storybook (HTML/Button/…).

Theme settings (ADR-0070): put `data-ok-theme` on `<html>` (or any element) and set the root
`font-size`; or import `applyThemeSettings` from `@owlky/html` (ESM). The CDN global
stays the runtime only (ADR-0007).

## CDN — include once per page

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.css">
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.js" defer></script>
```

To use a design style other than the default Soft, link its sheet after `owlky.css`, then set
`data-ok-style="swiss"` on `<html>` or on any element. A style sheet holds tokens only (about
2.6 kB gzip), and styles nest like themes:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky-style-swiss.min.css">
```

Then paste component snippets (Storybook HTML/* pages). Components
inserted later (htmx, Turbo, `innerHTML`) are initialized automatically and cleaned up when
removed. Loading the script twice is harmless.

**`owlky.js` loads what the page uses.** It holds the runtime and the common components (about
40 kB gzip). Larger components, such as the Chart, the Data grid, the date pickers, the Editor,
the Map, Markdown and the Phone input, are modules in the `modules/` folder next to `owlky.js`.
When the page holds one, `owlky.js` loads its stylesheet (`modules/<name>.css`) and then its
module, and the component starts. `owlky.css` holds the tokens and the light components only
(about 29 kB gzip). Until the module runs, the markup works as it does without JavaScript: a chart
shows its data table, for example. Host the whole `dist/` folder, so `modules/`, `monaco/` and
`owlky-map-worker.js` sit next to `owlky.js`. `owlky-all.css` holds every component in one file,
for pages that don't use the loader.

- **Preload:** list modules in `data-ok-preload` to load them before the page needs them, such
  as a chart at the top of the page. The modules are `chart`, `data-grid`, `date-picker`,
  `gantt`, `carousel` (Carousel and Lightbox), `motion`, `organization-chart`, `upload`,
  `walktour`, `tree-view`, `sortable`, `autocomplete`, `transfer-list`, `editor`, `map`,
  `markdown`, `code-editor`, `phone-input` and `illustration`. To fetch the files earlier, also
  add `<link rel="preload" as="style" href=".../modules/chart.css">` and
  `<link rel="modulepreload" href=".../modules/chart.js">`.
- **Another folder:** `data-ok-modules="/assets/owlky/modules/"` serves the modules from there.
- **From JavaScript:** `await Owlky.load("chart")` loads a module; `Owlky.loaded("chart")`
  tells whether it has loaded.
- **Errors:** a module that fails to load logs an error and dispatches `ok:runtime:error` on
  `document` (`detail`: `module`, `url`, `error`). The next `Owlky.load()` or the browser coming
  back online loads it again.
- **Strict CSP:** modules are same-origin ES modules with no inline code, so
  `script-src 'self'` and Trusted Types (`require-trusted-types-for 'script'`) work unchanged.
- **ES module pages:** `<script type="module" src=".../owlky.mjs">` is the same script as an ES
  module, with the same attributes. Load one of the two per page.

```html
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.js" data-ok-preload="chart" defer></script>
```

The separate opt-in scripts of earlier versions (`owlky-editor.js`, `owlky-map.js`,
`owlky-markdown.js`, `owlky-phone.js`, `owlky-illustrations.js`, `owlky-code-editor.js`) are
gone: remove their `<script>` tags. `owlky.js` loads those components by itself, and
`data-ok-preload` loads them ahead of use.

- **Code editor:** Monaco loads only when an editor appears, from the `monaco/` folder (about
  1.15 MB gzip for the first editor). Point `data-ok-monaco-path` (on the `owlky.js` script) at your own
  copy of `dist/monaco/`: Monaco's workers must come from the page's origin. Monaco needs
  `style-src 'unsafe-inline'` and a few Trusted Types policies; see the Code editor docs page.
- **Map:** MapLibre GL JS loads its worker, `owlky-map-worker.js`, from `dist/`. Owlky includes
  no map tiles: pass the URL of a MapLibre style, such as one of OpenFreeMap's free styles.
- **Illustrations:** the snippets are inline SVG that needs only the stylesheet. Named
  placeholders (`<svg data-ok-illustration="error-404" aria-hidden="true"></svg>`) load the
  set of pictures.
- **Markdown:** write the Markdown, with `&` and `<` escaped, in a `pre[data-ok-markdown-source]`
  inside `[data-ok-markdown]`.
- **Phone input:** the module fills the country list itself, so the snippet's
  `ul[data-ok-select-listbox]` stays empty (copy the markup from the Phone input snippets).

## npm

```ts
import "@owlky/styles/owlky-all.css"; // every component; or owlky.css + components/<name>.css
import "@owlky/html/auto"; // everything, started

// or à la carte, side-effect free:
import { components, getRuntime } from "@owlky/html";
getRuntime().register(...components).start();

// or one entry per component (`@owlky/html/<name>`, named after its docs page): only what you use.
import { dialog } from "@owlky/html/dialog";
import { tabs } from "@owlky/html/tabs";
getRuntime().register(dialog, tabs).start();
// Definitions registered later set up the components already on the page.
if (document.querySelector("[data-ok-data-grid]"))
  getRuntime().register((await import("@owlky/html/data-grid")).dataGrid);

// The Editor is opt-in: import "@owlky/html/editor", or register it with a code highlighter.
import { createEditor } from "@owlky/html";
import { common, createLowlight } from "lowlight";
getRuntime().register(createEditor({ highlighter: createLowlight(common) })).start();

// The Code editor is opt-in too: Monaco is imported from the monaco-editor package on demand.
import { loader } from "@owlky/html/code-editor";
loader.config({ getWorker: (label) => new Worker(/* your bundler's worker for `label` */) });
// The Map is opt-in too: point MapLibre at its worker, then import "@owlky/html/map".
import { setMapWorkerUrl } from "@owlky/core/map";
import workerUrl from "@owlky/core/map-worker.js?url"; // Vite; other bundlers: copy the file
setMapWorkerUrl(workerUrl);
await import("@owlky/html/map");

// Markdown is opt-in too: import "@owlky/html/markdown", or register it with plugins or a highlighter.
import { createMarkdown } from "@owlky/html";
getRuntime().register(createMarkdown({ highlighter: createLowlight(common) })).start();
// The phone input too: import "@owlky/html/phone", or register createPhoneInput({ metadata, labels }).
```

## Runtime API

`Owlky` (CDN) / `getRuntime()` (npm): `start()`, `stop()`, `init(root?)`,
`destroy(root?)`, `get(element, "<component>")`, `connect(shadowRoot)`, `load(module)`,
`loaded(module)`, `supports`, `version`.
Events bubble as `ok:<component>:<event>`. Details: ADR-0005, ADR-0007.
