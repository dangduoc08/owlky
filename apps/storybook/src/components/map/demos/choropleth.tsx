import {
  Layer,
  type LayerProps,
  MapLegend,
  MapRegions,
  MapView,
  mapRegionLayers,
  mapScale,
  NavigationControl,
  Source,
} from "@owlky/react";
import { MAP_STYLES, STATE_POPULATION, US_STATES } from "../map-data.js";

const regions = STATE_POPULATION.map(([name, value]) => ({ id: name, name, value }));
// Jenks natural breaks: five classes of the primary palette's shades.
const scale = mapScale(
  regions.map((region) => region.value),
  { method: "jenks", classes: 5 },
);
const [fill, outline] = mapRegionLayers({
  id: "population-fill",
  source: "population",
  scale,
}) as unknown as [LayerProps, LayerProps];

export function ChoroplethDemo() {
  return (
    <MapView
      id="map-choropleth"
      aria-label="Map of US states by population"
      description="The 50 US states and the District of Columbia, colored by their population in the 2020 census. California, Texas, Florida and New York are the most populous."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -98, latitude: 38.5, zoom: 3 }}
    >
      <NavigationControl position="top-right" />
      {/* promoteId: the state's name is the feature id the regions join on. */}
      <Source id="population" type="geojson" data={US_STATES} promoteId="name">
        <Layer {...fill} />
        <Layer {...outline} />
      </Source>
      <MapRegions
        id="map-choropleth-regions"
        source="population"
        layer="population-fill"
        data={regions}
        caption="Population by state, 2020 census"
        nameLabel="State"
        valueLabel="Population"
        formatValue={(value) => `${value.toFixed(2)} million`}
        listLabel="States"
      />
      <MapLegend id="map-choropleth-legend" scale={scale} title="Population (millions)" />
    </MapView>
  );
}
