import {
  Breadcrumbs,
  Layer,
  type LayerProps,
  Link,
  MapPanel,
  type MapRef,
  MapRegions,
  MapView,
  mapRegionLayers,
  mapScale,
  NavigationControl,
  Source,
} from "@owlky/react";
import { useRef, useState } from "react";
import {
  CENSUS_REGIONS,
  type CensusRegion,
  MAP_STYLES,
  regionFilter,
  regionRows,
  stateRows,
  US_BOUNDS,
  US_REGIONS,
  US_STATES,
} from "../map-data.js";

/** The generated layers: `layout` and `filter` are set per level below. */
type LayerSpec = Extract<LayerProps, { type: "fill" | "line" }> & { id: string };

const regionLayers = mapRegionLayers({
  id: "regions-fill",
  source: "regions",
  scale: mapScale(regionRows.map((row) => row.value)),
}) as unknown as LayerSpec[];
const stateLayers = mapRegionLayers({
  id: "states-fill",
  source: "states",
  scale: mapScale(
    Object.keys(CENSUS_REGIONS).flatMap((region) =>
      stateRows(region as CensusRegion).map((row) => row.value),
    ),
  ),
}) as unknown as LayerSpec[];

export function RegionDrilldownDemo() {
  const mapRef = useRef<MapRef>(null);
  const [region, setRegion] = useState<CensusRegion | null>(null);
  const showRegion = (next: CensusRegion | null) => {
    setRegion(next);
    mapRef.current?.fitBounds(next ? CENSUS_REGIONS[next].bounds : US_BOUNDS, { padding: 32 });
  };
  const visibility = region === null ? "visible" : "none";
  const statesVisibility = region === null ? "none" : "visible";
  const statesFilter = regionFilter(region ?? "") as LayerProps["filter"];
  return (
    <MapView
      ref={mapRef}
      id="map-drilldown"
      aria-label="Map of the United States by region"
      description="The four US Census regions, colored by their population. Select a region to zoom to it and see its states."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -96, latitude: 38, zoom: 3 }}
    >
      <NavigationControl position="top-right" />
      <Source id="regions" type="geojson" data={US_REGIONS} promoteId="name">
        {regionLayers.map((layer) => (
          <Layer key={layer.id} {...layer} layout={{ visibility }} />
        ))}
      </Source>
      <Source id="states" type="geojson" data={US_STATES} promoteId="name">
        {stateLayers.map((layer) => (
          <Layer
            key={layer.id}
            {...layer}
            layout={{ visibility: statesVisibility }}
            filter={statesFilter}
          />
        ))}
      </Source>
      <MapRegions
        id="map-drilldown-regions"
        source={region ? "states" : "regions"}
        layer={region ? "states-fill" : "regions-fill"}
        data={region ? stateRows(region) : regionRows}
        caption={region ? `Population of the ${region} by state` : "Population by US Census region"}
        nameLabel={region ? "State" : "Region"}
        valueLabel="Population"
        formatValue={(value) => `${value.toFixed(2)} million`}
        listLabel={region ? `States of the ${region}` : "Regions"}
        onRegionSelect={({ id }) => {
          // A click or Enter on a region goes down one level; states only get selected.
          if (region === null && id !== null) showRegion(id as CensusRegion);
        }}
      />
      <MapPanel position="top-left">
        <Breadcrumbs aria-label="Map level">
          {/* The first item stays a button, so the focus stays on it when it goes back. */}
          <Link
            component="button"
            type="button"
            color="inherit"
            underline="hover"
            aria-current={region === null ? "page" : undefined}
            onClick={() => showRegion(null)}
          >
            United States
          </Link>
          {region && <span aria-current="page">{region}</span>}
        </Breadcrumbs>
      </MapPanel>
    </MapView>
  );
}
