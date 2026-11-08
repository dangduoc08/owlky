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
`ok:data-grid:sort|filter|selection|columns|density|order|pinned|edit`, cancelable, and `ok:data-grid:resize`; filter rows with and / or, resizing, reordering, pinning, editing and print). Snippets ship in
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

## npm

```ts
import "@owlky/styles/owlky.css";
import "@owlky/html/auto"; // everything, started

// or à la carte, side-effect free:
import { components, getRuntime } from "@owlky/html";
getRuntime().register(...components).start();
```

## Runtime API

`Owlky` (CDN) / `getRuntime()` (npm): `start()`, `stop()`, `init(root?)`,
`destroy(root?)`, `get(element, "<component>")`, `connect(shadowRoot)`, `supports`, `version`.
Events bubble as `ok:<component>:<event>`. Details: ADR-0005, ADR-0007.
