---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart beeswarm charts (ApexCharts unit `layout: "scatter"`, `y: "lanes"`). `type="beeswarm"` draws each observation as a dot (`data-ok-chart-bee`) in a lane per series, along the value axis: the dots push apart just enough not to overlap (`beeswarmSpread="swarm"`, the default) or spread by a fixed sequence (`jitter`). `orientation` turns the value axis, `markerSize` sets the dot radius (without it, dots fit the lane). Observations are named by `categories` or `{ x, y }` points, else numbered; the data table lists one row per observation. The tooltip and the keyboard walk the observations one by one. `colorBlindMode` and `markerShape` give each lane a shape. New story: Beeswarm.
