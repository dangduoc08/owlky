# Implementation plan

Each phase ends with green CI (lint, types, unit ×3 browsers, e2e ×4 projects, package checks)
and a review before the next starts.

## Overview
Every page of the reference's component menu (`https://minimals.cc/components/…`) and where it
stands. ✅ = built (34); *wave N* = planned, see "Next — components"; *not planned* = a pattern
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
| MUI | List | ✅ | List, ListItem, ListItemButton, ListItemIcon, ListItemAvatar, ListItemText, ListSubheader, ListItemExpandIcon | List |
| MUI | Menu | ✅ | Menu, MenuItem | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Pagination | ✅ | Pagination, PaginationItem | Pagination |
| MUI | Popover | ✅ | Popover | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Progress | ✅ | CircularProgress, LinearProgress | Progress |
| MUI | Radio button | ✅ | Radio, RadioGroup | Text field & Radio |
| MUI | Rating | ✅ | Rating | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Slider | ✅ | Slider | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Stepper | ✅ | Stepper, Step, StepLabel, StepConnector, StepContent, MobileStepper | Tabs, Breadcrumbs & Stepper |
| MUI | Switch | ✅ | Switch, FormControlLabel | Checkbox & Switch |
| MUI | Table | ✅ | Table parts, TablePagination, TableExpandButton / TableDetailRow | Table |
| MUI | Tabs | ✅ | Tabs, Tab, TabPanel | Tabs, Breadcrumbs & Stepper |
| MUI | Text field | ✅ | TextField, InputAdornment (native select) | Text field & Radio |
| MUI | Timeline | ✅ | Timeline and its parts | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI | Tooltip | ✅ | Tooltip | Popover, Tooltip, Menu, Dialog & Snackbar |
| MUI | Transfer list | ✅ | TransferList | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| MUI X | Data grid | wave 7 (ADR) | — | Next |
| MUI X | Date pickers | wave 7 (ADR) | — | Next |
| MUI X | Tree view | ✅ | SimpleTreeView, TreeItem, RichTreeView | Rating, Slider, Timeline, Transfer list, Tree view & Autocomplete |
| Extra | Animate | not planned | — | Next |
| Extra | Carousel | wave 7 (ADR) | — | Next |
| Extra | Chart | wave 7 (ADR) | — | Next |
| Extra | Dnd | ✅ | Sortable | Sortable |
| Extra | Editor | wave 7 (ADR) | — | Next |
| Extra | Form validation | not planned | — | Next |
| Extra | Form wizard | not planned | — | Next |
| Extra | Image | wave 7 (ADR) | — | Next |
| Extra | Label | ✅ | Label | Avatar, Badge, Chip & Label |
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
| Extra (Sonner) | Snackbar | ✅ | Toaster, toast() | Popover, Tooltip, Menu, Dialog & Snackbar |
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
**Backlog:** non-native `select` (listbox, wave 4), FormLabel /
FormHelperText / FormControl as separate components.

## ✅ Components — Checkbox & Switch (2026-11-07)
Checkbox (colors incl. `default`, `medium` / `small`, `indeterminate`, custom icons) and Switch
(colors, sizes, `edge`), both native checkboxes (`role="switch"`), API from MUI; `ref` and input
props go to the `<input>`. FormControlLabel (`labelPlacement` end / start / top / bottom,
`required`, props passed to the control). HTML runtime `checkbox`: mixed state in step, and
parents with `aria-controls` (WAI-ARIA mixed checkbox); Switch is CSS only. Visible focus rings
(the reference has none). Integrated: Table selection uses small Checkboxes (select-all shows
mixed), the "Sorting & selecting" story has the reference's "Dense" Switch
(`data-ok-table-dense="<table id>"` in HTML). No new tokens.
**Backlog:** Switch `icon` / `checkedIcon` (thumb content); FormGroup, FormControl, FormLabel,
FormHelperText (wave 2, with Text field).

