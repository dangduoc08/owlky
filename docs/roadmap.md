# Implementation plan

Each phase ends with green CI (lint, types, unit ×3 browsers, e2e ×4 projects, package checks)
and a review before the next starts.

## Overview
Every page of the reference's component menu (`https://minimals.cc/components/…`) and where it
stands (plus pages from other references, marked). ✅ = built (46); *wave N* = planned, see "Next — components"; *not planned* = a pattern
or app-level page. *Section* = the heading below with the details. Update this table with each
component and each `/integrate` run.

| Group | Reference page | Status | Owlky | Section |
|---|---|---|---|---|
| Foundation | Colors | ✅ | Foundations › Colors | Phase 2' |
| Foundation | Typography | ✅ | Foundations › Typography | Phase 2' |
| Foundation | Shadows | ✅ | Foundations › Shadows | Phase 2' |
| Foundation | Grid | ✅ | Foundations › Grid | Phase 2' |
| Foundation | Icons | ✅ | Foundations › Icons | Phase 2' |
| Foundation | (Settings drawer) | ✅ | Foundations › Settings, `applyThemeSettings` | Theme settings |
| Foundation | Illustrations (error, maintenance, empty, account and dashboard pages) | ✅ (ADR-0041) | Foundations › Illustrations, `Illustration`, `@owlky/core/illustrations` | Phase 2' |
| MUI | Accordion | ✅ | Accordion | Accordion & Alert |
| MUI | Alert | ✅ | Alert | Accordion & Alert |
| MUI | Autocomplete | ✅ | Autocomplete | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Avatar | ✅ | Avatar, AvatarGroup | Avatar, Badge, Chip & Label |
| MUI | Badge | ✅ | Badge | Avatar, Badge, Chip & Label |
| MUI | Breadcrumbs | ✅ | Breadcrumbs, BreadcrumbsDot | Tabs, Breadcrumbs & Stepper |
| MUI | Buttons | ✅ | Button, IconButton, Fab, ButtonGroup, ToggleButton(Group) | Button |
| MUI | Checkbox | ✅ | Checkbox, FormControlLabel | Checkbox & Switch |
| MUI | Chip | ✅ | Chip | Avatar, Badge, Chip & Label |
| MUI | Dialog | ✅ | Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Drawer | ✅ | Drawer | Drawer |
| MUI (no Minimals page; mui.com) | Divider | ✅ | Divider | Divider |
| MUI (no Minimals page; mui.com) | Backdrop | ✅ | Backdrop | Backdrop |
| MUI (no Minimals page; mui.com) | Paper | ✅ | Paper | Paper |
| MUI (no Minimals page; mui.com) | Typography | ✅ | Typography | Typography |
| MUI (no Minimals page; mui.com) | Transitions (Collapse; Fade, Grow, Slide, Zoom are Motion) | ✅ (ADR-0044) | Collapse | Collapse |
| MUI (no Minimals page; mui.com) | Card | ✅ | Card, CardHeader, CardContent, CardMedia, CardActions, CardActionArea | Card |
| MUI (no Minimals page; mui.com) | Form control (API pages; demos on Radio, Checkbox, Switch) | ✅ | FormControl, FormLabel, FormGroup, FormHelperText, `useFormControl` | Form control |
| MUI (no Minimals page; mui.com) | Link | ✅ | Link | Link |
| MUI | List | ✅ | List, ListItem, ListItemButton, ListItemIcon, ListItemAvatar, ListItemText, ListSubheader, ListItemExpandIcon | List |
| MUI | Menu | ✅ | Menu, MenuItem | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Pagination | ✅ | Pagination, PaginationItem | Pagination |
| MUI | Popover | ✅ | Popover | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Progress | ✅ | CircularProgress, LinearProgress | Progress |
| MUI | Radio button | ✅ | Radio, RadioGroup | Text field & Radio |
| MUI | Select | ✅ (ADR-0045) | Select, InputLabel (`native`, multiple, chips, grouping); TextField and TablePagination `selectProps` | Select |
| MUI | Rating | ✅ | Rating | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Slider | ✅ | Slider | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Stepper | ✅ | Stepper, Step, StepLabel, StepConnector, StepContent, MobileStepper | Tabs, Breadcrumbs & Stepper |
| MUI | Switch | ✅ | Switch, FormControlLabel | Checkbox & Switch |
| MUI | Table | ✅ | Table parts, TablePagination, TableExpandButton / TableDetailRow | Table |
| MUI | Tabs | ✅ | Tabs, Tab, TabPanel | Tabs, Breadcrumbs & Stepper |
| MUI | Text field | ✅ | TextField, InputAdornment (native select; listbox with `selectProps`) | Text field & Radio |
| MUI | Timeline | ✅ | Timeline and its parts | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Tooltip | ✅ | Tooltip | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Transfer list | ✅ | TransferList | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI X | Data grid | ✅ phases 1–6 of 6 (ADR-0020, ADR-0021) | DataGrid | Data grid |
| MUI X | Date pickers | ✅ complete, phases 1–4 (ADR-0022, ADR-0026, ADR-0028, ADR-0030) | DatePicker, DesktopDatePicker, MobileDatePicker, StaticDatePicker, DateField, DateCalendar, MonthCalendar, YearCalendar, LocalizationProvider; TimePicker, DateTimePicker (desktop, mobile, static), TimeField, DateTimeField, TimeClock, DigitalClock, MultiSectionDigitalClock; DateRangeCalendar, DateRangePicker (desktop, mobile, static), TimeRangePicker, DateTimeRangePicker (desktop, mobile), single and multi input range fields (date, time, date time); time zones, date adapters (Day.js, date-fns, Luxon, Moment), calendar systems, locale packs, right to left, slots and view renderers | Date pickers |
| MUI X | Tree view | ✅ | SimpleTreeView, TreeItem, RichTreeView | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| Extra | Animate | ✅ beta | Motion, MotionGroup, MotionText, CountUp, MotionBorder; Dialog `transition` | Motion |
| Extra | Carousel | ✅ (ADR-0033) | Carousel, CarouselStage, CarouselViewport, CarouselSlide, CarouselArrows, CarouselDots, CarouselProgress, CarouselThumbs, CarouselThumb, CarouselPlayButton | Carousel |
| Extra | Chart | ✅ complete, phases 1–4 (ADR-0024, ADR-0027, ADR-0029, ADR-0031) | Chart | Chart |
| Extra (ApexSankey reference) | Sankey | ✅ (ADR-0047) | Chart `type="sankey"` | Chart |
| Extra (ApexStock reference) | Stock charts | ✅ (ADR-0047) | Chart `indicators`, `navigator`, `paneHeight` | Chart |
| Extra | Dnd | ✅ | Sortable | Sortable |
| Extra | Editor | ✅ (ADR-0023, Tiptap) | Editor | Editor |
| Extra (monaco-react reference) | Code editor | ✅ (ADR-0034, Monaco) | CodeEditor, DiffEditor, useMonaco, loader | Code editor |
| Extra (ApexCharts) | Gantt | ✅ phases 1–3 of 3 (ADR-0048: scales, zoom, bars, summaries, milestones, baselines, critical path, tree, dependencies, non-working days, today line, selection, tooltips, keyboard; phase 2: editing by drag and keyboard, edit-form requests; phase 3: row virtualization, SVG / PNG / CSV downloads) | Gantt | Gantt |
| Extra | Form validation | not planned | — | Next |
| Extra | Form wizard | not planned | — | Next |
| Extra | Image | ✅ (ADR-0038) | Image | Image |
| Extra | Label | ✅ | Label | Avatar, Badge, Chip & Label |
| Extra | Layout | not planned | — | Next |
| Extra | Lightbox | ✅ (ADR-0032) | Lightbox, LightboxTrigger | Lightbox |
| Extra | Map | ✅ (ADR-0025, MapLibre GL JS) | MapView, Marker, Popup, Source, Layer, NavigationControl, GeolocateControl, FullscreenControl, ScaleControl, AttributionControl, GlobeControl, TerrainControl, MapControl, MapPanel, MapProvider / useMap | Map |
| Extra | Markdown | ✅ (ADR-0035, unified) | Markdown, MarkdownAsync, MarkdownHooks | Markdown |
| Extra | Mega menu | not planned | — | Next |
| Extra | Multi-language | not planned | — | Next |
| Extra | Navigation bar | not planned | — | Next |
| Extra | Organization chart | ✅ (ADR-0036) | OrganizationChart, OrganizationChartNode | Organization chart |
| Extra | Scroll progress | Motion full, phase 2 | — | Next — Motion, full version |
| Extra | Scrollbar | ✅ | Scrollbar | Scrollbar |
| Extra (Sonner) | Snackbar | ✅ | Toaster, toast() | Popover, Tooltip, Menu, Dialog & Snackbar |
| Extra | Upload | ✅ (ADR-0037) | Upload, UploadAvatar, UploadBox | Upload |
| Extra | Utilities | spread across components ([`roadmap-components.md`](roadmap-components.md) 4.19–4.26) | Typography, Text field, Colors, Motion, Radio / Checkbox, Settings guide | — |
| Extra | Walktour | ✅ (ADR-0039) | Walktour | Walktour |

## ✅ Phase 0 — Foundation tooling
pnpm workspace, strict TypeScript 7, Biome (incl. boundary import rules), Vitest browser mode,
Playwright, Storybook 10, Changesets (fixed), CI and release workflows, ADRs, `AGENTS.md`.

## ✅ Phase 1 — Tokens and theming
Typed tokens → `tokens.css`/JSON, light/dark/system/nested scopes, `createTheme()`, AA contrast
tests, Tailwind v4 `theme.css`, prebuilt CSS pipeline with leak checks, HTML Core Runtime.

## ↩ Phase 2 — Pattern components (removed, ADR-0011)
Button, Switch and Dialog proved the architecture and were then removed so the library is built
foundations-first. Their code is the pattern reference at commit `bd5fb2d`.

## ✅ Phase 2' — Foundations (Storybook › Foundations)
Content from the reference's Foundation section, presented the Storybook way (one story per
section, autodocs page, Controls), generated from the tokens:

| Page | Content | Token changes |
|---|---|---|
| Colors | One story per palette: Hex / Rgb / Var, click to copy | `getContrastText`, `contrastRatio`, `hexToRgb` |
| Typography | One story per variant with its definition, text colors | Responsive sizes (600/900/1200px), display font Barlow for h1–h3, h5/h6 values, breakpoints |
| Shadows | System elevations 1–24, extended shadows, colored shadows, drop shadows (2026-11-09: `filter` versions of z1 / z4 / z8 for shapes; Slider thumb and Map pin moved to tokens; `styles.test.ts` rejects hand-written blurred shadows) | `--ok-elevation-1…24`, `--ok-drop-shadow-z1 / z4 / z8` |
| Grid | Spacing (0–40px) and column (1–12) stories driven by Controls | — |
| Icons | Icon sets, sizes, colors, usage | — (no icon set bundled; reference logo/illustrations not reproduced) |
| Illustrations (ADR-0041, 2026-11-09) | 16 original theme-aware pictures in six stories (All, Errors, States, Account, Dashboard, Shapes), style guide `docs/illustrations-style.md` and shared parts, framework toolbar, Controls `color` / `size`, usage guide | `--ok-illustration-skin-light / -medium / -deep`; `Illustration` (React), runtime `illustration` (opt-in `owlky-illustrations.js`), data in `@owlky/core/illustrations` |

