---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart unit charts (ApexCharts `unit`). `type="unit"` draws each value as a number of marks: `unitLayout` places them in blobs per category (`grouped`, the default), one blob (`packed`, the smallest group in the middle unless `disableSortByGroup`), stacked columns (`columns`), a lattice (`grid`) or rows of seats on an arc (`arc`; `arcRows`, `innerSize`, `startAngle`, `endAngle`). `unitValue` and `maxUnits` set how many marks a value becomes, `clusterLabels` names clusters and columns, `markerShape`, `markerSize` and `spacing` shape the marks. As in waffle charts, a category is one item for the tooltip, the keyboard, selection and the legend. Pictogram and image marks, custom layout callbacks, per-mark tooltips and animated transitions between layouts are not built (see the spec). `orientation` and `total` gain chart-specific meanings for beeswarm and waffle charts. New story: Unit.
