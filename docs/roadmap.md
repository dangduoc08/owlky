# Implementation plan

Each phase ends with green CI (lint, types, unit ×3 browsers, e2e ×4 projects, package checks)
and a review before the next starts.

## Overview
Every page of the reference's component menu (`https://minimals.cc/components/…`) and where it
stands. ✅ = built (14); *wave N* = planned, see "Next — components"; *not planned* = a pattern
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
| MUI | Accordion | ✅ | Accordion | Accordion & Alert |
| MUI | Alert | ✅ | Alert | Accordion & Alert |
| MUI | Autocomplete | wave 6 | — | Next |
| MUI | Avatar | wave 3 | — | Next |
| MUI | Badge | wave 3 | — | Next |
| MUI | Breadcrumbs | wave 5 | — | Next |
| MUI | Buttons | ✅ | Button, IconButton, Fab, ButtonGroup, ToggleButton(Group) | Button |
| MUI | Checkbox | wave 1 | — | Next |
| MUI | Chip | wave 3 | — | Next |
| MUI | Dialog | wave 4 | — | Next |
| MUI | Drawer | ✅ | Drawer | Drawer |
| MUI | List | wave 3 | — | Next |
| MUI | Menu | wave 4 | — | Next |
| MUI | Pagination | ✅ | Pagination, PaginationItem | Pagination |
| MUI | Popover | wave 4 | — | Next |
| MUI | Progress | wave 1 | — | Next |
| MUI | Radio button | wave 2 | — | Next |
| MUI | Rating | wave 6 | — | Next |
| MUI | Slider | wave 6 | — | Next |
| MUI | Stepper | wave 5 | — | Next |
| MUI | Switch | wave 1 | — | Next |
| MUI | Table | ✅ | Table parts, TablePagination, TableExpandButton / TableDetailRow | Table |
| MUI | Tabs | wave 5 | — | Next |
| MUI | Text field | wave 2 | — | Next |
| MUI | Timeline | wave 6 | — | Next |
| MUI | Tooltip | wave 4 | — | Next |
| MUI | Transfer list | wave 6 | — | Next |
| MUI X | Data grid | wave 7 (ADR) | — | Next |
| MUI X | Date pickers | wave 7 (ADR) | — | Next |
| MUI X | Tree view | wave 6 | — | Next |
| Extra | Animate | not planned | — | Next |
| Extra | Carousel | wave 7 (ADR) | — | Next |
| Extra | Chart | wave 7 (ADR) | — | Next |
| Extra | Dnd | ✅ | Sortable | Sortable |
| Extra | Editor | wave 7 (ADR) | — | Next |
| Extra | Form validation | not planned | — | Next |
| Extra | Form wizard | not planned | — | Next |
| Extra | Image | wave 7 (ADR) | — | Next |
| Extra | Label | wave 3 | — | Next |
| Extra | Layout | not planned | — | Next |
| Extra | Lightbox | wave 7 (ADR) | — | Next |
| Extra | Map | wave 7 (ADR) | — | Next |
| Extra | Markdown | wave 7 (ADR) | — | Next |
| Extra | Mega menu | not planned | — | Next |
| Extra | Multi-language | not planned | — | Next |
| Extra | Navigation bar | not planned | — | Next |
| Extra | Organization chart | wave 7 (ADR) | — | Next |
| Extra | Scroll progress | not planned | — | Next |
| Extra | Scrollbar | ✅ | Scrollbar | Scrollbar |
| Extra | Snackbar | wave 4 | — | Next |
| Extra | Upload | wave 7 (ADR) | — | Next |
| Extra | Utilities | not planned | — | Next |
| Extra | Walktour | wave 7 (ADR) | — | Next |

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
| Shadows | System elevations 1–24, extended shadows, colored shadows | `--ok-elevation-1…24` |
| Grid | Spacing (0–40px) and column (1–12) stories driven by Controls | — |
| Icons | Icon sets, sizes, colors, usage | — (no icon set bundled; reference logo/illustrations not reproduced) |

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
shared by future modals). Token added: `--ok-shadow-dialog-start`. Demo menu content is styled in
the Storybook preview until a List component exists.

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