Illustrations: error 404 / 403 / 500, no connection, empty content, no results, maintenance, coming
soon, sign in, email sent, reset password, welcome, upgrade, order complete, upload, avatar shape.
All drawn by us (Humaaans is CC0 but only downloadable through a Gumroad checkout; ADR-0041).
Upload's drop zone composes the `upload` picture. No other component draws an illustration (the
other inline SVGs are icons, such as the Lightbox toolbar, or functional, such as the Walktour
spotlight). Candidates for an optional picture, not changed (they would change anatomy and API):
the Data grid's no-rows / no-results overlays (text only; the reference shows its "empty content"
picture there) and empty Table / Transfer list states (`emptyContent`, `noResults`).

## ✅ Components — Button (first component, 2026-11-04)
Created with `/component` from the reference "Buttons" page: 4 variants × 9 colors × 4 sizes,
icons, loading (center / start / end), link buttons. Tokens added: RGB channels, font-size scale,
black/white bindings (ADR-0013). Coverage tooling (`pnpm test:coverage`), responsive matrix,
strict-CSP check and visual baselines at 5 viewports were introduced with it.
Follow-ups from the same reference page, added in the same review (Update mode): **Icon button**,
**Fab**, **Button group** (CSS only) and **Toggle button** (core `nextToggleSelection()`, HTML
runtime `toggle-button` / `toggle-group`, React state). No new tokens.

## ✅ Components — Drawer (2026-11-04)
Created with `/component` from the reference "Drawer" page (story: Anchor — left / right / top /
bottom). Native `<dialog>` + core `createModalController()` (restored from the removed Dialog,
shared by future modals). Token added: `--ok-shadow-dialog-start`. The demo menu is a List.

## ✅ Components — Sortable (2026-11-04)
Created with `/component` from the reference "Dnd" page (stories: Grid, Vertical, Horizontal).
Core `createSortableController()`: Pointer Events dragging (mouse, touch, pen), keyboard and
two-tap moves (WCAG 2.1.1 / 2.5.7), live announcements; remove buttons built in, "Add item" is app
logic (HTML: `<template data-ok-sortable-template>`). No new tokens.

## ✅ Components — Accordion & Alert (2026-11-05)
Created with `/component` from the reference "Accordion" (stories: Simple, Controlled, Custom
styles) and "Alert" pages (stories: Standard, Filled, Outlined, Description, Actions). Accordion is
a native `<details>` (keyboard and find-in-page built in); `name` gives one-open-at-a-time with core
`closeOtherDetails()` as the fallback; extras beyond MUI: `variant` (`default` · `outlined` ·
`soft`) and `name`. Alert: `severity` / `variant` / `color`, close button (React `onClose`, HTML
runtime `ok:alert:close` → `hidden`), standard tones follow the theme's `color-scheme` with
`light-dark()` (light tones without it). No new tokens.

## ✅ Components — Table (2026-11-05)
Created with `/component` from the reference "Table" page (stories: Basic, Sorting & selecting,
Grouping & fixed header, Collapsible, Pagination with API — added with Pagination). Native `<table>` parts mapped from MUI (`Table`,
`TableHead/Body/Footer`, `TableRow`, `TableCell`, `TableContainer`, `TableSortLabel`,
`TablePagination`) plus `TableExpandButton` / `TableDetailRow` for collapsible rows. React leaves
data to the app (helpers in core: `compareCellValues`, `nextSortDirection`, `pageRange`,
`selectAllState`); the HTML runtime (`table`, `table-pagination`) sorts, selects and pages the rows
in the DOM (approved extension beyond MUI). No new tokens.

## ✅ Components — Pagination (2026-11-05)
Created with `/component` from the reference "Pagination" page (stories: Shapes, Variants, Sizes,
Buttons, Ranges, Custom icons, Table). MUI `Pagination` / `PaginationItem`; `usePagination` →
core `paginationItems()` shared by React and the HTML runtime (`pagination`, rebuilds the page
items with DOM APIs, keeps focus). Extras from the reference: `soft` variant and every palette
color; `size` uses `sm | md | lg` like the button family; HTML label templates
(`data-ok-label-page`, `data-ok-label-current`). No new tokens.

## ✅ Components — Scrollbar (2026-11-05)
Created with `/component` from the reference "Scrollbar" page (stories: Vertical, Horizontal,
Layout). Upstream simplebar mapped to **native** scrollbars, CSS only: `scrollbar-width` /
`scrollbar-color` with a `::-webkit-scrollbar` fallback; `autoHide` (thumb on hover / focus).
Integrated in the same review, by composition like the reference (`TableContainer › Scrollbar ›
Table`): all Table stories, Drawer content and Sortable lists now scroll in a Scrollbar; their CSS
adapts with `:has(> [data-ok-scrollbar])`, and the old markup keeps working (additive). An
unnamed `TableContainer` is no longer focusable. No new tokens.

## ✅ Components — Popover, Tooltip, Menu, Dialog & Snackbar (2026-11-07)
Wave 4 (overlays), created with `/component` from the reference pages. Core: anchored positioning
(`computePosition`: 12 placements, flip, shift, arrow offset) and `createPopoverController`
(Popover API `popover="manual"` + fallback `data-ok-fallback`, Escape / outside press as intent,
focus in and back, layer stack) shared by Popover, Menu and Tooltip; `createHoverIntent` (tooltip
timing, 100 ms grace to reach the tooltip); menu keyboard helpers (arrows, Home / End, typeahead);
toast store / API / timer (Sonner). Dialog reuses `createModalController`. HTML runtimes: `popover`
(click and hover triggers), `menu`, `tooltip`, `dialog`, `toaster` (templates, `data-ok-then`).
One placement vocabulary replaces MUI's `anchorOrigin` / `transformOrigin`. Token added:
`--ok-bg-paper-channel` (translucent paper). No new runtime dependency.

## ✅ Components — Motion (Animate, 2026-11-08) — beta
Created with `/component` from the reference "Animate" page (stories: In view, Text, Scroll,
Dialog, Background, Tap & hover, Path, Count up, Logo, Avatar, Border). Named Motion because
`data-ok-animate` is the IconButton / Fab hover flag. Framer Motion's ideas without the dependency:
CSS keyframes driven by custom properties (one keyframe per family; exits play it backwards),
`data-ok-state` written by the owner from core `createMotionTrigger` (mount, in view through
IntersectionObserver, manual `in`). **Motion** (the reference's 48 entrances and exits, Ken Burns,
pan and color loops, `draw`, `interactive`), **MotionGroup** (stagger), **MotionText** (letters,
read whole), **CountUp** (core `createCountUp`), **MotionBorder** (a conic gradient on a registered
angle). Beyond the reference: `paused` (WCAG 2.2.2). Without JavaScript nothing is hidden; reduced
motion shows end states at once. Tokens added: `--ok-duration-enter` (640ms),
`--ok-duration-exit` (480ms), `--ok-easing-expressive`. Closes the pending integration "Dialog
story Transitions": Dialog `transition` (a Motion entrance on the paper). Size budgets raised: CDN
bundle 34 kB, all CSS 27 kB gzip (about 33 and 26 kB now). Differences: an original owl mark
instead of the reference's logo, an original SVG image, no variant picker (Storybook Controls).
**Beta (owner's decision, 2026-11-08):** this CSS-keyframe Motion is the interim version. Its API
(`variant`, `trigger`, `in`, `once`, `amount`, `duration`, `delay`, `distance`, `paused`, `stagger`,
the HTML attributes and `ok:motion:end`) should survive the full version below; mark it beta in
docs and the changeset until then.
**Update (2026-11-08, `/component` Update):** MotionBorder follows the reference's border lights:
one symmetric light (`inherit` or a palette color) over a faint track, `secondaryColor` (a second
light half a turn away), per-side widths and per-corner radii from the root's CSS. Stories Border
(12 tiles + buttons), Avatar (9) and Count up (`0 → 500+`, `200 → 500.14k`) follow the reference.
Additive (minor). The Logo story's rings wait for phase 1 below ("Pending integrations").
**Backlog:** Motion `component` (renders a `div`), Dialog `keepMounted`.

### Next — Motion, full version (self-written, needs an ADR)
Framer Motion's features without the dependency, still one core for React and HTML, nothing hidden
without JavaScript, reduced motion honored, timings from `--ok-*` tokens. Each phase is one review;
measure `pnpm check:size` (rough estimate: 6–10 kB gzip more in the CDN bundle for all of it).

| Phase | Scope | How |
|---|---|---|
| 0 | ADR: from CSS keyframes to a Web Animations API engine in core | supersedes the CSS-only playback; keeps the beta API |
| 1 Engine | `animate(element, keyframes, options)`, spring easing, interruption from the current value, exit before removal (React keeps the node until the exit ends; HTML `remove()` waits) | WAAPI; springs precomputed into `linear()` easing (fallback curve where unsupported); Dialog exit transitions |
| 2 Scroll | Scroll-linked progress, the reference's "Scroll progress" page | `animation-timeline: scroll()/view()` where supported, JS fallback (Firefox) |
| 3 Gestures | Drag with inertia and constraints, spring hover / tap | Pointer Events (as Slider and Sortable) |
| 4 Layout | Layout animations (FLIP), shared values (`useMotionValue`-like store, React hooks, HTML callbacks) | measure before / after, transform back; size and scroll corrections |
| Later / maybe | Shared-element transitions across routes (`layoutId`) | evaluate View Transitions first |

## ✅ Components — Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete (2026-11-08)
Wave 6 (composites), created with `/component` from the reference pages. **Timeline** (stories:
Left, Right, Alternating, Filled, Outlined, Opposite, Customized): MUI Lab parts, CSS only.
**Rating** (stories: Controlled, Read only, Disabled, Custom, Ten stars, Hover feedback, Half
ratings, Sizes): native radio group per value with an "Empty" radio; core `ratingValues` /
`nextRating`; HTML runtime `rating` (`ok:rating:change` / `active`); beyond MUI: `color` and the
reference's `xSmall` / `xxSmall` sizes. **Slider** (stories: Volume, Disabled, Temperature, Sizes,
Small steps, Custom marks, Restricted values, Range, Vertical, Colors): native range inputs as
thumbs, core `createSliderController` (pointer, keyboard, swap / `disableSwap`), positions in
CSSOM. **Transfer list** (stories: Simple, Enhanced): composed of Scrollbar, List, Checkbox and
Button; core `transferMove`; HTML runtime `transfer-list`. **Tree view** (stories: Simple, Rich,
Custom icons, Checkbox, Custom styling): `SimpleTreeView` / `TreeItem` / `RichTreeView`, core
`createTreeController` (WAI-ARIA tree keyboard, typeahead, range selection); beyond MUI X:
`variant="lines"` (the reference's custom styling). **Autocomplete** (stories: Playground,
Country): a combobox composed of TextField, Chip, IconButton and Popover; core
`createComboboxController` and `filterOptions`; HTML runtime `autocomplete` (chips from a
`<template>`). Option parsing now accepts exponents (`1e-5`). Size budgets raised: CDN bundle
31 kB, all CSS 25 kB gzip (about 30 and 24 kB now). Differences: slider mark labels use secondary
text (AA), Autocomplete chips are soft, country flags show the country code on a Label (no image
assets), focus rings on every control. No new token, no new runtime dependency.
**Backlog:** Slider `scale`, `shiftStep`; Tree view `selectionPropagation`, drag and drop, lazy
loading, `apiRef`, label editing; Autocomplete `groupBy`, `loading`, `autoSelect`,
`blurOnSelect`, `clearOnEscape`, `includeInputInList`, `selectOnFocus`, virtualization.

