import {
  mapAttributionOptions,
  mapGeolocateOptions,
  mapLegendOptions,
  mapMarkerOptions,
  mapNavigationOptions,
  mapOptions,
  mapPopupOptions,
  mapRegionsOptions,
  mapScaleOptions,
} from "@owlky/core";
import mapApi from "@owlky/docs-content/api/map.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { MapView, Marker, NavigationControl, ScaleControl } from "@owlky/react";
import bubbles from "../../../../../packages/html/src/components/map/examples/bubbles-group.html?raw";
import changeTheme from "../../../../../packages/html/src/components/map/examples/change-theme-group.html?raw";
import choropleth from "../../../../../packages/html/src/components/map/examples/choropleth-group.html?raw";
import exportMapGroup from "../../../../../packages/html/src/components/map/examples/export-map-group.html?raw";
import greatCircles from "../../../../../packages/html/src/components/map/examples/great-circles-group.html?raw";
import hexbin from "../../../../../packages/html/src/components/map/examples/hexbin-group.html?raw";
import interactionGroup from "../../../../../packages/html/src/components/map/examples/interaction-group.html?raw";
import markersGroup from "../../../../../packages/html/src/components/map/examples/markers-popups-group.html?raw";
import patternFills from "../../../../../packages/html/src/components/map/examples/pattern-fills-group.html?raw";
import pixelMap from "../../../../../packages/html/src/components/map/examples/pixel-map-group.html?raw";
import regionDrilldown from "../../../../../packages/html/src/components/map/examples/region-drilldown-group.html?raw";
import regionSelection from "../../../../../packages/html/src/components/map/examples/region-selection-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";
import { MAP_STYLES } from "./map-data.js";

/** The attribution control every map shows (MapLibre fills in the text). */
const ATTRIBUTION = snippetElement(markersGroup, "data-ok-map-attribution");
const indent = (text: string, spaces: number) =>
  text
    .split("\n")
    .map((line) => (line ? `${" ".repeat(spaces)}${line}` : line))
    .join("\n");
/** The parts inside every map root: the view, the fallback, the status and the four corners. */
const MAP_PARTS = `  <div data-ok-map-view></div>
  <div data-ok-map-fallback></div>
  <div data-ok-map-status role="status"></div>
  <div data-ok-map-corner="top-left"></div>
  <div data-ok-map-corner="top-right"></div>
  <div data-ok-map-corner="bottom-left"></div>
  <div data-ok-map-corner="bottom-right">
${indent(ATTRIBUTION, 4)}
  </div>`;

