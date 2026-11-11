# Map

Reference: Minimal UI kit "Map" page (sections Change theme, Markers & popups, Draggable markers,
GeoJSON animation, Clusters, Interaction, Viewport animation, Highlight by filter, Heatmap, Side by
side), content only. Upstream: react-map-gl (props mapped prop by prop, ADR-0015) on MapLibre GL JS
(ADR-0025). Created with `/component`.
Reference URL: https://minimals.cc/components/extra/map
HTML source: built from MapLibre GL JS
Breaking (unpublished): the scale bar helper `mapScale(meters, maxWidth, unit)` is now
`mapScaleBar`; `mapScale` classifies choropleth values.

## Purpose
Interactive vector maps: styles that follow the theme, markers, popups, data layers (GeoJSON,
clusters, heatmaps, highlights), camera control and the usual map controls. MapLibre GL JS runs in
core `createMapController` (`@owlky/core/map`), shared by React and the HTML runtime; everything
around the canvas (controls, markers, popups, panels, credits, scale) is Owlky markup.

## Anatomy
```
div[data-ok-map][data-ok-longitude|latitude|zoom|pitch|bearing]?[data-ok-min-zoom|max-zoom|min-pitch|max-pitch]?
   [data-ok-projection][data-ok-<handler>="false"]?[data-ok-cooperative-gestures]?[data-ok-render-world-copies="false"]?
   [data-ok-map-style][data-ok-map-style-dark]?[data-ok-bounds="w,s,e,n"]?[data-ok-max-bounds]?
   [data-ok-interactive-layer-ids="a b"]?[data-ok-label]?[data-ok-style-diffing="false"]?
   [data-ok-light=JSON]?[data-ok-sky=JSON]?[data-ok-padding="t r b l"]?
   [data-ok-ready]? (style in) [data-ok-loaded]? (first full render) [data-ok-fallback]? [data-ok-fullscreen]?
  div[data-ok-map-view]                       MapLibre: div.maplibregl-canvas-container › canvas[role=region][tabindex=0]
                                                [aria-label][aria-describedby][aria-roledescription=map]; div[data-ok-map-user-location]?
  div[data-ok-map-fallback]                   text (default from labels.fallback when empty)
  p[data-ok-map-description][id]?             text alternative (visually hidden; shown with the fallback)
  div[data-ok-map-status][role=status]        location announcements (visually hidden)
  div[data-ok-map-marker][data-ok-longitude][data-ok-latitude][data-ok-anchor][data-ok-color][data-ok-offset]?
     [data-ok-draggable]?[data-ok-rotation]?[data-ok-rotation-alignment]?[data-ok-pitch-alignment]?
     [data-ok-scale]?[data-ok-click-tolerance]?
     [role=button][tabindex=0][aria-label]? (interactive) [data-ok-dragging]? (state)
    svg[data-ok-map-pin] | content
  div[data-ok-map-popup][role=dialog|tooltip][tabindex=-1][aria-label]?[data-ok-longitude][data-ok-latitude]
     [data-ok-anchor]?[data-ok-offset]?[data-ok-max-width]?[data-ok-close-on-click="false"]?[data-ok-close-on-move]?
     [data-ok-focus-after-open="false"]?[data-ok-current-anchor] (controller) [hidden]? (HTML: closed)
    span[data-ok-map-popup-tip][aria-hidden] + div[data-ok-map-popup-content] + button[data-ok-map-popup-close][aria-label]?
  div[data-ok-map-source][data-ok-id][data-ok-type][hidden] › div[data-ok-map-layer][data-ok-id][data-ok-type][hidden]   (HTML only)
  div[data-ok-map-panel][data-ok-position][data-ok-theme=dark]
  div[data-ok-map-regions][data-ok-source][data-ok-layer]?[data-ok-source-layer]?[id]?   (choropleth)
    div[data-ok-map-regions-list][role=listbox][tabindex=0][aria-label]? [id] [aria-activedescendant] [data-ok-hovering]? (controller)
      div[data-ok-map-region][role=option][id][data-ok-id][aria-selected][data-ok-active]?[data-ok-hovered]?   (controller, from the rows)
    table › caption + thead (th[scope=col] × 2) + tbody › tr[data-ok-id] › th[scope=row] + td[data-ok-value]?
  div[data-ok-map-corner=top-left|top-right|bottom-left|bottom-right]   (always the four, in this order)
    div[data-ok-map-control][data-ok-map-navigation][data-ok-visualize-pitch]?
      button[data-ok-map-action=zoom-in|zoom-out][aria-label][aria-disabled]
      button[data-ok-map-action=compass] › svg[data-ok-map-compass-icon] › path[data-ok-map-compass-north|south]
    div[data-ok-map-control][data-ok-map-geolocate][data-ok-track-user-location]?[data-ok-show-user-location="false"]?[data-ok-show-accuracy-circle="false"]?
      button[data-ok-map-action=geolocate][data-ok-state=off|waiting|active|error][aria-pressed]? (tracking)
    div[data-ok-map-control] › button[data-ok-map-action=fullscreen][aria-pressed] › svg[data-ok-map-icon=enter] + svg[data-ok-map-icon=exit]
    div[data-ok-map-control] › button[data-ok-map-action=globe|terrain][aria-pressed] (terrain: data-ok-source, data-ok-exaggeration)
    div[data-ok-map-scale][data-ok-unit][data-ok-max-width]?   text and width from the controller
    details[data-ok-map-attribution][data-ok-compact]?[data-ok-narrow]? (controller) › summary[aria-label] › svg + div[data-ok-map-attribution-text]
    div[data-ok-map-legend][data-ok-variant=classes|gradient][data-ok-interactive="false"]?[role=group][aria-labelledby|aria-label]
      p[data-ok-map-legend-title][id]?
      ul[data-ok-map-legend-classes] › li › button[data-ok-map-legend-class][data-ok-min][data-ok-max][aria-pressed] | [data-ok-null]
                                           (static: span[data-ok-map-legend-class]) › span[data-ok-map-legend-swatch][data-ok-swatch][aria-hidden] + span[data-ok-map-legend-label]
      | div[data-ok-map-legend-gradient] › span[data-ok-map-legend-bar][aria-hidden] › span[data-ok-map-legend-stop][data-ok-swatch]×n
                                         + div[data-ok-map-legend-ticks] › span (min) + span (max)
      | ul[data-ok-map-legend-sizes][data-ok-radius] (variant=size, 4.18.94) › li › span[data-ok-map-legend-circle][data-ok-radius][aria-hidden] + span[data-ok-map-legend-label]
  div[data-ok-map-control] (MapControl: author content)
```
Sources and layers: `data-ok-data` (URL or inline JSON), `data-ok-url`, `data-ok-tiles` (URLs
separated by spaces), `data-ok-tile-size`, `data-ok-min-zoom`, `data-ok-max-zoom`, `data-ok-bounds`
(JSON), `data-ok-scheme`, `data-ok-attribution`, `data-ok-cluster`, `data-ok-cluster-radius`,
`data-ok-cluster-max-zoom`, `data-ok-cluster-min-points`, `data-ok-cluster-properties` (JSON),
`data-ok-promote-id`, `data-ok-generate-id`, `data-ok-buffer`, `data-ok-tolerance`,
`data-ok-line-metrics`, `data-ok-encoding`, `data-ok-coordinates` (JSON); layers `data-ok-paint`,
`data-ok-layout`, `data-ok-filter` (JSON), `data-ok-source-layer`, `data-ok-min-zoom`,
`data-ok-max-zoom`, `data-ok-before-id`, and `data-ok-source` when not inside a source. Anything
else is ignored (allowlist). Paint and layout strings `"var(--ok-…)"` resolve to the token's value
(again when the color scheme changes).