## ✅ Components — Tabs, Breadcrumbs & Stepper (2026-11-07)
Wave 5 (navigation), created with `/component` from the reference pages. **Tabs** (stories: Text,
Icon, Colors, Scrollable, Vertical, Custom): MUI `Tabs` / `Tab` + Lab `TabPanel`; core
`createTabsController` (WAI-ARIA keyboard with manual activation or `selectionFollowsFocus`, a
sliding indicator measured into CSSOM, scroll buttons and scroll-into-view) shared by React and the
HTML runtime `tabs` (applies the selection and the panels' `hidden`). Beyond MUI: `segmented` (the
reference's Custom section), `inherit` text / indicator colors (the reference default). **Breadcrumbs**
(stories: Text, With icon, Customized): `nav › ol`, separators in their own `aria-hidden` `li`,
`BreadcrumbsDot`; `maxItems` collapsing with core `breadcrumbsCollapse` (React state, HTML runtime
`breadcrumbs`). **Stepper** (stories: Horizontal linear, Linear alternative label, Vertical linear,
Customized, Mobile): MUI Stepper parts and MobileStepper; core `stepState`; beyond MUI: Stepper
`variant` (`dot`, `circle`: the reference's customized steppers) and MobileStepper `getStepLabel`;
HTML runtimes `stepper` (states from `data-ok-active-step`, Back / Next / Reset triggers, panels)
and `mobile-stepper`. Token added: `--ok-z-mobile-stepper` (1000). Size budgets raised: CDN bundle 24 kB, all CSS 22 kB gzip (about 23 and 21 kB now). Differences: not-reached step
icons use grey-600 (white numbers at AA), breadcrumb items are 24px tall (WCAG 2.5.8), tabs and
links get focus rings. Nothing was waiting for these components.
**Backlog:** Stepper `nonLinear` + `StepButton`, Step `expanded`, StepContent transition,
MobileStepper `LinearProgressProps`; Tabs `action` (imperative re-measure) and RTL scroll audit
(with the right-to-left backlog of Theme settings).

## ✅ Components — Backdrop (2026-11-07)
Wave 4's last overlay, created with `/component` from MUI's page (Minimals has none). A fixed `div`
over the viewport (`--ok-backdrop`, `--ok-z-modal`, white content), CSS-only display: closed it
stays in the DOM with `visibility: hidden`, so the fade-out (opacity + a `visibility` step) plays.
HTML runtime `backdrop`: triggers `data-ok-backdrop-open` / `-close` (also on the backdrop itself:
a click anywhere closes it), `ok:backdrop:*` events, `open()` / `close()`. React renders from
`open`; `onClick` is the consumer's. No core controller, no new token. Closes the "Backdrop"
pending integration without a DOM change: Dialog and Drawer keep the native `::backdrop` (top
layer), painted with the same token. Accepted deviation: white on the light backdrop over a white
page is 2.97:1 (docs: text goes on a paper). Deferred: `transitionDuration` (1.0 API audit).

## ✅ Components — List (2026-11-07)
Created with `/component` from the reference "List" page (stories: Simple, Nested, Folder,
Selected, Controls, Switch). `ul[data-ok-list]` with items, row buttons (`button` / `a`), icon,
avatar, two-line text, subheader, end action and nested lists; CSS only, plus the HTML runtime
`list` that opens / closes nested lists (`aria-expanded` + `aria-controls`, `ok:list:toggle`).
Beyond upstream: `ListItemExpandIcon` (the chevron turns with `aria-expanded`). Controls are
labelled by the row text instead of sitting in a row button (a control in a button is invalid).
Integrated in the same review: the Drawer stories' mailbox menu and Divider "Variants" (rows in a
List, dividers in their own `li`). CSS budget raised to 20 kB. No new tokens.

## ✅ Components — Paper (2026-11-09)
Wave 8 (primitives), created with `/component` from MUI's Paper page (Minimals has none; its theme
customizes MUI's Paper), every section as a story: Basic, Elevation (light and dark pages side by
side), Variants, Corners. CSS only, any element: `data-ok-paper`, `variant` (elevation /
outlined), `elevation` 0–24 (`--ok-elevation-<n>`, default 1), `square`; React `component`.
Minimals' look: no dark-mode lightening gradient, outline grey 500 at 16%. `paper.css` is imported
first among the components so surfaces built on it override it by source order (the Card
contract in `specs/components/paper.md`). No new tokens. Closes no "Pending integrations" row on
its own: the "Typography + Paper (card)" rows wait for Card. The library's own surfaces compose
it since 2026-11-12 (ADR-0066, owner decision; an anatomy change, breaking but a minor changeset before 0.1.0): every
popover root (Popover, Menu, Select, Autocomplete, pickers, Walktour steps, Editor overlays),
the Dialog paper, the Drawer content and the Map controls and popup contents carry
`data-ok-paper` on their own element and keep their look (no visual change); Popover, Menu and
Dialog take MUI's `elevation`; `TableContainer component={Paper}` (React) puts a table on a
paper, shown on the Table docs page (the stories follow the reference, without a surface).
Still candidates (backlog in the ADR): Paper `variant` / `square` on overlays, Autocomplete
`slotProps.paper`, Snackbar content, Alert and Accordion.

## ✅ Components — Divider (2026-11-07)
From MUI's Divider page (Minimals has none; its Drawer uses MUI's Divider): `hr` or, with text,
`div role="separator"`; `variant` (fullWidth / inset / middle), `orientation`, `flexItem`,
`textAlign`, `absolute`. CSS only. Integrated: the Drawer stories' mailbox menu uses Divider
instead of a demo `<hr>`. "Variants" shows List rows since List exists.

## ✅ Components — Avatar, Badge, Chip & Label (2026-11-07)
Avatar (image with a letter / icon fallback, `variant`, `color`, `size` in px or a length) and
AvatarGroup (`max`, `total`, `renderSurplus`, `spacing`); Badge (standard, dot and the reference's
presence statuses, `overlap`, `anchorOrigin`, `max`, `showZero`, `invisible`); Chip (filled /
outlined / soft, every color incl. black / white, avatar or icon, clickable button, separate named
delete button, Backspace / Delete); Label (soft / filled / outlined / inverted, icons). HTML
runtimes: `avatar` (size, image fallback) and `chip` (`ok:chip:delete`). Storybook gets
`staticDirs` for original demo portraits. Differences: grey avatars use grey-700 letters (AA),
chips and the chip delete button get visible focus and 24px targets, `deleteLabel` names it.
**Backlog:** AvatarGroup numeric `spacing`.

## ✅ Components — Text field & Radio (2026-11-07)
TextField (outlined / filled / standard, medium / small, `color` (focus), floating label with a notched outline,
error, helper text, `InputAdornment`, `required`, `margin`, `shrink`, native `select`, multiline
with `rows` or growing `minRows` / `maxRows`), API from MUI; `ref` and input props go to the input.
Radio and RadioGroup (colors incl. `default`, sizes, `row`; native radios, CSS only). HTML runtime
`text-field`: growing-row custom properties and a `data-ok-text-field-reveal` password button.
Differences: resting label `text-secondary` and disabled helper text `text-secondary` (AA), error
text in the AA error tone, a focus ring on filled fields. CSS budget raised to 16 kB gzip.
**Backlog:** ~~non-native `select`~~ ✅ (Select, 2026-11-09: `selectProps={{ native: false }}`). FormLabel / FormHelperText / FormControl
exist since 2026-11-09 (Form control); TextField keeps its own label and helper parts.

## ✅ Components — Checkbox & Switch (2026-11-07)
Checkbox (colors incl. `default`, `medium` / `small`, `indeterminate`, custom icons) and Switch
(colors, sizes, `edge`), both native checkboxes (`role="switch"`), API from MUI; `ref` and input
props go to the `<input>`. FormControlLabel (`labelPlacement` end / start / top / bottom,
`required`, props passed to the control). HTML runtime `checkbox`: mixed state in step, and
parents with `aria-controls` (WAI-ARIA mixed checkbox); Switch is CSS only. Visible focus rings
(the reference has none). Integrated: Table selection uses small Checkboxes (select-all shows
mixed), the "Sorting & selecting" story has the reference's "Dense" Switch
(`data-ok-table-dense="<table id>"` in HTML). No new tokens.
**Backlog:** Switch `icon` / `checkedIcon` (thumb content). FormGroup, FormControl, FormLabel,
FormHelperText: done (Form control, 2026-11-09).

## ✅ Components — Progress (2026-11-07)
CircularProgress (indeterminate / determinate, 7 colors incl. `inherit`, `size` in px or a
`px` / `rem` / `em` length, `thickness`, `disableShrink`, `enableTrackSlot`) and LinearProgress
(indeterminate / determinate / buffer / query, `valueBuffer`), API from MUI. CSS for the look;
the HTML runtime turns values, size and thickness into private custom properties through CSSOM
(strict CSP). New `number` option kind in the schemas (Controls, docs tables, spec tables).
Button / IconButton loaders are now a CircularProgress (`data-ok-button-spinner` kept; an empty
spinner span still renders). No new tokens.
**Backlog:** right-to-left linear progress. The value label is a story ("With label": a
LinearProgress beside a Typography), like MUI's demo, not a part.

## ✅ Theme settings (ADR-0017, 2026-11-05)
From the reference's Settings drawer: primary color presets (default, cyan, purple, blue, orange,
red) via `data-ok-preset`, font families (Public Sans, Inter, DM Sans, Nunito Sans) via
`data-ok-font`, root font size 12–20px; scopes nest with `data-ok-theme`. Helper
`applyThemeSettings` in core (validates; stores only with an app-provided storage). Storybook
toolbar: Preset, Font, Size; Foundations › Settings. Backlog: contrast setting, right-to-left
(logical-property audit), a SettingsDrawer component (needs Switch and Slider).

