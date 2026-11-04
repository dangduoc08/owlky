# @minimal-tailwind/html

Framework-free [Minimal Tailwind](../../README.md) components: copy-paste HTML snippets plus a
~2 kB (gzip) Core Runtime that wires behavior up through `data-mt-*` attributes.

> Status: foundations first (ADR-0011). The runtime and the stylesheet ship today; component
> snippets are added with each component.

## CDN — include once per page

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.css">
<script src="https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist/minimal-tailwind.js" defer></script>
```

Then paste component snippets (Storybook HTML/* pages). Components
inserted later (htmx, Turbo, `innerHTML`) are initialized automatically and cleaned up when
removed. Loading the script twice is harmless.

## npm

```ts
import "@minimal-tailwind/styles/minimal-tailwind.css";
import "@minimal-tailwind/html/auto"; // everything, started

// or à la carte, side-effect free:
import { components, getRuntime } from "@minimal-tailwind/html";
getRuntime().register(...components).start();
```

## Runtime API

`MinimalTailwind` (CDN) / `getRuntime()` (npm): `start()`, `stop()`, `init(root?)`,
`destroy(root?)`, `get(element, "<component>")`, `connect(shadowRoot)`, `supports`, `version`.
Events bubble as `mt:<component>:<event>`. Details: ADR-0005, ADR-0007.
