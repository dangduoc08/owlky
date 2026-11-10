---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Chart sunburst charts (ApexCharts v8 `sunburst`, ADR-0058). `type="sunburst"` draws the tree charts' hierarchy (`hierarchy` in React, one table row per node with its parent in HTML; ApexCharts' `x` / `y` data works too) as rings: each node is an arc of its parent's turn sized by its value (`path[data-ok-chart-arc]`), the roots' branches keep their palette color, and each level is paler (`tint`). `innerSize` sets the hole (15% by default), `startAngle` / `endAngle` the part of the circle (fitted to the SVG), `leaf` whether shallow branches `extend` to the edge or `stop`, `spacing` the gap between arcs, and `dataLabels` adds values to the names. Names are drawn along the radius or the ring where the estimated text fits (`text[data-ok-chart-partition-label]`). A click, Enter or Space zooms into a branch (ApexCharts `zoomOnClick`); the center disc, Escape and a **Back** button (`[data-ok-chart-drill]`, with the drilled path as a status) zoom out; `disableZoomOnClick` keeps the chart still. The state is `data-ok-drill-node` on the root, with `ok:chart:drill` (cancelable) and the instance's `drillNode` / `setDrillNode` in HTML, and `drillNode` / `defaultDrillNode` / `onDrillNodeChange` in React; `localeText.drillUp` renames the button. Arrow keys walk out, in and around the rings. Core exports `layoutSunburst`, `chartHierarchyAction`, `chartDrillUp` and `chartDrillLabels`. New story: Sunburst.