# ADR-0044: Collapse — `hidden` is the state, a core controller animates the size

**Status:** Accepted (2026-11-09)

## Context
MUI's Transitions page lists five transitions. Fade, Grow, Slide and Zoom are entrances and exits
that the Motion component already plays (ADR-less beta, `docs/roadmap.md` → Motion). Collapse is
different: it animates the *size* of a block between a collapsed size (0 by default) and its
content's natural size, which CSS can't do in the Baseline (ADR-0006): `height: auto` isn't
interpolable without `interpolate-size` / `calc-size()` (Chromium only). Three existing components
open and close at once with `hidden` and wait for it ("Pending integrations"): List nested lists,
Stepper `StepContent` (vertical) and Tree view groups. Their markup and APIs are approved and
tested; integrating Collapse must not change their structure.

Upstream (MUI `Collapse`, React only): `in`, `orientation`, `collapsedSize`, `timeout` (a number,
`{ appear, enter, exit }` or `"auto"`: a duration from the height), `easing` (one value or
`{ enter, exit }`), `component`, react-transition-group's `mountOnEnter`, `unmountOnExit` and the
six callbacks, `disablePrefersReducedMotion`. It renders three `div`s (root, wrapper, inner
wrapper) so it can measure the content.

## Decision
1. **One element, `hidden` is the closed state.** A Collapse is any element with
   `data-ok-collapse`; it is closed while it carries `hidden`. The owner writes `hidden` (React from
   `in`, HTML runtimes such as List, Tree view and Stepper as they already do, or the `collapse`
   runtime's API and triggers). Without JavaScript the content is shown or hidden exactly as the
   markup says. No wrapper elements: the component can sit on an existing element (React
   `component`, HTML an extra attribute), so dependents integrate without a DOM change.
2. **A core controller animates; it owns no state.** `createCollapseController(element, options)`
   watches `hidden` with a `MutationObserver` (its callback runs before the next paint) and plays
   the size change with the Web Animations API from the current size to the measured one: enter
   measures the natural size once `hidden` is gone; exit keeps the element rendered during the
   animation (an inline `display: … !important` through CSSOM, the value it had while open, because
   author CSS such as `[data-ok-list][hidden] { display: none }`, or Tailwind's preflight
   `[hidden] { display: none !important }` in `@layer base`, would otherwise win) and removes it
   when the animation ends. Interruptions start from the current animated size. `data-ok-state="entering"`
   / `"exiting"` exists only during the animation (it clips the overflow). The six callbacks
   (`onEnter` … `onExited`) report the phases; the HTML runtime turns them into
   `ok:collapse:<phase>` events. Without `element.animate` the change is instant and the
   callbacks still run.
3. **Timing comes from tokens.** The stylesheet sets `--_ok-collapse-duration`
   (`--ok-duration-standard`) and `--_ok-collapse-easing` (`--ok-easing-standard`) on every root;
   the controller reads them. `timeout` (milliseconds, `"auto"`, or separate enter / exit values)
   and `easing` (a CSS easing, `var(--ok-easing-*)` included; written to the custom property
   through CSSOM and read back resolved) override them. `"auto"` uses the duration formula of
   Material Design for the distance travelled, capped at 3 s. Under
   `prefers-reduced-motion: reduce` the stylesheet sets `--_ok-collapse-reduce: 1` and the change is
   instant, unless `data-ok-disable-prefers-reduced-motion`.
4. **Collapsed size through private properties and the controller.** A `collapsedSize` other
   than 0 (px number or CSS length) becomes `--_ok-collapsed-size` and `--_ok-collapse-closed-display` (core
   `collapseStyle`, React `style`, HTML runtime CSSOM): the closed element stays rendered at that
   size, clipped; the controller also writes that display inline (`!important`, see 2) so an
   important `[hidden]` reset can't hide it. Without JavaScript (no property) a closed Collapse is
   `display: none`. Both properties are reset on every root so nested Collapses don't inherit them.
5. **Dependents compose it.** List: `<Collapse component={List} in={open} timeout="auto">` /
   `data-ok-collapse` on the nested `ul`. Tree view: `TreeItem` renders its group as a Collapse
   (MUI X's default `groupTransition`). Stepper: `StepContent` is a Collapse with
   `timeout="auto"` (MUI's default `transitionDuration`) and `hidden` on inactive steps; the
   stepper runtime writes that `hidden`. Their existing `[hidden]` rules stay.

## Consequences
- Padding and borders on the Collapse element itself stay visible at size 0: put them on a child
  (the dependents have none on the collapsing element).
- Horizontal collapses lay their children out in a row that doesn't shrink (`flex-shrink: 0`), so
  content keeps its width while the root's width animates.
- `mountOnEnter` / `unmountOnExit` are React only: HTML markup is the content.
- `appear` (animate on first render), `addEndListener`, `slots` / `slotProps` and the wrappers'
  classes aren't offered: there is one element and the initial state is the markup's.
- A closed Collapse with a collapsed size keeps its content in the accessibility tree (as MUI).
