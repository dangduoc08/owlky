import { MapView, type MapViewState, ToggleButton, ToggleButtonGroup } from "@owlky/react";
import { useState } from "react";
import { MAP_STYLES } from "../map-data.js";

type Mode = "side-by-side" | "split-screen";

export function SideBySideDemo() {
  const [view, setView] = useState<MapViewState>({
    longitude: -122.43,
    latitude: 37.78,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  });
  const [mode, setMode] = useState<Mode>("side-by-side");
  // The map under the pointer (or with focus) leads; the other one follows it.
  const [active, setActive] = useState<"left" | "right">("left");
  return (
    <div className={`sb-map-compare sb-map-compare--${mode}`}>
      <MapView
        id="map-left"
        aria-label="Light map of San Francisco"
        description="San Francisco in the light style. It moves with the dark map beside it."
        mapStyle={MAP_STYLES.light}
        viewState={view}
        onMove={(event) => active === "left" && setView(event.viewState)}
        onPointerEnter={() => setActive("left")}
        onFocus={() => setActive("left")}
      />
      <MapView
        id="map-right"
        aria-label="Dark map of San Francisco"
        description="San Francisco in the dark style. It moves with the light map beside it."
        mapStyle={MAP_STYLES.dark}
        viewState={view}
        onMove={(event) => active === "right" && setView(event.viewState)}
        onPointerEnter={() => setActive("right")}
        onFocus={() => setActive("right")}
      />
      <ToggleButtonGroup
        className="sb-map-compare-mode"
        exclusive
        size="sm"
        aria-label="Layout"
        value={mode}
        onChange={(value) => {
          if (value) setMode(value as Mode);
        }}
      >
        <ToggleButton value="side-by-side">Side by side</ToggleButton>
        <ToggleButton value="split-screen">Split screen</ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
