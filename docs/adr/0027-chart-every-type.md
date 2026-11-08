# ADR-0027: Chart — every ApexCharts chart type, phases 3 and 4 rescoped for dashboards

**Status:** Accepted (2026-11-08). Supersedes decision 6 (the phase table) of ADR-0024 for phases 3
and 4; the rest of ADR-0024 stands.

## Context
The owner will use Chart heavily for a developer-tools dashboard and wants every ApexCharts chart
type, not only the 18 demos of the reference page (2026-11-08). ApexCharts has no paid tiers of
chart types (one library, one license), so "every type" means its whole chart catalog. Compared
with it, the ADR-0024 phases miss bubble, range area, funnel / pyramid, slope, sparklines and
synchronized charts. Dashboards also need sparklines (charts in cards and table cells) and live
updates early, while ADR-0024 left the JavaScript data API (`updateSeries`) to phase 4.

## Decision
| Phase | Scope |
|---|---|
| 1 ✅ | Engine, legend, tooltip, keyboard, data table; Line, Area, Column single / multiple / stacked / negative, Bar, Mixed, Scatter |
| 2 ✅ | Pie, Donut, Radial bar, Radar, Semi circle gauge, Stroked gauge; data labels |
| 3 ✅ | BoxPlot, Heatmap, Treemap (reference); Bubble, Range area, Funnel / pyramid, Slope; Sparklines (no axes, sized by their container); a JavaScript data API (`updateSeries`, appending points) in React and HTML |
| 4 | Synchronized charts (shared tooltip and zoom), zoom and pan, brush, annotations, animations (honoring reduced motion), export (SVG, PNG, CSV), Candlestick, Range bar, Timeline, Polar area; data label formatters and styles, donut hole size, a legend with values |

## Consequences
- After phase 4, Owlky draws every ApexCharts chart type with our own engine (no ApexCharts code).
- Phase 3 grows: the new types reuse the phase 1 axes and scales; sparklines reuse the line, area
  and bar layouts without axes.
- The CDN bundle and CSS budgets will need raising in phase 3 (CSS is at 32.73 / 33 kB after
  phase 2); each raise keeps a measured reason in `scripts/check-size.mjs`.
