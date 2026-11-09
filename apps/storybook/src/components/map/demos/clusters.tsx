import { Layer, type LayerProps, type MapRef, MapView, Source } from "@owlky/react";
import { useRef } from "react";
import { CLUSTER_LAYERS, EARTHQUAKES, MAP_STYLES } from "../map-data.js";

export function ClustersDemo() {
  const mapRef = useRef<MapRef>(null);
  return (
    <MapView
      ref={mapRef}
      id="map-clusters"
      aria-label="Map of earthquake clusters"
      description="About 1,600 earthquakes in the contiguous United States in October 2025, grouped in clusters that split as you zoom in. Most are in California, Nevada and the northwest."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -103.6, latitude: 40.7, zoom: 3 }}
      interactiveLayerIds={["clusters"]}
      // A click on a cluster zooms in until it breaks apart.
      onClick={async (event) => {
        const feature = event.features?.[0];
        const map = mapRef.current;
        if (!feature || !map?.controller || feature.geometry.type !== "Point") return;
        const zoom = await map.controller.getClusterExpansionZoom(
          "earthquakes",
          feature.properties["cluster_id"],
        );
        map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom });
      }}
    >
      <Source
        id="earthquakes"
        type="geojson"
        data={EARTHQUAKES}
        cluster
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        {CLUSTER_LAYERS.map((layer) => (
          <Layer key={layer.id} {...(layer as unknown as LayerProps)} />
        ))}
      </Source>
    </MapView>
  );
}
