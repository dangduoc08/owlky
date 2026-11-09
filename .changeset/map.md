---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add the Map (ADR-0025), built on MapLibre GL JS: styles that follow the theme (`mapStyle`, `mapStyleDark`), markers (draggable with the pointer or the arrow keys), popups that take and return focus, GeoJSON and tile sources with layers (clusters, heatmaps, filters; `var(--ok-…)` token colors), camera control, and Owlky controls (navigation, geolocate, fullscreen, scale, attribution, globe, terrain, custom) and panels. React: `MapView` (react-map-gl's `Map`) and its parts with react-map-gl's props. HTML: opt-in `@owlky/html/map` or `owlky-map.js` (with `owlky-map-worker.js`), declarative sources and layers, popup and fly-to triggers. Without WebGL the map shows a fallback and its description.
