import {
  addLinear,
  closeLinear,
  fullScreenLinear,
  globalLinear,
  gpsLinear,
  infoCircleLinear,
  mapPointBold,
  minusLinear,
  panoramaLinear,
  quitFullScreenLinear,
} from "../icons/solar.js";

/**
 * Map control icons (ADR-0025, ADR-0070 § 9): Solar icons shared by React and the HTML snippets.
 * `pin` is the filled marker (Bold).
 */
export const mapIcons = {
  zoomIn: addLinear,
  zoomOut: minusLinear,
  geolocate: gpsLinear,
  fullscreenEnter: fullScreenLinear,
  fullscreenExit: quitFullScreenLinear,
  globe: globalLinear,
  terrain: panoramaLinear,
  info: infoCircleLinear,
  close: closeLinear,
  pin: mapPointBold,
} as const;

/**
 * The compass needle (a component graphic, not an icon: it turns with the bearing and colors its
 * north half): path data of its two halves in a 24 × 24 box.
 */
export const mapCompass = { north: "M12 3 16 12H8Z", south: "M8 12h8l-4 9Z" } as const;

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
  regions: "Regions",
  legend: "Legend",
  noData: "No data",
} as const;

export type MapLabels = { -readonly [K in keyof typeof mapLabels]: string };
