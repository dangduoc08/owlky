import {
  Layer,
  type LayerProps,
  MapLegend,
  MapRegions,
  MapView,
  mapBubbleLayer,
  mapScale,
  mapSizeScale,
  NavigationControl,
  Source,
} from "@owlky/react";
import { MAP_STYLES, METRO_POINTS, METROS } from "../map-data.js";

// Circle areas follow the population (square root scale, radii from 4px to 34px).
const size = mapSizeScale(
  METROS.map(([, , , population]) => population),
  { method: "sqrt", range: [4, 34], legendValues: [20, 10, 4], input: ["get", "population"] },
);
// A second field colors the circles: growth since 2010, in three classes.
const color = mapScale(
  METROS.map(([, , , , growth]) => growth),
  { method: "threshold", thresholds: [5, 12], palette: "warning", input: ["get", "growth"] },
);
const bubbles = mapBubbleLayer({
  id: "metros-bubbles",
  source: "metros",
  size,
  color,
  input: ["get", "population"],
}) as unknown as LayerProps;
const regions = METROS.map(([name, , , population]) => ({ id: name, name, value: population }));

export function BubblesDemo() {
  return (
    <MapView
      id="map-bubbles"
      aria-label="Map of the largest US metropolitan areas"
      description="The 20 largest US metropolitan areas in the 2020 census as circles sized by population and colored by growth since 2010. New York and Los Angeles are the largest; Dallas and Houston grew the most."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -97, latitude: 38, zoom: 3 }}
    >
      <NavigationControl position="top-right" />
      {/* promoteId: the metro's name is the feature id the regions list joins on. */}
      <Source id="metros" type="geojson" data={METRO_POINTS} promoteId="name">
        <Layer {...bubbles} />
      </Source>
      <MapRegions
        id="map-bubbles-regions"
        source="metros"
        layer="metros-bubbles"
        data={regions}
        caption="Population of the largest metropolitan areas, 2020 census"
        nameLabel="Metropolitan area"
        valueLabel="Population"
        formatValue={(value) => `${value.toFixed(2)} million`}
        listLabel="Metropolitan areas"
      />
      <MapLegend
        id="map-bubbles-size"
        variant="size"
        sizeScale={size}
        title="Population (millions)"
      />
      <MapLegend
        id="map-bubbles-growth"
        position="top-left"
        scale={color}
        interactive={false}
        title="Growth since 2010"
        formatter={(_item, index) =>
          index === 0 ? "Under 5%" : index === 1 ? "5% to 12%" : "12% or more"
        }
      />
    </MapView>
  );
}
