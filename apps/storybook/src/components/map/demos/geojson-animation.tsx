import {
  Button,
  FullscreenControl,
  GeolocateControl,
  Layer,
  type LayerProps,
  MapPanel,
  MapView,
  NavigationControl,
  ScaleControl,
  Source,
} from "@owlky/react";
import { useEffect, useState } from "react";
import { MAP_STYLES, POINT_LAYER, pointOnCircle } from "../map-data.js";

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function GeojsonAnimationDemo() {
  const [angle, setAngle] = useState(0);
  // Moving content can be paused (WCAG 2.2.2); it starts paused with reduced motion.
  const [playing, setPlaying] = useState(() => !reducedMotion());
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setAngle((current) => current + (now - last) / 1000);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  return (
    <MapView
      id="map-animation"
      aria-label="Map with a moving point"
      description="A point circling the Gulf of Guinea, 20 degrees around the meeting point of the equator and the prime meridian."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: 0, latitude: 0, zoom: 2 }}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <Source id="point" type="geojson" data={pointOnCircle(angle)}>
        <Layer {...(POINT_LAYER as unknown as LayerProps)} />
      </Source>
      <MapPanel>
        <Button variant="contained" size="sm" onClick={() => setPlaying(!playing)}>
          {playing ? "Pause" : "Play"}
        </Button>
      </MapPanel>
    </MapView>
  );
}
