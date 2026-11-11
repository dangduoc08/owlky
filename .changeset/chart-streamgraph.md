---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Chart streamgraphs (ApexCharts `streamgraph`). `type="streamgraph"` stacks its series as bands around a moving baseline (`data-ok-chart-stream-band`), joined on x: a missing or negative value counts as zero. `streamOffset` sets the baseline (`wiggle`, the default, `silhouette`, `zero` or `expand`), `streamOrder` the stacking order (`inside-out`, the default, `inverse` or `none`). Series names are drawn on the bands where they fit; `hideStreamLabels` and `streamLabelMinWidth` control them. The value axis and the grid are hidden unless `yaxis` and `grid` ask for them. The tooltip lists each band's value from the top down and the column's total (not with `expand`); with `tooltip="point"` it follows one band and fades the others to `streamHoverOpacity`. `colorBlindMode` and `fillPattern` fill the bands with patterns. A numeric x axis is treated as labels. Core exports `chartStreamBands`, `chartStreamOffsets`, `chartStreamOrders` and the option types; `layoutChart` gains `drawSeries`. New story: Streamgraph.
