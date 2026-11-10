---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Date pickers (fields): `clearButtonPosition` and `openPickerButtonPosition` (`start` puts the button in a start adornment), public `startAdornment` / `endAdornment`, `shouldRespectLeadingZeros`, the field API (`fieldRef` in React; `getSections`, `getActiveSectionIndex`, `setSelectedSections`, `focusField` and `isFieldFocused` on the HTML `date-field` instance; core `createFieldApi`), the TextField props `color`, `margin`, `hiddenLabel` and `focused`, and `selectedSections` accepting `"all"` and a section type (`onSelectedSectionsChange` reports `"all"` on select-all). Fields, single input range fields and the date, time and date time pickers take them.

Behavior change: as in MUI, digit sections without padding in the format (`D`, `M`, `H`, `h`, `m`, `s`) now show two digits (`M/D/YYYY` shows `05/07/2025`). Set `shouldRespectLeadingZeros` (HTML `data-ok-should-respect-leading-zeros`) to keep the format's padding. `DateField`'s `endAdornment` is now your own adornment: the picker's open button no longer goes through it.
