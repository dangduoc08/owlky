---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Pattern fills and pictures for region classes (WCAG 1.4.1). Map: core `mapPatternLayer({ id, source, scale, patterns })` adds a texture per class over a choropleth (the Chart's pattern names, ApexMaps' `dots`, `lines`, `diagonal` as aliases); the map controller draws the `ok-pattern-<style>` images on demand; `MapLegend patterns` repeats them on the swatches (`data-ok-pattern`). Chart `type="geo"`: `fill="pattern"`, `fillPattern` and `colorBlindMode` give each class a pattern (legend markers too); `regions[].image` (HTML `th[data-ok-image]`; http(s), relative or `data:image` URLs only) fills a region with a decorative picture, fitted by `imageFit` (`cover`, `contain`, `fill`; `data-ok-image-fit`). Behavior change: geo regions are painted by CSS only when they have no `fill` attribute. "Pattern fills" stories for the Map and the Chart.
