# Component completion roadmap

Tracks one goal: **every Owlky component is complete and fully documented** before the website
continues (owner's decision 2026-11-09). The project-wide plan is in [`roadmap.md`](roadmap.md)
("After the waves", step 5).

**Complete means:** every component matches its upstream (MUI, MUI X, Sonner, Tiptap,
react-joyride, Embla, MapLibre, ApexCharts) except what an ADR rules out (`sx`, `slots`, `classes`,
MUI transition components); every docs page carries the full API reference; nothing is left in
`roadmap.md` → "Pending integrations"; CI is green on `main`.

**How items ship:** `/component <name>` in Update mode (additive, never breaking without a listed
migration), three at a time in worktrees, React + HTML + parity + docs + `pnpm manifest`. Shadows and
every other value from tokens.

**Status:** ⬜ to do · 🔄 in progress · ✅ done · ⏸ deferred with a reason. Update the row in the same
review that changes it.

## Phase 1 — Stability

| # | Item | Detail | Status |
|---|---|---|---|
| 1.1 | CI unit job per browser | split "Lint, types, build, unit tests" into one unit job per browser (chromium, firefox, webkit), like the e2e shards: one runner ran about 15,000 tests in three browsers and crashed a page on 2026-11-09 | ✅ |
| 1.2 | Flaky: editor image form | `packages/html/src/components/editor/editor.test.ts` "inserts an image; an invalid form stays open" (Chromium, CI 2026-11-09) | ✅ |
| 1.3 | Flaky: button soft colors | `packages/html/src/components/button/button.test.ts` `soft-colors.html: no axe violations` (Firefox, CI 2026-11-09) | ✅ |
| 1.4 | Flaky: carousel thumbs-y | e2e parity `carousel / thumbs-y` pixels, about 2 of 60 runs under load (already before Wave 8; image decode and scroll settle waits didn't fix it) | ✅ |
| 1.5 | Carousel `loop` resize | with `loop`, a viewport resize jumps to another slide; the landing page turns `loop` off until fixed | ✅ |

**Done when:** three green CI runs in a row on `main` — reached 2026-11-10 (`e47390c`, `51d6a02`, `271cd3a`). Watch list (local only, under parallel load, pass alone): React data grid "pruning", React pickers "runs every action", core carousel "ignores keys from inside slides". Notes: 1.1 split CI into `check` + `unit (chromium | firefox | webkit)` (if branch protection lists the old job name, switch it to the new ones); 1.5 also fixed short loops and resizes during animations. 1.2 was a real editor bug (a refused action still focused the editor) and uncovered a date picker setup crash on field-only pickers (fixed); 1.3 came from the real mouse hovering a button (axe now parks the pointer); 1.4 from Chromium repainting late-decoded thumbnails partially (parity repaints the story from scratch). After the Sankey / stock merge, CI caught one more flake: React Collapse read `getAnimations()` after a slow click had outlasted the default animation (its demo now animates for 60 s and the tests `finish()` it). Still open, unrelated: in Chromium a Playwright full-page screenshot scrolls carousels by about 185 px without a resize.

## Phase 2 — ApexCharts parity

Commercial add-ons of ApexCharts: behavior and API only, our own code, data and images.

| # | Item | Detail | ADR | Status |
|---|---|---|---|---|
| 2.1 | Sankey | `sankey` chart type in the engine: column layout with relaxation, link widths by value, palette colors, labels, hover and keyboard on nodes and links, links as an HTML `<table>` | 0047 | ✅ |
| 2.2 | Stock charts | indicators computed in core (SMA, EMA, Bollinger Bands, RSI, MACD, volume, others ApexStock lists), panes on one time axis, navigator / range selector (zoom window and brush, ADR-0031), crosshair readout, period buttons | 0047 | ✅ |
| 2.3 | Gantt | new component: task tree + timeline, day → year scales, today line, weekends, milestones, summary tasks, dependencies, drag to move / resize / set progress with keyboard alternatives (WCAG 2.5.7), selection, tooltips, virtualization, HTML data as a `<table>` | 0048 | ✅ |
| 2.4 | Parity audit | ApexTree ↔ Organization chart / Tree view, ApexGrid ↔ Data grid, ApexMaps ↔ Map (a choropleth map?), Chart Editor (a builder from the Chart option schema?) → new rows in Phase 4, batch E | — | ✅ |

**Notes:** 2.3 merged in three phases (read-only; editing by drag and keyboard with an edit request as the single-pointer path; virtualization and SVG / PNG / CSV export); deferred in ADR-0048: undo, split tasks, grouping, sort and filter, context menu, drawing tasks and links, right to left, sub-day scales. Budgets after Phase 2: `owlky.js` 184.3 of 190 kB, all CSS 51.5 of **52 kB** (the next components need a CSS budget decision). 2.4 (audit 2026-11-09) added rows 4.18.1–4.18.21; not proposed: ApexGrid formulas (a formula engine) and AI toolkit (a model service), ApexTree semantic zoom / edge flow animation, ApexMaps story mode and Storyboard (Phase 5), Perspectives / Rewind (app code serializes props). 2.1 / 2.2 merged (ADR-0047, 13 indicators, navigator on the ADR-0031 zoom window; the CDN budget went from 165 to 172 kB). Not built, recorded in the spec: chord / circular Sankey views, particle flow, draggable nodes, drill-down; stock drawing tools, comparison mode, price scale modes, event markers, price lines (candidates for 2.4 / batch E).

## Phase 3 — Upstream API audit and a complete API reference

| # | Item | Detail | Status |
|---|---|---|---|
| 3.1 | Upstream audit | all 62 components, prop by prop against the upstream API pages; a mapping table in each spec (kept · renamed · deferred · not applicable); every gap becomes a row in Phase 4, batch E | ✅ |
| 3.2 | Structured API data | React prop types, option schemas (ADR-0015), the anatomy's part attributes, triggers, events (`ok:<component>:<event>` with `detail`), instance methods and the public `--ok-*` variables each component reads, per component and per part, exported as data and added to the MCP manifest (ADR-0046) | ✅ |
| 3.3 | API reference on every docs page | generated tables (not hand-written) in each Storybook docs page: React props, HTML attributes (options and their values, parts, triggers), events, methods, CSS variables / tokens — for the component and each of its parts (Card → CardHeader, CardMedia…). The website (ADR-0040) reads the same data | ✅ |
| 3.4 | Completeness check | a test fails when a schema option, a `data-ok-*` name used in the snippets, an event, a method or a React prop is missing from the docs page (extends `foundations.spec.ts` `OPTION_TABLES` and `check:docs`). `pnpm check:docs` reports 376 problems today (placeholders `…`, React examples that aren't modules) and runs in neither `pnpm check` nor CI: fix them and add it to both | ✅ |
| 3.5 | Controls unchanged | Storybook's Controls panel keeps following `/component`: only options that change every example at once, from the option schema. The full reference lives in the docs page | — |

**Notes:** 3.2–3.3 merged (ADR-0049): `scripts/api-reference.mjs` (`pnpm api`, `check:api` in `pnpm check` and CI) writes `apps/docs-content/src/api/<spec>.json` from typed sources (React types and JSDoc, option schemas, `core/src/anatomy/parts.ts`, runtime event maps and instance interfaces, stylesheet `--ok-*` reads); every docs page ends with "API reference"; MCP `get_component` returns it (manifest budget 1 MB). 3.4: the completeness checks are in `check:api` and a per-page e2e test; `check:docs` went from 376 problems to 0 (complete React modules, long HTML from the snippets through `snippetElement()`) and runs in `pnpm check` and CI. 3.1 (2026-11-09): every spec has an `## Upstream API mapping` table (kept · renamed · deferred · not applicable); gaps already in Phase 4 are cited there, the 61 new ones are rows 4.18.22–4.18.82. Judgement calls recorded in the specs: ripple props not applicable (no ripple, CSS states), Tooltip `disableInteractive` not applicable (WCAG 1.4.13), selection controls don't read the Form control context (a `fieldset` root disables them natively). Components with no new gap: Alert, Badge, Card, Circular / Linear progress, Collapse, Divider, Paper, Typography, Backdrop, Tooltip, Markdown, Transfer list, Checkbox, Radio, Rating, Form control (+ label), Breadcrumbs, Link, Timeline, Table, Image, Organization chart (beyond 4.18.1–6), Scrollbar, Illustration.

## Phase 4 — Close every gap

Known *Deferred* items today; the audits of phases 2 and 3 add rows to batch E. Batch F spreads the
reference's Utilities page over the components it belongs to (order: 4.19, 4.20, 4.21, 4.26 first,
then 4.22–4.24, then 4.25 with its ADR).

| # | Batch | Component | Missing today | Status |
|---|---|---|---|---|
| 4.1 | A — inputs | Autocomplete | `groupBy`, `loading` / `loadingText`, virtualization, `autoSelect`, `blurOnSelect`, `clearOnEscape`, `selectOnFocus`, `includeInputInList`, `ListboxComponent` | ✅ |
| 4.2 | A | Slider | `scale`, `shiftStep` | ✅ |
| 4.3 | A | Switch | `icon` / `checkedIcon` | ✅ |
| 4.4 | A | Upload | hook API (`getRootProps` / `getInputProps`, react-dropzone style) | ✅ |
| 4.5 | B — overlays, navigation | Menu | nested menus, `variant="menu"` | ✅ |
| 4.6 | B | Tooltip | `followCursor`, `enterNextDelay` | ✅ |
| 4.7 | B | Popover | `anchorPosition` / `anchorReference`, `marginThreshold` | ✅ |
| 4.8 | B | Dialog | `keepMounted` (exit transitions come with Phase 5) | ✅ |
| 4.9 | B | Drawer, Backdrop | `elevation`, `transitionDuration` | ✅ |
| 4.10 | B | Stepper | `nonLinear`, `StepButton`, Step `expanded` / `last` | ✅ |
| 4.11 | C — data display | Tree view | drag and drop (`itemsReordering`), lazy loading, label editing, `selectionPropagation`, `apiRef`, `getItemId` / `getItemLabel` | ✅ |
| 4.12 | C | Avatar group | any `spacing` (today `medium` / `small`) | ✅ |
| 4.13 | C | Linear progress | right to left | ✅ |
| 4.14 | C | Snackbar | swipe to dismiss, `expand` / stacked collapse, `richColors`, `hotkey`, `offset` / `gap`, per-toast `position` | ✅ |
| 4.15 | D — heavy | Data grid | `rowGroupingColumnMode="multiple"`, `groupingValueGetter`, group footers, server-side aggregation, `getPivotDerivedColumns`, pivot panel drag and drop, one chart per grid | ✅ |
| 4.16 | D | Editor | Tiptap `extensions` / `editorProps` pass-through, bubble menus, tables, mentions, a form `name` | ✅ |
| 4.17 | D | Walktour | `before` / `after` hooks, `targetWaitTimeout`, `beaconTrigger: "hover"`, `closeButtonAction`, `scrollTarget`, `spotlightTarget`, `isFixed`, `disableFocusTrap`, `beaconPlacement`, `scrollDuration` | ✅ |
| 4.18 | E — from the audits | any | rows added by 2.4 and 3.1 | ⬜ |
| 4.18.1 | E — ApexTree (must, **ADR** superseding ADR-0036) | Organization chart | collapsible nodes (`enableExpandCollapse`, `expandCollapseOnNodeClick`, a badge with the hidden count), `expandAll` / `collapseAll` / `expandToDepth`, lazy children (`loadChildren`), `ok:organization-chart:expand`, a toggle button per branch (`aria-expanded`), Collapse for the children list | ✅ |
| 4.18.2 | E (should, **ADR**) | Organization chart | `direction` `top` · `bottom` · `left` · `right` (connectors on logical properties, right to left mirrors) | ⬜ |
| 4.18.3 | E (could) | Organization chart | `groupLeafNodes`: leaf children stacked in one column under their parent (CSS) | ⬜ |
| 4.18.4 | E (should) | Organization chart | lineage highlight on hover and focus (`highlightOnHover`, `dimOpacity`, path to the root through `:has()`), search that scrolls to and highlights a node (composed Autocomplete) | ⬜ |
| 4.18.5 | E (could, **ADR**) | Organization chart | zoom / fit / center (`enableZoomPan`, `fitScreen`, `zoom`, `centerOnNode`, a toolbar), beyond the Scrollbar's pan | ⬜ |
| 4.18.6 | E (could) | Organization chart | per-node line options (`edgeColorMode: "node"`: `lineColor` / `lineStyle` on a node) | ⬜ |
| 4.18.7 | E (could, **ADR**) | Chart | `tree` type: radial and dendrogram hierarchy layouts in the SVG engine (ApexTree `layoutType`) | ⬜ |
| 4.18.8 | E (should) | Tree view | `expandAll` / `collapseAll` / `expandToDepth(depth)` / `expandSubtree(id)` (instance, React `apiRef`), search highlight of matching items and their ancestors | ✅ |
| 4.18.9 | E — ApexGrid (must) | Data grid | undo / redo of edits (`history: { enabled, stackSize }`, MUI X undo-redo): Ctrl / Cmd + Z, Ctrl / Cmd + Shift + Z, a paste or bulk edit is one step, `processRowUpdate` on each | ✅ |
| 4.18.10 | E (should) | Data grid | set filter: a checklist of the column's distinct values with search and "Select all", on the `isAnyOf` model | ⬜ |
| 4.18.11 | E (must) | Data grid | status bar for `cellSelection`: count, sum, average, min, max of the selected cells, a polite live region, with `aggregationFunctions` | ✅ |
| 4.18.12 | E (should) | Data grid (+ Chart) | a chart from a cell range (`createRangeChart`, Alt + F1), cross-filtering (a category click filters the grid), chart config `toJSON` / `restore` | ⬜ |
| 4.18.13 | E (could) | Data grid | context menu on cells (right click, Shift + F10, Menu key: copy, paste, export, chart range, pin), extensible, after 4.7 `anchorPosition`; nested filter groups (AND / OR, JSON) in the filter panel | ⬜ |
| 4.18.14 | E (could) | Data grid | `autoGenerate`: columns and types inferred from `rows` when `columns` is omitted | ⬜ |
| 4.18.15 | E — ApexMaps (must) | Map | choropleth: core `mapScale(values, { method: quantile · equalInterval · jenks · threshold, classes, palette })` → a MapLibre `step` expression with token colors, a `MapLegend` part (classes / gradient, interactive classes mute regions), hover / selected regions through feature state, regions reachable by keyboard plus a data table, a "Choropleth" story on public-domain geometry | 🔄 |
| 4.18.16 | E (could) | Map | core `greatCircle(from, to)` (geodesic arcs, antimeridian split), a region drilldown story (click → `fitBounds` → sub-regions, breadcrumbs), `exportMap("png")` | ⬜ |
| 4.18.17 | E (could, **ADR**) | Chart or a new component | offline SVG geo maps without a tile style: projection (Equal Earth), regions as SVG with the chart's legend, tooltip and keyboard, hex tile layouts | ⬜ |
| 4.18.18 | E — Chart Editor (could, **ADR**, after website phase 2) | Website / Storybook | a chart builder page: a form generated from `chartOptions` (style → Select, flag → Switch, number → Text field), a Data grid for the series, a live Chart, HTML \| React code with Copy | ⬜ |
| 4.18.19 | E — ApexCharts Premium (should) | Chart | crossfilter between charts of a `group` (a slice click or a brush filters the others; Linked Views / Highlight Filter) | ⬜ |
| 4.18.20 | E (could) | Chart | measure ruler (span · free, keyboard alternative, pinned rulers, `clearMeasures`), draggable annotations that report data coordinates (Ink) | ⬜ |
| 4.18.21 | E — ApexCharts v8 (should: waterfall, dumbbell first) | Chart | new types `waterfall`, `dumbbell`, `streamgraph`, `sunburst`, `icicle`, `violin`, `beeswarm`, `waffle`, `unit` (prop-level mapping in 3.1) | ⬜ |
| 4.18.22 | E — audit 3.1 (should) | Button, Icon button, Fab (+ Button group) | polymorphic `component` / `LinkComponent` (router links); Icon button `href` (icon links); Button group `component` | 🔄 |
| 4.18.23 | E — audit 3.1 (should) | Autocomplete | `readOnly`, `onHighlightChange`, `autoComplete` (inline completion), `clearOnBlur`, `filterSelectedOptions`, `disableListWrap`, `disabledItemsFocusable`, configurable `handleHomeEndKeys`, `resetHighlightOnMouseLeave` | ✅ |
| 4.18.24 | E — audit 3.1 (could) | Autocomplete | `renderValue` (custom chips), `clearIcon` / `popupIcon` / `forcePopupIcon`, object values (`getOptionLabel` / `isOptionEqualToValue` / `getOptionKey` / `getOptionValue`), public `useAutocomplete` / `createFilterOptions` | ✅ |
| 4.18.25 | E — audit 3.1 (should) | Text field | FormControl props `hiddenLabel`, `focused`, `component`; InputAdornment `disablePointerEvents`, `component` | 🔄 |
| 4.18.26 | E — audit 3.1 (could) | Text field (+ Select) | standalone `InputBase` / `OutlinedInput` (`notched`) / `FilledInput` (`disableUnderline`) / `Input`, `inputComponent` | ⬜ |
| 4.18.27 | E — audit 3.1 (should) | Select | InputBase `startAdornment` / `endAdornment` | 🔄 |
| 4.18.28 | E — audit 3.1 (could) | Slider | `tabIndex` | ✅ |
| 4.18.29 | E — audit 3.1 (should) | Date pickers (fields) | `clearButtonPosition`, `openPickerButtonPosition`, public `startAdornment` / `endAdornment`, `shouldRespectLeadingZeros`, `fieldRef` (field API), TextField props `color` / `margin` / `hiddenLabel` / `focused`, `selectedSections` `"all"` / section type | 🔄 |
| 4.18.30 | E — audit 3.1 (could) | Date pickers | range fields `dateSeparator`; calendars and clocks `focusedView` / `onFocusedViewChange`; TimeClock `showViewSwitcher`; static pickers `displayStaticWrapperAs` | ⬜ |
| 4.18.31 | E — audit 3.1 (could) | Upload | `dragFileRejections` (MIME / surplus rejections during a drag) | ✅ |
| 4.18.32 | E — audit 3.1 (could) | Code editor | DiffEditor `line` | ⬜ |
| 4.18.33 | E — audit 3.1 (should) | Editor | React access to the Tiptap editor (`onCreate` / editor ref) and Tiptap events (`create`, `focus`, `blur`, `selectionUpdate`, `transaction`, `paste`, `drop`, `delete`, `contentError`); `getJSON()` / `getText()` | ⬜ |
| 4.18.34 | E — audit 3.1 (could) | Editor | `editorProps`, `parseOptions`, `enableInputRules` / `enablePasteRules`, `textDirection`, `autofocus`; form `name` (hidden input) (with 4.16) | ✅ |
| 4.18.35 | E — audit 3.1 (could, **ADR**) | Editor | `extensions` pass-through (tables, mentions), `BubbleMenu` / `FloatingMenu` / `useEditor` (with 4.16: new Tiptap extension dependencies, schema and sanitizer impact) | ✅ |
| 4.18.36 | E — audit 3.1 (should) | Chip | link chips: `component="a"` / `href` on the action (clickable) | ✅ |
| 4.18.37 | E — audit 3.1 (should) | Snackbar | right to left: Toaster `dir`, logical properties in `snackbar.css` (with 4.13) | ✅ |
| 4.18.38 | E — audit 3.1 (should) | Snackbar | per-toast `closeButton` / `invert`, Toaster `invert`, `toastOptions` (defaults for every toast), `icons` | ✅ |
| 4.18.39 | E — audit 3.1 (should) | Menu | React `MenuList` without a Popover (`autoFocus`, `autoFocusItem`, `variant`); Menu `disableAutoFocusItem` | ✅ |
| 4.18.40 | E — audit 3.1 (could) | Snackbar | several toasters: Toaster `id` + toast `toasterId` | ✅ |
| 4.18.41 | E — audit 3.1 (could) | Snackbar | `toast.promise` `unwrap()`, `finally`, toast options; `toast.getHistory()` / `getToasts()`, `useSonner()` | ✅ |
| 4.18.42 | E — audit 3.1 (could) | Menu | `MenuList` `disabledItemsFocusable`, `disableListWrap` | ✅ |
| 4.18.43 | E — audit 3.1 (could) | Popover, Menu | `transitionDuration` | ✅ |
| 4.18.44 | E — audit 3.1 (could) | Dialog | `transitionDuration` (with 5.1 exit transitions) | ⬜ |
| 4.18.45 | E — audit 3.1 (could) | Dialog, Drawer | Modal props `disableRestoreFocus`, `disableScrollLock`; Drawer `ModalProps.keepMounted` (with 4.8) | ✅ |
| 4.18.46 | E — audit 3.1 (could) | Drawer | `SwipeableDrawer`: `onOpen`, `swipeAreaWidth`, `hysteresis`, `minFlingVelocity`, `disableSwipeToOpen`, `disableDiscovery`, `allowSwipeInChildren`; a button to open and close stays (WCAG 2.5.7); shares a core swipe helper with 4.14 | ⏸ |
| 4.18.47 | E — audit 3.1 (could) | Accordion | `AccordionActions` `disableSpacing` | ✅ |
| 4.18.48 | E — audit 3.1 (could) | Label | `disabled` | ✅ |
| 4.18.49 | E — audit 3.1 (must) | Data grid | column `sortComparator` / `getSortComparator` / `sortingOrder`, grid `sortingOrder`, `multipleColumnsSortingMode` | ✅ |
| 4.18.50 | E — audit 3.1 (must) | Data grid | column `renderEditCell`, `renderHeaderFilter`; controlled `cellModesModel` / `rowModesModel` | ✅ |
| 4.18.51 | E — audit 3.1 (should) | Data grid | per-column hooks and opt-outs: `cellClassName`, `headerClassName`, `hideSortIcons`, `disableColumnMenu`, `disableReorder`, `disableExport`, `pinnable`, `rowSpanValueGetter`, `pastedValueParser`, `groupingValueSetter`, `rowHeader`, `display: "flex"` | ⬜ |
| 4.18.52 | E — audit 3.1 (should) | Data grid | selection: `rowSelection: false`, `rowSelectionPropagation` (groups / tree), `checkboxColDef` | ⬜ |
| 4.18.53 | E — audit 3.1 (should) | Data grid | layout: `columnHeaderHeight`, `columnGroupHeaderHeight`, `headerFilterHeight`, `showCellVerticalBorder`, `showColumnVerticalBorder`, `rowSpacingType`, `autoHeight`, `autoPageSize` | ⬜ |
| 4.18.54 | E — audit 3.1 (should) | Data grid | footer / toolbar: `hideFooterPagination`, `hideFooterRowCount`, `hideFooterSelectedRowCount`, `label`; `tabNavigation` | ⬜ |
| 4.18.55 | E — audit 3.1 (could) | Data grid | events: column header double click / context menu / enter / leave / over / out, `onMenuOpen` / `Close`, `onPreferencePanelOpen` / `Close`, `onSidebarOpen` / `Close`, `onResize`, `onColumnResize`, `onFetchRows`, `onExcelExportStateChange`, `onBeforeClipboardPasteStart` | ⬜ |
| 4.18.56 | E — audit 3.1 (could) | Data grid | server: `paginationMeta` / `estimatedRowCount` / `onRowCountChange`, `dataSourceKeepPreviousData`, `dataSourceRevalidateMs`, `filterDebounceMs` / `columnFilterDebounceMs`, `disableChildrenFiltering` / `-Sorting` | ⬜ |
| 4.18.57 | E — audit 3.1 (could) | Data grid | `disableAutosize`, `keepColumnPositionIfDraggedOutside`, pinned section separators, `isRowReorderable` / `isValidRowReorder` / `setTreeDataPath`, `pivotingColDef`, `pivotPanelOpen`, `virtualizeColumnsWithAutoRowHeight` | ⬜ |
| 4.18.58 | E — audit 3.1 (could) | Data grid | `cellSelectionFillHandle` (drag to fill, keyboard alternative, WCAG 2.5.7) | ⬜ |
| 4.18.59 | E — audit 3.1 (must) | Chart | several value axes (`yaxis[]` with `seriesName`, `opposite`), `logarithmic`, `reversed`, `tickAmount`; a drawn x axis title | ✅ |
| 4.18.60 | E — audit 3.1 (must) | Chart | point / slice / label selection: `ok:chart:select` + React callback (click, Enter), selected state (`allowMultipleDataPointsSelection`, `toggleDataPointSelection`) | ✅ |
| 4.18.61 | E — audit 3.1 (should) | Chart | `stackType: "100%"`, `stackOnlyBar`; stacked totals, data label position; bar `colors.ranges`, background bars | ⬜ |
| 4.18.62 | E — audit 3.1 (should) | Chart | non-color series cues: `markers.shape`, `markers.discrete`, `fill.pattern`, `colorBlindMode` (WCAG 1.4.1); `stroke.width` per series | ⬜ |
| 4.18.63 | E — audit 3.1 (should) | Chart | tooltip: `tooltip: false`, per-point mode (`shared: false`), fixed position, custom content (React node / HTML `<template>`) | ⬜ |
| 4.18.64 | E — audit 3.1 (should) | Chart | legend `horizontalAlign`, `showForSingleSeries`, toggle opt-out, custom items; grid lines per axis, stripes | ⬜ |
| 4.18.65 | E — audit 3.1 (could) | Chart | `xaxis.group` (two-level categories), label rotation, fixed x `min` / `max` / `range`; `forecastDataPoints`; `noData`; text annotations; several `brush.targets` | ⬜ |
| 4.18.66 | E — audit 3.1 (could) | Chart | `dataReducer` (LTTB downsampling of the drawing) | ⬜ |
| 4.18.67 | E — audit 3.1 (could) | Chart | timeline `rangeBarGroupRows` / `rangeBarOverlap`, `hideZeroBarsWhenGrouped` | ⬜ |
| 4.18.68 | E — audit 3.1 (could, **ADR**) | Chart | drilldown (`drillDown` / `drillUp` / `drillToRoot`, back control, events); trellis small multiples | ⬜ |
| 4.18.69 | E — audit 3.1 (should) | Tree view | `onItemSelectionToggle`, `onItemClick`, `onItemFocus`; `isItemDisabled`, `isItemSelectionDisabled` / TreeItem `disableSelection`, `disabledItemsFocusable`, `getItemChildren` (with 4.11) | ✅ |
| 4.18.70 | E — audit 3.1 (could, **ADR**) | Tree view | `itemChildrenIndentation`; virtualization (`itemHeight`, flat DOM `domStructure`) | ⏸ |
| 4.18.71 | E — audit 3.1 (should) | Tabs | link tabs (Tab `href` / `component`, navigation pattern with `aria-current`) | ✅ |
| 4.18.72 | E — audit 3.1 (could) | Tabs | `TabPanel value` from the Tabs context (hides itself, `keepMounted`), like MUI Lab `TabContext` | ✅ |
| 4.18.73 | E — audit 3.1 (could) | Pagination | PaginationItem `component` (router link as the item) | ✅ |
| 4.18.74 | E — audit 3.1 (could) | Stepper | StepContent `transitionDuration` (Collapse `timeout` pass-through) | ✅ |
| 4.18.75 | E — audit 3.1 (should, **ADR**) | Sortable | move between lists (`group` / `accept`, a kanban story), keyboard and announcements across lists | ⬜ |
| 4.18.76 | E — audit 3.1 (should) | Sortable | auto scroll near Scrollbar / page edges while dragging; disabled items; `onDragStart` / `onDragOver` / `onDragCancel`; HTML `messages` | ⬜ |
| 4.18.77 | E — audit 3.1 (could) | Sortable | swapping strategy; drag by the whole item (no handle) | ⬜ |
| 4.18.78 | E — audit 3.1 (should) | Motion | `component` (any element); `viewport.margin` / `root`; in-view events (`onViewportEnter` / `Leave`, `ok:motion:enter` / `leave`) | ⬜ |
| 4.18.79 | E — audit 3.1 (could) | Map | reactive `light` / `sky`, `styleDiffing`, camera `padding`; Marker `scale`, `clickTolerance` | ⬜ |
| 4.18.80 | E — audit 3.1 (could) | Carousel | Embla v9 method aliases (`goTo`, `goToNext`, `selectedSnap`, `snapList`…), `snapIndex(slide)`, events `resize`, `slideschanged`, `pointermove` | ⬜ |
| 4.18.81 | E — audit 3.1 (could) | Lightbox | `render.slideContainer`, `render.buttonPrev` / `buttonNext` / `buttonClose` (+ plugin buttons), `render.iconLoading` / `iconError` | ⬜ |
| 4.18.82 | E — audit 3.1 (could) | Walktour | option `offset`; step `id` and `data` (in events) | ⬜ |
| 4.19 | F — Minimals Utilities, spread across components (owner's decision 2026-11-09: no Utilities group) | Typography (+ Link) | "Text max line": a `maxLines` option (CSS `line-clamp`, beside `noWrap`), a "Text max line" story with 1–4 lines and "As link" | ⬜ |
| 4.20 | F | Text field (+ Snackbar) | "Copy to clipboard": a copy IconButton in an end adornment and copy on double click, a core helper on a user gesture with the refused path handled, a "Copied" toast | ⬜ |
| 4.21 | F | Foundations › Colors (+ Paper / Card, Typography) | "Gradient": `--ok-gradient-*` tokens from the palette (follow presets and dark mode), gradient text, border, background and paper examples | ⬜ |
| 4.22 | F | Motion (beside CountUp) | "Countdown": a `Countdown` (to a date, or seconds) with days / hours / minutes / seconds, a polite live region, pausable (WCAG 2.2.2) | ⬜ |
| 4.23 | F | Radio, Checkbox (+ Avatar group) | "Color pickers": single (Radio) and multiple (Checkbox) color swatches on native inputs, a "+N" color preview in the Avatar group style | ⬜ |
| 4.24 | F | Text field | "Number input": increment / decrement buttons in the adornment, `min` / `max` / `step`, Arrow / PageUp / PageDown keys, helper text, disabled | ⬜ |
| 4.25 | F | Text field (+ Select / Autocomplete) | "Phone input": country select (auto, default, fixed, international, hidden select), national / international / raw values. Needs phone metadata (for example `libphonenumber-js`): **ADR**, behind an opt-in entry like Editor / Map | ⬜ |
| 4.26 | F | Foundations › Settings (or Introduction) | "Styled": no component — a guide "Style components" with CSS variables, `data-ok-*` state selectors (`[data-ok-open]`, `:focus-visible`, `:disabled`), keyframes with tokens, Tailwind (Owlky's answer to MUI's `sx` / `styled()` / `keyframes`) | ⬜ |

**Notes:** batch A merged 2026-11-10. Behavior changes to mention in the release notes: Autocomplete `selectOnFocus` follows MUI (the first click in a non-free-solo field selects its text); Slider Page Up / Down move by `shiftStep` (default 10) instead of 10 steps. Budgets: all CSS 51.6 of 52 kB, `owlky.js` 187.1 of 190 kB.

**Notes:** batches B and C merged 2026-11-10. Left: 4.18.44 Dialog `transitionDuration` (waits for 5.1), 4.18.46 SwipeableDrawer (no shared swipe helper yet; the Snackbar's is toast-specific), 4.18.70 tree virtualization (needs an ADR; `itemChildrenIndentation` is done). Release-note behavior changes: Snackbar toasts that can be swiped show a close button unless `closeButton={false}` (WCAG 2.5.7); `toast.promise` returns a boxed id with `unwrap()` (compare with `id.valueOf()`); Tree view arrow keys, Home / End and typeahead skip disabled items unless `disabledItemsFocusable`; Tooltip `enterNextDelay` defaults to `enterDelay`; React Dialog / Drawer `keepMounted` defaults to `true`. Budgets: `owlky.js` 195.1 of 200 kB, all CSS 52.6 of 56 kB.

**Notes:** batch D merged 2026-11-10 (ADR-0050: Tiptap table, mention and suggestion packages, Floating UI stubbed in `owlky-editor.js`; 4.18.34 shipped with 4.16). Release-note behavior changes: Walktour waits up to 1000 ms for a missing target (`targetWaitTimeout={0}` for the old skip), scrolls with an eased 300 ms animation and skips fixed targets, and fires `step:after` before the next step's change; Editor Alt+F10 moves to the toolbar or the bubble menu, part ids derive from `id`; every Data grid root writes `data-ok-row-grouping-column-mode="single"`, date columns add year and quarter fields to the pivot panel, `"footer"` aggregation positions now render, the pivot panel's fields sit in four sections. Budgets: `owlky.js` 200.0 of 205 kB, all CSS 53.0 of 56 kB, editor IIFE 155.1 of 163 kB. Watch list (local, under load, pass alone): React Toaster auto-close, HTML Tooltip "instance show / hide", HTML Dialog, Firefox data grid docs "fits a phone".

## Phase 5 — Motion full version (own ADR)

| # | Step | Scope | Status |
|---|---|---|---|
| 5.1 | Engine | `animate(element, keyframes, options)` on the Web Animations API, springs as `linear()` easing, interruption from the current value, exit before removal → Dialog exit transitions and the Motion "Logo" story (the last "Pending integrations" row) | ⬜ |
| 5.2 | Scroll | scroll-linked progress (`animation-timeline`, JavaScript fallback for Firefox): the reference's Scroll progress page (`minimals.cc/components/extra/scroll-progress`, built on Framer Motion's `useScroll`) — sections "Container scroll-y", "Container scroll-x" and "Scroll document", drawn with Linear / Circular progress | ⬜ |
| 5.3 | Gestures | drag with inertia and constraints, spring hover / tap | ⬜ |
| 5.4 | Layout | layout animations (FLIP), shared values | ⬜ |
| 5.5 | Later | shared-element transitions (evaluate View Transitions first) | ⏸ |

## Phase 6 — Final sweep (owner's decision 2026-11-09)

| # | Step | Scope | Status |
|---|---|---|---|
| 6.1 | `/integrate` with the Fable model | after phases 1–5, run `/integrate` (no argument) once more, as agents on the **Fable** model (`model: "fable"`), to find and close every wait left on a component that now exists — stand-ins, deferred stories, story demo CSS for surfaces or fonts — with a fresh pair of eyes | ⬜ |
| 6.2 | Re-check | rerun the discovery of `/integrate` step 3; "Pending integrations" must be empty and the docs API reference complete (3.4 green) | ⬜ |

## Done

When every row above (phase 6 included) is ✅ or ⏸ with a reason, update `roadmap.md` step 5 to ✅ and continue with
the website (step 6).
