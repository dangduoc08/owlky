---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart (phase 2 of ADR-0024): pie, donut, radial bar (rings and gauges) and radar charts, drawn by the same SVG engine for React and HTML. Pie, donut and radial bar charts draw one slice or ring per category; their legend shows and hides categories. New options: `dataLabels` (percentages on slices, values in bars and above points), `startAngle` / `endAngle`, `dashArray`, `trackWidth`, `total` and `totalLabel` (the center of donuts and radial bars).
