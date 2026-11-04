# @owlky/html

Framework-free [Owlky](../../README.md) components: copy-paste HTML snippets plus a
~2 kB (gzip) Core Runtime that wires behavior up through `data-ok-*` attributes.

Components: **Accordion** (native `<details>`; runtime: `accordion`, events
`ok:accordion:beforetoggle|toggle`, `name` fallback) **Alert** (runtime: `alert`, close button
`data-ok-alert-close`, event `ok:alert:close`) **Button**, **Icon button**, **Fab**, **Button group** (CSS only — no JavaScript
needed) **Drawer** (runtime: `drawer`, triggers `data-ok-drawer-open="<id>"` / `data-ok-drawer-close`,
events `ok:drawer:beforeopen|open|beforeclose|close`) **Table** (runtime: `table` + `table-pagination` — sorts, selects, pages and expands rows in the
DOM; events `ok:table:sort|select|expand`, `ok:table-pagination:change`; pagination linked with
`data-ok-table-pagination="<table id>"`) **Sortable** (runtime: `sortable`, events `ok:sortable:move|remove|add`, add trigger
`data-ok-sortable-add="<list id>"` + `<template data-ok-sortable-template>`) and **Toggle button** (runtime: `toggle-button` + `toggle-group`, events
`ok:toggle-button:change` / `ok:toggle-group:change`). Snippets ship in
`@owlky/html/snippets/<component>/<story>-<group>.html` and in Storybook (HTML/Button/…).

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
