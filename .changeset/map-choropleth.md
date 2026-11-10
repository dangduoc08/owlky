---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Map: choropleths. Core `mapScale(values, { method: "quantile" | "equalInterval" | "jenks" | "threshold", classes, palette, thresholds, nullColor, input })` returns the class breaks, token colors (`var(--ok-palette-<color>-<shade>)`, resolved again on theme and preset changes) and MapLibre `step` / `interpolate` expressions; `mapRegionLayers()` builds the fill and outline layers on feature state (`value`, `hover`, `focus`, `selected`, `muted`); also `mapScaleLabel`, `mapPaletteColors`, `jenksBreaks`. New parts `MapRegions` (HTML `div[data-ok-map-regions]`: a keyboard listbox of the regions with name and value, and the data table, shown without WebGL) and `MapLegend` (`div[data-ok-map-legend]`, classes or gradient, interactive classes mute the other regions); events `onRegionSelect` / `ok:map:regionselect` and `onLegendToggle` / `ok:map:legendtoggle`; HTML instance `scale()`. A "Choropleth" story (US states, 2020 census). Breaking (unpublished): the scale bar helper `mapScale(meters, maxWidth, unit)` is renamed `mapScaleBar`.