## ✅ Components — Progress (2026-11-07)
CircularProgress (indeterminate / determinate, 7 colors incl. `inherit`, `size` in px or a
`px` / `rem` / `em` length, `thickness`, `disableShrink`, `enableTrackSlot`) and LinearProgress
(indeterminate / determinate / buffer / query, `valueBuffer`), API from MUI. CSS for the look;
the HTML runtime turns values, size and thickness into private custom properties through CSSOM
(strict CSP). New `number` option kind in the schemas (Controls, docs tables, spec tables).
Button / IconButton loaders are now a CircularProgress (`data-ok-button-spinner` kept; an empty
spinner span still renders). No new tokens.
**Backlog:** right-to-left linear progress; a value label part (needs Typography).

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
| Typography (display text) | Sortable stories (card numbers) | demo `<span>` styled in `.storybook/preview.css` |
| Typography (heading / secondary text) | Accordion summaries (plain text, no secondary line from the reference) | summary text styled by `accordion.css` |
| Typography (heading) | Scrollbar "Layout" story heading | demo `<h4>` styled in `.storybook/preview.css` |
| Select (listbox, built on Menu) | `TablePagination` rows per page (library markup) | native `<select>` styled in `table.css`; the API (`rowsPerPageOptions`) stays. TextField's native select doesn't match MUI's InputBase select here |
| Select (listbox, built on Menu) | Pagination story "Items" (card grid + items-per-page Select) | story deferred: the reference uses MUI's listbox Select |
| Select (listbox, built on Menu) | Table story "Table pagination with API" (search TextField + category Select) | story deferred until the listbox Select; TextField exists |
| Select (listbox, built on Menu) | TextField `select` (non-native) | native `<select>` only (`select` prop) |
| FormLabel | Radio story "Colors" (group label) | story-only `<span id>` styled in `.storybook/preview.css` |
| Collapse (transition) | List nested lists | open / close at once (`hidden`); a Collapse component can animate the height later without a DOM change |
| Collapse (transition) | Stepper `StepContent` (vertical) | shown / hidden at once by CSS on the active step; MUI collapses it |
| Link (Typography) | Breadcrumbs items | native `a` / `span[aria-current]` styled by `breadcrumbs.css` (inherit color, hover underline); a Link component can go inside items without a DOM change |
| Typography (headings, body text) | Breadcrumbs story "Customized" (page heading `h4`, paragraph) and Stepper stories (step panels, mobile card `h6` / `p`) | demo markup styled in `.storybook/preview.css` |
| Typography (headings, body text) | Popover and Dialog stories (popover text, "Selected:" line, full-screen toolbar title) | demo `h6` / `p` / `header` styled in `.storybook/preview.css` |
| Collapse / Slide (transitions) | Dialog story "Transitions" (the reference slides the dialog in) | the dialog's one opening animation (fade + scale) |
| Typography + Paper (card) | Timeline story "Customized" (cards with a title and text) | demo `.sb-timeline-card` styled in `.storybook/preview.css` |
| Typography (body text) | Autocomplete stories (output lines under the fields) | demo `p` styled in `.storybook/preview.css` |
| Collapse (transition) | Tree view groups | open / close at once (`hidden`); MUI X collapses them |

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
| 2 Form | ~~Text field (Input, Textarea, native Select)~~ ✅, ~~Radio button~~ ✅ | TablePagination rows per page, Table "Table pagination with API", Pagination "Items": wait for the listbox Select (wave 4) |
| 3 Display | ~~Avatar~~ ✅, ~~Badge~~ ✅, ~~Chip~~ ✅, ~~Label~~ ✅, ~~Divider~~ ✅, ~~List~~ ✅ | ~~Drawer menu~~ ✅ |
| 4 Overlays | ~~Popover~~ ✅, ~~Tooltip~~ ✅, ~~Menu~~ ✅, ~~Dialog~~ ✅, ~~Snackbar~~ ✅, ~~Backdrop~~ ✅ | ~~Drawer / Dialog backdrop~~ ✅ (native `::backdrop`, same token); icon button tooltips: nothing to change (MUI uses native `title` there; Tooltip wraps any IconButton) |
| 5 Navigation | ~~Tabs~~ ✅, ~~Breadcrumbs~~ ✅, ~~Stepper~~ ✅ | — (nothing waited for them) |
| 6 Composites | ~~Rating~~ ✅, ~~Slider~~ ✅, ~~Timeline~~ ✅, ~~Transfer list~~ ✅, ~~Autocomplete~~ ✅, ~~Tree view~~ ✅ | — (nothing waited for them; Slider unblocks the SettingsDrawer backlog of Theme settings) |
| 7 Needs an ADR | Data grid, Date pickers, Chart, Map, Editor, Carousel, Lightbox, Markdown, Organization chart, Upload, Image, Walktour | — |

Not planned as components (patterns or app-level pages of the reference): Animate, Layout,
Utilities, Multi-language, Navigation bar, Mega menu, Scroll progress, Form validation, Form wizard.
Typography (display / heading text) has no reference page of its own: build it with wave 3.
Feedback & 1.0 after the waves: accessibility audit, docs polish, and an upstream API audit of every component (prop by prop against MUI, a mapping table in each spec; e.g. Drawer `elevation`, `transitionDuration` are missing; Backdrop `transitionDuration`).

**Before publishing 0.1.0 (needs the owner):** npm org `@owlky`, GitHub repo (replace
`OWNER`), npm trusted publishing, visual baselines in Docker (`pnpm test:visual:update`).