## Data grid (ADR-0020, ADR-0021) — every MUI X tier, in six phases
The owner asked for every MUI X Data Grid feature, Community, Pro and Premium alike (2026-11-08).
One grid engine in core, ARIA grid on `div`s with CSS grid columns, HTML data in the markup.
Phase 1 (stories: Basic, Custom): DataGrid with typed columns (width / flex / min width, value
getters and formatters, custom cells), sorting (Shift: multi), quick filter, a one-item filter panel,
TablePagination footer, checkbox selection, columns panel, density menu, CSV export (formula-safe),
column menu and ARIA grid keyboard navigation; HTML runtime `data-grid` (rows moved / hidden).
Reuses TextField, Button, IconButton, Menu, Popover, Switch, FormControlLabel, Checkbox and
TablePagination; no new token, no dependency. Size budgets raised: CDN bundle 40 kB, all CSS 28 kB
gzip (about 38 and 27 kB now). Differences: labeled toolbar buttons in both sections (the
reference's Basic toolbar is icon-only), original data and names, clicking a row toggles it.

| Phase | Scope (MUI X tier) | State |
|---|---|---|
| 1 | Columns (types, width / flex / min width, alignment, formatters, custom cells), sorting with multi-sort (Pro), quick filter, filter panel (one filter), pagination, checkbox selection, column visibility, density, CSV export, column menu, keyboard navigation, toolbar | ✅ 2026-11-08 |
| 2 | Multi filters and logic operators (Pro), column resizing and reordering (Pro), column pinning (Pro), cell and row editing, print export | ✅ 2026-11-08 |
| 3 | Row virtualization; server-side sorting, filtering and pagination (`sortingMode` / `filterMode` / `paginationMode="server"`, `rowCount`); infinite loading, `dataSource` with cache (Pro); `loading` overlay and skeleton rows; HTML: a JavaScript rows API with row templates | ✅ 2026-11-08 |
| 4 | Community and API completeness. **Selection:** single-row selection (`disableMultipleRowSelection`), `isRowSelectable`, `keepNonExistentRowsSelected`, `checkboxSelectionVisibleOnly`. **Columns:** autosizing (`autosizeColumns`, double-click the resize edge), `colSpan` and `rowSpanning`, header `description` tooltips, `renderHeader`. **Rows:** `getRowHeight` and `"auto"` heights, `getRowClassName` / `getCellClassName`, `getRowSpacing`. **Editing:** validation with error states (`preProcessEditCellProps`), `valueParser` / `valueSetter`, start editing by typing, `onCellEditStart` / `onCellEditStop` / `onRowEditStop`, `isCellEditable`. **Filtering:** `isAnyOf`, custom operators, quick filter options (`quickFilterLogicOperator`, searched columns). **Events and API:** `onRowClick`, `onCellClick`, `onCellDoubleClick`, `onColumnHeaderClick`…, `apiRef`, `exportState` / `restoreState`. **Export:** CSV options (delimiter, fields, all rows or filtered), print options, printing every filtered row. **Look and language:** the reference's icon-only toolbar, locale packs, right-to-left layout. **HTML:** value formatters for edited and `setRows` cells | ✅ 2026-11-08 |
| 5 | Tree data (data source loading per level), master-detail panels, row reordering by drag, row pinning (top / bottom), column groups (multi-level headers), list view; column virtualization (`columnBufferPx`), lazy loading of row chunks (`lazyLoading`, `rowsLoadingMode`), `dataSource.updateRow`, cache time to live, `rowBufferPx` as an option (Pro); from phase 4: `isAnyOf` values as chips (Autocomplete) instead of comma-separated text, HTML attributes for CSV and print options | ✅ 2026-11-08 |
| 6 | Row grouping (also through the data source), aggregation (sum, average, min / max, count), pivoting, Excel (.xlsx) export, clipboard copy and paste, cell range selection, header filters (Premium); charts integration and AI assistant once a Chart component exists; from phase 5: generated parent rows for tree paths with missing parents | ✅ 2026-11-08 (AI assistant deferred, see below) |

Phase 2 (story: Advanced): filter rows combined with and / or, column resizing (drag the header
edge, or Alt + arrows), reordering (drag a header, or Move left / right in the column menu),
pinning to either side (sticky cells, offsets measured by core `syncGridPinning`), cell and row
editing with typed fields (`processRowUpdate`; HTML `ok:data-grid:edit`), print through a hidden
frame. Beyond MUI X for keyboard users: Alt + arrows and the Move menu items. TablePagination,
Popover and Menu are reused as in phase 1.

Phase 3 (stories: Large dataset, Server side): rows outside the visible area ± 150px leave the DOM
once a bounded grid is measured (core `gridRowWindow`, `createGridScrollWatcher`; body padding
stands for them; first render and SSR show every row), server modes with `rowCount`, `loading`
with three overlay variants (LinearProgress, CircularProgress, skeleton rows), `onRowsScrollEnd`
(HTML `ok:data-grid:scrollend`), `dataSource` with a per-source cache (HTML `setDataSource`), and
HTML `setRows(rows)` from `<template data-ok-data-grid-row>` / `data-ok-data-grid-cell` (text only).
Column virtualization and lazy loading of row chunks moved to phase 5.

Phase 4 (stories: Layout, Validation; Basic now uses the icon toolbar): single-row selection,
unselectable rows, select all on the page, kept or pruned selections; column autosizing (double
click, on mount, `autosizeColumns`); `colSpan` and `rowSpanning`; header descriptions (Tooltip) and
`renderHeader`; row heights (`rowHeight`, `getRowHeight` with `"auto"`, per-row offsets in the
window), row spacing, row and cell classes; click, double click, key and header events; `apiRef`
(`useGridApiRef`) with the HTML instance's methods plus `exportState` / `restoreState` (sanitized
input), `scrollToIndexes`; edit validation (`preProcessEditCellProps`, HTML `ok:data-grid:validate`),
`valueParser` / `valueSetter`, typing to edit, edit start / stop events, `isCellEditable`;
`isAnyOf`, custom filter operators, quick filter options, `ignoreDiacritics`; CSV and print options
(print: every filtered row); the icon toolbar (`toolbarVariant`, beyond MUI X), locale packs
(`enUS`, `viVN`, `frFR`, `deDE`, `esES`, `jaJP`, `zhCN`), right-to-left layout; HTML value formats
(`data-ok-format`, `setValueFormatter`). Differences from the plan: `isAnyOf` values are typed
separated by commas in both versions (chips in phase 5); CSV and print options are method options
in HTML (attributes in phase 5).

Phase 5 (stories: Tree data, Master detail, Row ordering and pinning, Column groups, List view,
Lazy loading): tree data (paths or a server data source), detail panels, row reordering (drag or
Alt + arrows, announced), pinned rows, column groups, list view, column virtualization,
row / column buffers, lazy loading in chunks, `dataSource.updateRow`, cache time to live,
`isAnyOf` chips (Autocomplete), HTML CSV and print options as attributes. Every tree path needs a
row for its parent (generated parents move to phase 6).

