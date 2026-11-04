# ADR-0006: Browser baseline and native-API fallbacks

**Status:** Accepted

## Context

Components rely on native platform features. We must state what we support and must not
silently assume support.

## Decision

### Supported baseline

| Browser            | Minimum | Limited by                                              |
| ------------------ | ------- | ------------------------------------------------------- |
| Chrome / Edge      | 114     | Popover API                                             |
| Firefox            | 128     | Tailwind v4 output (`@property`, `color-mix()`, layers) |
| Safari (macOS/iOS) | 17.0    | Popover API                                             |

This is roughly _Baseline 2024_. The CDN bundle is compiled for exactly these targets
(`packages/html/vite.config.ts`). Older browsers are unsupported; they may render styles but
behavior is not guaranteed.

### Feature detection

`core/src/dom/support.ts` exposes `supports.dialog`, `supports.popover`, `supports.inert`
(lazy, SSR-safe). The runtime re-exports it as `Owlky.supports`.

### Fallbacks

| Feature                                    | Native path                                             | Fallback (automatic)                                                                                                                             | Status                                                                      |
| ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Modal dialog                               | `showModal()`: top layer, inert page, Escape → `cancel` | `open` + `data-ok-fallback` + `aria-modal`, siblings `inert` (or `aria-hidden`), manual Tab trap and Escape, CSS paints the backdrop and z-index | Implemented and tested (`forceFallback` runs the full suite in both modes)  |
| `inert`                                    | `inert` attribute                                       | `aria-hidden="true"` on outside content                                                                                                          | Implemented                                                                 |
| Popover (Tooltip, Dropdown, Select, Toast) | `popover` + `showPopover()`                             | `hidden` toggling + fixed positioning + `--ok-z-*` + manual light-dismiss                                                                        | To build with the first popover component (Phase 5), same pattern as dialog |
| CSS `@property`                            | non-inheriting color bindings                           | Tailwind's emitted reset layer                                                                                                                   | Automatic                                                                   |
| `checkVisibility()`                        | used for focusability                                   | `getClientRects()`                                                                                                                               | Implemented                                                                 |

Fallback mode is visible (`data-ok-fallback` attribute, `controller.isFallback`), never silent.
Platform differences that are _correct_ behavior are documented, not "fixed": e.g. a native modal
may hand Tab focus to browser UI; Safari doesn't focus buttons on click (so triggers pass
themselves explicitly for focus return).

### Not used yet (revisit when Baseline)

CSS anchor positioning, Invoker Commands (`commandfor`), `@starting-style` exit animations.

## Consequences

- Tests run in Chromium, Firefox and WebKit (unit: `VITEST_BROWSERS`; e2e: all projects).
- Raising the baseline is a breaking change (major version).
