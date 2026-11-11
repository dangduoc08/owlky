---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Generated descriptions of maps (ApexMaps `a11y.description: 'auto'`). Core `geoDescription()` writes the type, region count, value range with its extremes, the highest values, the classes and the regions without data, from translatable templates (`geoDescriptionStrings`). Map: `description="auto"` (HTML `p[data-ok-map-description][data-ok-auto]`) is written from the first `MapRegions` and legend; `descriptionStrings` / `setDescriptionStrings()` translate it. Chart: a new `description` option (`data-ok-description`) describes the plot (`aria-describedby`, a visually hidden `p[data-ok-chart-description]` in the plot) on every type; `"auto"` generates it on geo charts; `descriptionStrings` / `setDescriptionStrings()`.
