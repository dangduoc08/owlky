import {
  FormControlLabel,
  FullscreenControl,
  GeolocateControl,
  MapPanel,
  type MapRef,
  MapView,
  NavigationControl,
  Radio,
  RadioGroup,
  ScaleControl,
} from "@owlky/react";
import { useRef, useState } from "react";
import { CITIES, MAP_STYLES } from "../map-data.js";

const [first] = CITIES as [(typeof CITIES)[number]];

export function ViewportAnimationDemo() {
  const mapRef = useRef<MapRef>(null);
  const [city, setCity] = useState(first.name);
  return (
    <MapView
      ref={mapRef}
      id="map-viewport"
      aria-label="Map of six cities"
      description="Pick a city in the panel: the map flies there."
      mapStyle={MAP_STYLES.light}
      mapStyleDark={MAP_STYLES.dark}
      initialViewState={{ longitude: first.longitude, latitude: first.latitude, zoom: 11 }}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <MapPanel>
        <RadioGroup
          name="map-viewport-city"
          aria-label="City"
          value={city}
          onChange={(name) => {
            setCity(name);
            const target = CITIES.find((each) => each.name === name);
            if (target)
              mapRef.current?.flyTo({
                center: [target.longitude, target.latitude],
                zoom: 11,
                duration: 4000,
              });
          }}
        >
          {CITIES.map((each) => (
            <FormControlLabel
              key={each.name}
              value={each.name}
              label={each.name}
              control={<Radio />}
            />
          ))}
        </RadioGroup>
      </MapPanel>
    </MapView>
  );
}
