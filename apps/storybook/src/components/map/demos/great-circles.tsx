import { greatCircle, Layer, MapView, NavigationControl, Source } from "@owlky/react";
import { AIRPORT_HUB, AIRPORTS, MAP_STYLES } from "../map-data.js";

// One arc from the hub to each airport: Los Angeles crosses the antimeridian, so it has two parts.
const routes = {
  type: "FeatureCollection" as const,
  features: AIRPORTS.map((airport) =>
    greatCircle(AIRPORT_HUB.position, airport.position, { properties: { name: airport.name } }),
  ),
};
const airports = {
  type: "FeatureCollection" as const,
  features: [AIRPORT_HUB, ...AIRPORTS].map(({ name, position }) => ({
    type: "Feature" as const,
    properties: { name },
    geometry: { type: "Point" as const, coordinates: [...position] },
  })),
};

export function GreatCirclesDemo() {
  return (
    <MapView
      id="map-great-circles"
      aria-label="Flight routes from Singapore"
      description="Great circle routes from Singapore to London, Los Angeles, Sydney, Johannesburg and Tokyo. The route to Los Angeles crosses the Pacific and the antimeridian."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: 110, latitude: 20, zoom: 0.8 }}
    >
      <NavigationControl position="top-right" />
      <Source id="routes" type="geojson" data={routes}>
        <Layer
          id="routes-line"
          type="line"
          layout={{ "line-cap": "round" }}
          paint={{ "line-color": "var(--ok-palette-primary-main)", "line-width": 2 }}
        />
      </Source>
      <Source id="airports" type="geojson" data={airports}>
        <Layer
          id="airports-circle"
          type="circle"
          paint={{
            "circle-color": "var(--ok-palette-primary-dark)",
            "circle-radius": 4,
            "circle-stroke-color": "var(--ok-bg-paper)",
            "circle-stroke-width": 1.5,
          }}
        />
      </Source>
    </MapView>
  );
}
