# ADR-0059: Chart: offline SVG geo maps (`type="geo"`)

**Status:** Accepted (2026-11-11, auto-approved under the owner's standing instruction). Extends
ADR-0024 and ADR-0025; nothing earlier is superseded.

## Context
Roadmap 4.18.17 (must, ApexMaps complete in Owlky, owner 2026-11-10): maps with no tile style: a
projection (Equal Earth), regions drawn as SVG with the chart's legend, tooltip and keyboard, and
hex tile layouts. The Map (ADR-0025) is MapLibre: WebGL, a worker, a style URL and about 440 kB
gzip on opt-in entries. A report or a dashboard often only needs a static, themed, accessible
picture of regions, on a page without WebGL, offline, or under a strict CSP. The Chart's contract
fits: React and HTML draw the same nodes from one layout, an HTML `<table>` is the data and the
accessible view, text widths are estimated, colors are palette names.

## Decision
1. **A chart type, `type="geo"`, in new files** (`core/src/chart/chart-geo.ts`). `renderChart`
   only dispatches to it. Layout mode `cell` with the region as the cell (arrow keys move to the
   nearest region center; hit test even-odd on the rings). A small addition to `ChartMark`
   (`geo`), the tooltip, the active outline and the selection outline. It does not import
   MapLibre: the Map's `mapScale` lives in a pure module (`map/choropleth.ts`) and is imported
   directly, so `owlky.js` grows only by the layout.
2. **Data model.** React: `geometry` (a GeoJSON `FeatureCollection`, a feature or a list; only
   `Polygon` and `MultiPolygon` are drawn) and `regions` (`{ id, name?, label?, value? }[]`),
   joined by `joinBy` (a feature property; default the feature's `id`, then its `id`, `iso_a2` or
   `name` property). HTML: the `<table data-ok-chart-data>` lists the regions (`th` name with
   `data-ok-value` for the id, `data-ok-label` for the tile text, `td` value) and the geometry comes
   from a JSON element (`data-ok-geometry="<id of a <script type="application/json">>"`, parsed with
   `JSON.parse`, never `innerHTML`) or a script (`instance.setGeometry(geojson)`). A data element is
   not executable, so strict CSP pages keep working. Limits for untrusted input: 2000 regions,
   400 000 coordinates.
3. **Projections.** `equalEarth` (default, Šavrič et al. 2018), `mercator` and `equirectangular`
   (the plane formulas, 40 lines). Rings are not resampled: the source geometry must be split at
   ±180° (Natural Earth is). `sphere` and `graticule` draw the globe's outline and 30° lines,
   and `sphere` makes the fit the whole globe instead of the features' box (ApexMaps `geo.sphere`,
   `geo.graticule`).
4. **Scale reuse.** `mapScale` classifies the values (`scaleMethod`: `quantile` default,
   `equalInterval`, `jenks`, `threshold` with `scaleThresholds`; `scaleClasses`, default 5). Its
   palette is the chart's: a color name allowlist (`data-ok-color`), so `colors` (one color: its
   five shades; several: a ramp) and themes work as for every chart. A region without a value is
   drawn in `--ok-bg-neutral` (`data-ok-no-data`) and says "No data" (`localeText.noData`).
5. **The chart's legend is the class legend.** One item per class (range as text); toggling a class
   mutes its regions (a `fill-opacity` attribute, CSS never sets it). `hidden` / `hiddenSeries` hold
   class indexes.
6. **Hex tiles.** `geoLayout="hex"` draws one hexagon per region, either at `hexCells` (`{ id, col,
   row }`, odd-r offset grid: `data-ok-cell="col,row"` on the table's `th`) or, without them,
   placed from the geometry's centroids (filled from the center outward, so the shape of the area
   survives). A hex map with `hexCells` needs no geometry at all.
7. **Relation to the Map.** Use the Map for pan, zoom, tiles, markers, popups and clusters. Use
   `type="geo"` for a static themed picture of regions with a data table: no pan or zoom, no
   basemap, no WebGL or worker. It shares `mapScale` so classes read the same in both.
8. **Not built** (ApexMaps): `orthographic` and rotation specs (need clipping), pan and zoom,
   morphing between shapes and hex, bubbles, markers and clustering on `type="geo"`, a `showNull`
   legend item, automatic label collision.

## Consequences
- Additive API (minor): one chart type, new props and options, parts `data-ok-chart-region`,
  `-sphere`, `-graticule`, table attributes `data-ok-cell` and `data-ok-label`, HTML
  `data-ok-geometry` and `setGeometry()`. Other chart types' trees and snippets are byte-identical.
- The geometry never ships with Owlky: the page provides it (Natural Earth, public domain, in the
  stories). There is no built-in geometry pack.
- Tests and stories are offline: the repository's Natural Earth US states.
