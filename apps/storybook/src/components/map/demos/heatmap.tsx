import {
  FormControlLabel,
  Layer,
  type LayerProps,
  MapPanel,
  MapView,
  Slider,
  Source,
  Switch,
} from "@owlky/react";
import { useState } from "react";
import { DAYS, dayLabel, EARTHQUAKES, HEATMAP_LAYER, MAP_STYLES } from "../map-data.js";

export function HeatmapDemo() {
  const [allDays, setAllDays] = useState(true);
  const [day, setDay] = useState(8);
  const selected = DAYS[day - 1] as string;
  return (
    <MapView
      id="map-heatmap"
      aria-label="Heatmap of earthquakes"
      description="Earthquakes in the contiguous United States in October 2025 as a heatmap: warmer colors where quakes are many and strong, mostly in California, Nevada and the northwest."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -100, latitude: 40, zoom: 3 }}
    >
      <Source id="earthquakes" type="geojson" data={EARTHQUAKES}>
        <Layer
          {...(HEATMAP_LAYER as unknown as LayerProps)}
          filter={allDays ? undefined : ["==", ["get", "day"], selected]}
        />
      </Source>
      <MapPanel className="sb-map-heatmap">
        <FormControlLabel
          label="All days"
          labelPlacement="start"
          control={<Switch checked={allDays} onChange={setAllDays} />}
        />
        <p id="map-heatmap-day">{`Each day: ${dayLabel(selected)}`}</p>
        <Slider
          aria-labelledby="map-heatmap-day"
          min={1}
          max={DAYS.length}
          value={day}
          disabled={allDays}
          onChange={(value) => setDay(value as number)}
        />
      </MapPanel>
    </MapView>
  );
}
