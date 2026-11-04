# ADR-0005: HTML Core Runtime

**Status:** Accepted

## Context

HTML users copy snippets and include one script; components must work without custom JavaScript,
work together, survive dynamic DOM (htmx, Turbo, `innerHTML`), and never duplicate listeners or
instances — even if the script is loaded twice.

## Decision

`packages/html/src/runtime` — about 3 kB gzip — provides:

| Concern          | Mechanism                                                                                                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration     | `defineComponent({ name, selector, setup, delegate })`; `register()` keeps the first definition per name (re-registration is a no-op).                                                                                                                         |
| Initialization   | `start()` (idempotent) connects `document`, mounts every match, and waits for `DOMContentLoaded` when needed. `init(root)` mounts a subtree; mounting is idempotent per element × component.                                                                   |
| Dynamic DOM      | One `MutationObserver` per connected root, batched per microtask. Added subtrees are mounted; removed ones swept. A node moved within one task keeps its instance (connectedness is checked at flush).                                                         |
| Teardown         | Each instance gets an `AbortController`; every listener uses its `signal`. `destroy(root)`, removal from the DOM, and `stop()` abort it and call the instance's `destroy()`. With `observe: false`, `init()` still sweeps disconnected instances.              |
| Event delegation | One native listener per (event type, phase) per root, shared by all components; handlers get the `closest(selector)` match. Non-bubbling events use `capture: true`. No `stopPropagation` in library code. Handler errors are caught and logged per component. |
| Coexistence      | Subtrees under `[data-ok-runtime="off"]` (all React roots that have behavior) are never mounted or delegated to.                                                                                                                                               |
| Shadow DOM       | `connect(shadowRoot)` adds delegation + observation there.                                                                                                                                                                                                     |
| Communication    | Components never import each other: DOM events (`ok:<component>:<event>`, bubbling, some cancelable) and id references (`data-ok-dialog-open="id"`).                                                                                                           |
| API              | `getRuntime()`, `register`, `start`, `stop`, `init`, `destroy`, `get(el, name)`, `getOrCreate`, `connect`, `supports`, `version`, `protocol`, `active`.                                                                                                        |

Distribution: `@owlky/html` (side-effect free ESM), `@owlky/html/auto`
(registers everything + starts), `dist/owlky.js` (IIFE for `<script>`, one global
`window.Owlky`, set only by the copy that owns the page).

Adding a component = a folder in `src/components/<name>/` + one line in
`src/components/index.ts` (a test verifies the list). CSS-only components (Button, Switch) have
no definition at all.

## Consequences

- Predictable, documented lifecycle; no per-element listeners for triggers.
- Elements whose `data-ok-*` root attribute is added later (not inserted) need `init()`.
- Each snippet must be valid and closed/inert without JS (native `<dialog>`, `hidden`, `popover`),
  so a page never shows half-working components before the script loads.
