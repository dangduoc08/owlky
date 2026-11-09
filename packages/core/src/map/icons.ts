/**
 * Map control icons (ADR-0025): 24 × 24 stroke paths drawn for Owlky, shared by React and the HTML
 * snippets (`fill="none" stroke="currentColor" stroke-width="2"`). `pin` and the compass halves are
 * filled shapes.
 */
export const mapIcons = {
  zoomIn: "M12 5v14M5 12h14",
  zoomOut: "M5 12h14",
  compassNorth: "M12 3 16 12H8Z",
  compassSouth: "M8 12h8l-4 9Z",
  geolocate:
    "M12 2v3M12 19v3M2 12h3M19 12h3M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  fullscreenEnter: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  fullscreenExit: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9M12 3C9.6 5.5 8.4 8.5 8.4 12s1.2 6.5 3.6 9",
  terrain: "M3 19 9 9l4 6 3-4 5 8Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01",
  close: "M6 6l12 12M18 6 6 18",
  pin: "M12 2.5A7.5 7.5 0 0 0 4.5 10c0 5.3 6.2 11 6.9 11.6a.9.9 0 0 0 1.2 0c.7-.6 6.9-6.3 6.9-11.6A7.5 7.5 0 0 0 12 2.5Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z",
} as const;

export type MapIconName = keyof typeof mapIcons;

/** Accessible names of the controls (English; pass your own labels to translate). */
export const mapLabels = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  compass: "Reset north",
  geolocate: "Find my location",
  fullscreenEnter: "Enter fullscreen",
  fullscreenExit: "Exit fullscreen",
  globe: "Globe view",
  terrain: "3D terrain",
  attribution: "Map credits",
  close: "Close",
  map: "Map",
  fallback: "This map can't be shown: your browser doesn't support WebGL.",
  locationDenied: "Location permission denied.",
  locationUnavailable: "Your location isn't available.",
  locationFound: "Map moved to your location.",
} as const;

export type MapLabels = { -readonly [K in keyof typeof mapLabels]: string };
