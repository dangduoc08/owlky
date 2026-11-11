---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Pixel maps. Chart `geoLayout="pixel"` draws each region of a geo chart as a lattice of cells: `pixelShape` (`circle`, `square` or `hexagon`; HTML `data-ok-pixel-shape`), `pixelSpacing` (px between cells, `data-ok-pixel-spacing`) and `pixelSize` (% of the spacing, `data-ok-pixel-size`); hits, tooltip, keyboard, legend and table work as before. Map: a "Pixel map" story builds the cells with `mapPixelGrid()` and joins them to `MapRegions` through `promoteId`. A "Pixel map" chart story.
