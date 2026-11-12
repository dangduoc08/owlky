# Architecture Decision Records

Short, numbered records of decisions that shape the codebase. Change a decision by adding a new
ADR that supersedes the old one — don't rewrite history.

| #                                              | Decision                                                                  | Status   |
| ---------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| [0001](0001-monorepo-and-packages.md)          | Monorepo with five packages and strict boundaries                         | Accepted |
| [0002](0002-design-tokens.md)                  | TypeScript tokens → CSS variables, AA-checked                             | Accepted (brand-color contrast rules superseded by 0014) |
| [0003](0003-styling-architecture.md)           | `data-ok-*` anatomy, zero-specificity CSS in cascade layers, prebuilt CSS | Accepted |
| [0004](0004-shared-core.md)                    | Shared framework-free core for behavior and anatomy                       | Accepted |
| [0005](0005-html-runtime.md)                   | HTML Core Runtime: registry, delegation, lifecycle, idempotency           | Accepted |
| [0006](0006-browser-baseline-and-fallbacks.md) | Browser baseline and native-API fallbacks                                 | Accepted |
| [0007](0007-shared-state-and-versioning.md)    | Page-wide shared state and runtime version policy                         | Accepted |
| [0008](0008-framework-independence.md)         | Framework independence, enforced                                          | Accepted |
| [0009](0009-build-and-publishing.md)           | Build, distribution and publishing                                        | Accepted (publishing trigger superseded by 0012) |
| [0010](0010-testing-strategy.md)               | Testing strategy                                                          | Accepted |
| [0011](0011-foundations-first.md)             | Foundations first; sample components removed (references in git)        | Accepted ("AA wins" superseded by 0014, Storybook layout by 0018 and 0019) |
| [0012](0012-release-by-tag.md)                | Release only from `release/v*` tags on main                              | Accepted |
| [0013](0013-translucent-colors-via-channels.md) | Translucent colors via RGB channel tokens (no `color-mix()` in components) | Accepted |
| [0014](0014-brand-colors-follow-reference.md) | Brand colors follow the reference look (white on fills, `main` text) | Accepted |
| [0015](0015-component-api-and-option-schema.md) | Component API from the upstream component; one option schema for React and HTML | Accepted |
| [0016](0016-rename-to-owlky.md) | Rename the library to Owlky (`ok` namespace) | Accepted |
| [0017](0017-theme-presets.md) | Theme presets through data attributes (color, font, root size) | Accepted |
| [0018](0018-one-story-per-component.md) | One story per component, framework chosen in the toolbar | Accepted |
| [0019](0019-component-docs-pages.md) | A usage guide page for every component | Accepted |
| [0020](0020-data-grid.md) | Data grid: one grid engine in core, every MUI X tier, built in phases | Accepted (phase table superseded by 0021) |
| [0021](0021-data-grid-six-phases.md) | Data grid: the backlog folded into six phases | Accepted |
| [0022](0022-pickers.md) | Pickers: one picker engine in core, every MUI X tier, four phases | Accepted |
| [0023](0023-editor-on-tiptap.md) | Editor: Tiptap as the first runtime dependency, behind its own entry points | Accepted |
| [0024](0024-chart.md) | Chart: one SVG chart engine in core, written by us, four phases | Accepted (phases 3–4 superseded by 0027) |
| [0025](0025-map-on-maplibre.md) | Map: MapLibre GL JS behind its own entry points, Owlky markup around the canvas | Accepted |
| [0026](0026-time-pickers.md) | Time pickers: one field and picker anatomy for every value type, clocks as listboxes | Accepted |
| [0027](0027-chart-every-type.md) | Chart: every ApexCharts chart type; phases 3–4 rescoped for dashboards | Accepted |
| [0028](0028-range-pickers.md) | Range pickers: a range model in core, ISO intervals, one range calendar and runtime | Accepted |
| [0029](0029-chart-phase-3-data-model.md) | Chart phase 3: several values per point, cell charts, sparklines, live updates | Accepted |
| [0030](0030-picker-adapters-and-time-zones.md) | Pickers phase 4: date adapters as opt-in entries, zones and calendars at the edge | Accepted |
| [0031](0031-chart-phase-4-interaction-and-links.md) | Chart phase 4: zoom as an x window, linked charts, annotations, export, last chart types | Accepted |
| [0032](0032-lightbox.md) | Lightbox: a modal dialog around the Carousel, one controller in core | Accepted |
| [0033](0033-carousel.md) | Carousel: native scroll snapping, one controller in core, loop by reordering | Accepted |
| [0034](0034-code-editor-on-monaco.md) | Code editor: Monaco behind opt-in entries, self-hosted, with its own CSP | Accepted |
| [0035](0035-markdown-on-unified.md) | Markdown: unified (remark / rehype) behind opt-in entries, safe by default | Accepted |
| [0036](0036-organization-chart.md) | Organization chart: nested lists with CSS connectors, lengths through private properties | Accepted (partly superseded by 0051) |
| [0037](0037-upload.md) | Upload: a native file input under the drop zone, one controller in core | Accepted |
| [0038](0038-image.md) | Image: native lazy loading, the load state as a data attribute | Accepted |
| [0039](0039-walktour.md) | Walktour: a state machine in core, steps as Popovers over a Backdrop with an SVG spotlight | Accepted |
| [0040](0040-website.md) | Website: a Next.js app in the monorepo, docs content shared with Storybook, deployed to Vercel | Accepted |
| [0041](0041-illustrations.md) | Illustrations: a theme-aware set as data in core, tones mapped to tokens, opt-in bundles | Accepted |
| 0042–0043 | Not used: numbers reserved for Wave 8 agents (Typography, Paper) that needed no ADR | — |
| [0044](0044-collapse.md) | Collapse: `hidden` is the state, a core controller animates the size | Accepted |
| [0045](0045-select.md) | Select: a select-only combobox with roving focus; the native select stays | Accepted |
| [0046](0046-mcp-server.md) | MCP server: `@owlky/mcp` over stdio, answering from a generated manifest | Accepted |
| [0047](0047-chart-sankey-and-stock-charts.md) | Chart: Sankey and stock charts in the shared engine (links table, indicators, panes, navigator) | Accepted |
| [0048](0048-gantt.md) | Gantt: one treegrid with a timeline column, laid out by core, built in three phases | Accepted |
| [0049](0049-api-reference.md) | API reference: generated from typed sources (props, parts, event maps, instances), shown on every docs page | Accepted |
| [0050](0050-editor-tables-mentions-bubble-menu.md) | Editor: tables, mentions and a bubble menu (new Tiptap extensions, opt-in), Tiptap settings passed through, a form value | Accepted |
| [0051](0051-organization-chart-collapsible-nodes.md) | Organization chart: collapsible nodes, a toggle per branch, lazy children (supersedes part of ADR-0036) | Accepted |
| [0052](0052-organization-chart-direction.md) | Organization chart: direction (top, bottom, left, right) in CSS only, toggles follow it (supersedes part of ADR-0036) | Accepted |
| [0053](0053-sortable-multiple-lists.md) | Sortable: items move between lists of a group (one session per document, intent to the holding list's owner, move-to triggers) | Accepted |
| [0054](0054-chart-crossfilter.md) | Chart crossfilter: one group filter in the link registry, shown as a filter or a highlight per chart, a Clear control | Accepted |
| [0055](0055-data-grid-range-charts-crossfilter.md) | Data grid: range charts (a model with `rows`, Alt + F1), cross-filtering as the category field's `isAnyOf` filter, `chartsToJSON` / `restoreCharts` | Accepted |
| [0056](0056-organization-chart-zoom-pan.md) | Organization chart: zoom, fit and center through CSS `zoom` inside the composed Scrollbar, a toolbar part, intent from a core controller | Accepted |
| [0057](0057-data-grid-cell-menu-filter-groups.md) | Data grid: a cell menu (`contextMenu`, right click, Shift + F10, Menu key; extensible), nested filter groups with their own And / Or (JSON), generated columns (`autoGenerate`, HTML from a data table) | Accepted |
| [0058](0058-chart-hierarchy-tree-sunburst-icicle.md) | Chart: hierarchy charts (tree, sunburst, icicle) on one nested model, a nodes-with-parents table, tidy and partition layouts, drill and collapse as root attributes | Accepted |
| [0060](0060-chart-drilldown-trellis.md) | Chart: drilldown levels next to the series (`drilldown`, a path of level ids on the root, the ADR-0058 drill row) and trellis small multiples (`ChartTrellis`, shared nice scales, `promote`) | Accepted |
| [0059](0059-chart-geo-maps.md) | Chart: offline SVG geo maps (`type="geo"`): regions and hex tiles with the chart's legend, tooltip and keyboard, `mapScale`, geometry from GeoJSON (React) or a JSON element / script (HTML) | Accepted |
| [0061](0061-phone-input.md) | Phone input: libphonenumber-js `min` behind opt-in entries (`@owlky/core/phone`, `owlky-phone.js`), a bare Select of countries with emoji flags, E.164 values | Accepted |
| [0062](0062-motion-engine.md) | Motion full version: a Web Animations API engine in core (`animate()`, springs as `linear()`, interruption), exits before removal, Dialog / Drawer exits and `transitionDuration` | Accepted |
| [0063](0063-organization-chart-tree-selection-keyboard.md) | Organization chart: an opt-in ARIA tree written by core (`enableKeyboardNavigation`, `enableSelection`), roving focus and arrow keys, `data-ok-selected`, a composed lineage breadcrumb (supersedes part of ADR-0036) | Accepted |
| [0064](0064-data-grid-server-side-pivoting.md) | Data grid server-side pivoting: `pivotModel` in data source requests, `pivotColumns` in responses, values in `<keys>>-><field>` row fields (MUI X) | Accepted |
| [0065](0065-map-region-selection-linked-maps.md) | Map: multiple region selection, Shift + drag box selection by label anchor (MapLibre `boxZoom` off while it is on), linked maps by `group` with a bidirectional filter | Accepted |
| [0066](0066-paper-composed-by-surfaces.md) | Paper composed by the library's own surfaces: `data-ok-paper` on Popover (every popover root), Dialog paper, Drawer content, Map controls and popups; `elevation` on Popover / Menu / Dialog; `TableContainer component={Paper}` | Accepted |

Template: **Context** (why decide) · **Decision** (what) · **Consequences** (trade-offs, follow-ups).
