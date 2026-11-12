import { type PaletteColorName, paletteColorNames } from "@owlky/tokens";
import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Map (ADR-0025) -----------------------------------------------------------------------------

export const mapProjections = ["mercator", "globe"] as const;
export type MapProjection = (typeof mapProjections)[number];
export const mapAnchors = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export type MapAnchor = (typeof mapAnchors)[number];
export const mapAlignments = ["auto", "map", "viewport"] as const;
export type MapAlignment = (typeof mapAlignments)[number];
export const mapMarkerColors = paletteColorNames;
export type MapMarkerColor = PaletteColorName;
export const mapScaleUnits = ["metric", "imperial", "nautical"] as const;
export type MapScaleUnit = (typeof mapScaleUnits)[number];
export const mapPositions = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type MapPosition = (typeof mapPositions)[number];

/** Map interaction handlers (MapLibre names), each a `behavior` option that is on by default. */
export const mapHandlers = [
  "boxZoom",
  "doubleClickZoom",
  "dragPan",
  "dragRotate",
  "keyboard",
  "scrollZoom",
  "touchPitch",
  "touchZoomRotate",
] as const;
export type MapHandler = (typeof mapHandlers)[number];

export const mapOptions = defineOptions("map", "data-ok-map", {
  longitude: number(
    "data-ok-longitude",
    0,
    "Center longitude in degrees (HTML: changing it moves the map).",
  ),
  latitude: number("data-ok-latitude", 0, "Center latitude in degrees (−85 to 85)."),
  zoom: number("data-ok-zoom", 0, "Zoom level (0: the whole world).", { min: 0 }),
  pitch: number("data-ok-pitch", 0, "Tilt in degrees (0: looking straight down).", { min: 0 }),
  bearing: number("data-ok-bearing", 0, "Rotation in degrees clockwise from north."),
  minZoom: number("data-ok-min-zoom", 0, "Lowest zoom level people can reach."),
  maxZoom: number("data-ok-max-zoom", 22, "Highest zoom level people can reach (at most 24)."),
  minPitch: number("data-ok-min-pitch", 0, "Lowest tilt in degrees.", { min: 0 }),
  maxPitch: number("data-ok-max-pitch", 60, "Highest tilt in degrees (at most 85).", { min: 0 }),
  projection: style(
    "data-ok-projection",
    mapProjections,
    "mercator",
    "Projection: a flat `mercator` map or a `globe` when zoomed out.",
  ),
  boxZoom: behavior("data-ok-box-zoom", true, "Shift + drag zooms to the drawn box."),
  doubleClickZoom: behavior("data-ok-double-click-zoom", true, "Double click zooms in."),
  dragPan: behavior("data-ok-drag-pan", true, "Dragging moves the map."),
  dragRotate: behavior(
    "data-ok-drag-rotate",
    true,
    "Right-click drag (or Ctrl + drag) rotates and tilts the map.",
  ),
  keyboard: behavior(
    "data-ok-keyboard",
    true,
    "Arrow keys pan, + and − zoom, Shift + arrows rotate and tilt (the map has focus).",
  ),
  scrollZoom: behavior("data-ok-scroll-zoom", true, "The mouse wheel and trackpad zoom."),
  touchPitch: behavior("data-ok-touch-pitch", true, "Two-finger vertical drag tilts the map."),
  touchZoomRotate: behavior(
    "data-ok-touch-zoom-rotate",
    true,
    "Pinch zooms and two-finger twist rotates.",
  ),
  renderWorldCopies: behavior(
    "data-ok-render-world-copies",
    true,
    "Repeats the world side by side when zoomed out.",
  ),
  styleDiffing: behavior(
    "data-ok-style-diffing",
    true,
    "A new style is compared with the current one and only the differences are applied (off: the style reloads).",
  ),
  cooperativeGestures: flag(
    "data-ok-cooperative-gestures",
    "Page-friendly gestures: Ctrl + scroll zooms and two fingers pan, so the page keeps scrolling.",
  ),
  fullscreen: state(
    "data-ok-fullscreen",
    "Fills the screen (the fullscreen control; Escape leaves).",
    "fullscreen",
  ),
});

export type MapAnatomyOptions = {
  longitude?: number | undefined;
  latitude?: number | undefined;
  zoom?: number | undefined;
  pitch?: number | undefined;
  bearing?: number | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  minPitch?: number | undefined;
  maxPitch?: number | undefined;
  projection?: MapProjection | undefined;
  cooperativeGestures?: boolean | undefined;
  renderWorldCopies?: boolean | undefined;
  styleDiffing?: boolean | undefined;
} & { [K in MapHandler]?: boolean | undefined };

