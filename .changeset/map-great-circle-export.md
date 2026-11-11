---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Map great circles, region drilldown and PNG export (ApexMaps). Core `greatCircle(from, to, { steps, properties })` returns the geodesic arc as GeoJSON and splits it at the antimeridian (also on `@owlky/react` and the HTML instance). `exportMap("png", { fileName, download })` (React ref, HTML instance) resolves with a PNG of the canvas and saves it; it rejects outside a user gesture, before the map is drawn, or when the browser can't read the canvas. New stories: Great circles, Region drilldown (composes `MapRegions`, `fitBounds` and Breadcrumbs), Export.
