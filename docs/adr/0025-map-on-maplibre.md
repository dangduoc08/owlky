# ADR-0025: Map — MapLibre GL JS behind its own entry points

**Status:** Accepted (2026-11-08).

**Note (2026-11-13, ADR-0068 S6):** `owlky-map.js` was removed before 0.1.0. On a CDN page, `owlky.js` loads this component from its lazy module (`modules/map.js`) when the page holds one; the text below keeps the original decision.

## Context
The reference's "Map" page shows ten interactive maps (styles, markers and popups, draggable
markers, an animated GeoJSON point, clusters, interaction settings, viewport animation, highlight
by filter, a heatmap, side-by-side maps) built with react-map-gl. A vector map renderer (WebGL tile
rendering, label placement, style specification, gestures) is far too large to write again. The
owner chose **MapLibre GL JS** (BSD-3-Clause, the open-source fork of Mapbox GL JS; no account or
token) for both implementations (2026-11-08). react-map-gl is only a React wrapper around it.
Owlky's other runtime dependency so far is Tiptap (ADR-0023), reached through opt-in entries.

## Decision
1. **`maplibre-gl` is a dependency of `@owlky/core`**, pinned exactly (6.16.0, the newest release
   at least 14 days old; its young transitive releases are held back with scoped `overrides`).
2. **One controller in core** (`createMapController`, entry `@owlky/core/map`) mounts MapLibre on
   `[data-ok-map-view]`. Everything around the canvas is Owlky markup that React and HTML render
   the same way: controls (navigation, geolocate, fullscreen, scale, attribution, globe, terrain),
   markers, popups and panels. MapLibre's own controls, markers, popups and logo are off: their DOM
   uses class names, unlabeled icons and, for popups and attribution, HTML strings. The controller
   positions markers and popups through CSSOM (`--_ok-map-x|y`), reports intent (popup close,
   marker drag, fullscreen) and owns no content. React doesn't use react-map-gl; its API is
   mapped prop by prop (ADR-0015).
3. **Separate entry points.** `@owlky/core/map` is not re-exported from `@owlky/core`; the HTML
   `map` definition is not in `components` (not in `@owlky/html/auto` or `owlky.js`). Pages opt in
   with `@owlky/html/map` or `owlky-map.js` (an IIFE loaded after `owlky.js`, registered on the same
   runtime). MapLibre draws in a Web Worker: `owlky-map-worker.js` ships next to `owlky-map.js`
   (found from the script's URL), and bundlers point `setMapWorkerUrl()` at
   `@owlky/core/map-worker.js`. React's map components are tree-shaken when unused.
4. **Map styles come from the consumer.** `mapStyle` (and `mapStyleDark`, used while the map sits in
   a dark color scheme, so the map follows Owlky's theme) take a style URL or object. Owlky bakes in
   no tile service. Docs and stories use OpenFreeMap (free, no key, no request limit, commercial use
   allowed; attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" is shown by the
   attribution control from the style's sources).
5. **Declarative data in HTML.** Sources and layers are `[data-ok-map-source]` /
   `[data-ok-map-layer]` elements (`hidden`), read through an allowlist of attributes (JSON for
   `paint`, `layout`, `filter`); React passes the same specs as props to `Source` / `Layer`, which
   render no DOM.
6. **No WebGL, visible fallback (ADR-0006).** The controller feature-detects WebGL; without it (or
   when MapLibre fails to start) the root gets `data-ok-fallback`, a message replaces the canvas and
   the map's text description is shown.
7. **Security.** Every URL (styles, data, tiles) goes through `safeMapUrl` (`http(s)` only).
   Source attributions (HTML in styles) are split into text and `http(s)` links by Owlky, never
   parsed as HTML. CSP: MapLibre's worker needs `worker-src 'self'` (and `blob:` when the worker is
   on another origin). Under Trusted Types MapLibre's `new Worker(url)` needs a policy for the
   worker URL from the page (a `default` policy): documented, not worked around.

## Consequences
- Every Owlky install pulls MapLibre (about 295 kB gzip for the main thread, 147 kB for the
  worker), but only map pages load it. `owlky-map.js` and `owlky-map-worker.js` get their own size
  budgets.
- Tests never touch the network: unit tests use an inline style, e2e intercepts the OpenFreeMap
  requests and serves an offline style (Natural Earth land, public domain). Pixel parity skips the
  WebGL canvas (rendering timing differs between page loads); the DOM and the overlays are compared.
- New MapLibre features (terrain sources, globe) reach both implementations at once through the
  controller.
