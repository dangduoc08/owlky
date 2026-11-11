---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Chart waffle charts (ApexCharts `waffle`). `type="waffle"` fills a grid of cells (`data-ok-chart-unit-cell`, grouped by category in `data-ok-chart-unit-group`) from one series with a value per category. `total` shares that many cells by the largest remainder (`100` for a percentage waffle); without it one cell stands for `unitValue` units, up to `maxUnits`. `columns`, `fillFrom`, `cellRadius` and `spacing` shape the lattice. `split` draws one mini waffle per category (`tileColumns`, `splitMax`, `trackColor`, `data-ok-chart-unit-track` and `data-ok-chart-unit-title` parts). A category is one tooltip and keyboard item: the arrow keys move between categories and its cells light up together; clicks, Enter and Space select it; the legend hides categories. `colorBlindMode` gives each category its own shape. `total` keeps its donut center meaning. New story: Waffle.
