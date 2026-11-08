---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart (phase 1 of ADR-0024): line, area, column (single, grouped, stacked, negative), horizontal bar, mixed and scatter charts, drawn as SVG by one layout engine in core for React (`Chart`) and HTML (`data-ok-chart`, data from a `<table>`). Legend buttons hide series, a tooltip follows the pointer, touch and the keyboard, and the data stays available as a visually hidden table. Options: `type`, `xType` (category, datetime, numeric), `curve`, `legend`, `fill`, `stacked`, `horizontal`, `height`, `markerSize`, `columnWidth`, `barHeight`, `yMin` / `yMax`, `yTitle`, value prefix / suffix, `locale` and custom formatters. Colors are palette names such as `info` or `primary-dark`.
