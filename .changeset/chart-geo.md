---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Chart geo maps without map tiles (ADR-0059, ApexMaps). `type="geo"` draws regions from GeoJSON as SVG: `geometry` and `regions` (`{ id, name?, label?, value? }`, joined by `joinBy`) in React; a table of regions with `data-ok-geometry="<id of a JSON script element>"` or `setGeometry()` in HTML. `projection` is `equalEarth` (default), `mercator` or `equirectangular`, `sphere` and `graticule` draw the globe. `geoLayout="hex"` draws equal hex tiles at `hexCells` (`{ id, col, row }`) or placed from the geometry. Values are classed by the Map's `mapScale` (`scaleMethod`, `scaleClasses`, `scaleThresholds`); the legend toggles classes, arrow keys walk the regions with the chart's tooltip, regions are selectable, and the table stays the accessible view. New stories: Geo map, Geo projections, Hex tile map.
