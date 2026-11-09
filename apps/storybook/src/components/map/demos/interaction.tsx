import {
  FormControlLabel,
  FullscreenControl,
  GeolocateControl,
  MapPanel,
  MapView,
  NavigationControl,
  ScaleControl,
  Switch,
  TextField,
} from "@owlky/react";
import { useState } from "react";
import { MAP_STYLES } from "../map-data.js";

const LIMITS = [
  ["minZoom", "Min zoom"],
  ["maxZoom", "Max zoom"],
  ["minPitch", "Min pitch"],
  ["maxPitch", "Max pitch"],
] as const;
const HANDLERS = [
  ["boxZoom", "Box zoom"],
  ["dragPan", "Drag pan"],
  ["keyboard", "Keyboard"],
  ["scrollZoom", "Scroll zoom"],
  ["dragRotate", "Drag rotate"],
  ["touchPitch", "Touch pitch"],
  ["doubleClickZoom", "Double click zoom"],
  ["touchZoomRotate", "Touch zoom rotate"],
] as const;

type Limit = (typeof LIMITS)[number][0];
type Handler = (typeof HANDLERS)[number][0];

export function InteractionDemo() {
  const [limits, setLimits] = useState<Record<Limit, number>>({
    minZoom: 0,
    maxZoom: 20,
    minPitch: 0,
    maxPitch: 85,
  });
  const [handlers, setHandlers] = useState<Record<Handler, boolean>>({
    boxZoom: true,
    dragPan: true,
    keyboard: true,
    scrollZoom: true,
    dragRotate: true,
    touchPitch: true,
    doubleClickZoom: true,
    touchZoomRotate: true,
  });
  return (
    <MapView
      id="map-interaction"
      aria-label="Map of San Francisco"
      description="San Francisco and the bay. Use the panel to turn ways of moving the map on and off."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -122.42, latitude: 37.77, zoom: 11 }}
      {...limits}
      {...handlers}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <MapPanel className="sb-map-settings">
        {LIMITS.map(([key, label]) => (
          <TextField
            key={key}
            id={`map-interaction-${key}`}
            size="small"
            type="number"
            label={label}
            value={limits[key]}
            onChange={(value) => {
              const number = Number(value);
              if (value !== "" && Number.isFinite(number))
                setLimits((current) => ({ ...current, [key]: number }));
            }}
          />
        ))}
        {HANDLERS.map(([key, label]) => (
          <FormControlLabel
            key={key}
            label={label}
            labelPlacement="start"
            control={
              <Switch
                size="small"
                checked={handlers[key]}
                onChange={(checked) => setHandlers((current) => ({ ...current, [key]: checked }))}
              />
            }
          />
        ))}
      </MapPanel>
    </MapView>
  );
}
