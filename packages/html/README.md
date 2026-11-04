# @minimal-tailwind/html

Framework-free [Minimal Tailwind](../../README.md) components: copy-paste HTML snippets plus a
~4 kB (gzip) Core Runtime that wires behavior up through `data-mt-*` attributes.

## CDN — include once per page

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.css">
<script src="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.js" defer></script>
```

Then paste snippets (Storybook HTML/* pages, or `dist/snippets/<component>/*.html`). Components
inserted later (htmx, Turbo, `innerHTML`) are initialized automatically and cleaned up when
removed. Loading the script twice is harmless.

## npm

```ts
import "@minimal-tailwind/styles/minimal-tailwind.css";
import "@minimal-tailwind/html/auto"; // everything, started

// or à la carte, side-effect free:
import { getRuntime, dialog } from "@minimal-tailwind/html";
getRuntime().register(dialog).start();
```

## Runtime API

`MinimalTailwind` (CDN) / `getRuntime()` (npm): `start()`, `stop()`, `init(root?)`,
`destroy(root?)`, `get(element, "dialog")`, `connect(shadowRoot)`, `supports`, `version`.
Events bubble as `mt:<component>:<event>`. Details: ADR-0005, ADR-0007.
