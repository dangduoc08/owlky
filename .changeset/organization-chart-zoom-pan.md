---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Organization chart: zoom, fit and center, after ApexTree (ADR-0056; opt-in, existing charts are unchanged). With `enableZoomPan` (`data-ok-enable-zoom-pan`), Ctrl or Command with the mouse wheel and trackpad pinches zoom at the pointer (a plain wheel still scrolls the page), **+** / **=** / **−** / **0** zoom on the focused scroll area or chart, and a mouse drag pans the composed Scrollbar. The level is CSS `zoom` on the chart, so the Scrollbar scrolls the zoomed size and focused controls scroll into view. State: React `zoom` / `defaultZoom` / `onZoomChange`, HTML `data-ok-zoom` with the cancelable `ok:organization-chart:zoom` event (`{ zoom, previous }`); limits `minZoom` (0.25) and `maxZoom` (2). Methods on `apiRef` and the HTML instance: `zoom(factor)`, `zoomIn()`, `zoomOut()`, `setZoom(level)`, `getZoom()`, `resetZoom()`, `fitScreen()` (up to 100%) and `centerOnNode(id)` (opens collapsed ancestors). New `OrganizationChartToolbar` (HTML `data-ok-organization-chart-toolbar="<chart id>"`): zoom out, the level (a polite `output`), zoom in, fit and reset IconButtons. Core: `createOrganizationChartZoom`, `organizationChartFitZoom`, `centerOrganizationChartNode`, `organizationChartViewport`, `clampOrganizationChartZoom`. Collapse now measures layout size under zoomed or scaled ancestors, so it animates to the right size there.
