---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Chart icicle charts (ApexCharts v8 `icicle`, ADR-0058). `type="icicle"` draws the hierarchy of tree and sunburst charts in bands: one band per level, each node a cell as long as its share of its parent (`rect[data-ok-chart-icicle-cell]`). `direction` puts the root at the `top` (default), `bottom` (a flame graph), `left` or `right` (ApexCharts' `down` / `up` / `right` / `left` growth directions, renamed to the root's side as for trees); `leaf` defaults to `stop` (shallow branches end at their band) and `extend` reaches the far edge; `spacing`, `tint` and `dataLabels` work as for sunbursts; names are centered in cells at least 30px long. A click, Enter or Space zooms into a branch; `zoomType: "value"` (default) keeps its ancestors as full bands above it (a press on one zooms out to it), `both` makes the branch the top level; Escape and **Back** zoom out (`data-ok-drill-node`, `ok:chart:drill`, React `drillNode`). Arrow keys follow the direction: away from the root to the first child, toward it to the parent, along the band to the next cell. Core exports `layoutIcicle`, `chartZoomTypes` and `ChartIcicleOptions`. New story: Icicle.