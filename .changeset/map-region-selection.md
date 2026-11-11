---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Map: multiple and box selection of regions, linked maps (ADR-0065). `MapRegions multiple` (`data-ok-multiple`) keeps a set of selected regions (clicks and Enter / Space toggle, Shift + arrows add, Ctrl / Cmd + A selects all, Escape clears; `aria-multiselectable`); `boxSelect` (`data-ok-box-select`) adds Shift + drag box selection by label anchor (Alt adds, Escape cancels) and turns MapLibre's Shift + drag box zoom off meanwhile. `group` (`data-ok-group`) and `linkFilter` (`bidirectional`, `emit`, `receive`; `data-ok-link-filter`) link the regions of several maps: a selection fades the other maps' regions outside it. Behavior change: `onRegionSelect` and `ok:map:regionselect` now also report `ids` (every selected region). React `selection` sets the selection; HTML instance `selectRegions()` and `clearSelection()`. A "Region selection" story.