## Options
<!-- options:map (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `longitude` | `data-ok-longitude="…"` | number | number | `0` | Center longitude in degrees (HTML: changing it moves the map). |
| `latitude` | `data-ok-latitude="…"` | number | number | `0` | Center latitude in degrees (−85 to 85). |
| `zoom` | `data-ok-zoom="…"` | number | number | `0` | Zoom level (0: the whole world). |
| `pitch` | `data-ok-pitch="…"` | number | number | `0` | Tilt in degrees (0: looking straight down). |
| `bearing` | `data-ok-bearing="…"` | number | number | `0` | Rotation in degrees clockwise from north. |
| `minZoom` | `data-ok-min-zoom="…"` | number | number | `0` | Lowest zoom level people can reach. |
| `maxZoom` | `data-ok-max-zoom="…"` | number | number | `22` | Highest zoom level people can reach (at most 24). |
| `minPitch` | `data-ok-min-pitch="…"` | number | number | `0` | Lowest tilt in degrees. |
| `maxPitch` | `data-ok-max-pitch="…"` | number | number | `60` | Highest tilt in degrees (at most 85). |
| `projection` | `data-ok-projection="…"` | style | `mercator` `globe` | `mercator` | Projection: a flat `mercator` map or a `globe` when zoomed out. |
| `boxZoom` | `data-ok-box-zoom="false"` turns it off | behavior | boolean | on | Shift + drag zooms to the drawn box. |
| `doubleClickZoom` | `data-ok-double-click-zoom="false"` turns it off | behavior | boolean | on | Double click zooms in. |
| `dragPan` | `data-ok-drag-pan="false"` turns it off | behavior | boolean | on | Dragging moves the map. |
| `dragRotate` | `data-ok-drag-rotate="false"` turns it off | behavior | boolean | on | Right-click drag (or Ctrl + drag) rotates and tilts the map. |
| `keyboard` | `data-ok-keyboard="false"` turns it off | behavior | boolean | on | Arrow keys pan, + and − zoom, Shift + arrows rotate and tilt (the map has focus). |
| `scrollZoom` | `data-ok-scroll-zoom="false"` turns it off | behavior | boolean | on | The mouse wheel and trackpad zoom. |
| `touchPitch` | `data-ok-touch-pitch="false"` turns it off | behavior | boolean | on | Two-finger vertical drag tilts the map. |
| `touchZoomRotate` | `data-ok-touch-zoom-rotate="false"` turns it off | behavior | boolean | on | Pinch zooms and two-finger twist rotates. |
| `renderWorldCopies` | `data-ok-render-world-copies="false"` turns it off | behavior | boolean | on | Repeats the world side by side when zoomed out. |
| `styleDiffing` | `data-ok-style-diffing="false"` turns it off | behavior | boolean | on | A new style is compared with the current one and only the differences are applied (off: the style reloads). |
| `cooperativeGestures` | `data-ok-cooperative-gestures` | flag | boolean | off | Page-friendly gestures: Ctrl + scroll zooms and two fingers pan, so the page keeps scrolling. |
| `fullscreen` | `data-ok-fullscreen` · event `ok:map:fullscreen` | state | — | — | Fills the screen (the fullscreen control; Escape leaves). |
<!-- /options:map -->

<!-- options:map-marker (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-marker`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `longitude` | `data-ok-longitude="…"` | number | number | — | Longitude of the point it marks. |
| `latitude` | `data-ok-latitude="…"` | number | number | — | Latitude of the point it marks. |
| `anchor` | `data-ok-anchor="…"` | style | `center` `top` `bottom` `left` `right` `top-left` `top-right` `bottom-left` `bottom-right` | `center` | Which part of the marker sits on the point (`bottom` for pins). |
| `color` | `data-ok-color="…"` | style | `primary` `secondary` `info` `success` `warning` `error` | `primary` | Color of the default pin. |
| `draggable` | `data-ok-draggable` | flag | boolean | off | People can drag the marker, or move it with the arrow keys once it has focus. |
| `rotation` | `data-ok-rotation="…"` | number | number | — | Rotation in degrees clockwise. |
| `scale` | `data-ok-scale="…"` | number | number | `1` | Size of the default pin (1: 26px). |
| `clickTolerance` | `data-ok-click-tolerance="…"` | number | number | — | Pixels a press may move and still count as a click, not a drag (default: the map's `clickTolerance`, 3). |
| `rotationAlignment` | `data-ok-rotation-alignment="…"` | style | `auto` `map` `viewport` | — | `map`: turns with the map; `viewport` and `auto`: stays upright. |
| `pitchAlignment` | `data-ok-pitch-alignment="…"` | style | `auto` `map` `viewport` | — | `map`: lies flat on a tilted map; `viewport` and `auto`: faces the screen. |
<!-- /options:map-marker -->

<!-- options:map-popup (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-popup`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `longitude` | `data-ok-longitude="…"` | number | number | — | Longitude of the point it points at. |
| `latitude` | `data-ok-latitude="…"` | number | number | — | Latitude of the point it points at. |
| `anchor` | `data-ok-anchor="…"` | style | `center` `top` `bottom` `left` `right` `top-left` `top-right` `bottom-left` `bottom-right` | — | Which side of the popup points at the point (default: picked so the popup fits). |
| `maxWidth` | `data-ok-max-width="…"` | number | number (px) or `px` `rem` `em` length | `240` | Widest the popup gets, in px. |
| `closeOnClick` | `data-ok-close-on-click="false"` turns it off | behavior | boolean | on | A click on the map closes it. |
| `closeOnMove` | `data-ok-close-on-move` | flag | boolean | off | Moving the map closes it. |
| `focusAfterOpen` | `data-ok-focus-after-open="false"` turns it off | behavior | boolean | on | Moves focus into the popup when it opens (and back when it closes). |
<!-- /options:map-popup -->

<!-- options:map-navigation (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-navigation`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `visualizePitch` | `data-ok-visualize-pitch` | flag | boolean | off | The compass also tilts with the map. |
<!-- /options:map-navigation -->

<!-- options:map-geolocate (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-geolocate`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `trackUserLocation` | `data-ok-track-user-location` | flag | boolean | off | Keeps following the location: the button turns tracking on and off. |
| `showUserLocation` | `data-ok-show-user-location="false"` turns it off | behavior | boolean | on | Shows a dot at the location. |
| `showAccuracyCircle` | `data-ok-show-accuracy-circle="false"` turns it off | behavior | boolean | on | Shows a circle as wide as the location's accuracy. |
<!-- /options:map-geolocate -->

<!-- options:map-scale (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-scale`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `unit` | `data-ok-unit="…"` | style | `metric` `imperial` `nautical` | `metric` | Units: `metric`, `imperial` or `nautical`. |
| `maxWidth` | `data-ok-max-width="…"` | number | number | `100` | Longest the scale bar gets, in px. |
<!-- /options:map-scale -->

<!-- options:map-legend (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-legend`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `variant` | `data-ok-variant="…"` | style | `classes` `gradient` | `classes` | `classes`: one swatch and range per class; `gradient`: one bar from the lowest value to the highest. |
| `interactive` | `data-ok-interactive="false"` turns it off | behavior | boolean | on | Classes are toggle buttons: pressing some mutes the regions outside them. |
<!-- /options:map-legend -->

<!-- options:map-attribution (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-map-attribution`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `compact` | `data-ok-compact` | flag | boolean | off | Always folds the credits behind an info button (default: only on maps narrower than 640px). |
<!-- /options:map-attribution -->

Other props (React) ↔ HTML: `mapStyle` / `mapStyleDark` (URL or style object; HTML URLs only:
`data-ok-map-style` / `data-ok-map-style-dark`), `initialViewState` (`longitude`, `latitude`,
`zoom`, `pitch`, `bearing`, `bounds`, `fitBoundsOptions`; HTML root numbers and `data-ok-bounds`),
`viewState` / `longitude` … `bearing` (controlled; HTML: change the root numbers), `maxBounds`
(`data-ok-max-bounds`), `interactiveLayerIds` (`data-ok-interactive-layer-ids`), `cursor`,
`terrain`, `light` / `sky` (MapLibre light and sky; HTML JSON in `data-ok-light` / `data-ok-sky`,
re-applied after every style load; `null`: MapLibre's default light, no sky of ours), `padding`
(camera padding in px, `{ top, right, bottom, left }`; HTML `data-ok-padding` like CSS `padding`,
1–4 numbers; `map.setPadding`), `styleDiffing` (`data-ok-style-diffing="false"`; default `true`:
`setStyle(style, { diff })`, MapLibre fires `style.load` after a diff and the controller restores its
sources, layers, light and sky there),
`mapOptions` (any other MapLibre option, read once), `labels` (control names and
messages), `aria-label` (`data-ok-label`, the canvas name, default "Map"), `description`
(`p[data-ok-map-description]`), `fallback` (content of `[data-ok-map-fallback]`),
`attributionControl` (default `true`; HTML writes the attribution in the bottom-right corner).
Event props: `onLoad`, `onError`, `onIdle`, `onResize`, `onRemove`, `onRender`, `onData`,
`onStyleData`, `onSourceData`, `onMoveStart|Move|MoveEnd`, `onZoom…`, `onRotate…`, `onPitch…`,
`onDrag…`, `onBoxZoom…`, `onClick`, `onDblClick`, `onContextMenu`, `onMouseDown|Up|Move|Over|Out|
Enter|Leave`, `onWheel`, `onTouch…` (event: `{ type, viewState, lngLat?, point?, features?,
originalEvent?, error?, sourceId? }`), `onFullscreenChange`, `onFallback`.
Parts: `Marker` (`longitude`, `latitude`, `anchor`, `offset`, `color`, `draggable`, `rotation`,
`scale` (default pin size, `--_ok-map-pin-scale` through CSSOM), `clickTolerance` (px a press may move
before a drag starts; default the map's `mapOptions.clickTolerance`, 3), `rotationAlignment`,
`pitchAlignment`, `onDragStart|Drag|DragEnd({ lngLat })`, `onClick`,
children), `Popup` (`longitude`, `latitude`, `anchor`, `offset`, `closeButton`, `closeOnClick`,
`closeOnMove`, `focusAfterOpen`, `maxWidth`, `onClose(reason)`, `onOpen`), `Source` (MapLibre source
spec + `id`), `Layer` (MapLibre layer spec + `id`, `source`, `beforeId`), controls
`NavigationControl` (`showZoom`, `showCompass`, `visualizePitch`), `GeolocateControl`
(`trackUserLocation`, `showUserLocation`, `showAccuracyCircle`, `onGeolocate`, `onError`,
`onTrackUserLocationStart|End`), `FullscreenControl`, `ScaleControl` (`maxWidth`, `unit`),
`AttributionControl` (`compact`), `GlobeControl`, `TerrainControl` (`source`, `exaggeration`),
`MapControl` (custom), each with `position`; `MapPanel` (`position`); `MapProvider` + `useMap()`;
ref `MapRef` (`getMap()`, `controller`, `getViewState()`, `flyTo`, `easeTo`, `jumpTo`, `fitBounds`,
`exportMap(format?, { fileName?, download? })`).
Choropleth parts: `MapRegions` (`source`, `sourceLayer`, `layer`, `data: { id, name, value }[]`,
`caption`, `nameLabel`, `valueLabel`, `formatValue`, `listLabel`, `onRegionSelect({ id })`) and
`MapLegend` (`scale`, `position` default `bottom-left`, `variant`, `title`, `interactive`, `showNull`,
`nullLabel`, `formatter(item, index)`, `tickFormatter(value)`, `onLegendToggle({ classIndex, active })`);
helpers (core `@owlky/core/map`, re-exported by `@owlky/react`): `mapScale`, `mapRegionLayers`,
`mapScaleLabel`, `mapPaletteColors`, `jenksBreaks`, `greatCircle`.

API mapping (react-map-gl): renamed `Map` → `MapView` (a component named `Map` shadows the global `Map` in consumer modules, Biome `noShadowRestrictedNames`). Kept `mapStyle`, `initialViewState`, `viewState` and the view props,
`minZoom` … `maxPitch`, `maxBounds`, `projection`, `renderWorldCopies`, `cooperativeGestures`, the
eight handler props, `interactiveLayerIds`, `cursor`, `terrain`, `light`, `sky`, `padding`,
`styleDiffing`, `attributionControl`, every event
prop, `Marker` / `Popup` / `Source` / `Layer` props, the controls and their options, `MapProvider`,
`useMap`, `MapRef.getMap()`. Added `mapStyleDark` (theme), `description`, `fallback`, `labels`,
`onFullscreenChange`, `onFallback`, `MapPanel`, `Popup.onClose(reason)`. Renamed: other MapLibre
options go through `mapOptions` (`transformRequest`, `hash`, `fadeDuration`, `locale`,
`pixelRatio`…). Not applicable: `mapLib` (MapLibre is built in), `reuseMaps`, `RTLTextPlugin` (call
MapLibre's `setRTLTextPlugin` from `@owlky/core/map`'s MapLibre), `Marker.popup` (compose a
`Popup`; HTML `data-ok-map-popup-open`), `Marker.color` as any CSS color (palette names), `style`
props of parts (class names / CSS), `useControl` (use `MapControl`), `LogoControl` (MapLibre logo
is off; the attribution credits the data).

## Choropleth
Roadmap 4.18.15, after ApexMaps (apexcharts.com/apexmaps, docs checked 2026-11-10).
- `mapScale(values, { method, classes, palette, thresholds, nullColor, input })` (pure): `method`
  `quantile` (default; R-7 interpolated quantiles) · `equalInterval` · `jenks` (Fisher's exact
  natural breaks, O(k·n²)) · `threshold` (`thresholds`, classes = thresholds + 1); equal breaks
  are kept once (fewer classes). `palette`: a palette color (`lighter` … `darker`, five shades) or
  `grey` (200–800, seven), or a color array; colors are sampled evenly from the ramp and `classes`
  is capped at its length. Returns `{ method, min, max, breaks, classes[{ index, min, max, color,
  count }], colors, nullColor, nullCount, expression, gradient, classOf(value) }`; `expression` is
  `["case", is-number, ["step", input, c0, b1, c1, …], nullColor]`, `gradient` the same with
  `interpolate` (stops evenly from min to max). `input` defaults to `["feature-state", "value"]`.
  Colors are `var(--ok-…)` strings: the controller resolves them on add and again when a
  `data-ok-theme` / `data-ok-preset` changes or the system scheme flips.
- `mapRegionLayers({ id, source, sourceLayer?, scale, variant?, opacity = 0.8, mutedOpacity = 0.15 })`:
  a fill (`muted` → `mutedOpacity`, hover / focus / selected → +0.15) and `<id>-outline` (selected
  2.5px, hover / focus 1.5px `--ok-text-primary`, else 0.5px `--ok-bg-paper`).
- Regions (controller, both owners): each `tr[data-ok-id]` sets feature state `{ value, muted,
  selected, hover, focus }` on `{ source, sourceLayer, id }` (ids: a canonical number string → a
  number, else the string; the source needs ids, `promoteId`). States are written again after each
  style load and when the source object is re-created; rows that go away get `removeFeatureState`.
  The controller fills the list with one option per row (`<name>: <cell text>` or `labels.noData`),
  ids `<list id>-<n>` (list id: `<root id>-list`, else generated). Pointer: `mousemove` over
  `data-ok-layer` sets `hover` (and `data-ok-hovered` / `data-ok-hovering`, the visible readout) and
  the pointer cursor; a click toggles the single selection; clicks off the regions keep it.
- Legend: pressing a class toggles `aria-pressed` (controller-owned; React renders `false` only),
  regions outside the pressed classes get `muted` (a class is `[min, max)`, the last one includes
  `max`, `data-ok-null` matches regions without a value; none pressed: none muted). Swatches and
  the gradient bar get `--_ok-map-swatch` / `--_ok-map-gradient` through CSSOM from
  `data-ok-swatch` (`var(--ok-…)` or a CSS color; `url(` and declarations refused).
- Layout: legend on paper (like the controls, a candidate to compose Paper later), `--ok-radius-md`, `--ok-shadow-z1`, caption type, 12px swatches, 24px
  class rows, pressed `--ok-action-selected`; the readout is a paper chip at the top center
  (`--ok-shadow-dropdown`), visible while the list has `:focus-visible` (the active option) or the
  pointer is over a region (the hovered one). The table is visually hidden; with the fallback it is
  shown (scrolls) and the description becomes visually hidden.
- Not built (could, later): a hover tooltip with custom content (compose a `Popup` with
  `onMouseMove`), camera moves to the keyboard's region, bivariate / diverging scales, `log` /
  `sqrt` continuous scales, ordinal (category) scales, OkLab-resampled ramps (palette arrays are
  used as given), multi-selection, legend `align` / `width` / `marker`, ApexMaps' own geometry
  registry and `joinBy` (MapLibre sources and feature ids instead).

## Proportional symbols and hexbins
Roadmap 4.18.94 / 4.18.95, after ApexMaps' bubble and hexbin samples (checked 2026-11-11).
- `mapSizeScale(values, { method = "sqrt" | "linear", range = [4, 32], domain?, legendValues?, input = ["get", "value"] })`
  (pure, `symbols.ts`): `domain` defaults to the finite values' min / max (sqrt: min ≥ 0); a value
  maps to `r0 + (r1 − r0) · (t(v) − t(d0)) / (t(d1) − t(d0))` clamped, `t` = √ or identity; radii
  rounded to 0.01. Returns `{ method, min, max, range, nullCount, legend[{ value, radius }],
  expression, radiusOf(value) }`; `expression` = `["case", is-number, ["interpolate", ["linear"],
  ["sqrt", ["max", 0, input]] | input, t0, r0, t1, r1], 0]` (one radius when the domain is flat).
  Legend values: `legendValues`, else the max, 35% and 8% of the domain rounded to 2 significant
  digits; deduplicated, largest first, strictly shrinking radii.
- `mapBubbleLayer({ id, source, sourceLayer?, size, color?, opacity = 0.62, input })`: a `circle`
  layer; `circle-color` from a `mapScale` result (its own `input`: the second color field) or one
  color (default `--ok-palette-primary-main`); paper stroke 1px, `--ok-text-primary` 2px while
  hovered / focused / selected (feature state from `MapRegions`); `circle-sort-key` = −value
  (largest drawn first, ApexMaps `sortBySize`).
- `MapLegend variant="size" sizeScale`: nested circles bottom-aligned (`--_ok-map-radius`, list
  `--_ok-map-size-max`, CSSOM from `data-ok-radius`, 0–200), the value at each circle's top
  (`tickFormatter`); never toggles.
- `mapHexbin(points, { radius = 1, aggregate = "count" | "mean", valueProperty = "value", minCount = 1 })`
  (pure, `hexbin.ts`): pointy-top hexagons (radius in degrees of longitude) in the Web Mercator
  plane (cube rounding), one closed `Polygon` per non-empty cell, ids 0…n in order north → south,
  west → east, properties `{ count, value, longitude, latitude }` (6 decimals); `mean` gives
  `null` below `minCount`. Points: `[lng, lat]`, `[lng, lat, value]`, `Point` features or a
  `FeatureCollection`; at most 500 000, |lat| ≤ 85.05113. Color with `mapScale(values, { input:
  ["get", "value"] })` (fixed `thresholds` keep legends comparable, ApexMaps `scale.domain`).
- Instance helpers for CDN pages: `sizeScale`, `hexbin` (and `pixelGrid`, below).
- Not built (ApexMaps): hexbin `radius` in screen pixels (rebinned on zoom), the `nearest`
  interaction radius (hit testing is MapLibre's), bubble clustering, a size legend `align`.

## Great circles, drilldown, export
Roadmap 4.18.16 (ApexMaps checked 2026-11-11: arc series, drilldown, breadcrumb).
- `greatCircle(from, to, { steps = 64 (1–1024; non-finite: 64), properties })` (pure, `@owlky/core/map`,
  `@owlky/react`, HTML instance): spherical interpolation, coordinates rounded to 6 decimals.
  Returns a GeoJSON `Feature`, a `LineString`, or a `MultiLineString` split at ±180° when a
  segment jumps more than 180° of longitude (crossing latitude linear between two samples).
  Opposite points go through a point at right angles (any great circle is shortest). Throws
  `RangeError` on non-finite coordinates or `|latitude| > 90`.
- Region drilldown is composition (story `region-drilldown`, no new API): `MapRegions` per level,
  `onRegionSelect` / `ok:map:regionselect` (pointer and keyboard), `fitBounds`, layer `filter` and
  `layout`, `Breadcrumbs` in a `MapPanel`. The selection is dropped when its row goes away.
- `exportMap("png", { fileName?, download = true })`: the canvas is read inside a `render` event
  (the buffer is cleared after each frame; no `preserveDrawingBuffer`), resolves with the `Blob`,
  saved as `<slug of fileName or labels.map>.png`. Rejects: `NotAllowedError` (no user gesture,
  only when `download`), `InvalidStateError` (no map, or removed before the frame), `TypeError`
  (format), `SecurityError` / `NotSupportedError` from the canvas (nothing saved).
- Not built (ApexMaps): arc `curvature`, `width.range`, `endpoints`, `flow` (compose layers),
  `drillTo` / `drillUp` methods and automatic parent detection (app data decides the level),
  overlays in the PNG (page elements), `svg` export (the Chart's `type="geo"` does it).

## Layout and tokens
Root: 480px high (`--ok-spacing` × 120), `--ok-radius-md`, `overflow: hidden`; fullscreen fallback is
fixed and fills the window at `--ok-z-modal`. Corners: 10px from the edges, column of controls with
8px gaps. Controls: paper, `--ok-radius-md`, `--ok-shadow-z1`, 32px buttons, 20px icons, dividers
between buttons, hover `--ok-action-hover`, focus ring `--ok-text-primary`, disabled
`--ok-action-disabled`, pressed `--ok-palette-primary-main`; compass north `--ok-palette-error-main`.
Pin: 26px, `--ok-c-main` of `data-ok-color`. Popup: paper, `--ok-radius-lg`, `--ok-shadow-dropdown`,
10px tip, 240px max width, close button 28px. Panel: grey 900 at 80% with a 6px blur,
`--ok-radius-lg`, white text, a nested dark theme for its controls. Scale: gradient
`--ok-palette-secondary-dark` → `--ok-palette-error-dark`, white caption text. Attribution: white at
84%, grey 800 caption text, a 24px info button when folded (narrower than 640px or `compact`).
Responsive: the root is fluid (`min-width: 0`); panels cap at the map's size and scroll; the
attribution folds below 640px of map width.

## States
`data-ok-ready` (first style loaded, overlays placed), `data-ok-loaded` (MapLibre `load`),
`data-ok-fallback`, `data-ok-fullscreen`; popups `hidden` (HTML) and `data-ok-current-anchor`;
markers `data-ok-dragging`; controls `aria-disabled` (zoom limits), `aria-pressed` (fullscreen,
globe, terrain, tracking), `data-ok-state` (geolocate); attribution `open`, `data-ok-narrow`.

## Behavior
- The controller mounts MapLibre on the view (attribution, logo and MapLibre controls off), labels
  the canvas, links the description and re-adds the owner's sources and layers after each style
  load. Without WebGL (or when MapLibre fails to start) it sets `data-ok-fallback` instead.
- `mapStyleDark` applies while the map's `color-scheme` is dark (a `data-ok-theme` scope or the
  system setting); scheme changes switch styles and re-read token colors.
- Markers and popups are positioned on every camera change through CSSOM (`--_ok-map-x|y`,
  rotations). Popups without `anchor` pick the side where they fit.
- Popups ask to close on their close button, Escape, a map click (`closeOnClick`) and camera moves
  (`closeOnMove`); the owner removes them (React) or the runtime hides them (HTML, cancelable).
  Opening moves focus into the popup (unless `focusAfterOpen` is off), closing returns it.
- Draggable markers follow the pointer (3px tolerance) or move 10px (Shift: 50px) per arrow key;
  the click that ends a drag is ignored. HTML stores the position in the marker's attributes; React
  reports `onDragEnd` (the marker stays where dropped until the props change).
- Controls: zoom buttons disable at the limits; the compass resets north (and the tilt with
  `visualizePitch`) and turns the map when dragged; geolocate flies to the location (tracking mode
  toggles a watch), shows a dot and accuracy circle and announces results and errors; fullscreen
  uses the Fullscreen API or a fixed fallback; globe toggles the projection; terrain toggles 3D
  terrain from a `raster-dem` source; scale and attribution follow the camera and the sources.
- HTML: `data-ok-map-popup-open="<id>"` toggles a popup (one open at a time),
  `[data-ok-map-fly-to="<map id>"][data-ok-view="lng,lat[,zoom[,pitch[,bearing]]]"][data-ok-duration]?`
  flies a map (click; `change` for checked radios), root and declaration attributes are observed.

## Keyboard
| Key | Action |
|---|---|
| Up / Down, Left / Right (regions list) | Previous / next region (no wrap) |
| Home / End, Page up / Page down (regions list) | First / last region; 10 regions |
| Letters (regions list) | Next region whose name starts with the typed text (700 ms buffer) |
| Enter / Space (regions list) | Select the active region, or clear it |
| Escape (regions list) | Clear the selection |
| Enter / Space (legend class) | Toggle the class (mute the regions outside the pressed classes) |
| Arrow keys (map) | Pan (MapLibre) |
| + / − (map) | Zoom (MapLibre) |
| Shift + arrows (map) | Rotate / tilt (MapLibre) |
| Enter / Space (button marker) | Click it |
| Arrow keys (draggable marker) | Move 10px; Shift: 50px |
| Escape | Close the focused popup; leave the fullscreen fallback |
| Tab | Map, markers, popups, panels, controls in DOM order |

## Accessibility
The canvas is a `region` named by `aria-label` (default "Map"), `aria-roledescription="map"` and
described by `[data-ok-map-description]`, which is shown when the map can't draw. Interactive
markers are buttons with names. Popups are dialogs (or tooltips for hover readouts) that take and
return focus. Control buttons are labelled (`labels`), report `aria-pressed` / `aria-disabled`, and
geolocation results are announced in the status region. Choropleths: the regions list is a
`listbox` (name from `listLabel` / `labels.regions`) whose options carry each region's name and
value (`aria-activedescendant`, `aria-selected`); the table (caption, column and row headers) holds
the same data for assistive technology and replaces the map in the fallback; legend classes are
toggle buttons in a named group with their ranges as text, so values never depend on color alone
(WCAG 1.1.1, 1.4.1). Draggable markers can also be moved with
the keyboard; stories also let a click place them (WCAG 2.5.7). Animations respect reduced motion
(MapLibre's camera and the stories' animated point, which can be paused, WCAG 2.2.2).

## Events / API
HTML (on the root unless noted): `ok:map:load|error|idle|movestart|move|moveend|zoomend|rotateend|
pitchend|click|dblclick|contextmenu|mousemove|mouseenter|mouseleave` (detail: the core `MapEvent`),
`ok:map:popupopen` / `ok:map:popupclose` (on the popup; `detail.reason`, cancelable),
`ok:map:markerdragstart|markerdrag|markerdragend` (on the marker; `detail.lngLat`),
`ok:map:fullscreen` (`{ fullscreen }`), `ok:map:geolocate` (`{ coords }`),
`ok:map:geolocateerror` (`{ code, message }`), `ok:map:trackuserlocation` (`{ tracking }`),
`ok:map:fallback` (`{ reason }`), `ok:map:regionselect` (on `[data-ok-map-regions]`, `{ id }`),
`ok:map:legendtoggle` (on the legend, `{ classIndex, active }`). Instance: `{ controller, map, viewState, flyTo, easeTo, jumpTo,
fitBounds, exportMap(format?, options?), setSourceData(id, data), getClusterExpansionZoom(source, clusterId), openPopup(popup),
closePopup(popup), fullscreen, setFullscreen(on), scale, greatCircle, sizeScale, hexbin, pixelGrid }` (core `mapScale`, `greatCircle`, `mapSizeScale`, `mapHexbin`, `mapPixelGrid`, for CDN pages). Worker: `setMapWorkerUrl(url)` from
`@owlky/core/map` (bundlers: `@owlky/core/map-worker.js`; `owlky-map.js` finds
`owlky-map-worker.js` next to itself).

## Security
Style, data and tile URLs go through `safeMapUrl` (`http(s)` only, relative resolved). Declarations
are read through an allowlist; JSON values only reach MapLibre's validated style. Attributions are
split into text and `http(s)` links (`target=_blank rel="noopener noreferrer"`), never parsed as
HTML. No `innerHTML`, no inline styles in markup (CSSOM only). CSP: MapLibre's worker needs
`worker-src 'self'` (`blob:` for a cross-origin worker URL); Trusted Types pages need a policy for
the worker URL (MapLibre calls `new Worker(url)`).

## Upstream API mapping

Upstream: react-map-gl (maplibre) `Map`, `Marker`, `Popup`, `Source`, `Layer`, controls
(visgl.github.io/react-map-gl/docs/api-reference/maplibre/…, checked 2026-11-09) on MapLibre GL JS.
The "API mapping" paragraph above records the details; this table adds a status per area.

| Upstream | Owlky | Status | Note |
|---|---|---|---|
| `Map` | `MapView` | renamed | avoids shadowing the global `Map` |
| Layout: `id`, `cursor` | same (`id` names the map for `useMap`) | kept | `style`: class names / CSS |
| Styling: `mapStyle`, `projection`, `renderWorldCopies`, `terrain` | same / `data-ok-map-style`, `-projection`, `-render-world-copies` | kept | `mapStyleDark` added (theme) |
| Styling: `light`, `sky` | same / `data-ok-light`, `data-ok-sky` (JSON) | kept | 4.18.79: reactive (compared by content), set again after every style load; `null` goes back to MapLibre's default light and removes the sky set before (a style's own sky stays until one is set) |
| Styling: `styleDiffing` | same / `data-ok-style-diffing="false"` | kept | 4.18.79: default `true` as upstream. Behavior change: a new style used to reload (`diff: false`); now it is diffed, and an equal style changes nothing (no `style.load`) |
| Camera: `initialViewState` (`bounds`, `fitBoundsOptions`), `longitude` … `bearing`, `viewState`, `minZoom` / `maxZoom` / `minPitch` / `maxPitch`, `maxBounds` | same / root numbers, `data-ok-bounds`, `-max-bounds` | kept | |
| Camera: `padding` | same / `data-ok-padding` | kept | 4.18.79: a root prop (`Partial<{ top, right, bottom, left }>`, missing sides 0); `initialViewState.padding` / `viewState.padding` deferred (use `padding`) |
| Input handlers (8 flags), `interactiveLayerIds` | same / `data-ok-<handler>="false"`, `-interactive-layer-ids` | kept | `cooperativeGestures` too |
| Callbacks: `onLoad` … `onSourceData` (every map, mouse, touch, move, zoom, rotate, pitch, drag, box zoom, data event) | same · `ok:map:*` | kept | HTML emits a subset (Events / API) |
| Other: `mapLib`, `reuseMaps` | — | not applicable | MapLibre built in |
| Other: `RTLTextPlugin`, `workerCount`, `maxParallelImageRequests` | MapLibre from `@owlky/core/map` | not applicable | global MapLibre settings, called by the app |
| Other: `workerUrl` | `setMapWorkerUrl(url)` | renamed | |
| Methods: `getMap()` (+ safe map methods on the ref) | `MapRef.getMap()`, `flyTo`, `easeTo`, `jumpTo`, `fitBounds`, `getViewState()` | kept | |
| Marker `longitude`, `latitude`, `anchor`, `offset`, `color`, `draggable`, `rotation`, `rotationAlignment`, `pitchAlignment`, `onClick`, `onDragStart` / `onDrag` / `onDragEnd` | same | kept | `color`: palette names |
| Marker `scale`, `clickTolerance` | same / `data-ok-scale`, `data-ok-click-tolerance` | kept | 4.18.79: `scale` sizes the default pin (custom content keeps its size, as upstream); `clickTolerance` default: the map's `mapOptions.clickTolerance` (3) |
| Marker `popup` | compose a `Popup` | not applicable | HTML `data-ok-map-popup-open` |
| Popup `longitude`, `latitude`, `anchor`, `offset`, `maxWidth`, `closeButton`, `closeOnClick`, `closeOnMove`, `focusAfterOpen`, `onOpen`, `onClose` | same | kept | `onClose(reason)` |
| Popup / Marker `style`, `className` | `className` | kept | `style` not applicable (strict CSP in HTML) |
| `Source`, `Layer` (MapLibre specs, `beforeId`) | same / hidden `data-ok-map-source` / `-layer` (allowlist) | kept | |
| `NavigationControl`, `GeolocateControl`, `FullscreenControl`, `ScaleControl`, `AttributionControl`, `GlobeControl`, `TerrainControl` (+ `position`) | same | kept | Owlky markup |
| `LogoControl`, `useControl` | — / `MapControl` | not applicable | |
| `MapProvider`, `useMap` | same | kept | |
| ApexMaps `scale.type` (`quantile`, `equalInterval` / `quantize`, `jenks` / `naturalBreaks`, `threshold`), `classes`, `breaks`, `palette`, `nullColor` | `mapScale({ method, classes, thresholds, palette, nullColor })` | renamed | `type` → `method`, `breaks` → `thresholds` (the result's `breaks` are the computed ones); continuous `linear` / `log` / `sqrt` and `ordinal` deferred |
| ApexMaps `legend.style` (`classes` · `gradient`), `interactive`, `title`, `position`, `showNull`, `formatter`, `tickFormatter`, event `legendToggle` | `MapLegend` `variant`, `interactive`, `title`, `position`, `showNull`, `formatter`, `tickFormatter`, `onLegendToggle` / `ok:map:legendtoggle` | kept | `style` → `variant`; `scale.nullLabel` → `nullLabel`; `align`, `width`, `marker` deferred |
| ApexMaps `states.muted.opacity`, `states.active` | `mapRegionLayers({ mutedOpacity })`, outline of `selected` | kept | |
| ApexMaps `series.joinBy`, `series.data` | `MapRegions data` joined by feature id (`promoteId`) | renamed | |
| ApexMaps accessibility (roving keyboard, data table) | `MapRegions` listbox + table | kept | |
| ApexMaps `tooltip`, `dataLabels`, `setSelection()`, `frameFeature()` | compose `Popup` / symbol layers; `fitBounds` | deferred | |
| ApexMaps arc series (`from`, `to`, `geodesic`) | `greatCircle(from, to)` + a `line` layer | renamed | `curvature`, `width.range`, `endpoints`, `flow` not built (compose layers) |
| ApexMaps `drilldown`, `breadcrumb`, `drilldown` / `drillup` events, `drillTo`, `drillUp` | `MapRegions` + `fitBounds` + `Breadcrumbs` (composition) | not applicable | app code owns the levels |
| ApexMaps bubble layer (`size.scale` `sqrt` · `linear`, `size.range`, `color`, `opacity`, `stroke`, `sortBySize`) | `mapSizeScale({ method, range })` + `mapBubbleLayer({ size, color, opacity })` | renamed (4.18.94) | `scale` → `method`; a second color field is a `mapScale` with its own `input`; legend `MapLegend variant="size"` |
| ApexMaps hexbin layer (`aggregate` `count` · `mean`, `minCount`, `scale.domain`) | `mapHexbin(points, { radius, aggregate, valueProperty, minCount })` + `mapScale` thresholds | renamed (4.18.95) | `radius` in degrees (cells fixed in the Mercator plane), not screen px |
| ApexMaps `geo.projection`, `geo.layout: 'hex'`, `geo.sphere`, `geo.graticule` | Chart `type="geo"` (ADR-0059) | renamed | SVG charts without tiles; `orthographic`, rotation, morphing not built |

## Parity notes
- Choropleth: the regions list's options, its `aria-activedescendant`, the legend's `aria-pressed`
  and the swatch properties are written by the shared controller in both implementations (React
  renders an empty list and `aria-pressed="false"`).
- React `Source` / `Layer` render no DOM; HTML writes `hidden` declarations (parity skips `hidden`).
- React renders a popup while it is open; HTML keeps closed popups `hidden` in the markup.
- HTML-only hooks ignored by parity: `data-ok-map-popup-open`, `data-ok-map-fly-to`, `data-ok-view`,
  `data-ok-duration`.
- React portals controls into the corners after mount (none in server markup); HTML writes them in
  the corners.
- Pixel parity masks the WebGL canvas and the panels and credits drawn over it: two page loads can
  render tiles at different moments. The DOM (including MapLibre's canvas container) is compared.
- Stories: Controls are not offered (stateful demos, like the Editor); options are covered by unit
  tests and the docs' Options tables.
