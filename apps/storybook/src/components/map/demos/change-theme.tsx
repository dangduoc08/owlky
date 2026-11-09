import {
  FormControlLabel,
  FullscreenControl,
  GeolocateControl,
  MapPanel,
  MapView,
  NavigationControl,
  Radio,
  RadioGroup,
  ScaleControl,
} from "@owlky/react";
import { useState } from "react";
import { MAP_STYLES } from "../map-data.js";

const THEMES = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["streets", "Streets"],
] as const;
type Theme = (typeof THEMES)[number][0];

export function ChangeThemeDemo() {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <MapView
      id="map-theme"
      aria-label="Map of the United States"
      description="The contiguous United States, drawn in the style you pick."
      mapStyle={MAP_STYLES[theme]}
      initialViewState={{ longitude: -100, latitude: 40, zoom: 3.5 }}
    >
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <NavigationControl position="bottom-left" />
      <ScaleControl position="bottom-left" />
      <MapPanel>
        <RadioGroup
          name="map-theme-style"
          aria-label="Map style"
          value={theme}
          onChange={(value) => setTheme(value as Theme)}
        >
          {THEMES.map(([value, label]) => (
            <FormControlLabel key={value} value={value} label={label} control={<Radio />} />
          ))}
        </RadioGroup>
      </MapPanel>
    </MapView>
  );
}
