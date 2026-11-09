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
**Avatar** (runtime `avatar`: `data-ok-size`, broken images fall back to the alt's letter; group:
`data-ok-avatar-group`, surplus `data-ok-avatar-surplus`) **Badge** and **Label** (CSS only) **Chip**
(runtime `chip`: delete button / Backspace → cancelable `ok:chip:delete`, then hidden)
**Divider** (CSS only: `hr[data-ok-divider]`, with text `div[role=separator][data-ok-divider] › span[data-ok-divider-text]`)
**List** (CSS only: `ul[data-ok-list]` › `li[data-ok-list-item]` › `button|a[data-ok-list-item-button]`, icon, avatar,
text, subheader, `data-ok-list-item-secondary-action`; runtime `list` opens / closes nested lists from
`aria-expanded` + `aria-controls`, event `ok:list:toggle`)
**Popover** (runtime `popover`: `div[data-ok-popover][popover=manual]`, triggers `data-ok-popover-open` /
`data-ok-popover-hover`; events `ok:popover:beforeopen|open|beforeclose|close`) **Menu** (runtime `menu`:
`ul[data-ok-menu][role=menu]` in a popover, keyboard navigation, event `ok:menu:select`) **Tooltip**
(runtime `tooltip`: `div[data-ok-tooltip][role=tooltip]`, found from `aria-labelledby` / `aria-describedby`)
**Dialog** (runtime `dialog`: `dialog[data-ok-dialog]`, triggers `data-ok-dialog-open` / `data-ok-dialog-close`,
events `ok:dialog:*`) **Snackbar** (runtime `toaster`: `section[data-ok-toaster]`, `<template>` toasts shown by
`data-ok-toast-open`, instance `show()` / `promise()` / `dismiss()`, events `ok:toaster:*`)
**Radio** (CSS only: `div[role=radiogroup][data-ok-radio-group]` › `span[data-ok-radio]` › native radio)
**Text field** (CSS only, plus runtime `text-field` for `data-ok-min-rows` / `data-ok-max-rows` and the
`data-ok-text-field-reveal` password button; inputs keep a `placeholder`, " " when none)
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
**Rating** (runtime `rating`: a radio per value plus an "Empty" radio; a second click clears; events
`ok:rating:change` (cancelable) and `ok:rating:active`) **Slider** (runtime `slider`: native range
inputs as thumbs, `data-ok-min|max|step`, marks, value labels from `data-ok-label-value`; events
`ok:slider:change` (cancelable) and `ok:slider:commit`) **Transfer list** (runtime `transfer-list`:
two checkbox lists and move buttons; event `ok:transfer-list:change` (cancelable)) **Tree view**
(runtime `tree-view`: `ul[role=tree]` › `li[role=treeitem]`; WAI-ARIA keyboard and typeahead; events
`ok:tree-view:expand` and `ok:tree-view:select` (cancelable)) **Autocomplete** (runtime
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
locale packs through `setLocaleText`, right-to-left keys) **Chart** (runtime `chart`: draws an SVG
line, area, bar, scatter, pie, donut, radial bar, radar, box plot, heatmap, treemap, bubble, range area, funnel, slope, candlestick, range bar, timeline or polar area chart or sparkline from its `<table data-ok-chart-data>`, which stays visible without
JavaScript; legend buttons toggle series; events `ok:chart:toggle` (cancelable) and
`ok:chart:active`; `setHiddenSeries`, `setActive`, `setFormatters`, `refresh()`, `updateSeries(series, categories?)` and `appendData(data, { categories, limit })` for live data, which rewrite the table in place; zoom and pan (`data-ok-zoom`, `ok:chart:zoom`, `zoomRange`, `setZoomRange`), a toolbar with SVG / PNG / CSV downloads (`data-ok-toolbar`, `exportChart`), synchronized groups (`data-ok-group`), brush charts (`data-ok-brush-target`), annotations in `ul[data-ok-chart-annotations]`, animations and `setLocaleText`). Snippets ship in
`@owlky/html/snippets/<component>/<story>-<group>.html` and in Storybook (HTML/Button/…).

Theme settings (ADR-0017): put `data-ok-preset` / `data-ok-font` on `<html>` (or any element) and
set the root `font-size`; or import `applyThemeSettings` from `@owlky/html` (ESM). The CDN global
stays the runtime only (ADR-0007).

## CDN — include once per page

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.css">
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky.js" defer></script>
```

Then paste component snippets (Storybook HTML/* pages). Components
inserted later (htmx, Turbo, `innerHTML`) are initialized automatically and cleaned up when
removed. Loading the script twice is harmless.

The **Editor** is a separate script, because its editing engine (Tiptap) adds about 125 kB gzip.
Load it after `owlky.js` on pages that have an editor:

```html
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky-editor.js" defer></script>
```

The **Map** is a separate script too, because its map engine (MapLibre GL JS) adds about 300 kB
gzip. Load it after `owlky.js` on pages that have a map. It loads its worker,
`owlky-map-worker.js`, from the same folder. Owlky includes no map tiles: pass the URL of a MapLibre
style, such as one of OpenFreeMap's free styles.

```html
<script src="https://cdn.jsdelivr.net/npm/@owlky/html@0/dist/owlky-map.js" defer></script>
```

## npm

```ts
import "@owlky/styles/owlky.css";
import "@owlky/html/auto"; // everything, started

// or à la carte, side-effect free:
import { components, getRuntime } from "@owlky/html";
getRuntime().register(...components).start();

// The Editor is opt-in: import "@owlky/html/editor", or register it with a code highlighter.
import { createEditor } from "@owlky/html";
import { common, createLowlight } from "lowlight";
getRuntime().register(createEditor({ highlighter: createLowlight(common) })).start();

// The Map is opt-in too: point MapLibre at its worker, then import "@owlky/html/map".
import { setMapWorkerUrl } from "@owlky/core/map";
import workerUrl from "@owlky/core/map-worker.js?url"; // Vite; other bundlers: copy the file
setMapWorkerUrl(workerUrl);
await import("@owlky/html/map");
```

## Runtime API

`Owlky` (CDN) / `getRuntime()` (npm): `start()`, `stop()`, `init(root?)`,
`destroy(root?)`, `get(element, "<component>")`, `connect(shadowRoot)`, `supports`, `version`.
Events bubble as `ok:<component>:<event>`. Details: ADR-0005, ADR-0007.
