/*
 * Map story data (plain data, shared by the React demos and the HTML snippet generator).
 * Basemaps: OpenFreeMap (free, no key; © OpenMapTiles, data © OpenStreetMap contributors).
 * Earthquakes: USGS (public domain), October 2025, magnitude 1.5 and up, contiguous US.
 * US states: Natural Earth 1:110m (public domain). Capitals and cities: public facts.
 * State populations: U.S. Census Bureau, 2020 Census apportionment counts (public domain).
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
/** The four US Census regions, built from the same states (`scripts/us-regions.mjs`). */
export const US_REGIONS = "maps/us-regions.geojson";

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

/** "Choropleth": resident population by state, 2020 Census (millions; the GeoJSON's `name` joins it). */
export const STATE_POPULATION: [string, number][] = [
  ["Alabama", 5.02],
  ["Alaska", 0.73],
  ["Arizona", 7.15],
  ["Arkansas", 3.01],
  ["California", 39.54],
  ["Colorado", 5.77],
  ["Connecticut", 3.61],
  ["Delaware", 0.99],
  ["District of Columbia", 0.69],
  ["Florida", 21.54],
  ["Georgia", 10.71],
  ["Hawaii", 1.46],
  ["Idaho", 1.84],
  ["Illinois", 12.81],
  ["Indiana", 6.79],
  ["Iowa", 3.19],
  ["Kansas", 2.94],
  ["Kentucky", 4.51],
  ["Louisiana", 4.66],
  ["Maine", 1.36],
  ["Maryland", 6.18],
  ["Massachusetts", 7.03],
  ["Michigan", 10.08],
  ["Minnesota", 5.71],
  ["Mississippi", 2.96],
  ["Missouri", 6.15],
  ["Montana", 1.08],
  ["Nebraska", 1.96],
  ["Nevada", 3.1],
  ["New Hampshire", 1.38],
  ["New Jersey", 9.29],
  ["New Mexico", 2.12],
  ["New York", 20.2],
  ["North Carolina", 10.44],
  ["North Dakota", 0.78],
  ["Ohio", 11.8],
  ["Oklahoma", 3.96],
  ["Oregon", 4.24],
  ["Pennsylvania", 13.0],
  ["Rhode Island", 1.1],
  ["South Carolina", 5.12],
  ["South Dakota", 0.89],
  ["Tennessee", 6.91],
  ["Texas", 29.15],
  ["Utah", 3.27],
  ["Vermont", 0.64],
  ["Virginia", 8.63],
  ["Washington", 7.71],
  ["West Virginia", 1.79],
  ["Wisconsin", 5.89],
  ["Wyoming", 0.58],
];

// --- Region drilldown ------------------------------------------------------------------------

export const CENSUS_REGION_NAMES = ["Northeast", "Midwest", "South", "West"] as const;
export type CensusRegion = (typeof CENSUS_REGION_NAMES)[number];
type LngLatBounds = [[number, number], [number, number]];

/** The contiguous US, for the top level. Alaska and Hawaii stay on the map but off this frame. */
export const US_BOUNDS: LngLatBounds = [
  [-125, 24.5],
  [-66.5, 49.5],
];

/** The frame and the states of each region (`properties.region` of the states file). */
export const CENSUS_REGIONS: Record<CensusRegion, { bounds: LngLatBounds; states: string[] }> = {
  Northeast: {
    bounds: [
      [-80.6, 39.7],
      [-66.9, 47.5],
    ],
    states: [
      "Connecticut",
      "Maine",
      "Massachusetts",
      "New Hampshire",
      "New Jersey",
      "New York",
      "Pennsylvania",
      "Rhode Island",
      "Vermont",
    ],
  },
  Midwest: {
    bounds: [
      [-104.1, 36],
      [-80.5, 49.4],
    ],
    states: [
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Michigan",
      "Minnesota",
      "Missouri",
      "Nebraska",
      "North Dakota",
      "Ohio",
      "South Dakota",
      "Wisconsin",
    ],
  },
  South: {
    bounds: [
      [-106.7, 25],
      [-75, 40.7],
    ],
    states: [
      "Alabama",
      "Arkansas",
      "Delaware",
      "District of Columbia",
      "Florida",
      "Georgia",
      "Kentucky",
      "Louisiana",
      "Maryland",
      "Mississippi",
      "North Carolina",
      "Oklahoma",
      "South Carolina",
      "Tennessee",
      "Texas",
      "Virginia",
      "West Virginia",
    ],
  },
  West: {
    // The contiguous part: Alaska and Hawaii are in the region but would shrink the frame.
    bounds: [
      [-124.8, 31.3],
      [-102, 49],
    ],
    states: [
      "Alaska",
      "Arizona",
      "California",
      "Colorado",
      "Hawaii",
      "Idaho",
      "Montana",
      "Nevada",
      "New Mexico",
      "Oregon",
      "Utah",
      "Washington",
      "Wyoming",
    ],
  },
};

