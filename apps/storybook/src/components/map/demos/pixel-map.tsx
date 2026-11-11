import {
  Layer,
  type LayerProps,
  MapLegend,
  MapRegions,
  MapView,
  mapPixelGrid,
  mapRegionLayers,
  mapScale,
  NavigationControl,
  Source,
} from "@owlky/react";
import { useEffect, useState } from "react";
import { MAP_STYLES, STATE_POPULATION, US_STATES } from "../map-data.js";

const regions = STATE_POPULATION.map(([name, value]) => ({ id: name, name, value }));
const scale = mapScale(
  regions.map((region) => region.value),
  { method: "jenks", classes: 5 },
);
const [fill, outline] = mapRegionLayers({
  id: "pixels-fill",
  source: "pixels",
  scale,
}) as unknown as [LayerProps, LayerProps];
const EMPTY = { type: "FeatureCollection" as const, features: [] };

export function PixelMapDemo() {
  const [cells, setCells] = useState<ReturnType<typeof mapPixelGrid>>(EMPTY);
  useEffect(() => {
    let live = true;
    fetch(US_STATES)
      .then((response) => response.json())
      // A dot every 0.8 degrees inside each state, tagged with the state's name.
      .then(
        (states) =>
          live && setCells(mapPixelGrid(states, { shape: "circle", spacing: 0.8, joinBy: "name" })),
      )
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <MapView
      id="map-pixel"
      aria-label="Dot map of US states by population"
      description="The US states drawn as dots, colored by their population in the 2020 census. California, Texas, Florida and New York are the most populous."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -98, latitude: 38.5, zoom: 3 }}
    >
      <NavigationControl position="top-right" />
      {/* promoteId: every dot of a state shares the state's feature state. */}
      <Source id="pixels" type="geojson" data={cells} promoteId="region">
        <Layer {...fill} />
        <Layer {...outline} />
      </Source>
      <MapRegions
        id="map-pixel-regions"
        source="pixels"
        layer="pixels-fill"
        data={regions}
        caption="Population by state, 2020 census"
        nameLabel="State"
        valueLabel="Population"
        formatValue={(value) => `${value.toFixed(2)} million`}
        listLabel="States"
      />
      <MapLegend id="map-pixel-legend" scale={scale} title="Population (millions)" />
    </MapView>
  );
}