Phase 6 (stories: Row grouping, Pivoting, Cell selection and clipboard, Charts integration; Tree
data's missing parents in Row grouping): row grouping (column menu, nested groups, counts, sorting
by key or aggregated value; through a data source with `groupFields` / `groupKeys`), aggregation
(`sum`, `avg`, `min`, `max`, `size`; inline group values and a footer row; header labels),
pivoting (rows, columns and values with functions; a panel with selects; column groups for the
keys), Excel export written in core (a stored ZIP and SpreadsheetML: typed numbers, booleans and
dates, no formulas; no dependency, so no ADR), clipboard copy and paste as tab-separated text
(through the browser's own copy / paste on a short-lived text area: no permissions), cell range
selection (press, drag, Shift, Ctrl / Cmd, Shift + arrows, Ctrl + A), header filters (a row of
fields; dates with the DatePicker), charts integration (the Chart component of ADR-0024: column,
bar, line and area from the top-level groups or the page's rows) and generated parent rows for tree
paths. Closes the Pending integration "Date pickers → Data grid filter values for `date` columns"
(filter panel and header filters use the DatePicker). The HTML runtime builds group rows, the
footer and the pivot from the rows in the markup. CDN budget raised to 95 kB (phase 6 adds about
12 kB). Differences from MUI X: one grouping column (`rowGroupingColumnMode="multiple"` deferred),
group keys are cell texts (`groupingValueGetter` deferred), no group footers, the pivot panel uses
selects instead of drag and drop and has no derived date columns, header filters use the column
type's first operator (no operator menu), the chart sits inside the grid with one `chartModel`.
Deferred, with the reason: the **AI assistant** (MUI X `aiAssistant`) turns prompts into grid
states through a language model service. Owlky has no backend and adds no paid service, and a
prompt panel without a model behind it would be a stand-in: it waits for an owner-approved service
(new ADR). Server-side aggregation (`dataSource.getAggregatedValue`) waits for a data source that
reports aggregates. Integration 2026-11-08 (`/integrate date-picker`): `dateTime` columns filter
with the DateTimePicker in the filter panel and the header filters (closes the Pending integration
"DateTimePicker → Data grid filter values for `dateTime` columns"; the Cells story gained a
`dateTime` column). Editing cells keeps native `date` / `datetime-local` inputs, as MUI X does.
Integration 2026-11-08 (`/integrate chart`, Chart complete): the charts integration offers every
MUI X chart type the Chart draws (`column`, `bar`, `line`, `area`, `pie`, and `donut` for a pie
with a hole) plus `radar` and `scatter` (beyond MUI X), and MUI X's configuration as far as the
Chart supports it (`stacked`, `itemLabel`, `legend`, `colors`, `height`, `curve`, `showMark`,
`seriesAxisLabel`, `showToolbar`, `animations`, pie angles, `donutSize`; core `gridChartOptions`).
Pivoted grids chart their pivot columns (one series per key), groups aggregate only the rows that
pass the filters, and the HTML grid drives the chart through `updateSeries` instead of writing its
table. The panel gained Stacked, Show values and Legend fields. The Charts integration story gained
"Pivot chart" and "Donut chart". Deferred: several dimensions (a grouped axis) and several charts
per grid.

The former backlog is folded into phases 4–6 (ADR-0021, 2026-11-08). New MUI X features go into a
phase, or into "Pending integrations" below when they need a missing component.

## Date pickers (ADR-0022) — every MUI X tier, in four phases
The owner asked for every MUI X Date and Time Pickers feature, Community and Pro alike
(2026-11-08). One picker engine in core (`core/src/pickers/`: dates in local time, ISO 8601,
Day.js-style formats split into sections, locale data from `Intl`, validation, the month grid,
`createFieldController`, `createCalendarController`); no date library. Phase 1 (stories: Date —
the reference section — plus Calendars, Validation, Shortcuts and Localization): DateField
(sectioned spinbutton field on a TextField, hidden ISO input), DateCalendar (day / month / year
views, week numbers, fixed weeks, outside days, loading), MonthCalendar, YearCalendar, DatePicker
(responsive: Popover on `(pointer: fine)`, Dialog otherwise), DesktopDatePicker, MobileDatePicker,
StaticDatePicker (toolbar, landscape layout, action bar, shortcuts), LocalizationProvider (English
and Vietnamese texts; `data-ok-locale` in HTML). HTML runtimes: `date-field`, `date-calendar`,
`month-calendar`, `year-calendar`, `date-picker`. Reuses TextField, IconButton, Button, Chip,
Popover and Dialog; no new token, no dependency. Size: about 13 kB of the CDN bundle and
2.5 kB of the CSS (gzip; budgets raised by that much). Beyond MUI X: weekday headers use the locale's narrow names
(Vietnamese "CN", "T2"… instead of "C", "T"), today has `aria-current="date"`.
Phase 2 (ADR-0026; stories: Time and Date & Time — the reference sections — plus Clocks and Time
validation): TimeField and DateTimeField (the DateField anatomy with `data-ok-value-type`),
TimeClock (an analog listbox clock: press, drag, keys), DigitalClock and MultiSectionDigitalClock
(listboxes with roving focus), the TimePicker and DateTimePicker families (digital clocks in the
desktop popover, toolbar + analog clock in the dialog and inline, date / time **Tabs** for date
times); time validation (`minTime`, `maxTime`, `minDateTime`, `maxDateTime`, `minutesStep`,
`shouldDisableTime`), `timeSteps`, `skipDisabled`, 12 / 24 hours from the locale. Core `time.ts`,
`createTimeClockController`, `createDigitalClockController`; HTML runtimes `time-clock`,
`digital-clock`, `multi-section-digital-clock` (the `date-field` and `date-picker` runtimes serve
every value type). Reuses Tabs as well; no new token, no dependency.
Phase 3 (ADR-0028; stories: Range — the reference section — plus Range fields, Range calendars,
Time ranges and Range shortcuts): DateRangeCalendar (one to three months, hover preview, drag
editing of the ends with a mouse or a finger, auto month switching), the DateRangePicker family
(two months in the desktop popover, toolbar and one month in the dialog and inline),
TimeRangePicker and DateTimeRangePicker (Start / End tabs, digital clocks on desktop, the analog
clock on touch screens), single and multi input range fields of each value type, range shortcuts
for dashboard filters and `invalidRange` validation. Core `range.ts`,
`createRangeDragController`; HTML runtimes `date-range-calendar`, `multi-input-range-field`,
`date-range-picker` (single input fields are `date-field` with `data-ok-range`); values are ISO
8601 intervals (`2025-05-20/2025-05-25`). No new token, no dependency; about 6.6 kB of the CDN
bundle and 1 kB of the CSS (gzip).
Phase 4 (ADR-0030; stories: Time zones, Date libraries, Calendar systems, Right to left and
Customization, plus locale packs in Localization): `timezone` on every picker, field, calendar and
clock (`"default" | "system" | "UTC" |` IANA; HTML `data-ok-timezone`, ISO input with offsets);
`LocalizationProvider dateAdapter` with the opt-in adapters `@owlky/core/adapters/dayjs`,
`/date-fns`, `/luxon`, `/moment` (they receive the app's library: optional peers, no runtime
dependency) and generic dates (`PickerValidDate`); HTML `date` / `setDate` / `setDateAdapter` on
every instance; calendar systems through `Intl` (`calendar` / `data-ok-calendar`, the locale's
`-u-ca-`: Persian, Hijri (Umm al-Qura, civil, tabular), Buddhist, Indian); locale packs
(`pickersFrFR`, `DeDE`, `EsES`, `JaJP`, `ZhCN`, `FaIR`, `ArSD`); right-to-left keys and arrows;
`slots` (`layout`, `toolbar`, `actionBar`, `shortcuts`, `day`, icons), `slotProps`
(`toolbar.hidden`, `tabs.hidden`, `day`), `usePickerContext`, `viewRenderers`
(`renderTimeViewClock`…, `null` for field-only pickers); HTML `setDayRenderer`. About 2.6 kB of
the CDN bundle (gzip); no new token. The date pickers are complete.

| Phase | Scope (MUI X tier) | State |
|---|---|---|
| 1 | Engine, LocalizationProvider; DateField, DateCalendar, MonthCalendar, YearCalendar, DatePicker (responsive, desktop, mobile, static); validation, toolbar, actions, shortcuts, week numbers, fixed weeks, outside days, loading, landscape, clearable fields (Community) | ✅ 2026-11-08 |
| 2 | TimeField, TimeClock, DigitalClock, MultiSectionDigitalClock, TimePicker, DateTimeField, DateTimePicker (each responsive, desktop, mobile, static; tabs); time validation and steps (Community); reference sections Time, Date & Time | ✅ 2026-11-08 (ADR-0026) |
| 3 | DateRangeCalendar, DateRangePicker, single- and multi-input range fields, TimeRangePicker, DateTimeRangePicker, range shortcuts, drag editing (Pro); reference section Range | ✅ 2026-11-08 (ADR-0028) |
| 4 | Time zones, `dateAdapter` (generic date types) and adapters for Day.js / date-fns / Luxon / Moment, other calendar systems, locale packs, right-to-left, view renderers and layout customization | ✅ 2026-11-08 (ADR-0030) |

## Pending integrations
Everything waiting for a component that doesn't exist yet — stand-ins (native feature, demo
markup, a small built-in part) **and** stories or features deferred until then. This table is the
only list of such waits: never record one only in a backlog. When that component is built,
integrate these in the same review (additive: no DOM or API change) and remove the rows.

| Waiting for | Where | Today |
|---|---|---|
| Owner decision (ADR: anatomy and keyboard change): Select, Checkbox and InputBase as the Data grid's cell editors (MUI X `GridEditSingleSelectCell`, `GridEditBooleanCell`, `GridEditInputCell`) | Data grid editing, React and the HTML runtime | native `select`, `input[type=checkbox]` and `input` marked `data-ok-data-grid-edit-input`, styled by `data-grid.css` (`accent-color` for the checkbox) |

**Sweep of 2026-11-12** (`/integrate` with no argument, roadmap-components 6.1): the table was
empty; the discovery found waits that had never been recorded. Closed, by composition in stories,
examples and snippets (story CSS keeps layout only): Divider "Orientation" and "Flex item" rows on
an outlined Paper; the Walktour step 4 settings on an outlined Paper; the Illustrations profile
cover as a Card; the Map "Side by side" layout switch on a Paper; the Motion guide's shared-value
example driven by a Slider and its viewport-root example scrolling in a Scrollbar; Foundations ›
Grid items as Papers, Settings preset and font tiles as Cards, the Icons credit as a Link. The
sweep left four rows open. Owner decision 2026-11-12: build the Image ratios, Paper in the overlay
roots and the Data grid editors (rows above; the Image ratios and Paper rows closed 2026-11-12,
ADR-0066); the toast swipe stays on `createToastSwipe` (its
Sonner-style damped pull on a refused direction and average-speed dismissal would change on
`createSwipe`), so that row is closed with this reason. Reviewed and left as they are
(the reference composes no component there): the Walktour steps' pictures (plain `img` in the
reference) and the Motion stories' pictures (the animation targets the `img`), the Menu "Selected" list (a List with a paper background in MUI's demo), tinted
demo stages without a paper background or a shadow (Slider range, Autocomplete output, Carousel
panel, Scrollbar layout, Tabs panels), Foundations › Shadows tiles (the token on a plain box is
the point), scroll areas inside components (listboxes, dialog content, grids: MUI and the
reference use no Scrollbar there), `title` on calendar and pagination buttons (as upstream).

## ✅ Components — Form control (2026-11-09)
Wave 8 (primitives, batch B), created with `/component` from MUI's FormControl, FormLabel,
FormGroup and FormHelperText API pages and their demos (Radio "Radio group" / "Show error",
Checkbox "FormGroup", Switch "Switches with FormGroup"); stories Radio group, Checkbox group,
Switch group, Show error, States (disabled, required, focused), Standalone control. CSS only:
the shared states (`disabled`, `error`, `required`, `focused`) and `color`, `size`, `variant`,
`margin`, `fullWidth` are attributes on `[data-ok-form-control]` that the parts' CSS reads (style
options written only when given); React shares them through a context (`useFormControl()`). A
`fieldset` root with a `legend` FormLabel names groups natively, and `disabled` there is also the
native attribute (it turns off every control). Minimals' label look (body2, secondary text);
helper text like TextField's (caption, 6px above, AA error tone). No DOM or API change to
TextField, Radio, Checkbox, Switch or FormControlLabel: their ARIA (`aria-describedby`,
`aria-invalid`, `aria-required`) is written by the author, as in MUI. No new token.
Integrated: the Radio "Colors" story's group label is a `fieldset` FormControl with a `legend`
FormLabel (the story-only label and its demo CSS are gone).
Differences: MUI's selection controls take `disabled` from the FormControl context; here a
`fieldset` root disables them natively (a `div` root needs `disabled` on each control). A part's
own state props add a state; they can't turn off the FormControl's. `hiddenLabel` waits for
Select's filled input. The contract for Select (InputLabel on FormLabel, `useFormControl()`,
focus through CSS) is in `specs/components/form-control.md`.

