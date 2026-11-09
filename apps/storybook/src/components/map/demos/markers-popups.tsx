import {
  FullscreenControl,
  GeolocateControl,
  MapView,
  Marker,
  NavigationControl,
  Popup,
  ScaleControl,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import { COUNTRIES, type Country, MAP_STYLES } from "../map-data.js";

export function MarkersPopupsDemo() {
  const [selected, setSelected] = useState<Country | null>(null);
  return (
    <MapView
      id="map-markers"
      aria-label="Map of ten capitals"
      description="Ten capitals in Africa, Europe, Asia and South America. Each marker opens a popup with the capital and its time zone."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: 10, latitude: 10, zoom: 1.5 }}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      {COUNTRIES.map((country) => (
        <Marker
          key={country.code}
          longitude={country.longitude}
          latitude={country.latitude}
          anchor="bottom"
          color="error"
          aria-label={country.name}
          onClick={() => setSelected(country)}
        />
      ))}
      {selected ? (
        <Popup
          id={`map-popup-${selected.code}`}
          aria-label={selected.name}
          longitude={selected.longitude}
          latitude={selected.latitude}
          offset={28}
          onClose={() => setSelected(null)}
        >
          <div className="sb-map-popup">
            <Typography variant="subtitle2" component="p" color="textPrimary">
              {selected.name}
            </Typography>
            <Typography variant="caption" component="p" color="textSecondary">
              {`Capital: ${selected.capital}`}
            </Typography>
            <Typography variant="caption" component="p" color="textSecondary">
              {`Time zone: ${selected.timezone}`}
            </Typography>
            <Typography variant="caption" component="p" color="textSecondary">
              {`Lat: ${selected.latitude} · Long: ${selected.longitude}`}
            </Typography>
          </div>
        </Popup>
      ) : null}
    </MapView>
  );
}