/** `data-ok-*` attributes of a map root: numbers when given, `="false"` for handlers turned off. */
export const mapAttributes = (options: MapAnatomyOptions = {}): DataAttributes => {
  const attributes = optionAttributes(mapOptions, { ...options });
  for (const key of [...mapHandlers, "renderWorldCopies", "styleDiffing"] as const)
    if (options[key] === false) attributes[mapOptions.options[key].attr] = "false";
  return attributes;
};

export const mapMarkerOptions = defineOptions("map-marker", "data-ok-map-marker", {
  longitude: number("data-ok-longitude", undefined, "Longitude of the point it marks."),
  latitude: number("data-ok-latitude", undefined, "Latitude of the point it marks."),
  anchor: style(
    "data-ok-anchor",
    mapAnchors,
    "center",
    "Which part of the marker sits on the point (`bottom` for pins).",
  ),
  color: style("data-ok-color", mapMarkerColors, "primary", "Color of the default pin."),
  draggable: flag(
    "data-ok-draggable",
    "People can drag the marker, or move it with the arrow keys once it has focus.",
  ),
  rotation: number("data-ok-rotation", undefined, "Rotation in degrees clockwise."),
  scale: number("data-ok-scale", 1, "Size of the default pin (1: 26px).", { min: 0 }),
  clickTolerance: number(
    "data-ok-click-tolerance",
    undefined,
    "Pixels a press may move and still count as a click, not a drag (default: the map's `clickTolerance`, 3).",
    { min: 0 },
  ),
  rotationAlignment: style(
    "data-ok-rotation-alignment",
    mapAlignments,
    "auto",
    "`map`: turns with the map; `viewport` and `auto`: stays upright.",
    { optional: true },
  ),
  pitchAlignment: style(
    "data-ok-pitch-alignment",
    mapAlignments,
    "auto",
    "`map`: lies flat on a tilted map; `viewport` and `auto`: faces the screen.",
    { optional: true },
  ),
});

export type MapMarkerAnatomyOptions = {
  longitude?: number | undefined;
  latitude?: number | undefined;
  anchor?: MapAnchor | undefined;
  color?: MapMarkerColor | undefined;
  draggable?: boolean | undefined;
  rotation?: number | undefined;
  scale?: number | undefined;
  clickTolerance?: number | undefined;
  rotationAlignment?: MapAlignment | undefined;
  pitchAlignment?: MapAlignment | undefined;
};

/** `data-ok-*` attributes of a marker. */
export const mapMarkerAttributes = (options: MapMarkerAnatomyOptions = {}): DataAttributes =>
  optionAttributes(mapMarkerOptions, { ...options });

export const mapPopupOptions = defineOptions("map-popup", "data-ok-map-popup", {
  longitude: number("data-ok-longitude", undefined, "Longitude of the point it points at."),
  latitude: number("data-ok-latitude", undefined, "Latitude of the point it points at."),
  anchor: style(
    "data-ok-anchor",
    mapAnchors,
    "bottom",
    "Which side of the popup points at the point (default: picked so the popup fits).",
    { optional: true },
  ),
  maxWidth: number("data-ok-max-width", 240, "Widest the popup gets, in px.", {
    min: 0,
    units: ["px", "rem", "em"],
  }),
  closeOnClick: behavior("data-ok-close-on-click", true, "A click on the map closes it."),
  closeOnMove: flag("data-ok-close-on-move", "Moving the map closes it."),
  focusAfterOpen: behavior(
    "data-ok-focus-after-open",
    true,
    "Moves focus into the popup when it opens (and back when it closes).",
  ),
});

export type MapPopupAnatomyOptions = {
  longitude?: number | undefined;
  latitude?: number | undefined;
  anchor?: MapAnchor | undefined;
  maxWidth?: number | string | undefined;
  closeOnClick?: boolean | undefined;
  closeOnMove?: boolean | undefined;
  focusAfterOpen?: boolean | undefined;
};

/** `data-ok-*` attributes of a popup (`="false"` for behaviors turned off). */
export const mapPopupAttributes = (options: MapPopupAnatomyOptions = {}): DataAttributes => {
  const attributes = optionAttributes(mapPopupOptions, { ...options });
  for (const key of ["closeOnClick", "focusAfterOpen"] as const)
    if (options[key] === false) attributes[mapPopupOptions.options[key].attr] = "false";
  return attributes;
};

export const mapNavigationOptions = defineOptions("map-navigation", "data-ok-map-navigation", {
  visualizePitch: flag("data-ok-visualize-pitch", "The compass also tilts with the map."),
});

