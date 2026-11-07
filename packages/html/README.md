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
`ok:toggle-button:change` / `ok:toggle-group:change`). Snippets ship in
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
