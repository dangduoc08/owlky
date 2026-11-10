---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Data grid charts integration: several charts per grid (MUI X: several renderer proxies with an `id` and a `label`). `chartModels` holds one chart model per chart id (`initialState.chartsIntegration.charts`, `onChartModelsChange`), a model's new `label` names its chart, and the charts render one after the other inside the grid (`div[data-ok-data-grid-chart][data-ok-chart-id]`, `Chart#<id>-chart-<chart id>`). The chart panel gets a **Chart** select that picks the chart it edits: `activeChartId` / `onActiveChartIdChange`, `apiRef.setChartModels` / `setActiveChartId`. In HTML, the models are `data-ok-chart-models` (JSON) and `data-ok-active-chart-id`; `ok:data-grid:chart` carries the chart's `id`, the new cancelable `ok:data-grid:activechart` reports a switch, and the instance has `chartModels`, `activeChartId`, `setChartModels` and `setActiveChartId`. Exported and restored states keep the charts. Core exports `sanitizeGridChartModels` and `gridActiveChartId`; new label `chartsActive` in every locale pack. The Charts integration story adds Multiple charts. The CDN bundle's budget goes from 190 to 195 kB (190.3 kB).
