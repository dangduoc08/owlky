import {
  Layer,
  type LayerProps,
  MapLegend,
  MapRegions,
  MapView,
  mapPatternLayer,
  mapRegionLayers,
  mapScale,
  NavigationControl,
  Source,
} from "@owlky/react";
import { MAP_STYLES, STATE_POPULATION, US_STATES } from "../map-data.js";

const regions = STATE_POPULATION.map(([name, value]) => ({ id: name, name, value }));
const scale = mapScale(
  regions.map((region) => region.value),
  { method: "jenks", classes: 4 },
);
// A texture per class, so the classes differ by more than their color.
const patterns = ["circles", "horizontalLines", "slantedLines", "squares"] as const;
const [fill, outline] = mapRegionLayers({
  id: "patterns-fill",
  source: "patterns",
  scale,
}) as unknown as [LayerProps, LayerProps];
const texture = mapPatternLayer({
  id: "patterns-texture",
  source: "patterns",
  scale,
  patterns,
}) as unknown as LayerProps;

export function PatternFillsDemo() {
  return (
    <MapView
      id="map-patterns"
      aria-label="Map of US states by population, with a pattern per class"
      description="The 50 US states and the District of Columbia in four population classes, each with its own color and pattern: dots, lines, diagonal lines and squares from the least to the most populous."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -98, latitude: 38.5, zoom: 3 }}
    >
      <NavigationControl position="top-right" />
      <Source id="patterns" type="geojson" data={US_STATES} promoteId="name">
        <Layer {...fill} />
        <Layer {...texture} />
        <Layer {...outline} />
      </Source>
      <MapRegions
        id="map-patterns-regions"
        source="patterns"
        layer="patterns-fill"
        data={regions}
        caption="Population by state, 2020 census"
        nameLabel="State"
        valueLabel="Population"
        formatValue={(value) => `${value.toFixed(2)} million`}
        listLabel="States"
      />
      <MapLegend
        id="map-patterns-legend"
        scale={scale}
        patterns={patterns}
        title="Population (millions)"
      />
    </MapView>
  );
}
