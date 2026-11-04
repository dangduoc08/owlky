# ADR-0004: Shared framework-free core for behavior and anatomy

**Status:** Accepted

## Context

Accessible behavior (focus, dismissal, stacking, scroll lock) is the hardest part to keep
identical in two implementations. Headless React libraries (Radix, React Aria) would leave the
HTML side without an equivalent.

## Decision

`@owlky/core` holds everything both implementations share, with no framework and no
side effects on import:

- **Anatomy:** `buttonAttributes()`, `switchAttributes()`, `dialogAttributes()` map options to the
  `data-ok-*` attributes. React spreads them; HTML snippets are written to match (verified by the
  e2e anatomy parity test).
- **Behavior controllers:** e.g. `createDialogController(element, options)` — the _only_
  implementation of dialog behavior. React drives it from effects; the HTML runtime from a
  component definition. Controllers report user intent (`onDismiss`) instead of closing
  themselves, so controlled React state and cancelable HTML events work the same way.
- **Primitives:** focus utilities, `layerStack`, `lockScroll`, `inertOutside`, `supports`,
  `createId`.

The HTML-only runtime (registry, delegation, observation) is **not** in core (ADR-0005), so React
never ships it.

## Consequences

- Behavior bugs are fixed once. Core is tested in Chromium, Firefox and WebKit.
- If a future component (Select/combobox) proves too costly to build in-house, Zag.js is the
  fallback: it is framework-agnostic and would keep this same split.
