/*
 * Map story data (plain data, shared by the React demos and the HTML snippet generator).
 * Basemaps: OpenFreeMap (free, no key; © OpenMapTiles, data © OpenStreetMap contributors).
 * Earthquakes: USGS (public domain), October 2025, magnitude 1.5 and up, contiguous US.
 * US states: Natural Earth 1:110m (public domain). Capitals and cities: public facts.
 */

/** Map styles (OpenFreeMap). */
export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
  streets: "https://tiles.openfreemap.org/styles/liberty",
} as const;

/** Files in Storybook's static folder (relative, so they work under any base path). */
export const EARTHQUAKES = "maps/earthquakes.geojson";
export const US_STATES = "maps/us-states.geojson";

export interface Country {
  code: string;
  name: string;
  capital: string;
  timezone: string;
  longitude: number;
  latitude: number;
}

/** Capitals for "Markers & popups". */
export const COUNTRIES: Country[] = [
  {
    code: "ma",
    name: "Morocco",
    capital: "Rabat",
    timezone: "Africa/Casablanca",
    longitude: -6.84,
    latitude: 34.02,
  },
  {
    code: "eg",
    name: "Egypt",
    capital: "Cairo",
    timezone: "Africa/Cairo",
    longitude: 31.24,
    latitude: 30.04,
  },
  {
    code: "ng",
    name: "Nigeria",
    capital: "Abuja",
    timezone: "Africa/Lagos",
    longitude: 7.49,
    latitude: 9.06,
  },
  {
    code: "ke",
    name: "Kenya",
    capital: "Nairobi",
    timezone: "Africa/Nairobi",
    longitude: 36.82,
    latitude: -1.29,
  },
  {
    code: "za",
    name: "South Africa",
    capital: "Pretoria",
    timezone: "Africa/Johannesburg",
    longitude: 28.19,
    latitude: -25.75,
  },
  {
    code: "es",
    name: "Spain",
    capital: "Madrid",
    timezone: "Europe/Madrid",
    longitude: -3.7,
    latitude: 40.42,
  },
  {
    code: "sa",
    name: "Saudi Arabia",
    capital: "Riyadh",
    timezone: "Asia/Riyadh",
    longitude: 46.68,
    latitude: 24.71,
  },
  {
    code: "in",
    name: "India",
    capital: "New Delhi",
    timezone: "Asia/Kolkata",
    longitude: 77.21,
    latitude: 28.61,
  },
  {
    code: "br",
    name: "Brazil",
    capital: "Brasília",
    timezone: "America/Sao_Paulo",
    longitude: -47.88,
    latitude: -15.79,
  },
  {
    code: "pe",
    name: "Peru",
    capital: "Lima",
    timezone: "America/Lima",
    longitude: -77.04,
    latitude: -12.05,
  },
];

export interface City {
  name: string;
  longitude: number;
  latitude: number;
}

/** Cities for "Viewport animation". */
export const CITIES: City[] = [
  { name: "San Francisco", longitude: -122.42, latitude: 37.77 },
  { name: "New York", longitude: -74.006, latitude: 40.713 },
  { name: "London", longitude: -0.128, latitude: 51.507 },
  { name: "Paris", longitude: 2.352, latitude: 48.857 },
  { name: "Tokyo", longitude: 139.692, latitude: 35.69 },
  { name: "Sydney", longitude: 151.209, latitude: -33.869 },
];

/** Earthquake clusters: circles colored by size, the count, and single quakes. */
export const CLUSTER_LAYERS = [
  {
    id: "clusters",
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "var(--ok-palette-info-light)",
        20,
        "var(--ok-palette-warning-light)",
        100,
        "var(--ok-palette-error-light)",
      ],
      "circle-radius": ["step", ["get", "point_count"], 16, 20, 24, 100, 32],
      "circle-stroke-width": 2,
      "circle-stroke-color": "var(--ok-palette-common-white)",
    },
  },
  {
    id: "cluster-count",
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
    },
    paint: { "text-color": "var(--ok-palette-grey-900)" },
  },
  {
    id: "unclustered-point",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "var(--ok-palette-info-main)",
      "circle-radius": 5,
      "circle-stroke-width": 1,
      "circle-stroke-color": "var(--ok-palette-common-white)",
    },
  },
] as const;

/** Earthquake heatmap: denser and stronger quakes glow warmer. */
export const HEATMAP_LAYER = {
  id: "heatmap",
  type: "heatmap",
  maxzoom: 9,
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "mag"], 0, 0, 3, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 2, 9, 5],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(33, 102, 172, 0)",
      0.1,
      "var(--ok-palette-info-light)",
      0.3,
      "var(--ok-palette-info-main)",
      0.5,
      "var(--ok-palette-warning-light)",
      0.7,
      "var(--ok-palette-warning-main)",
      0.9,
      "var(--ok-palette-error-main)",
      1,
      "var(--ok-palette-error-dark)",
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 6, 9, 30],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
  },
} as const;

/** Days of October 2025 ("2025-10-01"…"2025-10-31") for the heatmap filter. */
export const DAYS = Array.from(
  { length: 31 },
  (_, i) => `2025-10-${String(i + 1).padStart(2, "0")}`,
);

/** "2025-10-08" → "08 Oct 2025". */
export const dayLabel = (day: string) => `${day.slice(8)} Oct ${day.slice(0, 4)}`;

/** US states: a fill, the highlighted region, borders. */
export const STATE_LAYERS = [
  {
    id: "states-fill",
    type: "fill",
    paint: { "fill-color": "var(--ok-palette-grey-500)", "fill-opacity": 0.12 },
  },
  {
    id: "states-highlight",
    type: "fill",
    filter: ["==", ["get", "region"], ""],
    paint: { "fill-color": "var(--ok-palette-warning-main)", "fill-opacity": 0.48 },
  },
  {
    id: "states-border",
    type: "line",
    paint: { "line-color": "var(--ok-palette-grey-500)", "line-width": 1 },
  },
] as const;

/** The filter of the highlighted region. */
export const regionFilter = (region: string) => ["==", ["get", "region"], region];

/** The animated point: on a circle 20° around (0, 0); `angle` in radians. */
export const pointOnCircle = (angle: number) => ({
  type: "Point" as const,
  coordinates: [
    Math.round(Math.cos(angle) * 20 * 1e4) / 1e4,
    Math.round(Math.sin(angle) * 20 * 1e4) / 1e4,
  ],
});

export const POINT_LAYER = {
  id: "point",
  type: "circle",
  paint: {
    "circle-radius": 10,
    "circle-color": "var(--ok-palette-error-main)",
    "circle-stroke-width": 3,
    "circle-stroke-color": "var(--ok-palette-common-white)",
  },
} as const;