## ✅ Components — Link (2026-11-09)
Wave 8 (primitives, batch B), created with `/component` from MUI's "Links" page (Minimals has
none), every section with a demo as a story: Basic links, Underline, Accessibility (links in
text, a button link, a new-tab link); beyond them, from MUI's API: Colors. "Third-party routing
library" has no demo: the docs page shows `component` with a router link. CSS only, built on
Typography: one element with `data-ok-typography` + `data-ok-link`, Typography's options spread
into `linkOptions` with MUI's defaults (`variant` `inherit`, `color` `primary`, plus `inherit`),
and `underline` (`always` default, `hover`, `none`). The `always` underline is the palette's main
tone at 40 % (`--ok-c-channel`), the text color on hover, like MUI. React: `a` with `href`,
`<button type="button">` without `href` and `component` (keyboard-accessible actions), any
element or router link through `component` (typed with the component's props); `href` passes
through untouched, `target="_blank"` always gets `rel="noopener noreferrer"` (core `linkRel`).
`link.css` loads right after `typography.css`. No new token.
Integrated in the same review (stories, examples, snippets and the docs page compose it, no DOM
or API change of Breadcrumbs): Breadcrumbs items are Links (`color="inherit"`,
`underline="hover"`, as in MUI's demos); the Customized heading's back link (`underline="none"`)
and the paragraph's links (default Link, underlined) replace the story-only link colors. The
Typography contrast exemption no longer covers `inherit` colors.
Differences: MUI renders an `a` without `href` (not focusable) where Owlky renders a button;
underlines of text tones are in the text color (no channel tokens for them); `sx`, `classes`,
`TypographyClasses` and theme default props are consumer CSS.

## ✅ Components — Select (2026-11-09)
Wave 8 (primitives, batch C), created with `/component` from MUI's "Select" page (Minimals has
none; the look is the Text field's, the menu is Menu's), every section with a demo as a story:
Basic select, Variants, Labels and helper text, Auto width, Small size, Other props, Native
select, Multiple, Selection indicators, Chip, Placeholder, Multiple native, Controlling the open
state, With a dialog, Grouping. ADR-0045: the select-only combobox with MUI's roving focus
(`div[role=combobox]` → a Popover `ul[role=listbox]` of MenuItems; APG's closed-trigger Home /
End / typeahead added), behavior in core `createSelectController` (reports intent), value in a
hidden input (forms, and `:placeholder-shown` floats the InputLabel in CSS). Select reads the
FormControl's variant, size, color and states (`useFormControl()`) and writes them on its field
box; `InputLabel` = FormLabel + `data-ok-input-label` (`shrink`, `disableAnimation`); FormControl
gains `hiddenLabel`. `native` keeps the browser's `<select>` in the same box. HTML runtime
`select` (chips and placeholder templates, checkmark checkboxes, `data-ok-select-open`). No new
token; budgets raised (CDN bundle 165 kB, CSS 52 kB).
Integrated in the same review (additive, no DOM or API change of the defaults): TextField
`selectProps={{ native: false }}` composes the Select in its control (story "Select" groups 1
and 3 are now the listbox Select and a FormControl + InputLabel + Select, as on the reference);
TablePagination `selectProps={{ native: false }}` composes a bare listbox Select for rows per page
(the native select stays the default: the data grid and the Table stories keep it; the Pagination
story "Table" uses the listbox); new stories Pagination "Items" (cards, Pagination, items-per-page
Select) and Table "Table pagination with API" (search TextField, category Select, Search button,
TablePagination with the listbox; HTML page scripts).
Differences: TextField's `select` and TablePagination stay native by default (MUI: listbox);
`onChange(value)` / `onOpenChange(open, reason)` instead of MUI's event callbacks; `renderValue` is
React-only (HTML: chips, placeholder, joined texts); the menu opens under the field
(`bottom-start`), not over it; chips in the demos are `small`.

## ✅ Components — Card (2026-11-09)
Wave 8 (primitives), created with `/component` from MUI's "Card" page (Minimals has none; its theme
customizes MUI's Card), every section as a story: Basics, Outlined card, Complex interaction,
Media, Primary action, UI controls, Active state styles. CSS only, built on Paper: one element
with `data-ok-paper` + `data-ok-card` and Paper's options (spread into `cardOptions`) plus
`raised`; parts `CardHeader` (Avatar / action slots, title and subheader composed as Typography
`h6` / `body2`), `CardContent`, `CardMedia` (media elements get `src`, other elements a decorative
cover `img` — MUI's background image without a `style` attribute; composes Image with
`component={Image}`), `CardActions` (`disableSpacing`), `CardActionArea` (button, or link with
`href`). Minimals' look: `--ok-radius-xl`, `--ok-shadow-card` at the default level (other levels
keep Paper's `--ok-elevation-<n>`, `raised` = `--ok-elevation-8`), header 24/24/0, content 24,
subheader 4px below. `card.css` loads right after `paper.css` / `typography.css`. No new token. CSS
budget raised to 50 kB.
Integrated in the same review (stories, examples and snippets compose them; the demo CSS is gone
or reduced to layout): Motion (stages are flat Papers, the moving items Cards, headings and
count-up numbers Typography), Timeline "Customized" (flat Paper + Typography), Organization chart
(standard and member nodes are Cards, team nodes flat Papers, names and roles Typography),
Walktour (the dashboard cards are `section` Cards, titles, notes, figures and step texts
Typography). New wait: "Collapse (transition)" for the Card's Complex interaction.
Differences: MUI's `titleTypographyProps` / `slotProps.title|subheader` → `titleProps` /
`subheaderProps`; the "Active state styles" story marks the choice with `aria-pressed` (MUI's demo
uses `data-active`); the pictures are the stories' own artwork.

## ✅ Components — Typography (2026-11-09)
Created with `/component` from MUI's "Typography" page (Minimals has none; its type scale is
Foundations › Typography), every section with a demo as a story: Usage, Theme keys, Changing the
semantic element; beyond them, from MUI's API: Colors, Alignment and wrapping. CSS only:
`[data-ok-typography]` on any element, `variant` (the 13 steps of the type scale + `inherit`,
default `body1`), `color` (palette `main` tones, `textPrimary|Secondary|Disabled`), `align`,
`gutterBottom`, `noWrap`; React `component` and `variantMapping` (MUI's default mapping, shared
by core `typographyElement`). Every value comes from the `--ok-typography-*` tokens (responsive
headings, font presets). `typography.css` loads first in `owlky.css`, so components that compose
it restyle it. No new token, no dependency.
Integrated in the same review (stories, examples and snippets compose it; the demo CSS is gone):
Sortable card numbers (h2), Accordion summaries (subtitle1; the Controlled story gains the
reference's secondary line, body2), Scrollbar "Layout" heading, Breadcrumbs "Customized" heading
and paragraph, Stepper panels and mobile cards, Popover texts, Dialog "Selected:" line and the
full-screen title (`component={DialogTitle}`), Autocomplete outputs, Map popups, readouts and
captions, Image captions (overline, like the reference). New Linear progress story "With label".
Left: the "Typography + Paper (card)" rows (a Card / Paper component closes them) and "Link
(Typography)" (a Link component).
Differences: MUI's arbitrary color strings (`"text.secondary"`, `"primary.dark"`), theme-level
custom variants and `sx` are consumer CSS; `paragraph` (deprecated upstream) is not kept.

## ✅ Components — Collapse (ADR-0044, 2026-11-09)
Wave 8 (primitives), created with `/component` from MUI's Transitions page (section Collapse; Fade,
Grow, Slide and Zoom are Motion variants). One element (`data-ok-collapse`, React `component`):
`hidden` is the state, core `createCollapseController` watches it and animates the height or
width with the Web Animations API (keeps an author-hidden element rendered while it exits),
timing from `--ok-duration-standard` / `--ok-easing-standard`, `timeout` (ms, `auto`,
enter / exit), `easing`, `collapsedSize` (private properties), reduced motion honored. HTML
runtime `collapse`: triggers `data-ok-collapse-toggle` (checkbox or button), `ok:collapse:*`
events, `show()` / `hide()` / `toggle()`. Story: Collapse (the reference's four cards).
Closes the pending integrations "Collapse (transition)": List nested lists (`Collapse
component={List}`, `data-ok-collapse` on the `ul`), Tree view groups (TreeItem renders its group
as a Collapse), Stepper `StepContent` (a Collapse with `timeout="auto"`, `hidden` off the active
step, written by the stepper runtime too). Additive: new attributes on those elements, no
structural change. Differences: no `appear`, `addEndListener`, wrapper slots (one element).

## ✅ Components — Image (ADR-0038, 2026-11-09)
Created with `/component` from the reference "Image" page (Minimals' own Image, on
react-lazy-load-image-component), every section as a story: List, Aspect ratio, Overlay; beyond
them: Fit and position, Loading and errors. HTML written by us (owner's choice), native first: a
`span` root with a placeholder, an optional overlay and a plain `img` (`loading="lazy"`,
`decoding="async"`, `srcset` / `sizes`); `ratio` (11 ratios), `fit`, `position`, `effect`
(`blur`, `opacity`, `black-and-white`, `none`), `overlay` / `overlayFrom` (dark or palette
gradients), `disablePlaceholder`, `visibleByDefault`, `placeholderSrc`, `onLoad` / `onError`. The
load state is `data-ok-state` (React from the image's events, the HTML runtime `image`, both
through core `imageLoadState` for pictures that settled first); a broken picture keeps its `alt`
and shows an icon; `@media (scripting: none)` and reduced motion honored. Original SVG pictures in
`apps/storybook/public/images/`. No new token, no dependency. CSS budget raised to 45 kB (Image
about 0.95 kB gzip).
Integrated in the same review: Markdown `images="image"` + `imageRatio` (the reference renders its
pictures through Image, 16/9): React maps `img` to `Image`, the HTML runtime builds the Image
markup; both Markdown stories use it. Additive (minor).
Differences: Image is fluid (its container's width) instead of the reference's fixed grid cells;
the error state and `fit` / `position` are beyond the reference; the reference's alt texts are the
ratios, ours describe the pictures.
**Backlog:** ~~arbitrary ratios~~ ✅ (2026-11-12: any `width/height` or number, written as
`--_ok-image-ratio` by React `style` and the HTML runtime; the Carousel stories, docs page and
snippets compose Image for their slide pictures, closing that Pending integration), overlay
gradients (consumer CSS today), a `threshold` for when lazy loading starts (the browser decides).

## ✅ Components — Upload (ADR-0037, 2026-11-09)
Created with `/component` from the reference "Upload" page, every section as a story: Upload
single file, Upload multi file (Controls `layout` and `thumbnail` are the reference's "Horizontal
layout" and "Show image" switches), Upload avatar, Upload box; beyond them: Validation, Error and
disabled, Open the file dialog. Built on react-dropzone's API (every option, the drag states,
`open` / `removeFile` / `clearFiles`), HTML written by us (the upstream is React only): a native
file input covers the zone (works without JavaScript), one core controller
(`createUploadController`) handles drops, folders, paste, the File System Access picker, the
dialog's `cancel` event and the checks; the files are mirrored into `input.files` for forms. React:
`Upload`, `UploadAvatar`, `UploadBox`; HTML runtime `upload` (list rows from a `<template>`).
Composes IconButton and Button. No new token, no dependency.
Differences: an original illustration and icons; the description and helper texts use
`text-secondary` and "browse" the primary AA text tone (the reference uses grey 500 and primary
main); `multiple` defaults to `false` (Minimals' Upload, react-dropzone defaults to `true`);
`maxFiles` counts the files held; the drag verdict also colors the zone (primary border on accept,
error colors on reject); hover and drags strengthen the border instead of dimming the zone (the
description stays AA); remove buttons are 24px or more.
**Backlog:** a `useUpload` hook with `getRootProps` / `getInputProps` (react-dropzone's hook form);
upload progress per file (LinearProgress) once an upload API is in scope.

## ✅ Components — Walktour (ADR-0039, 2026-11-09)
Created with `/component` from the reference "Walktour" page, built on react-joyride's API (the v2
option names plus v3's `initialStepIndex`, `spotlightRadius` and step `width`), written by us (the
upstream is React only): a pure state machine in core (`walktourTransition`, `walktourEvents`)
owned by React (`run`, controlled `stepIndex`) and the HTML runtime `walktour` (`data-ok-run`,
cancelable `beforechange`), and one controller (`createWalktourController`) that renders a state.
Steps are Popovers (top layer, flip / shift, arrow) over an invisible Backdrop whose SVG path cuts
a rounded spotlight around the target; beacons, centered and `auto` steps, spotlight clicks,
scrolling into view, per-step overrides, a live region. Stories: Walktour (the reference's
five-step dashboard tour, progress, Skip, a dark last step with "Done") and Beacons. Composes
Backdrop, Popover, Button, IconButton, LinearProgress (and Avatar, TextField, Switch in the demo;
the featured card's picture is an Image, like the reference's carousel slides, while the step
pictures stay plain `img` as in the reference).
No new token, no dependency.
Differences: the beacon uses the primary color (the reference shows react-joyride's default red),
the step title is an `h2`, the progress bar is hidden from assistive technology (a live region
announces the step), the demo cards are text (no charts or carousel).
**Backlog:** `before` / `after` hooks and the loader, `targetWaitTimeout`, `beaconTrigger: "hover"`,
`closeButtonAction`, `scrollTarget` / `spotlightTarget`, `isFixed`, `disableFocusTrap`,
`beaconPlacement`, `scrollDuration`.

## ✅ Components — Organization chart (ADR-0036, 2026-11-09)
Created with `/component` from the reference "Organization chart" page, every section as a story:
Simple, Standard, Group; beyond them: Lines (the upstream's line options). Built on the API of
`react-organizational-chart` (`Tree` → `OrganizationChart`, `TreeNode` → `OrganizationChartNode`,
`label`, `lineHeight`, `lineWidth`, `lineColor`, `lineStyle`, `lineBorderRadius`, `nodePadding`),
HTML written by us (owner's choice): nested lists with CSS connectors (logical properties, so
right-to-left mirrors); the lengths reach the CSS as private properties (React `style`, the HTML
runtime `organization-chart` through CSSOM). Wide charts scroll in a composed Scrollbar, from the
first node. Story cards compose Avatar, IconButton, Menu (Delete / Edit) and Label. No new token,
no dependency.
Differences: `lineColor` is an allowlist (`divider`, `inherit`, palette light tones) instead of any
CSS color; defaults are the reference's (40px lines, 24px corners, 4px node padding); wide charts
start at the first node instead of being centered and cut off on phones; menu items are plain text
(the reference's Delete is red); team cards always show their menu button.

## ✅ Components — Map (2026-11-09)
Created with `/component` from the reference "Map" page, every section as a story: Change theme,
Markers & popups, Draggable markers, GeoJSON animation, Clusters, Interaction, Viewport animation,
Highlight by filter, Heatmap, Side by side. Built on MapLibre GL JS (ADR-0025, owner's choice): one
core controller (`@owlky/core/map`) for React and HTML, opt-in HTML entry (`@owlky/html/map`,
`owlky-map.js` + `owlky-map-worker.js`); React maps react-map-gl's props. Owlky draws the controls,
markers, popups, panels, scale and credits; styles come from the consumer (stories: OpenFreeMap),
with a dark style that follows the theme and token colors in layer paint. Composes Radio, Switch,
TextField, Slider, Button and ToggleButton in the stories' panels. No new tokens.
**Beyond the reference (kept):** globe and terrain controls, keyboard dragging of markers, a WebGL
fallback with the map's description, CSP example page.

## ✅ Components — Lightbox (ADR-0032, 2026-11-09)
Created with `/component` from the reference "Lightbox" page, built on yet-another-react-lightbox's
API and every plugin (Captions, Counter, Download, Fullscreen, Inline, Rotate, Share, Slideshow,
Thumbnails, Video, Zoom), written by us (the upstream is React only): a modal `<dialog>` around a
Carousel, one core controller (`createLightboxController`) shared by React and the HTML runtime
`lightbox`. Stories: Lightbox (the reference's gallery with its `disable…` Controls), Inline and
Toolbar (download, share, rotate, toggles, backdrop click, pull down). Composes Carousel and
IconButton. No new token, no dependency; the Carousel's key and pointer handlers now skip events
the lightbox handled.
Differences: `disableVideo` isn't an option (leave video slides out), thumbnails keep the selected
one in view rather than centered in a loop, no fade on close (native dialog), spacing between
slides in px or % of the slide area, video slides take caption `tracks`.

## ✅ Components — Carousel (ADR-0033, 2026-11-09)
Created with `/component` from the reference "Carousel" page, built on Embla Carousel's API (v8
names) and plugins, written by us (owner's choice): a native scroll container with CSS scroll
snapping (works without JavaScript) and one core controller, `createCarouselController`, shared by
React and the HTML runtime `carousel`. Stories (the 16 reference sections): Align, Progress,
Opacity, Scale, Fade, Parallax, Autoplay, Auto Scroll, Thumbs-x, Thumbs-y, Variable widths, Auto
height, Y-axis, Dots number, Animation, Custom; beyond them: Drag free, Slides to scroll, Right to
left. Every Embla option the reference relies on (`align`, `axis`, `loop`, `dragFree`, `draggable`,
`dragThreshold`, `skipSnaps`, `slidesToScroll`, `containScroll`, `startIndex`, `duration`,
`inViewThreshold`, `active`, `breakpoints`, `focus`, `dir`) and plugin (Autoplay, Auto Scroll, Fade,
Auto Height, Class Names as `data-ok-*` states, Wheel Gestures, the Accessibility plugin's labels and
live region), the tween effects (opacity, scale, parallax), Minimals' `slidesToShow` per breakpoint
and `slideSpacing`; arrows (basic, floating, number), dots (circular, rounded, number), progress
(scroll, autoplay), thumbnails (row, column), a play / pause button, overlay `placement` and
`color` on every control. Loop reorders the slides with CSS `order` (no clones). Composes
IconButton, Button and (stories) Motion. No new token, no dependency.
Differences: dots are 24px targets (reference 20px), the number arrows' pill is 72% grey-800
(reference 48%, for the counter's contrast), floating arrows sit inside the slides' edges (no page
overflow on phones), thumbnails have no edge fade, autoplay pauses on hover by default.
**Not planned (by design, ADR-0033):** loops shorter than one view plus two steps (they fall
back to bounded), Embla's `ssr` option (CSS sizes render on the server), the v9 `dragFree: "snap"`.

## ✅ Components — Editor (2026-11-08)
Created with `/component` from the reference "Editor" page (one story: the editor, a "Full item"
switch and a live preview). Built on Tiptap 3 (ADR-0023, the first runtime dependency): one core
controller (`@owlky/core/editor`) for React and HTML, opt-in HTML entry (`@owlky/html/editor`,
`owlky-editor.js`), lowlight-compatible `highlighter` for code blocks. Composes Menu (heading),
Popover + TextField + Button (link and image forms). No new tokens.
**Update (2026-11-09, `/component editor`):** parity with the reference and the Minimals wrapper's
Tiptap extensions: a text transform mark (`span[style="text-transform: …"]`, `textTransform`
action; snippets use `data-ok-text-transform`), fullscreen over a composed Backdrop with page scroll
lock and Tab kept inside (core `holdEditorFullscreen`), heading menu items in their own type, the
"—" rule in the language menu; React no longer reloads a controlled value Tiptap writes differently.
Additive (minor). Kept differences: inline code is primary text (AA), Undo / Redo / Remove link are
disabled when they can't run, toolbar labels carry no shortcut text (`aria-keyshortcuts`).
**Backlog (deferred):** Tiptap `extensions` / `editorProps` pass-through, bubble menu, tables,
mentions, task lists, a form `name` (hidden input with the HTML), character count.

## ✅ Components — Code editor (2026-11-09)
Created with `/component` from `https://monaco-react.surenatoyan.com/` (the `@monaco-editor/react`
demo: an editor with Language, Theme and Options settings, and a Diff editor) plus its README
(multi-model editing, validation, `useMonaco`, `loader`). Built on Monaco 0.57 (ADR-0034), every
`@monaco-editor/react` prop in one phase: one core controller pair (`@owlky/core/code-editor`) for
React (`CodeEditor`, `DiffEditor`, `useMonaco`, `loader`) and HTML (`code-editor`, `diff-editor`
runtimes; opt-in `@owlky/html/code-editor`, `owlky-code-editor.js`), Monaco self-hosted from
`@owlky/html/dist/monaco/` (engine, CSS, five module workers, UI messages) or bundled from the
package, Owlky light / dark themes built from the tokens (follow `data-ok-theme`, one theme per
page), a `<textarea>` with the value (no JavaScript, form value, fallback when Monaco can't load)
and a documented CSP (`examples/csp/code-editor.html`). Four stories: Editor, Diff editor,
Multi-model editor, Validation. No new tokens.
**Backlog (deferred):** Monaco's per-editor themes in nested scopes (Monaco has one theme per page),
`@monaco-editor/loader`'s AMD `paths` for third-party CDNs (Owlky self-hosts only).

## ✅ Components — Markdown (2026-11-09)
Created with `/component` from the reference "Markdown" page (react-markdown), both sections as
stories: Html content, Markdown content. Built from unified (ADR-0035, owner's choice): one
pipeline in core (`@owlky/core/markdown`: remark-parse + remark-gfm → remark-rehype → rehype-raw +
an allow-list sanitizer → Owlky's last step) for React (`Markdown`, `MarkdownAsync`,
`MarkdownHooks`, every react-markdown prop) and HTML (`markdown` runtime, opt-in
`@owlky/html/markdown`, `owlky-markdown.js`; the Markdown is the text of
`pre[data-ok-markdown-source]`). Safe by default: `defaultUrlTransform`, raw HTML as text unless
`rawHtml` (sanitized), scripts / frames / handlers never rendered, styles through CSSOM (strict
CSP). Owlky options: `gfm`, `rawHtml`, `sanitizeSchema`, `externalLinks`, `highlighter`
(lowlight, as the Editor). Task list boxes are named by a `label`. Closed the Editor story's
"Preview" wait (the preview renders the editor's HTML with Markdown, as the reference does). No new
tokens.
**Backlog (deferred):** a serif token for the reference's Georgia block quotes (body font today).

## Chart (ADR-0024, ADR-0027) — written by us, every ApexCharts chart type in four phases
Created with `/component` from the reference "Chart" page. ApexCharts' framework-free core isn't
MIT, so the owner chose our own engine (2026-11-08): one SVG layout in core (`renderChart`), drawn by
React and by the HTML runtime from a data table. Colors are palette names; no new tokens.

| Phase | Scope (reference sections) | Status |
|---|---|---|
| 1 | Engine, legend, tooltip, keyboard, data table; Line, Area, Column single / multiple / stacked / negative, Bar, Mixed, Scatter | ✅ 2026-11-08 |
| 2 | Pie, Donut, Radial bar, Radar, Semi circle gauge, Stroked gauge; data labels | ✅ 2026-11-08 |
| 3 | BoxPlot, Heatmap, Treemap; Bubble, Range area, Funnel / pyramid, Slope; Sparklines; a JavaScript data API (`updateSeries`, `appendData`) (ADR-0027, ADR-0029) | ✅ 2026-11-08 |
| 4 | Beyond the reference: synchronized charts, zoom and pan, brush, annotations, animations (reduced motion), export (SVG, PNG, CSV), candlestick, range bar, timeline, polar area; data label formatters, donut hole size, a legend with values; localized part labels, heatmap color ranges, horizontal box plots (ADR-0027, ADR-0031) | ✅ 2026-11-08 |

Phase 2 added `dataLabels`, `startAngle` / `endAngle`, `dashArray`, `trackWidth`, `total` /
`totalLabel`; pie, donut and radial bar charts draw the first series, one slice or ring per
category (the legend lists categories).

Phase 3 (ADR-0029) added the types `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`, `funnel`
and `slope`, the `sparkline` flag, `boxUpperColor` / `boxLowerColor`, several values per point (a
second header row in the data table, `th[data-ok-part]`), and the HTML instance methods
`updateSeries` / `appendData` (the table follows in place; redraws patch the SVG). Stories: BoxPlot,
Heatmap, Treemap (reference); Bubble, Range area, Funnel, Pyramid, Slope, Sparklines, Live data.

Phase 4 (ADR-0031) added the types `candlestick`, `rangeBar`, `timeline` and `polarArea`; the options
`zoom`, `toolbar`, `animations`, `legendValues`, `dataLabelBackground`, `donutSize`,
`candleUpColor` / `candleDownColor`; the props `group`, `brushTarget`, `annotations`, `colorRanges`,
`dataLabelFormatter`, `localeText`, `zoomRange` / `defaultZoomRange` / `onZoomRangeChange`; the
HTML instance members `zoomRange`, `setZoomRange`, `exportChart`, `setLocaleText` and the event
`ok:chart:zoom`; horizontal box plots. Stories: Candlestick, Range bar, Timeline, Polar area, Zoom
and export, Synchronized, Brush, Annotations, Data labels, Donut with values, Heatmap color ranges,
Horizontal box plot, Localized labels, Animations. **Chart is complete:** every ApexCharts chart
type and the features listed in ADR-0027 are built.

Sankey (ADR-0047, roadmap-components phase 2.1) added the type `sankey` (links between nodes: React
`nodes` / `edges`, an HTML table of links), the options `orientation`, `nodeWidth`, `whitespace`,
`edgeOpacity`, the text attribute `axisTitles`, a `flow` interaction mode (nodes and links, highlight,
keyboard rank by rank) and loops for cycles. Stories: Sankey, Vertical Sankey, Cycles, Alluvial, Link
and node options. Not built: chord and circular projections, particle flow, draggable nodes,
drill-down, the comparison split view, pinned path highlight.

Stock charts (ADR-0047, roadmap-components phase 2.2) added `indicators` (13 indicators computed
in core: `sma`, `ema`, `bollinger`, `vwap`, `donchian`, `keltner`, `volume`, `rsi`, `macd`,
`stochastic`, `atr`, `cci`, `pvt`), panes on one x axis (`paneHeight`), a navigator (`navigator`,
a brush on the zoom), a volume per point (`v`), indicator columns in the data table and a tooltip
readout of every pane. Stories: Stock chart, Overlays, Oscillators, Large dataset. Not built:
drawing tools (an editing UI with keyboard alternatives: a feature of its own), comparison, price
scale modes, event markers, price lines, aggregation helpers, period buttons (ApexStock has none).

**Not planned (by design, ADR-0031):** y / xy zoom and per-zoom y autoscaling, zooming horizontal,
polar, cell, funnel and slope charts, links between React and HTML charts on one page, custom
toolbar tools.

## ✅ Upstream API review (ADR-0015, 2026-11-04)
Components checked against their upstream API (MUI). Rule from the owner: what the Minimals page
shows wins, otherwise the upstream component. Added: Button / ButtonGroup `disableElevation`,
ButtonGroup / ToggleButton / ToggleButtonGroup `fullWidth`, IconButton `edge` + `loading`, Fab
`href`, Drawer `variant` (temporary / persistent / permanent), `hideBackdrop`,
`disableEscapeKeyDown`, `onOpenChange(open, reason)`. Renamed: Toggle neutral color `inherit` →
`standard`; Drawer `closeOnEscape` → `disableEscapeKeyDown`, `closeOnBackdropClick` removed (refuse
with the reason). Defaults: ButtonGroup `variant="outlined"`.

**Backlog (deferred):** Table toolbar (title, selected count, filter). Sortable auto-scroll while dragging near an edge; "Move to top / bottom"
keyboard actions (pragmatic-drag-and-drop accessibility guidance).

## Next — components (order approved 2026-11-05)
Dependency-first: leaf components before the ones built from them, the ones that close the most
"Pending integrations" first. Each in React + HTML with parity tests, from its reference page
(`https://minimals.cc/components/…`); after each wave run `/integrate <name>` for the *Unlocks*.

| Wave | Components | Unlocks (existing components) |
|---|---|---|
| 1 Leaves | ~~Scrollbar~~ ✅, ~~Progress~~ ✅, ~~Checkbox~~ ✅, ~~Switch~~ ✅ | ~~Sortable / Drawer / Table scrolling~~ ✅; ~~Button loading~~ ✅; ~~Table selection~~ ✅; ~~Table "Dense"~~ ✅ |
| 2 Form | ~~Text field (Input, Textarea, native Select)~~ ✅, ~~Radio button~~ ✅ | ~~TablePagination rows per page, Table "Table pagination with API", Pagination "Items"~~ ✅ (Select, wave 8) |
| 3 Display | ~~Avatar~~ ✅, ~~Badge~~ ✅, ~~Chip~~ ✅, ~~Label~~ ✅, ~~Divider~~ ✅, ~~List~~ ✅ | ~~Drawer menu~~ ✅ |
| 4 Overlays | ~~Popover~~ ✅, ~~Tooltip~~ ✅, ~~Menu~~ ✅, ~~Dialog~~ ✅, ~~Snackbar~~ ✅, ~~Backdrop~~ ✅ | ~~Drawer / Dialog backdrop~~ ✅ (native `::backdrop`, same token); icon button tooltips: nothing to change (MUI uses native `title` there; Tooltip wraps any IconButton) |
| 5 Navigation | ~~Tabs~~ ✅, ~~Breadcrumbs~~ ✅, ~~Stepper~~ ✅ | — (nothing waited for them) |
| 6 Composites | ~~Rating~~ ✅, ~~Slider~~ ✅, ~~Timeline~~ ✅, ~~Transfer list~~ ✅, ~~Autocomplete~~ ✅, ~~Tree view~~ ✅ | — (nothing waited for them; Slider unblocks the SettingsDrawer backlog of Theme settings) |
| 7 Needs an ADR | ~~Data grid~~ (ADR-0020, phases below), ~~Date pickers~~ (ADR-0022, ADR-0030, complete ✅), ~~Chart~~ (ADR-0024, ADR-0027, ADR-0031, complete ✅), ~~Map~~ (ADR-0025) ✅, ~~Editor~~ (ADR-0023) ✅, ~~Carousel~~ (ADR-0033) ✅, ~~Lightbox~~ (ADR-0032) ✅, ~~Markdown~~ (ADR-0035) ✅, ~~Organization chart~~ (ADR-0036) ✅, ~~Image~~ (ADR-0038) ✅, ~~Upload~~ (ADR-0037) ✅, ~~Walktour~~ (ADR-0039) ✅ | ~~Markdown pictures~~ ✅ (Image) |
| 8 Primitives (approved and done 2026-11-09; MUI pages, no Minimals page) | ~~Typography~~ ✅, ~~Paper~~ ✅, ~~Card~~ ✅, ~~Collapse~~ ✅ (ADR-0044), ~~Link~~ ✅, ~~Form control~~ ✅, ~~Select~~ ✅ (ADR-0045) | ~~every Typography, Paper / Card, Collapse, Link, FormLabel and Select row of "Pending integrations"~~ ✅ (each closed by its own `/component` review; the rest by the `/integrate` sweep) |

Not planned as components (patterns or app-level pages of the reference): Layout, Multi-language, Navigation bar, Mega menu, Form validation, Form wizard (Utilities is spread across components:
`roadmap-components.md` 4.19–4.26). Scroll progress is phase 2 of the Motion full version. Layout, Form wizard and Form validation may come back as
**blocks** (copy-paste compositions; needs its own ADR), Navigation bar and Mega menu as components.

## After the waves (order approved 2026-11-09, MCP added before the website the same day)
1. ✅ **Wave 8 Primitives** (above, 2026-11-09): Paper, Typography, Collapse, Card, Form control,
   Link, Select.
2. ✅ **One `/integrate`** (2026-11-09): closed the two cross waits (Collapse story ↔ Card) and 14
   story-only stand-ins that had never been recorded (demo CSS drawing cards or setting fonts in
   Stepper, List, Editor, Divider, Paper, Autocomplete and nine stories' demo text). Only the Motion
   "Logo" wait is left (Motion full version).
3. ✅ **`/update-ai-knowledge-base`**, then commit: CLAUDE.md, AGENTS.md, docs, ADRs and specs in
   sync with Wave 8.
4. ✅ **MCP server `@owlky/mcp`** (ADR-0046, 2026-11-09): `scripts/manifest.mjs` writes
   `packages/mcp/manifest.json` (about 6 MB, 0.7 MB gzip: 105 option schemas, 62 specs by section,
   371 stories with their HTML and React Code panels, 523 snippets, 68 guides, 273 tokens, the
   Tailwind theme, every `data-ok-*` name and the required parts; `pnpm check:manifest` in
   `pnpm check` and CI). A stdio server (`npx -y @owlky/mcp`, bin `owlky-mcp`) with the tools
   `list_components`, `get_component`, `get_examples`, `search_tokens`, `get_guide`,
   `validate_markup`, resources `owlky://components/<name>`, `owlky://tokens`,
   `owlky://guides/<id>` and prompts `build-html-page`, `build-react-page`; registered as `owlky`
   in `.mcp.json`; a packed-tarball smoke test in CI (`pnpm smoke:mcp`). A remote MCP on owlky.com
   is deferred, so the website stays static.
5. **Component completion** (next; owner's decision 2026-11-09: finish every component before the
   website continues): tracked on its own in [`docs/roadmap-components.md`](roadmap-components.md)
   — stability, ApexCharts parity, upstream API audit with a complete API reference on every docs
   page, every remaining gap, Motion full version.
6. **Website** (ADR-0040).
   - ✅ **Phase 1** (2026-11-09): `apps/website` (Next.js 16, static export, built with Owlky and
     its theme settings; Home, Get started, Foundations › Colors, Components › Button; Shiki code
     blocks with a Copy button; **Open HTML demo** sandbox pages; Pagefind search; `llms.txt`,
     `llms-full.txt` and one `.md` per page; Options tables from the MCP manifest),
     `apps/docs-content` with the two pilot guides and the guide UI (Storybook renders them through
     its own host), `website.yml` (Vercel CLI previews and production, skipped until the owner adds
     the Vercel secrets) and the website e2e. Owner's setup: `apps/website/README.md`.
   - ✅ **Landing page** (2026-11-09): the home page rebuilt in the layout of a SaaS template
     landing page with live Owlky components (dashboard preview, bento features, component tabs,
     principles carousel, FAQ, call to action); docs pages moved into an `app/(docs)/` route group.
   - **Phase 2 (after component completion):** migrate the remaining guides to `apps/docs-content` in
     batches (Foundations, then components by wave); Storybook's `*-docs.tsx` become thin
     wrappers, then disappear. Then deploy (the owner's Vercel project, secrets and DNS) and decide
     on a remote MCP endpoint on owlky.com (proposed, on hold: a `/mcp` route handler reusing
     `createOwlkyServer`, own ADR).
   - Phase 3: changelog, free blocks (own ADR).
7. **Publish 0.1.0** together with the website.
8. **More frameworks** (user decision 2026-11-09), after 0.1.0:
   - integration guides and DOM-morphing tests for server-rendered stacks (htmx, Hotwire / Turbo,
     Laravel Livewire, Phoenix LiveView, Django templates): the HTML runtime must survive morphs
     (idiomorph, Turbo morphing, LiveView patches);
   - a Preact check (`@owlky/react` through `preact/compat`) and setup pages for Next.js, Astro and
     Remix / React Router;
   - packages written 1:1 like `@owlky/react` (native components, same `data-ok-*` markup, behavior
     from `core`, parity-tested): `@owlky/vue` → `@owlky/svelte` → `@owlky/angular` →
     `@owlky/solid`. An ADR first (package layout, boundaries like ADR-0008, SSR per framework,
     Storybook's Framework menu and parity per framework, docs tabs), then a pilot of about three
     components (Button, Dialog, Select) before the full set.
   - Not planned: React Native and Flutter (no DOM), Ember, Lit / Web Component wrappers (the HTML
     package covers framework-free use), Qwik unless users ask.
9. **1.0 prep:** accessibility audit and docs polish (the upstream API audit moved to component completion),
   size optimization (owner 2026-11-10: later, not before 0.1.0): per-page budgets for sample pages
   and per component, and a lighter CDN core with opt-in heavy bundles (data grid, chart, pickers, Gantt),
   plus the backlogs (Table toolbar, Sortable
   auto-scroll and move to top / bottom, Motion `component`, Dialog `keepMounted`), Paper composed
   inside Popover / Menu / Dialog / Drawer / TableContainer / Map controls / Autocomplete listbox
   (no visual change), and the flaky e2e pixel parity of `carousel / thumbs-y` (about 2 of 60 runs
   with 4 workers, already before Wave 8; waiting for image decode and scroll settle didn't fix it). Carousel bug: with `loop`, a viewport resize (also Playwright's screenshot resize) jumps a
   looping carousel to another slide (found by the landing page, which turns `loop` off for now).
10. **Later, each with an ADR:** a blocks tier (free blocks here, premium blocks in a private
   repository), Navigation bar and Mega menu.

**Before publishing 0.1.0 (needs the owner):** npm org `@owlky`, npm trusted publishing for
`dangduoc08/owlky`, the Vercel project and secrets, DNS for owlky.com, visual baselines in Docker
(`pnpm test:visual:update`).
