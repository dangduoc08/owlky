---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/styles": minor
"@owlky/html": minor
---

Standalone inputs: `InputBase` (no box), `OutlinedInput` (`label` for the notch, `notched`), `FilledInput` (`disableUnderline`, `hiddenLabel`) and `Input` (`disableUnderline`): the TextField's field without a label or a helper text. `inputComponent` renders your own element instead of the `<input>`. TextField also takes `notched`, `disableUnderline` and `inputComponent`. HTML: the TextField markup without the label, with `data-ok-input-base` on the root (no `data-ok-variant` for an InputBase), `data-ok-notched` and `data-ok-disable-underline`. Core: `textFieldOptions.notched` and `textFieldOptions.disableUnderline`.