export const mapGeolocateOptions = defineOptions("map-geolocate", "data-ok-map-geolocate", {
  trackUserLocation: flag(
    "data-ok-track-user-location",
    "Keeps following the location: the button turns tracking on and off.",
  ),
  showUserLocation: behavior("data-ok-show-user-location", true, "Shows a dot at the location."),
  showAccuracyCircle: behavior(
    "data-ok-show-accuracy-circle",
    true,
    "Shows a circle as wide as the location's accuracy.",
  ),
});

export const mapScaleOptions = defineOptions("map-scale", "data-ok-map-scale", {
  unit: style(
    "data-ok-unit",
    mapScaleUnits,
    "metric",
    "Units: `metric`, `imperial` or `nautical`.",
  ),
  maxWidth: number("data-ok-max-width", 100, "Longest the scale bar gets, in px.", { min: 1 }),
});

export const mapAttributionOptions = defineOptions("map-attribution", "data-ok-map-attribution", {
  compact: flag(
    "data-ok-compact",
    "Always folds the credits behind an info button (default: only on maps narrower than 640px).",
  ),
});

export const mapLegendVariants = ["classes", "gradient", "size"] as const;
export type MapLegendVariant = (typeof mapLegendVariants)[number];

export const mapLegendOptions = defineOptions("map-legend", "data-ok-map-legend", {
  variant: style(
    "data-ok-variant",
    mapLegendVariants,
    "classes",
    "`classes`: one swatch and range per class; `gradient`: one bar from the lowest value to the highest; `size`: nested circles of a size scale (proportional symbols).",
  ),
  interactive: behavior(
    "data-ok-interactive",
    true,
    "Classes are toggle buttons: pressing some mutes the regions outside them.",
  ),
});

export type MapLegendAnatomyOptions = {
  variant?: MapLegendVariant | undefined;
  interactive?: boolean | undefined;
};

/** `data-ok-*` attributes of a map legend (`data-ok-interactive="false"` when it is static). */
export const mapLegendAttributes = (options: MapLegendAnatomyOptions = {}): DataAttributes => {
  const attributes = optionAttributes(mapLegendOptions, { ...options });
  if (options.interactive === false)
    attributes[mapLegendOptions.options.interactive.attr] = "false";
  return attributes;
};

export const mapRegionsLinkFilters = ["bidirectional", "emit", "receive"] as const;
export type MapRegionsLinkFilter = (typeof mapRegionsLinkFilters)[number];

/** Map regions (ADR-0065): multiple and box selection, linked maps. */
export const mapRegionsOptions = defineOptions("map-regions", "data-ok-map-regions", {
  multiple: flag(
    "data-ok-multiple",
    "Several regions can be selected: a click, Enter or Space toggles one, Shift + arrows add the next one, Ctrl + A selects all and Escape clears.",
  ),
  boxSelect: flag(
    "data-ok-box-select",
    "Shift + drag on the map selects the regions whose label anchor is in the box (Alt adds to the selection, Escape cancels). Implies `multiple` and turns off the map's Shift + drag zoom.",
  ),
  linkFilter: style(
    "data-ok-link-filter",
    mapRegionsLinkFilters,
    "bidirectional",
    "Regions of a `group`: `bidirectional` (the default: the selection filters the other maps of the group, and their selections filter this one), `emit` (filters the others only) or `receive` (shows the others' filters only).",
    { optional: true },
  ),
});

export type MapRegionsAnatomyOptions = {
  multiple?: boolean | undefined;
  boxSelect?: boolean | undefined;
  linkFilter?: MapRegionsLinkFilter | undefined;
};

/** `data-ok-*` attributes of a map regions part. */
export const mapRegionsAttributes = (options: MapRegionsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(mapRegionsOptions, { ...options });

export type MapControlAnatomyOptions = {
  visualizePitch?: boolean | undefined;
  trackUserLocation?: boolean | undefined;
  showUserLocation?: boolean | undefined;
  showAccuracyCircle?: boolean | undefined;
  unit?: MapScaleUnit | undefined;
  maxWidth?: number | undefined;
  compact?: boolean | undefined;
};

/** `data-ok-*` attributes of the navigation, geolocate, scale or attribution control. */
export const mapControlAttributes = (
  control: "navigation" | "geolocate" | "scale" | "attribution",
  options: MapControlAnatomyOptions = {},
): DataAttributes => {
  const schema = {
    navigation: mapNavigationOptions,
    geolocate: mapGeolocateOptions,
    scale: mapScaleOptions,
    attribution: mapAttributionOptions,
  }[control];
  const attributes = optionAttributes(schema, { ...options });
  if (control === "geolocate")
    for (const key of ["showUserLocation", "showAccuracyCircle"] as const)
      if (options[key] === false) attributes[mapGeolocateOptions.options[key].attr] = "false";
  return attributes;
};
