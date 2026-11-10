---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Walktour: the rest of react-joyride's step lifecycle. `before` / `after` hooks on the tour and on each step (the tour waits for a promise `before` returns, up to `beforeTimeout`, 5000 ms; HTML: `ok:walktour:beforestep` with `event.detail.waitUntil(promise)`, and the `step:after` event), `targetWaitTimeout` (a missing target is waited for, 1000 ms by default, before its step is skipped), `beaconTrigger` (`click` · `hover`), `closeButtonAction` (`close` · `skip`), `disableFocusTrap`, `scrollDuration` (eased scrolling, 300 ms), and the step fields `scrollTarget`, `spotlightTarget`, `isFixed` and `beaconPlacement` (HTML `data-ok-scroll-target`, `data-ok-spotlight-target`, `data-ok-is-fixed`, `data-ok-beacon-placement`). New events: `step:before-hook`, `step:after-hook`, `error`; the state carries `waiting` while the tour waits. Core: `createWalktourFlow`, the dispatch both implementations share.

Behavior changes: a step whose target isn't in the page now waits up to 1000 ms before it is skipped (set `targetWaitTimeout` to `0` for the old behavior); scrolling to a target is an eased 300 ms animation instead of the browser's smooth scroll; fixed targets are no longer scrolled to; `step:after` of the step that ends is reported before the next step's change (`onStepChange`, `ok:walktour:change`).
