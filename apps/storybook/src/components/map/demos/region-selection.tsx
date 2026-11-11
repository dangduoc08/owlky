import {
  Button,
  Layer,
  type LayerProps,
  MapLegend,
  MapRegions,
  MapView,
  mapPixelGrid,
  mapRegionLayers,
  mapScale,
  Source,
  Typography,
} from "@owlky/react";
import { useEffect, useState } from "react";
import { MAP_STYLES, STATE_POPULATION, US_STATES } from "../map-data.js";

const regions = STATE_POPULATION.map(([name, value]) => ({ id: name, name, value }));
const scale = mapScale(
  regions.map((region) => region.value),
  { method: "jenks", classes: 5 },
);
const [fill, outline] = mapRegionLayers({
  id: "select-fill",
  source: "select-states",
  scale,
}) as unknown as [LayerProps, LayerProps];
const [dots, dotsOutline] = mapRegionLayers({
  id: "linked-fill",
  source: "linked-pixels",
  scale,
}) as unknown as [LayerProps, LayerProps];
const EMPTY = { type: "FeatureCollection" as const, features: [] };

export function RegionSelectionDemo() {
  // The selection of the first map, kept in state so the button can clear it.
  const [selection, setSelection] = useState<readonly (string | number)[]>([]);
  const [cells, setCells] = useState<ReturnType<typeof mapPixelGrid>>(EMPTY);
  useEffect(() => {
    let live = true;
    fetch(US_STATES)
      .then((response) => response.json())
      .then((states) => live && setCells(mapPixelGrid(states, { spacing: 0.8, joinBy: "name" })))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const view = { longitude: -98, latitude: 38.5, zoom: 2.4 };
  return (
    <div className="sb-map-linked">
      <MapView
        id="map-select"
        aria-label="Map of US states to select"
        description="The US states colored by population. Shift and drag to select the states in a box, or select them in the list of states. The dot map beside it shows only the selected states."
        mapStyle={MAP_STYLES.light}
        mapStyleDark={MAP_STYLES.dark}
        initialViewState={view}
      >
        <Source id="select-states" type="geojson" data={US_STATES} promoteId="name">
          <Layer {...fill} />
          <Layer {...outline} />
        </Source>
        {/* Shift + drag selects by box; the group filters the other map. */}
        <MapRegions
          id="map-select-regions"
          source="select-states"
          layer="select-fill"
          data={regions}
          boxSelect
          group="us-dashboard"
          selection={selection}
          onRegionSelect={(event) => setSelection(event.ids)}
          caption="Population by state, 2020 census"
          nameLabel="State"
          valueLabel="Population"
          formatValue={(value) => `${value.toFixed(2)} million`}
          listLabel="States to select"
        />
        <MapLegend id="map-select-legend" scale={scale} title="Population (millions)" />
      </MapView>
      <MapView
        id="map-select-linked"
        aria-label="Dot map of the selected US states"
        description="The US states as dots. While states are selected in either map, the others fade in this one."
        mapStyle={MAP_STYLES.light}
        mapStyleDark={MAP_STYLES.dark}
        initialViewState={view}
      >
        <Source id="linked-pixels" type="geojson" data={cells} promoteId="region">
          <Layer {...dots} />
          <Layer {...dotsOutline} />
        </Source>
        <MapRegions
          id="map-select-linked-regions"
          source="linked-pixels"
          layer="linked-fill"
          data={regions}
          multiple
          group="us-dashboard"
          caption="Population by state, 2020 census"
          nameLabel="State"
          valueLabel="Population"
          formatValue={(value) => `${value.toFixed(2)} million`}
          listLabel="States of the dot map"
        />
      </MapView>
      <div className="sb-map-linked-bar">
        <Typography variant="body2" role="status" id="map-select-status">
          {selection.length === 1 ? "1 state selected" : `${selection.length} states selected`}
        </Typography>
        <Button variant="outlined" size="sm" onClick={() => setSelection([])}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