## ✅ Theme settings (ADR-0017, 2026-11-05)
From the reference's Settings drawer: primary color presets (default, cyan, purple, blue, orange,
red) via `data-ok-preset`, font families (Public Sans, Inter, DM Sans, Nunito Sans) via
`data-ok-font`, root font size 12–20px; scopes nest with `data-ok-theme`. Helper
`applyThemeSettings` in core (validates; stores only with an app-provided storage). Storybook
toolbar: Preset, Font, Size; Foundations › Settings. Backlog: contrast setting, right-to-left
(logical-property audit), a SettingsDrawer component (needs Switch and Slider).

## Pending integrations
Everything waiting for a component that doesn't exist yet — stand-ins (native feature, demo
markup, a small built-in part) **and** stories or features deferred until then. This table is the
only list of such waits: never record one only in a backlog. When that component is built,
integrate these in the same review (additive: no DOM or API change) and remove the rows.

| Waiting for | Where | Today |
|---|---|---|
| List | Drawer stories (mailbox menu) | demo `<nav><ul><button>` styled in `.storybook/preview.css` |
| Typography (display text) | Sortable stories (card numbers) | demo `<span>` styled in `.storybook/preview.css` |
| Progress | Button loading: `[data-ok-button-spinner]` in `button.css` (library) | own spinner; keep the attribute as public anatomy and share Progress's styles / tokens |
| Typography (heading / secondary text) | Accordion summaries (plain text, no secondary line from the reference) | summary text styled by `accordion.css` |
| Typography (heading) | Scrollbar "Layout" story heading | demo `<h4>` styled in `.storybook/preview.css` |
| Checkbox | Table selection column (`data-ok-table-select`, `data-ok-table-select-all`) | native `<input type="checkbox">`, sized in `.storybook/preview.css`; keep the attributes on the input |
| Select | `TablePagination` rows per page (library markup) | native `<select>` styled in `table.css`; the API (`rowsPerPageOptions`) stays |
| Select | Pagination story "Items" (card grid + items-per-page Select) | story deferred |
| TextField, Select | Table story "Table pagination with API" | story deferred |
| Switch | Table "Dense" toggle from the reference | not shown: the stories' `size` Control covers it |
| Divider | Drawer stories (mailbox menu) | demo `<hr>` styled in `.storybook/preview.css` |
| Backdrop | Drawer: native `::backdrop` | share `--ok-backdrop` with a future Backdrop component |

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
| 1 Leaves | ~~Scrollbar~~ ✅, Progress, Checkbox, Switch | ~~Sortable / Drawer / Table scrolling~~ ✅; Button loading; Table selection; Table "Dense" |
| 2 Form | Text field (Input, Textarea, native Select), Radio button (+ restore empty export globs) | TablePagination rows per page; Table "Table pagination with API"; Pagination "Items" |
| 3 Display | Avatar, Badge, Chip, Label, Divider, then List | Drawer menu (List, Divider) |
| 4 Overlays | Popover (positioning controller + fallback in core), then Tooltip, Menu, Dialog (+ Backdrop), Snackbar | Drawer backdrop; Icon button tooltips |
| 5 Navigation | Tabs, Breadcrumbs, Stepper | — |
| 6 Composites | Rating, Slider, Timeline, Transfer list, Autocomplete, Tree view | — |
| 7 Needs an ADR | Data grid, Date pickers, Chart, Map, Editor, Carousel, Lightbox, Markdown, Organization chart, Upload, Image, Walktour | — |

Not planned as components (patterns or app-level pages of the reference): Animate, Layout,
Utilities, Multi-language, Navigation bar, Mega menu, Scroll progress, Form validation, Form wizard.
Typography (display / heading text) has no reference page of its own: build it with wave 3.
Feedback & 1.0 after the waves: accessibility audit, docs polish.

**Before publishing 0.1.0 (needs the owner):** npm org `@owlky`, GitHub repo (replace
`OWNER`), npm trusted publishing, visual baselines in Docker (`pnpm test:visual:update`).