const population = new Map(STATE_POPULATION);

/** The states of a region, as the `MapRegions` rows. */
export const stateRows = (region: CensusRegion) =>
  CENSUS_REGIONS[region].states.map((name) => ({
    id: name,
    name,
    value: population.get(name) ?? 0,
  }));

/** The regions and their total population, as the `MapRegions` rows. */
export const regionRows = CENSUS_REGION_NAMES.map((name) => ({
  id: name,
  name,
  value: Math.round(stateRows(name).reduce((sum, state) => sum + state.value, 0) * 100) / 100,
}));

// --- Great circles ---------------------------------------------------------------------------

type Airport = { name: string; position: [longitude: number, latitude: number] };

export const AIRPORT_HUB: Airport = { name: "Singapore", position: [103.99, 1.36] };
export const AIRPORTS: Airport[] = [
  { name: "London", position: [-0.45, 51.47] },
  { name: "Los Angeles", position: [-118.41, 33.94] },
  { name: "Sydney", position: [151.18, -33.95] },
  { name: "Johannesburg", position: [28.24, -26.13] },
  { name: "Tokyo", position: [140.39, 35.77] },
];

// --- Proportional symbols ----------------------------------------------------------------------

/**
 * "Bubbles": the 20 largest US metropolitan areas, 2020 Census (population in millions, rounded)
 * and their growth since 2010 in percent (rounded): `[name, longitude, latitude, population, growth]`.
 */
export const METROS: [string, number, number, number, number][] = [
  ["New York", -74.01, 40.71, 20.14, 6.6],
  ["Los Angeles", -118.24, 34.05, 13.2, 2.9],
  ["Chicago", -87.63, 41.88, 9.62, 1.7],
  ["Dallas", -96.8, 32.78, 7.64, 19.9],
  ["Houston", -95.37, 29.76, 7.12, 20.3],
  ["Washington", -77.04, 38.91, 6.39, 13.3],
  ["Philadelphia", -75.17, 39.95, 6.25, 4.7],
  ["Miami", -80.19, 25.76, 6.14, 10.4],
  ["Atlanta", -84.39, 33.75, 6.09, 15.1],
  ["Boston", -71.06, 42.36, 4.94, 8.6],
  ["Phoenix", -112.07, 33.45, 4.85, 15.8],
  ["San Francisco", -122.42, 37.77, 4.75, 9.8],
  ["Riverside", -117.4, 33.95, 4.6, 7.8],
  ["Detroit", -83.05, 42.33, 4.39, 1.3],
  ["Seattle", -122.33, 47.61, 4.02, 17.2],
  ["Minneapolis", -93.27, 44.98, 3.69, 10.6],
  ["San Diego", -117.16, 32.72, 3.3, 6.6],
  ["Tampa", -82.46, 27.95, 3.18, 13.8],
  ["Denver", -104.99, 39.74, 2.96, 17.3],
  ["Baltimore", -76.61, 39.29, 2.84, 4.3],
];

/** The metros as GeoJSON points; `promoteId: "name"` joins them to `MapRegions`. */
export const METRO_POINTS = {
  type: "FeatureCollection" as const,
  features: METROS.map(([name, longitude, latitude, population, growth]) => ({
    type: "Feature" as const,
    properties: { name, population, growth },
    geometry: { type: "Point" as const, coordinates: [longitude, latitude] },
  })),
};
