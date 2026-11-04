# ADR-0015: Component API from the upstream component; one option schema for React and HTML

**Status:** Accepted (2026-11-04) — extends ADR-0003 (anatomy) and ADR-0004 (shared core)

## Context
Reference pages on minimals.cc show a component's look and a few demos, and link the upstream
component (MUI, or e.g. Atlassian pragmatic-drag-and-drop) whose API is complete. Building props
from the demos alone missed upstream features (Drawer `variant`, `hideBackdrop`) and let options
appear without a source (Drawer `closeOnEscape`). Each option was also declared in several places:
React types, `anatomy.ts` allowlists, the HTML runtime, spec tables and Storybook Controls — React
and HTML could drift apart.

## Decision
1. **API source.** `/component` reads the upstream component's API and demos (the link on the
   reference page) and proposes an **API mapping table**: every upstream prop is *kept* (same
   name), *renamed* (reason), *deferred* (backlog) or *not applicable* (reason: `sx`, `classes`,
   `slotProps`, `component`, transitions, ripple…). Options that exist neither on the reference nor
   upstream are listed under **"Options beyond the reference"** with a reason, and need approval.
2. **Names follow upstream** when the meaning matches (`anchor`, `variant`, `fullWidth`,
   `hideBackdrop`…). **Callbacks keep this project's shape** (owner decision): value-first,
   no event argument — `onOpenChange(open)`, `onChange(value)`, `onReorder(items)`; the reason,
   when it matters, is a second argument (`onOpenChange(false, "escape")`).
3. **React ↔ HTML mapping** — every option has both forms:

   | React | HTML |
   |---|---|
   | style prop (enum) | `data-ok-<option>` attribute (unknown values → default) |
   | boolean prop | presence attribute or native attribute (`disabled`) |
   | behavior option | `data-ok-*`, re-read by the runtime on every action |
   | controlled state (`open`, `value`) | native / ARIA state in the DOM + instance methods |
   | default state (`defaultOpen`) | initial state written in the markup (`data-ok-open`, `aria-pressed`) |
   | callback | `ok:<component>:<event>` CustomEvent; `before…` events are cancelable (= controlled refusal) |
   | ReactNode slot | child element with a part attribute (`data-ok-<component>-<part>`) |
   | render function | your markup, or `<template data-ok-<component>-template>` |
   | ref / imperative API | the element + `runtime.get(element, "<component>")` |
4. **One option schema per component in `core`** (`src/options/`): name, attribute, allowed values
   or type, default, kind (`style` · `behavior` · `state`) and related event. It drives React
   attributes and prop types, HTML runtime option reading, Storybook Controls for **both**
   implementations, a parity test that every option exists in React and HTML, and the spec's
   Options table.

## Consequences
- Proposals are longer (mapping table) but every prop has a source; deferred upstream features are
  visible in the backlog.
- The existing components are re-checked against their upstream API with `/component` (Update
  mode). Changes are additive unless approved; nothing is published yet.
- `anatomy.ts` attribute helpers are generated from the schemas; their public names stay.
