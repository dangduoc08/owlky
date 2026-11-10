---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Walktour: option `offset` (`data-ok-offset`, on the tour and on a step): the distance between the spotlight and the step, or the tip of its arrow, in pixels (default 8, as before). Steps take an `id` and `data` (React step fields; HTML `data-ok-step-id` and JSON in `data-ok-step-data`), passed as `step: { id, data }` in every event (`onEvent`, `ok:walktour:event`) and hook argument (`before`, `after`, `ok:walktour:beforestep`). Core: `WalktourStepInfo`, `walktourStepInfo(element)`, controller `stepInfo(index)`, flow host option `step(index)`.
