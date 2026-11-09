import {
  FullscreenControl,
  GeolocateControl,
  Layer,
  type LayerProps,
  MapView,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import { MAP_STYLES, regionFilter, STATE_LAYERS, US_STATES } from "../map-data.js";

interface Hover {
  longitude: number;
  latitude: number;
  name: string;
  region: string;
}

const [fill, highlight, border] = STATE_LAYERS as unknown as [LayerProps, LayerProps, LayerProps];

export function HighlightByFilterDemo() {
  const [hover, setHover] = useState<Hover | null>(null);
  return (
    <MapView
      id="map-highlight"
      aria-label="Map of US states by region"
      description="The 50 US states and the District of Columbia in four regions: Northeast, Midwest, South and West. Point at a state to highlight its region."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -98, latitude: 38.5, zoom: 3 }}
      interactiveLayerIds={["states-fill"]}
      onMouseMove={(event) => {
        const feature = event.features?.[0];
        setHover(
          feature && event.lngLat
            ? {
                longitude: event.lngLat.lng,
                latitude: event.lngLat.lat,
                name: String(feature.properties["name"]),
                region: String(feature.properties["region"]),
              }
            : null,
        );
      }}
      onMouseLeave={() => setHover(null)}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <Source id="states" type="geojson" data={US_STATES}>
        <Layer {...fill} />
        <Layer {...highlight} filter={regionFilter(hover?.region ?? "") as LayerProps["filter"]} />
        <Layer {...border} />
      </Source>
      {hover ? (
        <Popup
          id="map-highlight-popup"
          role="tooltip"
          longitude={hover.longitude}
          latitude={hover.latitude}
          offset={12}
          closeButton={false}
          closeOnClick={false}
          focusAfterOpen={false}
        >
          <div className="sb-map-popup">
            <Typography variant="subtitle2" component="p" color="textPrimary">
              {hover.name}
            </Typography>
            <Typography variant="caption" component="p" color="textSecondary">
              {`Region: ${hover.region}`}
            </Typography>
          </div>
        </Popup>
      ) : null}
    </MapView>
  );
}
