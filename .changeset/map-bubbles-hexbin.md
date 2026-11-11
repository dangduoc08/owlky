---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Map: proportional symbols and hexbins. Core `mapSizeScale(values, { method: "sqrt" | "linear", range, domain, legendValues, input })` returns radii, a MapLibre `circle-radius` expression and the circles of a size legend; `mapBubbleLayer({ id, source, size, color })` builds the circle layer (a second field colors it through a `mapScale` result, largest circles drawn first). `MapLegend` gets `variant="size"` with `sizeScale` (nested circles, HTML `ul[data-ok-map-legend-sizes]`). `mapHexbin(points, { radius, aggregate: "count" | "mean", valueProperty, minCount })` bins points into hexagon polygons to class with `mapScale`; `mapPixelGrid(geometry, options)` returns the cells of a pixel map. HTML instance helpers `sizeScale()`, `hexbin()` and `pixelGrid()`. "Bubbles" and "Hexbin" stories.