export const mapSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A map shows places and data that people can pan, zoom, tilt and turn. It is drawn by MapLibre GL JS, an open-source map engine, so both versions share the same behavior and markup. Around the map, Owlky draws its own controls, markers, popups and panels, which follow your theme and work with the keyboard.\n\nThe map is a separate script so that pages without one don't download the map engine. Load `owlky-map.js` after `owlky.js`. It finds its worker, `owlky-map-worker.js`, next to itself. With npm, import `@owlky/html/map` (HTML) or use the map components of `@owlky/react`, and point `setMapWorkerUrl()` at `@owlky/core/map-worker.js`.\n\nOwlky includes no map tiles. Pass the URL of a MapLibre style, for example one of OpenFreeMap's free styles, and keep the credits that the style requires.",
    html: `<!-- Load once per page: the styles, the runtime, then the map -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>
<script src="${CDN}/owlky-map.js" defer></script>

<div data-ok-map data-ok-label="Map of Europe"
  data-ok-map-style="${MAP_STYLES.light}"
  data-ok-map-style-dark="${MAP_STYLES.dark}"
  data-ok-longitude="10" data-ok-latitude="50" data-ok-zoom="3">
  <div data-ok-map-view></div>
  <div data-ok-map-fallback></div>
  <div data-ok-map-status role="status"></div>
  <!-- Markers, popups, data, panels -->
  <!-- Four corners for the controls (copy them from a snippet) -->
  <div data-ok-map-corner="top-left"></div>
  <div data-ok-map-corner="top-right"></div>
  <div data-ok-map-corner="bottom-left"></div>
  <div data-ok-map-corner="bottom-right">
${indent(ATTRIBUTION, 4)}
  </div>
</div>`,
    react: `import workerUrl from "@owlky/core/map-worker.js?url";
import { setMapWorkerUrl } from "@owlky/core/map";
import { MapView, NavigationControl } from "@owlky/react";

// Once, before the first map: where the map engine's worker is (Vite: ?url)
setMapWorkerUrl(workerUrl);

export function Europe() {
  return (
    <MapView
      aria-label="Map of Europe"
      mapStyle="${MAP_STYLES.light}"
      mapStyleDark="${MAP_STYLES.dark}"
      initialViewState={{ longitude: 10, latitude: 50, zoom: 3 }}
    >
      <NavigationControl position="bottom-left" />
    </MapView>
  );
}`,
  },
  {
    id: "styles",
    title: "Choose the map style",
    body: '`mapStyle` sets the style: a URL of a MapLibre style JSON, or the style object itself. Add `mapStyleDark` to switch styles when the map sits in a dark theme, such as the **Theme** menu\'s dark mode or a `data-ok-theme="dark"` area. Without it, the map keeps one style in both themes.\n\nIn HTML, change `data-ok-map-style` to switch the style later. In React, pass a new `mapStyle`, and keep style objects in a constant or `useMemo`, because the map compares every new object with the current style. It applies only the differences, so the camera and your own sources and layers stay as they are. Set `styleDiffing` to `false` (HTML: `data-ok-style-diffing="false"`) to reload the whole style instead.\n\nLayer colors can use Owlky tokens: write `"var(--ok-palette-info-main)"` as a paint value. The map reads the token\'s value, and reads it again when the theme changes.',
    html: `<div data-ok-map data-ok-label="Map"
  data-ok-map-style="${MAP_STYLES.light}"
  data-ok-map-style-dark="${MAP_STYLES.dark}">
${MAP_PARTS}
</div>`,
    react: `import { MapView } from "@owlky/react";

export function ThemedMap() {
  return (
    <MapView
      aria-label="Map"
      mapStyle="${MAP_STYLES.light}"
      mapStyleDark="${MAP_STYLES.dark}"
      initialViewState={{ longitude: 10, latitude: 50, zoom: 3 }}
    />
  );
}`,
  },
  {
    id: "markers",
    title: "Add markers and popups",
    body: "A marker sits on a point given by `longitude` and `latitude`. By default it is a pin in the `color` you choose. Set `anchor` to `bottom` for pins, so the tip touches the point. Give interactive markers a name with `aria-label`: a marker with a click handler or `draggable` is a button that people reach with Tab.\n\nA popup is a dialog that points at a place. It picks the side where it fits unless you set `anchor`, and `offset` moves it away from its marker. Escape, the close button and a click on the map close it. In React, a popup shows while you render it, and `onClose` asks you to remove it. In HTML, write popups with `hidden` and open them from a marker with `data-ok-map-popup-open`.\n\nWith `draggable`, people drag a marker or move it with the arrow keys. In HTML the marker stores its new position in its attributes. In React, update `longitude` and `latitude` in `onDragEnd`. Also let people place a marker with a click, because dragging is hard for some people. A press that moves less than `clickTolerance` pixels stays a click (default 3, or the map's `clickTolerance`). `scale` sizes the default pin: `2` doubles it.",
    html: `<div data-ok-map-marker data-ok-longitude="2.35" data-ok-latitude="48.86"
  data-ok-anchor="bottom" data-ok-color="error"
  role="button" tabindex="0" aria-label="Paris" data-ok-map-popup-open="paris">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-ok-map-pin><path d="M12 2.5A7.5 7.5 0 0 0 4.5 10c0 5.3 6.2 11 6.9 11.6a.9.9 0 0 0 1.2 0c.7-.6 6.9-6.3 6.9-11.6A7.5 7.5 0 0 0 12 2.5Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" fill="currentColor"></path></svg>
</div>
<div id="paris" data-ok-map-popup data-ok-longitude="2.35" data-ok-latitude="48.86"
  data-ok-offset="28" role="dialog" tabindex="-1" aria-label="Paris" hidden>
  <span data-ok-map-popup-tip aria-hidden="true"></span>
  <div data-ok-map-popup-content data-ok-paper>Capital of France</div>
  <button type="button" data-ok-map-popup-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"></path></svg></button>
</div>`,
    react: `import { MapView, Marker, Popup } from "@owlky/react";
import { useState } from "react";

export function Capital() {
  const [open, setOpen] = useState(false);
  return (
    <MapView aria-label="Map of France" mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: 2.35, latitude: 48.86, zoom: 5 }}>
      <Marker longitude={2.35} latitude={48.86} anchor="bottom" color="error"
        aria-label="Paris" onClick={() => setOpen(true)} />
      {open ? (
        <Popup longitude={2.35} latitude={48.86} offset={28} aria-label="Paris"
          onClose={() => setOpen(false)}>
          Capital of France
        </Popup>
      ) : null}
    </MapView>
  );
}`,
  },
  {
    id: "data",
    title: "Show data on the map",
    body: "A source holds data, such as GeoJSON points or polygons, and its layers draw it as circles, fills, lines, labels or a heatmap. The `paint`, `layout` and `filter` values follow the MapLibre style specification. A GeoJSON source can group nearby points in clusters with `cluster`.\n\nIn HTML, sources and layers are hidden elements inside the map. Write their `paint`, `layout` and `filter` as JSON in single-quoted attributes. Change an attribute, for example `data-ok-filter`, and the map updates the layer. For data that changes every frame, call `setSourceData(id, data)` on the instance instead.",
    html: `<div data-ok-map-source data-ok-id="quakes" data-ok-type="geojson"
  data-ok-data="earthquakes.geojson" data-ok-cluster hidden>
  <div data-ok-map-layer data-ok-id="clusters" data-ok-type="circle"
    data-ok-filter='["has","point_count"]'
    data-ok-paint='{"circle-color":"var(--ok-palette-info-light)","circle-radius":20}' hidden></div>
</div>`,
    react: `import { Layer, MapView, Source } from "@owlky/react";

export function Quakes() {
  return (
    <MapView aria-label="Earthquakes" mapStyle="${MAP_STYLES.light}">
      <Source id="quakes" type="geojson" data="earthquakes.geojson" cluster>
        <Layer id="clusters" type="circle" filter={["has", "point_count"]}
          paint={{ "circle-color": "var(--ok-palette-info-light)", "circle-radius": 20 }} />
      </Source>
    </MapView>
  );
}`,
  },
  {
    id: "events",
    title: "Respond to the pointer",
    body: "List the layers people can point at in `interactiveLayerIds` (HTML: `data-ok-interactive-layer-ids`, separated by spaces). Mouse events then report the features under the pointer in `features`, and the cursor turns into a pointer over them. `onMouseEnter` and `onMouseLeave` fire when the pointer enters or leaves those features. Use them for highlights and hover popups. Give a hover popup `closeButton={false}`, `closeOnClick={false}` and `focusAfterOpen={false}`.",
    html: `${snippetElement(interactionGroup, "data-ok-map ")}
<script type="module">
  const map = document.querySelector("#map-interaction");
  map.addEventListener("ok:map:mousemove", (event) => {
    console.log(event.detail.features[0]?.properties.name);
  });
</script>`,
    react: `import { MapView } from "@owlky/react";

export function MapEvents() {
  return (
    <MapView
      interactiveLayerIds={["states-fill"]}
      onMouseMove={(event) => console.log(event.features?.[0]?.properties["name"])}
    />
  );
}`,
  },
  {
    id: "choropleth",
    title: "Color regions by value",
    body: "A choropleth colors regions, such as countries or states, by a value. `mapScale(values, options)` sorts the values into classes and returns the class breaks, one color per class and a MapLibre expression that paints them. Pick the `method`: `quantile` (about as many regions in each class, the default), `equalInterval` (classes of the same width), `jenks` (natural breaks that keep similar values together) or `threshold` (your own `thresholds`). The colors come from the shades of a palette color, such as `primary`, so they follow the theme and the preset. Pass your own colors in `palette` if you need more than five classes.\n\n`mapRegionLayers({ id, source, scale })` returns two layers: a fill in the scale's colors and an outline that marks the region under the pointer, the one the keyboard is on and the selected one. The source needs a feature id for each region, so set `promoteId` to the property that names it.\n\n`MapRegions` joins your data to those regions by id (HTML: a `div[data-ok-map-regions]` with a table). It also gives keyboard users a list of the regions: press Tab to reach it, then use the arrow keys to move from region to region and hear its name and value. Enter selects a region, like a click on the map. The table holds the same data for screen readers, and the map shows it when the browser can't draw the map.\n\n`MapLegend` shows the classes in a corner of the map. Each class is a toggle button: press one or more to fade the regions outside them. Set `variant` to `gradient` for a continuous bar, and draw the fill with `scale.gradient` (`mapRegionLayers` with `variant: \"gradient\"`).",
    html: `<!-- The regions: feature ids from the state names, colors from mapScale() -->
${snippetElement(choropleth, "data-ok-map-source ")}

<!-- The data, joined to the regions by id -->
${snippetElement(choropleth, "data-ok-map-regions ")}

<!-- The legend sits in a corner -->
<div data-ok-map-corner="bottom-left">
${indent(snippetElement(choropleth, "data-ok-map-legend "), 2)}
</div>

<script type="module">
  const regions = document.querySelector("#map-choropleth-regions");
  regions.addEventListener("ok:map:regionselect", (event) => {
    console.log("Selected", event.detail.id);
  });
</script>`,
    react: `import {
  Layer,
  type LayerProps,
  MapLegend,
  MapRegions,
  MapView,
  mapRegionLayers,
  mapScale,
  Source,
} from "@owlky/react";

const STATES = [
  { id: "California", name: "California", value: 39.54 },
  { id: "Nevada", name: "Nevada", value: 3.1 },
  { id: "Oregon", name: "Oregon", value: 4.24 },
  { id: "Arizona", name: "Arizona", value: 7.15 },
];
const scale = mapScale(
  STATES.map((state) => state.value),
  { method: "jenks", classes: 3 },
);
const [fill, outline] = mapRegionLayers({
  id: "population-fill",
  source: "population",
  scale,
}) as unknown as [LayerProps, LayerProps];

export function PopulationMap() {
  return (
    <MapView
      aria-label="Map of western US states by population"
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -117, latitude: 38, zoom: 4 }}
    >
      {/* The state names are the feature ids */}
      <Source id="population" type="geojson" data="us-states.geojson" promoteId="name">
        <Layer {...fill} />
        <Layer {...outline} />
      </Source>
      <MapRegions
        source="population"
        layer="population-fill"
        data={STATES}
        caption="Population by state, 2020 census"
        nameLabel="State"
        valueLabel="Population"
        formatValue={(value) => \`\${value.toFixed(2)} million\`}
        onRegionSelect={(event) => console.log("Selected", event.id)}
      />
      <MapLegend scale={scale} title="Population (millions)" />
    </MapView>
  );
}`,
  },
  {
    id: "bubbles",
    title: "Size points by value",
    body: 'Proportional symbols draw a circle on each point whose size shows a value, such as the population of a city. `mapSizeScale(values, options)` turns the values into radii: with `method: "sqrt"` (the default) the circle\'s area follows the value, so a city twice as large looks twice as large; `linear` sizes the radius instead. `range` sets the radii of the lowest and the highest value in pixels (4 to 32 by default), and `input` names the feature property to read, such as `["get", "population"]`.\n\n`mapBubbleLayer({ id, source, size, color })` returns a circle layer that draws them: the largest circles first, so small ones stay on top, with an outline in the paper color. Color the circles by a second field with a `mapScale()` result whose `input` reads that field, or pass one color.\n\nA `MapLegend` with `variant="size"` and `sizeScale` shows nested circles with their values. Pick round values with `legendValues`. Join the points to `MapRegions` (with `promoteId` on the source) to give keyboard users a list of the points and screen readers a table of their values.',
    html: `<!-- The points, with the population and the growth of each -->
${snippetElement(bubbles, "data-ok-map-source ")}

<!-- Nested circles, in a corner -->
<div data-ok-map-corner="bottom-left">
${indent(snippetElement(bubbles, 'data-ok-variant="size"'), 2)}
</div>`,
    react: `import {
  Layer,
  type LayerProps,
  MapLegend,
  MapView,
  mapBubbleLayer,
  mapScale,
  mapSizeScale,
  Source,
} from "@owlky/react";

const CITIES = [
  { name: "New York", position: [-74.01, 40.71], population: 20.14, growth: 6.6 },
  { name: "Chicago", position: [-87.63, 41.88], population: 9.62, growth: 1.7 },
  { name: "Houston", position: [-95.37, 29.76], population: 7.12, growth: 20.3 },
];
const points = {
  type: "FeatureCollection" as const,
  features: CITIES.map(({ name, position, population, growth }) => ({
    type: "Feature" as const,
    properties: { name, population, growth },
    geometry: { type: "Point" as const, coordinates: position },
  })),
};
const size = mapSizeScale(
  CITIES.map((city) => city.population),
  { range: [6, 30], legendValues: [20, 10], input: ["get", "population"] },
);
// The growth colors the circles.
const color = mapScale(
  CITIES.map((city) => city.growth),
  { method: "threshold", thresholds: [10], palette: "warning", input: ["get", "growth"] },
);
const bubbles = mapBubbleLayer({
  id: "cities-bubbles",
  source: "cities",
  size,
  color,
  input: ["get", "population"],
}) as unknown as LayerProps;

export function CityBubbles() {
  return (
    <MapView
      aria-label="Map of three US cities by population"
      description="New York is the largest of the three cities; Houston grew the most since 2010."
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -85, latitude: 37, zoom: 3 }}
    >
      <Source id="cities" type="geojson" data={points}>
        <Layer {...bubbles} />
      </Source>
      <MapLegend variant="size" sizeScale={size} title="Population (millions)" />
    </MapView>
  );
}`,
  },
  {
    id: "hexbin",
    title: "Count points in hexagons",
    body: 'When there are too many points to read one by one, count them in hexagons. `mapHexbin(points, options)` returns one hexagon polygon for each cell that holds points, with its `count` and its `value`. Points are `[longitude, latitude]` pairs, `[longitude, latitude, value]` triples or GeoJSON `Point` features. `radius` sets the size of the hexagons in degrees of longitude (1 by default). The cells are regular on the map\'s Web Mercator projection.\n\nThe `value` is the count, or with `aggregate: "mean"` the mean of the points\' values (`valueProperty` names the property, `value` by default). Set `minCount` to leave cells with few points without a mean, so one point doesn\'t color a cell. Color the cells with `mapScale(values, { input: ["get", "value"] })`. Fixed `thresholds` keep the legend the same for any data, so maps stay comparable. In HTML, `hexbin` is also on the map\'s instance.',
    html: `${snippetElement(hexbin, "data-ok-map-source ")}

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-hexbin");
  const map = getRuntime().get(element, "map");
  const response = await fetch("maps/earthquakes.geojson");
  map.setSourceData("quake-bins", map.hexbin(await response.json(), { radius: 0.75 }));
</script>`,
    react: `import {
  Layer,
  type LayerProps,
  MapLegend,
  MapView,
  mapHexbin,
  mapScale,
  Source,
} from "@owlky/react";

const QUAKES: [number, number][] = [
  [-122.8, 38.8],
  [-122.81, 38.82],
  [-116.3, 38.4],
  [-104, 31.5],
  [-104.02, 31.6],
  [-103.9, 31.55],
];
const bins = mapHexbin(QUAKES, { radius: 0.75 });
const scale = mapScale(
  bins.features.map((cell) => cell.properties.value),
  { method: "threshold", thresholds: [2, 3], palette: "info", input: ["get", "value"] },
);
const fill = {
  id: "quake-bins-fill",
  type: "fill",
  paint: { "fill-color": scale.expression },
} as unknown as LayerProps;

export function QuakeHexbins() {
  return (
    <MapView
      aria-label="Earthquakes counted in hexagons"
      description="Most of the earthquakes are in western Texas."
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -112, latitude: 36, zoom: 4 }}
    >
      <Source id="quake-bins" type="geojson" data={bins}>
        <Layer {...fill} />
      </Source>
      <MapLegend scale={scale} interactive={false} title="Earthquakes per hexagon" />
    </MapView>
  );
}`,
  },
  {
    id: "pixel-map",
    title: "Draw a pixel map",
    body: "A pixel map is a choropleth drawn as a lattice of dots, squares or hexagons. `mapPixelGrid(geometry, options)` returns one small polygon for each lattice point inside each region, with the region's id in a property (`region` by default, `property` to rename it). `shape` is `circle` (the default), `square` or `hexagon`, `spacing` is the distance between the points in degrees of longitude (1 by default) and `size` is each cell's width as a share of the spacing (0.8 by default). `joinBy` names the feature property that holds each region's id.\n\nSet the source's `promoteId` to that property. Every cell of a region then shares the region's feature state, so `mapScale`, `mapRegionLayers`, `MapRegions` and `MapLegend` work as on a choropleth: the cells take the region's color, the list and the table give its value, and a legend class mutes its cells. In HTML, `pixelGrid` is also on the map's instance.",
    html: `${snippetElement(pixelMap, "data-ok-map-source ")}

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-pixel");
  const map = getRuntime().get(element, "map");
  const response = await fetch("maps/us-states.geojson");
  const states = await response.json();
  map.setSourceData("pixels", map.pixelGrid(states, { spacing: 0.8, joinBy: "name" }));
</script>`,
    react: `import {
  Layer,
  type LayerProps,
  MapRegions,
  MapView,
  mapPixelGrid,
  mapRegionLayers,
  mapScale,
  Source,
} from "@owlky/react";

const states = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Nevada" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-120, 35], [-114, 35], [-114, 42], [-120, 42], [-120, 35]]],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Utah" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-114, 37], [-109, 37], [-109, 42], [-114, 42], [-114, 37]]],
      },
    },
  ],
};
const STATES = [
  { id: "Nevada", name: "Nevada", value: 3.1 },
  { id: "Utah", name: "Utah", value: 3.27 },
];
const cells = mapPixelGrid(states, { shape: "square", spacing: 0.5, joinBy: "name" });
const scale = mapScale(
  STATES.map((state) => state.value),
  { classes: 2 },
);
const [fill] = mapRegionLayers({ id: "pixels-fill", source: "pixels", scale }) as unknown as [
  LayerProps,
];

export function SquareMap() {
  return (
    <MapView
      aria-label="Nevada and Utah as squares, by population"
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -114, latitude: 38.5, zoom: 4 }}
    >
      {/* Every cell of a state shares the state's feature state */}
      <Source id="pixels" type="geojson" data={cells} promoteId="region">
        <Layer {...fill} />
      </Source>
      <MapRegions
        source="pixels"
        layer="pixels-fill"
        data={STATES}
        caption="Population by state, millions"
      />
    </MapView>
  );
}`,
  },
  {
    id: "pattern-fills",
    title: "Fill classes with patterns",
    body: "Colors alone don't tell classes apart for everyone, or on a grayscale printout. Give each class a texture too. `mapPatternLayer({ id, source, scale, patterns })` returns a fill layer with one pattern per class of the scale: `circles` (dots), `horizontalLines`, `verticalLines`, `slantedLines` (diagonal lines) or `squares`, the same patterns as the Chart. `dots`, `lines` and `diagonal` work too. Without `patterns`, each class takes the next pattern, and `null` leaves a class plain. Regions without a value never get a pattern.\n\nDraw the pattern layer between the fill and the outline of `mapRegionLayers`. The map draws each pattern in a translucent black ink when the layer needs it, so the textures read on every class color and in both themes. Pass the same `patterns` to `MapLegend`: its swatches repeat the textures.",
    html: `${snippetElement(patternFills, "data-ok-map-source ")}

<!-- The legend's swatches carry the same patterns -->
<div data-ok-map-corner="bottom-left">
${indent(snippetElement(patternFills, "data-ok-map-legend "), 2)}
</div>`,
    react: `import {
  Layer,
  type LayerProps,
  MapLegend,
  MapView,
  mapPatternLayer,
  mapRegionLayers,
  mapScale,
  Source,
} from "@owlky/react";

const STATES = [
  { id: "California", name: "California", value: 39.54 },
  { id: "Nevada", name: "Nevada", value: 3.1 },
  { id: "Oregon", name: "Oregon", value: 4.24 },
];
const scale = mapScale(
  STATES.map((state) => state.value),
  { method: "jenks", classes: 2 },
);
const patterns = ["circles", "slantedLines"] as const;
const [fill, outline] = mapRegionLayers({
  id: "states-fill",
  source: "states",
  scale,
}) as unknown as [LayerProps, LayerProps];
const texture = mapPatternLayer({
  id: "states-texture",
  source: "states",
  scale,
  patterns,
}) as unknown as LayerProps;

export function PatternMap() {
  return (
    <MapView
      aria-label="Map of three western states by population"
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -118, latitude: 39, zoom: 4 }}
    >
      <Source id="states" type="geojson" data="us-states.geojson" promoteId="name">
        <Layer {...fill} />
        <Layer {...texture} />
        <Layer {...outline} />
      </Source>
      <MapLegend scale={scale} patterns={patterns} title="Population (millions)" />
    </MapView>
  );
}`,
  },
  {
    id: "region-selection",
    title: "Select several regions and link maps",
    body: "Set `multiple` on `MapRegions` (HTML: `data-ok-multiple`) to let people select several regions: a click toggles the region under the pointer, and in the list of regions Enter or Space toggles one, Shift with an arrow key adds the next one, Ctrl + A (Cmd + A on macOS) selects every region and Escape clears the selection. `boxSelect` (HTML: `data-ok-box-select`) also turns on Shift + drag: the regions whose label anchor falls in the box are selected. Hold Alt as well to add them to the selection, and press Escape to cancel the box. The map's own Shift + drag zoom is off while box selection is on; the zoom buttons, the wheel and the keyboard still zoom. Everything a box does has a keyboard path in the list, so no one needs to drag.\n\n`onRegionSelect` (HTML: `ok:map:regionselect`) reports `id`, the region toggled, and `ids`, every selected region. In React, pass `selection` to set the selection from your state, for example `[]` to clear it. In HTML, call `selectRegions(regions, ids)` or `clearSelection()` on the map's instance.\n\nGive the regions of several maps the same `group` (HTML: `data-ok-group`) to link them: the selection of one becomes a filter that fades the other maps' regions outside it, in both directions. `linkFilter` sets the direction: `bidirectional` (the default), `emit` (the map filters the others but shows no filter) or `receive` (it shows the others' filters only). The maps must use the same region ids.",
    html: `<!-- Shift + drag selects states; the group links this map to the dot map -->
${snippetElement(regionSelection, "data-ok-box-select")}

<!-- After the map -->
<button type="button" id="clear" data-ok-button data-ok-variant="outlined" data-ok-size="sm"><span data-ok-button-label>Clear selection</span></button>

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-select");
  const regions = element.querySelector("[data-ok-map-regions]");
  regions.addEventListener("ok:map:regionselect", (event) => {
    console.log("Selected", event.detail.ids);
  });
  // A button that clears the selection.
  document.querySelector("#clear").addEventListener("click", () => {
    getRuntime().get(element, "map").clearSelection();
  });
</script>`,
    react: `import {
  Button,
  Layer,
  type LayerProps,
  MapRegions,
  MapView,
  mapRegionLayers,
  mapScale,
  Source,
} from "@owlky/react";
import { useState } from "react";

const STATES = [
  { id: "California", name: "California", value: 39.54 },
  { id: "Nevada", name: "Nevada", value: 3.1 },
  { id: "Oregon", name: "Oregon", value: 4.24 },
];
const scale = mapScale(
  STATES.map((state) => state.value),
  { classes: 3 },
);
const layers = mapRegionLayers({ id: "states-fill", source: "states", scale }) as unknown as [
  LayerProps,
  LayerProps,
];

function StatesMap({ id, selection, onSelect }: {
  id: string;
  selection?: readonly (string | number)[];
  onSelect?: (ids: readonly (string | number)[]) => void;
}) {
  return (
    <MapView
      aria-label={\`Map \${id} of western states\`}
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -118, latitude: 39, zoom: 4 }}
    >
      <Source id="states" type="geojson" data="us-states.geojson" promoteId="name">
        <Layer {...layers[0]} />
        <Layer {...layers[1]} />
      </Source>
      <MapRegions
        source="states"
        layer="states-fill"
        data={STATES}
        caption="Population by state, millions"
        boxSelect
        group="west"
        selection={selection}
        onRegionSelect={(event) => onSelect?.(event.ids)}
      />
    </MapView>
  );
}

export function LinkedMaps() {
  const [selection, setSelection] = useState<readonly (string | number)[]>([]);
  return (
    <>
      <StatesMap id="1" selection={selection} onSelect={setSelection} />
      <StatesMap id="2" />
      <Button onClick={() => setSelection([])}>Clear selection</Button>
    </>
  );
}`,
  },
  {
    id: "auto-description",
    title: "Describe the map automatically",
    body: 'A map needs a text alternative that says what it shows, not only "a map of the United States". Set `description` to `auto` (HTML: an empty `p[data-ok-map-description]` with `data-ok-auto`) and the map writes it from its first `MapRegions` and legend: the type of map, the number of regions, the value range with its lowest and highest regions, the three highest values, the classes and the regions without data. Values read as in the table, for example "39.54 million". The text follows the data when it changes.\n\nTranslate it with `descriptionStrings` (HTML: `setDescriptionStrings()` on the map\'s instance). Each text is a template with placeholders, such as `summary: "{type} of {count} regions."`. `geoDescription()` returns the same text for your own use.',
    html: `<!-- The map fills this paragraph -->
<p data-ok-map-description id="map-patterns-description" data-ok-auto></p>

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-patterns");
  getRuntime().get(element, "map").setDescriptionStrings({
    summary: "{type} de {count} régions.",
    choropleth: "Carte choroplèthe",
  });
</script>`,
    react: `import { MapRegions, MapView } from "@owlky/react";

const STATES = [
  { id: "California", name: "California", value: 39.54 },
  { id: "Nevada", name: "Nevada", value: 3.1 },
];

export function DescribedMap() {
  return (
    <MapView
      aria-label="Map of two western states by population"
      description="auto"
      descriptionStrings={{ summary: "{type} de {count} régions.", choropleth: "Carte choroplèthe" }}
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -118, latitude: 38, zoom: 4 }}
    >
      <MapRegions source="states" data={STATES} caption="Population by state, millions" />
    </MapView>
  );
}`,
  },
  {
    id: "view",
    title: "Move the map",
    body: '`initialViewState` sets where the map starts: `longitude`, `latitude`, `zoom`, `pitch` and `bearing`, or `bounds` to fit. To control the view, pass `viewState` and update it from `onMove`. The map ref has `flyTo`, `easeTo`, `jumpTo` and `fitBounds`, and `getMap()` returns the MapLibre map for anything else.\n\nIn HTML, the root\'s `data-ok-longitude`, `data-ok-latitude` and `data-ok-zoom` set the view, and the map moves when you change them. Any element with `data-ok-map-fly-to="<map id>"` and `data-ok-view="longitude,latitude,zoom"` flies the map there when it is clicked, or when a radio button is selected. With reduced motion, the map jumps instead of flying.',
    html: `<button type="button" data-ok-map-fly-to="world" data-ok-view="139.69,35.69,10">
  Tokyo
</button>`,
    react: `import { MapView, type MapRef } from "@owlky/react";
import { useRef } from "react";

// Any MapLibre style URL, such as OpenFreeMap's
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export function FlyToTokyo() {
  const mapRef = useRef<MapRef>(null);
  return (
    <>
      <MapView
        ref={mapRef}
        aria-label="Map"
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: 10, latitude: 50, zoom: 3 }}
      />
      <button type="button" onClick={() => mapRef.current?.flyTo({ center: [139.69, 35.69], zoom: 10 })}>
        Tokyo
      </button>
    </>
  );
}`,
  },
  {
    id: "padding",
    title: "Keep the center clear of a panel",
    body: "When a panel covers part of the map, set `padding` in pixels for that side. The camera then centers, flies and fits bounds in the rest of the map, so places don't end up under the panel. In HTML, write `data-ok-padding` like CSS `padding`: one to four numbers for the top, right, bottom and left sides. The map follows a new padding at once.",
    html: `<div data-ok-map data-ok-label="Map beside a panel"
  data-ok-map-style="${MAP_STYLES.light}"
  data-ok-longitude="10" data-ok-latitude="50" data-ok-zoom="3"
  data-ok-padding="0 0 0 320">
${MAP_PARTS}
</div>`,
    react: `import { MapView } from "@owlky/react";

// Any MapLibre style URL, such as OpenFreeMap's
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export function MapBesidePanel() {
  return (
    <MapView
      aria-label="Map beside a panel"
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 10, latitude: 50, zoom: 3 }}
      padding={{ left: 320 }}
    />
  );
}`,
  },
  {
    id: "light-sky",
    title: "Set the light and the sky",
    body: "`light` lights 3D extrusions, such as buildings: `anchor`, `color`, `intensity` and `position`, as in a MapLibre style. `sky` sets the sky above a tilted map and the atmosphere around the globe, such as `atmosphere-blend`. Both follow new values. They replace the style's own light and sky, and stay when the style changes. Set them to `null` to go back to the default light and to remove the sky. In HTML, write them as JSON in `data-ok-light` and `data-ok-sky`.",
    html: `<div data-ok-map data-ok-label="Globe"
  data-ok-map-style="${MAP_STYLES.light}"
  data-ok-projection="globe" data-ok-zoom="1.5"
  data-ok-light='{"anchor":"map","intensity":0.6}'
  data-ok-sky='{"atmosphere-blend":0.8}'>
${MAP_PARTS}
</div>`,
    react: `import { MapView } from "@owlky/react";

// Any MapLibre style URL, such as OpenFreeMap's
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export function Globe() {
  return (
    <MapView
      aria-label="Globe"
      mapStyle={MAP_STYLE}
      projection="globe"
      initialViewState={{ zoom: 1.5 }}
      light={{ anchor: "map", intensity: 0.6 }}
      sky={{ "atmosphere-blend": 0.8 }}
    />
  );
}`,
  },
  {
    id: "controls",
    title: "Add controls",
    body: "Controls sit in the corners of the map: `NavigationControl` (zoom and a compass you can drag to turn the map), `GeolocateControl`, `FullscreenControl`, `ScaleControl`, `GlobeControl`, `TerrainControl` and `AttributionControl`, which every map shows unless you turn it off with `attributionControl={false}`. Place them with `position`, and add your own buttons in a `MapControl`. In HTML, write the controls inside the four corner elements.\n\nPut settings and readouts in a `MapPanel`: a dark, translucent card in a corner of the map.",
    html: `<div data-ok-map-corner="bottom-left">
${indent(snippetElement(changeTheme, "data-ok-map-navigation"), 2)}
${indent(snippetElement(changeTheme, "data-ok-map-scale"), 2)}
</div>`,
    react: `import { FullscreenControl, MapView, NavigationControl, ScaleControl } from "@owlky/react";

// Any MapLibre style URL, such as OpenFreeMap's
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export function MapControls() {
  return (
    <MapView
      aria-label="Map"
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 10, latitude: 50, zoom: 3 }}
    >
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <FullscreenControl position="top-left" />
    </MapView>
  );
}`,
  },
  {
    id: "security",
    title: "Use the map on a strict page",
    body: "The map accepts only `http` and `https` URLs for styles, data and tiles, and shows the credits of a style as text and links, never as HTML. Its engine draws in a Web Worker. With a Content Security Policy, allow the worker with `worker-src 'self'`, and add `blob:` when the worker comes from another origin, such as a CDN. Pages that enforce Trusted Types need a policy for the worker's URL.",
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. The map's options come first, then the marker, popup, control and legend options.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the style, the content and the callbacks. They aren't options, because HTML writes them as markup or listens to events.",
  },
  {
    id: "great-circles",
    title: "Draw great circle routes",
    body: "A great circle is the shortest path between two places on the globe. On a flat map it looks curved, which is why flight routes bend toward the poles. `greatCircle(from, to, options)` returns that arc as a GeoJSON feature, from two `[longitude, latitude]` positions. `steps` sets how many segments it has (64 by default), and `properties` become the feature's properties.\n\nAn arc that crosses the antimeridian (the 180° meridian, in the Pacific) comes back as a `MultiLineString` split at ±180°, so the line doesn't jump across the map. Coordinates that don't exist throw a `RangeError`. Add the features to a `line` layer. In HTML, `greatCircle` is also on the map's instance, for pages that load the map from the CDN.",
    html: `${snippetElement(greatCircles, "data-ok-map-source ")}

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-great-circles");
  const map = getRuntime().get(element, "map");
  map.setSourceData("routes", {
    type: "FeatureCollection",
    features: [map.greatCircle([103.99, 1.36], [-118.41, 33.94])],
  });
</script>`,
    react: `import { greatCircle, Layer, MapView, Source } from "@owlky/react";

// Singapore to Los Angeles: this arc crosses the antimeridian, so it has two parts
const routes = {
  type: "FeatureCollection" as const,
  features: [greatCircle([103.99, 1.36], [-118.41, 33.94])],
};

export function FlightRoutes() {
  return (
    <MapView
      aria-label="Flight route from Singapore to Los Angeles"
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: 160, latitude: 25, zoom: 1 }}
    >
      <Source id="routes" type="geojson" data={routes}>
        <Layer
          id="routes-line"
          type="line"
          paint={{ "line-color": "var(--ok-palette-primary-main)", "line-width": 2 }}
        />
      </Source>
    </MapView>
  );
}`,
  },
  {
    id: "region-drilldown",
    title: "Drill down into regions",
    body: 'A drilldown starts with large regions and shows the parts of the one people pick. Join each level to a source with `MapRegions` and listen for its select event: `onRegionSelect` in React and `ok:map:regionselect` in HTML. It fires for a click on the map and for Enter in the list of regions, so one handler covers the pointer and the keyboard.\n\nWhen a region is selected, change the data of `MapRegions`, hide the layers of the level above and call `fitBounds` with the frame of the region. Filter the next level\'s layers with a MapLibre expression, such as `["==", ["get", "region"], "West"]`. A `Breadcrumbs` component in a `MapPanel` shows the path. Keep the first item a button when it becomes the current page, so the focus stays on it when people go back.',
    html: `<!-- The level you start from, with the map's other parts -->
${snippetElement(regionDrilldown, "data-ok-map-regions ")}

<!-- The path -->
${snippetElement(regionDrilldown, "data-ok-breadcrumbs")}

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-drilldown");
  const regions = element.querySelector("[data-ok-map-regions]");
  regions.addEventListener("ok:map:regionselect", (event) => {
    if (event.detail.id === "West")
      getRuntime().get(element, "map").fitBounds([[-124.8, 31.3], [-102, 49]], { padding: 32 });
  });
</script>`,
    react: `import { Link, Breadcrumbs, MapPanel, type MapRef, MapRegions, MapView } from "@owlky/react";
import { useRef, useState } from "react";

const REGIONS = [
  { id: "West", name: "West", value: 78.59 },
  { id: "South", name: "South", value: 126.27 },
];
const WEST = [
  { id: "California", name: "California", value: 39.54 },
  { id: "Oregon", name: "Oregon", value: 4.24 },
];

export function RegionDrilldown() {
  const mapRef = useRef<MapRef>(null);
  const [region, setRegion] = useState<string | null>(null);
  const showRegion = (next: string | null) => {
    setRegion(next);
    mapRef.current?.fitBounds(
      next
        ? [
            [-124.8, 31.3],
            [-102, 49],
          ]
        : [
            [-125, 24.5],
            [-66.5, 49.5],
          ],
      { padding: 32 },
    );
  };
  return (
    <MapView
      ref={mapRef}
      aria-label="Population by region"
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -96, latitude: 38, zoom: 3 }}
    >
      <MapRegions
        source={region ? "states" : "regions"}
        layer={region ? "states-fill" : "regions-fill"}
        data={region ? WEST : REGIONS}
        caption="Population in millions"
        onRegionSelect={({ id }) => {
          if (region === null && id !== null) showRegion(String(id));
        }}
      />
      <MapPanel position="top-left">
        <Breadcrumbs aria-label="Map level">
          <Link component="button" type="button" underline="hover" onClick={() => showRegion(null)}>
            United States
          </Link>
          {region && <span aria-current="page">{region}</span>}
        </Breadcrumbs>
      </MapPanel>
    </MapView>
  );
}`,
  },
  {
    id: "export",
    title: "Download the map as an image",
    body: "`exportMap(\"png\", options)` draws a frame and resolves with a PNG `Blob` of the canvas. By default, it also saves a file, named after the map or after `fileName`. It's on the ref in React and on the instance in HTML. Set `download` to `false` to only get the `Blob`, for example to send it to a server.\n\nCall it inside a click or a key press, because browsers block downloads that no person asked for. The promise rejects, and nothing is saved, in these cases: the page isn't handling a user gesture (`NotAllowedError`), the map isn't drawn (`InvalidStateError`), the format is unknown (`TypeError`) or the browser can't read the canvas (`SecurityError` or `NotSupportedError`). Show that message to the person.\n\nThe image holds only the canvas. Controls, markers and popups are page elements over the canvas and are not in the file, so credit the map data's sources yourself where you publish the image.",
    html: `${snippetElement(exportMapGroup, "data-ok-map-panel ")}

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("#map-export");
  element.querySelector("[data-ok-map-panel] button").addEventListener("click", () => {
    getRuntime().get(element, "map").exportMap("png", { fileName: "united-states" });
  });
</script>`,
    react: `import { Button, type MapRef, MapPanel, MapView } from "@owlky/react";
import { useRef } from "react";

export function DownloadMap() {
  const mapRef = useRef<MapRef>(null);
  return (
    <MapView
      ref={mapRef}
      aria-label="Map to download"
      mapStyle="${MAP_STYLES.light}"
      initialViewState={{ longitude: -98, latitude: 38.5, zoom: 3 }}
    >
      <MapPanel position="top-left">
        <Button onClick={() => mapRef.current?.exportMap("png", { fileName: "united-states" })}>
          Download PNG
        </Button>
      </MapPanel>
    </MapView>
  );
}`,
  },
  {
    id: "api",
    title: "Events and methods",
    body: `- **\`ok:map:load\`**, **\`ok:map:move\`**, **\`ok:map:moveend\`**, **\`ok:map:click\`**, **\`ok:map:mousemove\`**, **\`ok:map:mouseenter\`**, **\`ok:map:mouseleave\`** and the other map events fire on the map with \`detail.viewState\`, and for pointer events \`lngLat\`, \`point\` and \`features\`.
- **\`ok:map:popupopen\`** and **\`ok:map:popupclose\`** fire on a popup. \`popupclose\` has \`detail.reason\` and can be canceled to keep it open.
- **\`ok:map:markerdragstart\`**, **\`ok:map:markerdrag\`** and **\`ok:map:markerdragend\`** fire on a marker with \`detail.lngLat\`.
- **\`ok:map:regionselect\`** fires on a \`div[data-ok-map-regions]\` with \`detail.id\`, the region toggled (\`null\` when the selection is cleared), and \`detail.ids\`, every selected region. **\`ok:map:legendtoggle\`** fires on a legend with \`detail.classIndex\` and \`detail.active\`, the pressed classes.
- **\`ok:map:fullscreen\`**, **\`ok:map:geolocate\`**, **\`ok:map:geolocateerror\`**, **\`ok:map:trackuserlocation\`** and **\`ok:map:fallback\`** report the controls and a map that can't draw.
- **Instance:** \`runtime.get(element, "map")\` returns \`{ map, controller, viewState, flyTo, easeTo, jumpTo, fitBounds, setSourceData(id, data), getClusterExpansionZoom(source, id), openPopup(popup), closePopup(popup), fullscreen, setFullscreen(on), exportMap(format, options), selectRegions(regions, ids), clearSelection(regions), scale(values, options), greatCircle(from, to, options), sizeScale(values, options), hexbin(points, options), pixelGrid(geometry, options) }\`. \`scale\`, \`greatCircle\`, \`sizeScale\`, \`hexbin\` and \`pixelGrid\` are \`mapScale\`, \`greatCircle\`, \`mapSizeScale\`, \`mapHexbin\` and \`mapPixelGrid\`, for pages that load the map from the CDN.
- **React:** event props such as \`onLoad\`, \`onMove\`, \`onClick\`, \`onMouseMove\` and \`onMouseEnter\`; a ref with \`getMap()\`, \`flyTo\`, \`easeTo\`, \`jumpTo\` and \`fitBounds\`; and \`useMap()\` inside a map or a \`MapProvider\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The map itself is one stop in the Tab order. With focus on the map, the keys below move it. Markers that people can click or drag, popups and controls are buttons in the Tab order.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name each map with \`aria-label\` (HTML: \`data-ok-label\`). Without a name, it is called "Map".
- Describe what the map shows with \`description\` (HTML: a \`p[data-ok-map-description]\` with an \`id\`), or let the map write it with \`auto\`. Screen readers read it with the map, and it replaces the map when the browser can't draw it.
- Give every interactive marker a name. People can open its popup with Enter or Space, and move a draggable marker with the arrow keys.
- A popup takes focus when it opens and gives it back when it closes, unless you turn off \`focusAfterOpen\`.
- On a choropleth, name the regions' list with \`listLabel\` and give the table a \`caption\`. Keyboard users reach every region through the list, screen readers also get the table, and the legend shows the ranges as text, so the data never depends on color alone.
- Controls have names and states: fullscreen and globe report \`aria-pressed\`, and the location result is announced.
- Moving content needs a way to pause it, and animations respect reduced motion.`,
  },
  apiReferenceSection(mapApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <MapView
        aria-label="Map of Europe"
        description="Western Europe with a marker on Paris."
        mapStyle={MAP_STYLES.light}
        mapStyleDark={MAP_STYLES.dark}
        initialViewState={{ longitude: 6, latitude: 48, zoom: 3.5 }}
        style={{ height: "calc(var(--ok-spacing) * 80)" }}
      >
        <NavigationControl position="bottom-left" />
        <ScaleControl position="bottom-left" />
        <Marker longitude={2.35} latitude={48.86} anchor="bottom" color="error" />
      </MapView>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={mapOptions} />
      <OptionsTable schema={mapMarkerOptions} />
      <OptionsTable schema={mapPopupOptions} />
      <OptionsTable schema={mapNavigationOptions} />
      <OptionsTable schema={mapGeolocateOptions} />
      <OptionsTable schema={mapScaleOptions} />
      <OptionsTable schema={mapAttributionOptions} />
      <OptionsTable schema={mapLegendOptions} />
      <OptionsTable schema={mapRegionsOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Map content props"
      rows={[
        {
          react: "mapStyle / mapStyleDark",
          html: "data-ok-map-style / data-ok-map-style-dark",
          type: "string | StyleSpecification",
          description: "The map style, and the one used in a dark theme.",
        },
        {
          react: "initialViewState / viewState",
          html: "data-ok-longitude, data-ok-latitude, data-ok-zoom, data-ok-bounds",
          type: "object",
          description: "Where the map starts, or the view it follows (controlled).",
        },
        {
          react: "maxBounds",
          html: "data-ok-max-bounds",
          type: "[west, south, east, north]",
          description: "People can't move the map outside these bounds.",
        },
        {
          react: "interactiveLayerIds",
          html: "data-ok-interactive-layer-ids",
          type: "string[]",
          description: "Layers that mouse events report and that show a pointer.",
        },
        {
          react: "aria-label",
          html: "data-ok-label",
          type: "string",
          description: 'The name of the map (default "Map").',
        },
        {
          react: "description",
          html: "p[data-ok-map-description]",
          type: "ReactNode",
          description: "A text alternative for the map's content.",
        },
        {
          react: "labels",
          html: "—",
          type: "Partial<MapLabels>",
          description: "Texts of the controls and status messages, to translate them.",
        },
        {
          react: "terrain / cursor / mapOptions",
          html: "—",
          type: "object / string / MapOptions",
          description: "3D terrain, the cursor, and other MapLibre options read once.",
        },
        {
          react: "Source, Layer",
          html: "div[data-ok-map-source], div[data-ok-map-layer]",
          type: "MapLibre specs",
          description: "Data and how it is drawn (`paint`, `layout`, `filter`).",
        },
        {
          react: "Marker onDragStart / onDrag / onDragEnd",
          html: "ok:map:markerdrag*",
          type: "({ lngLat }) => void",
          description: "A draggable marker moved.",
        },
        {
          react: "MapRegions source / layer / sourceLayer",
          html: "data-ok-source, data-ok-layer, data-ok-source-layer",
          type: "string",
          description: "The source of the regions, and the fill layer that the pointer hits.",
        },
        {
          react: "MapRegions data",
          html: "tr[data-ok-id] › th + td[data-ok-value]",
          type: "{ id, name, value }[]",
          description: "Each region's feature id, name and value (no value: no data).",
        },
        {
          react: "MapRegions caption / nameLabel / valueLabel / formatValue / listLabel",
          html: "caption, th[scope=col], cell text, aria-label",
          type: "ReactNode / string / (value) => string",
          description: "The table's caption and headers, the value text, and the list's name.",
        },
        {
          react: "MapRegions onRegionSelect",
          html: "ok:map:regionselect",
          type: "({ id, ids }) => void",
          description: "The selection changed: the region toggled and every selected region.",
        },
        {
          react: "MapRegions group",
          html: "data-ok-group",
          type: "string",
          description: "Links the regions of several maps: a selection filters the others.",
        },
        {
          react: "MapRegions selection",
          html: "selectRegions(regions, ids) / clearSelection()",
          type: "(string | number)[]",
          description: "Sets the selected regions from your state, or clears them.",
        },
        {
          react: "MapLegend scale / title / position",
          html: "div[data-ok-map-legend] in a corner",
          type: "MapScaleResult / ReactNode / corner",
          description: "The classes to show, the legend's title and its corner.",
        },
        {
          react: 'MapLegend variant="size" sizeScale',
          html: "ul[data-ok-map-legend-sizes] › span[data-ok-map-legend-circle][data-ok-radius]",
          type: "MapSizeScaleResult",
          description: "Nested circles of a size scale, with their values.",
        },
        {
          react: "MapLegend patterns",
          html: "span[data-ok-map-legend-swatch][data-ok-pattern]",
          type: "(MapPatternStyle | null)[]",
          description: "The texture of each class, as in the map's pattern layer.",
        },
        {
          react: "MapLegend showNull / nullLabel / formatter / tickFormatter",
          html: "button[data-ok-null], label text",
          type: "boolean / string / functions",
          description: "A class for regions without a value, and the texts of classes and numbers.",
        },
        {
          react: "MapLegend onLegendToggle",
          html: "ok:map:legendtoggle",
          type: "({ classIndex, active }) => void",
          description: "A class was pressed or released.",
        },
        {
          react: "Popup onClose / onOpen",
          html: "ok:map:popupclose / popupopen",
          type: "(reason) => void",
          description: "The popup asks to close, or opened.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves to the map, then to markers, panels and controls."],
        ["Arrow keys (map)", "Pan the map."],
        ["+ / −", "Zoom in, zoom out."],
        ["Shift + Left arrow / Right arrow", "Turn the map."],
        ["Shift + Up arrow / Down arrow", "Tilt the map."],
        ["Enter / Space (marker)", "Clicks the marker, for example to open its popup."],
        ["Arrow keys (draggable marker)", "Move the marker by 10 px (Shift: 50 px)."],
        ["Escape", "Closes the popup that has focus, or leaves fullscreen."],
        ["Up arrow / Down arrow (regions list)", "Moves to the previous or next region."],
        ["Home / End (regions list)", "Moves to the first or last region."],
        ["Page up / Page down (regions list)", "Moves 10 regions."],
        ["A letter (regions list)", "Moves to the next region whose name starts with it."],
        ["Enter / Space (regions list)", "Selects the region, or clears the selection."],
        ["Escape (regions list)", "Clears the selection."],
        ["Shift + Up arrow / Down arrow (multiple)", "Moves and adds the region to the selection."],
        ["Ctrl + A / Cmd + A (multiple)", "Selects every region."],
        ["Shift + drag (box selection)", "Selects the regions in the box; with Alt, adds them."],
        ["Escape (while dragging a box)", "Cancels the box."],
        [
          "Enter / Space (legend class)",
          "Fades, or shows again, the regions outside the pressed classes.",
        ],
      ]}
    />
  ),
};

/** Map docs page (ADR-0019). */
export function MapDocs() {
  return <GuideDocs sections={mapSections} previews={PREVIEWS} />;
}
