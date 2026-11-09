# ADR-0039: Walktour — a state machine in core, steps as Popovers over a Backdrop with an SVG spotlight

**Status:** Accepted (2026-11-09)

## Context
The reference's "Walktour" page runs a five-step dashboard tour on react-joyride (v3): a tooltip
per step with a title, content, a progress line, Skip / Back / Next and a step count, a dimmed
overlay with a rounded cut-out around the target, and beacons. The owner wants every
react-joyride feature (the v2 option names), plus an HTML version: react-joyride is React only,
so the HTML side is written by us; no code is copied. Owlky already has the parts: the Popover
(anchored, top layer, flip and shift), the Backdrop, Button, IconButton and LinearProgress.

## Decision
1. **State machine in core, owned by the owners.** `walktourTransition(state, action, context)`
   (pure) holds react-joyride's rules: `status` (`idle`, `running`, `paused`, `skipped`,
   `finished`), `index` and `lifecycle` (`beacon` | `tooltip`); `close` moves to the next step's
   beacon, `next` / `prev` in a continuous tour go from tooltip to tooltip; missing targets are
   skipped. `walktourEvents(previous, next)` derives the event stream (`tour:start`,
   `step:before`, `beacon`, `tooltip`, `step:after`, `tour:end`, `tour:status`,
   `error:target-not-found`). React keeps the state (`run`, controlled `stepIndex`), the HTML
   runtime keeps it in the instance (`data-ok-run`, cancelable `beforechange`).
2. **One controller renders a state** (`createWalktourController(root).render(state)`) in both
   implementations and reports intent (`onIntent(intent, origin)`) from the buttons, Escape, the
   overlay and the beacon. Options are attributes on the root, overridable per step (`"false"`
   turns a tour option off), read on every render: React writes them from props, HTML authors
   write them.
3. **Composition.** Every step is rendered (React too, closed ones are closed popovers) as a
   Popover (`data-ok-popover`, its controller per step: top layer, `data-ok-current-placement`,
   arrow) with IconButton, Buttons and a LinearProgress inside. The overlay is an invisible
   Backdrop shown in the top layer under the step. Options that hide buttons set `hidden` from the
   controller, so React and HTML markup stay identical and Controls work in both.
4. **Spotlight without style strings.** An SVG in the overlay: a mask path (the viewport minus a
   rounded rectangle, `fill-rule="evenodd"`) whose `d` the controller writes with
   `setAttribute`, and a hole path that blocks presses on the target unless `spotlightClicks`.
   Positions go through CSSOM (`--_ok-popover-*`, `--_ok-walktour-beacon-*`,
   `--_ok-walktour-width`). Works under the strict CSP.
5. **Accessibility.** A step is a dialog, `aria-modal` while the overlay blocks the page (Tab
   wraps inside, the page outside the tour is `inert`); focus goes to the primary button, to the beacon when a step closes to it, and
   back when the tour ends; a polite live region says "Step 2 of 5".
6. **API (ADR-0015).** v2 names (`disableBeacon`, `spotlightClicks`, `showSkipButton`…) plus v3's
   `initialStepIndex`, `spotlightRadius` and step `width`; `callback` becomes `onEvent(type,
   data)` with `onStepChange` and `onStatusChange`; `getHelpers` becomes `apiRef`. Custom
   components, styles, hooks (`before` / `after`) and floating options are not applicable or
   deferred.

## Consequences
- `walktour.css` must load after backdrop, popover, button, icon-button and linear-progress
  (it restyles them through the step's private variables).
- The HTML Popover runtime also mounts an idle instance on each step (harmless: the walktour
  controller opens it).
- Story demo CSS that targets popover content must exclude walktour steps.
- About 3 kB of the CDN bundle and under 1 kB of CSS (gzip); no dependency.
