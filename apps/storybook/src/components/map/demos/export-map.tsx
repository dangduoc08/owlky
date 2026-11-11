import { Button, MapPanel, type MapRef, MapView, Typography } from "@owlky/react";
import { useRef, useState } from "react";
import { MAP_STYLES } from "../map-data.js";

export function ExportMapDemo() {
  const mapRef = useRef<MapRef>(null);
  const [status, setStatus] = useState("");
  return (
    <MapView
      ref={mapRef}
      id="map-export"
      aria-label="Map to download"
      description="The contiguous United States. The button in the panel downloads the map as a PNG file."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: -98, latitude: 38.5, zoom: 3 }}
    >
      <MapPanel position="top-left">
        <Button
          variant="contained"
          color="primary"
          size="sm"
          onClick={() => {
            // Must run inside the click: downloads need a user gesture.
            mapRef.current
              ?.exportMap("png", { fileName: "united-states" })
              .then(() => setStatus("Saved united-states.png."))
              .catch((error: Error) => setStatus(`Could not save the map: ${error.message}`));
          }}
        >
          Download PNG
        </Button>
        <Typography variant="caption" component="p" role="status">
          {status}
        </Typography>
      </MapPanel>
    </MapView>
  );
}
