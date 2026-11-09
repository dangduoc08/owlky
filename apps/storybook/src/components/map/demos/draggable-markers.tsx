import {
  FullscreenControl,
  GeolocateControl,
  MapPanel,
  MapView,
  Marker,
  type MarkerDragEvent,
  NavigationControl,
  ScaleControl,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import { MAP_STYLES } from "../map-data.js";

type Phase = "start" | "drag" | "end";
const PHASES: [Phase, string][] = [
  ["start", "Drag start"],
  ["drag", "Dragging"],
  ["end", "Drag end"],
];
const format = ({ lng, lat }: { lng: number; lat: number }) =>
  `${lng.toFixed(5)}, ${lat.toFixed(5)}`;

export function DraggableMarkersDemo() {
  const [marker, setMarker] = useState({ longitude: -100, latitude: 40 });
  const [events, setEvents] = useState<Partial<Record<Phase, string>>>({});
  const log = (phase: Phase) => (event: MarkerDragEvent) =>
    setEvents((current) => ({ ...current, [phase]: format(event.lngLat) }));
  return (
    <MapView
      id="map-draggable"
      aria-label="Map with a draggable marker"
      description="A marker you can drag, move with the arrow keys, or place with a click on the map."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -100, latitude: 40, zoom: 3.5 }}
      // A click places the marker too (a way to move it without dragging).
      onClick={(event) => {
        if (event.lngLat) setMarker({ longitude: event.lngLat.lng, latitude: event.lngLat.lat });
      }}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <Marker
        longitude={marker.longitude}
        latitude={marker.latitude}
        anchor="bottom"
        color="error"
        draggable
        aria-label="Draggable marker"
        onDragStart={log("start")}
        onDrag={log("drag")}
        onDragEnd={(event) => {
          log("end")(event);
          setMarker({ longitude: event.lngLat.lng, latitude: event.lngLat.lat });
        }}
      />
      <MapPanel>
        <dl className="sb-map-events">
          {PHASES.map(([phase, label]) => (
            <div key={phase}>
              <Typography variant="subtitle2" component="dt">
                {label}
              </Typography>
              <Typography variant="body2" component="dd">
                {events[phase] ?? "None"}
              </Typography>
            </div>
          ))}
        </dl>
      </MapPanel>
    </MapView>
  );
}
