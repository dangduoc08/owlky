---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
"@owlky/mcp": minor
---

Chart tooltip options (ApexCharts `tooltip.enabled`, `tooltip.shared` / `.intersect`, `tooltip.fixed`, `tooltip.custom`): `tooltip` (`data-ok-tooltip`) is `shared` (the default: every series of the category), `point` (the column, bar or point under the pointer; the arrow keys move value by value) or `none` (no tooltip is shown, but the status stays visually hidden, so the values the keyboard moves to are still announced). `tooltipFixed` (`data-ok-tooltip-fixed`: `topLeft`, `topRight`, `bottomLeft`, `bottomRight`) keeps the tooltip in a corner of the plot. Custom content: React `tooltipContent(context)` returns the tooltip's content from `{ title, rows, selected, points, active }`; in HTML, a `<template data-ok-chart-tooltip>` child of the chart is copied into the tooltip and its `data-ok-chart-tooltip-slot` elements (`title`, `state`, `row`, `name`, `value`, `marker`) get text only. Core exports `chartTooltipContext`, `chartTooltipFixed`, `chartTooltipModes` and `chartTooltipCorners`; `placeChartTooltip` takes an optional fixed corner. New stories: Tooltip options and Custom tooltip. Charts without these options behave exactly as before.
