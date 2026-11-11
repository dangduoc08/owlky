---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/styles": minor
"@owlky/html": minor
---

Map: reactive `light` and `sky` (set again after every style load), `styleDiffing` (default `true`), camera `padding`, and Marker `scale` and `clickTolerance`. Behavior change: a new map style is now diffed with the current one instead of reloaded (react-map-gl's default); set `styleDiffing={false}` to keep reloading. HTML: `data-ok-light` and `data-ok-sky` (JSON), `data-ok-padding` (1 to 4 numbers, like CSS `padding`), `data-ok-style-diffing="false"`, and `data-ok-scale` / `data-ok-click-tolerance` on markers. Core: `MapSettings` `light`, `sky`, `padding`, `styleDiffing`; `mapPadding`, `parseMapPadding`, `parseMapJson`; types `MapLight`, `MapSky`, `MapPadding`.
