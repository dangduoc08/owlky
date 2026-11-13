---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart violin charts (ApexCharts `violin`). `type="violin"` draws the distribution of each category as a mirrored density curve (`data-ok-chart-violin`). `y` takes observations (a list of numbers) or `{ density: [[value, weight]], points }` for a precomputed curve; in HTML the cell holds the five-number summary as text and the data in `data-ok-samples` (observations) or `data-ok-density` (`value:weight` pairs). Curves are a Gaussian kernel density estimate (`kdeBandwidth`, default Silverman's rule; `kdeResolution`, default 64), scaled with `violinNormalize` (`individual` or `group`) and `bandwidthScale`, with `violinSide` for half a violin and `horizontal` to turn the chart. `violinBox` adds a quartile box, a median line and whiskers (`violinWhiskers`: `minmax` or `tukey`); observations draw as dots (`hideViolinPoints`, `violinPointSize`, `violinJitter`, `violinMaxPoints`, `unconstrainedViolinPoints`). The tooltip and the data table show the count and the five numbers (new part label `count`, localizable). `colorBlindMode` gives patterns and marker shapes. Core exports the violin statistics and `chartViolinCurve`. New story: Violin.
