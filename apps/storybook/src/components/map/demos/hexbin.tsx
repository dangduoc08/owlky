import {
  Layer,
  type LayerProps,
  type MapHexbinCollection,
  MapLegend,
  MapView,
  mapHexbin,
  mapScale,
  NavigationControl,
  Source,
} from "@owlky/react";
import { useEffect, useState } from "react";
import { EARTHQUAKES, MAP_STYLES } from "../map-data.js";

const EMPTY: MapHexbinCollection = { type: "FeatureCollection", features: [] };
// Fixed class breaks: the legend reads the same whatever the data, so maps stay comparable.
const scale = mapScale([], {
  method: "threshold",
  thresholds: [3, 6, 12, 24],
  palette: "info",
  input: ["get", "value"],
});
// The expression is MapLibre JSON: cast the layer to the Layer props.
const fill = {
  id: "quake-bins-fill",
  type: "fill",
  paint: {
    "fill-color": scale.expression,
    "fill-opacity": 0.8,
    "fill-outline-color": "var(--ok-bg-paper)",
  },
} as unknown as LayerProps;
const CLASSES = ["1 or 2", "3 to 5", "6 to 11", "12 to 23", "24 or more"];

export function HexbinDemo() {
  const [bins, setBins] = useState(EMPTY);
  useEffect(() => {
    let live = true;
    fetch(EARTHQUAKES)
      .then((response) => response.json())
      // Count the earthquakes in hexagons of 0.75 degrees.
      .then((quakes) => live && setBins(mapHexbin(quakes, { radius: 0.75 })))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return (
    <MapView
      id="map-hexbin"
      aria-label="Map of earthquakes counted in hexagons"
      description="Earthquakes in the contiguous United States in October 2025, counted in hexagons of 0.75 degrees. The hexagons with the most earthquakes are in western Texas, California and Nevada."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -100, latitude: 40, zoom: 3 }}
    >
      <NavigationControl position="top-right" />
      <Source id="quake-bins" type="geojson" data={bins}>
        <Layer {...fill} />
      </Source>
      <MapLegend
        id="map-hexbin-legend"
        scale={scale}
        interactive={false}
        title="Earthquakes per hexagon"
        formatter={(_item, index) => CLASSES[index] ?? ""}
      />
    </MapView>
  );
}
