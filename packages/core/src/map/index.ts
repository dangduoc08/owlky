/*
 * @owlky/core/map — the Map's engine (ADR-0025): MapLibre GL JS, shared by React and HTML. A
 * separate entry so that `@owlky/core` and the main HTML bundle don't load MapLibre.
 */
export { getWorkerUrl as getMapWorkerUrl, setWorkerUrl as setMapWorkerUrl } from "maplibre-gl";
export {
  jenksBreaks,
  type MapExpression,
  type MapRegionLayersOptions,
  type MapScaleClass,
  type MapScaleMethod,
  type MapScaleOptions,
  type MapScalePalette,
  type MapScaleResult,
  mapPaletteColors,
  mapRegionLayers,
  mapScale,
  mapScaleLabel,
  mapScaleMethods,
  mapScalePalettes,
} from "./choropleth.js";
export {
  mapLayerTypes,
  mapSourceTypes,
  readLayerDeclaration,
  readSourceDeclaration,
} from "./declarations.js";
export {
  type AttributionPart,
  autoAnchor,
  distanceMeters,
  mapOffset,
  mapScaleBar,
  parseAttribution,
  safeMapUrl,
  supportsWebGL,
} from "./helpers.js";
export { type MapIconName, type MapLabels, mapIcons, mapLabels } from "./icons.js";
export {
  createMapController,
  type MapController,
  type MapControllerOptions,
  type MapDragPhase,
  type MapEvent,
  type MapEventType,
  type MapGeolocateState,
  type MapInitialViewState,
  type MapLayerSpec,
  type MapLibreMap,
  type MapPopupCloseReason,
  type MapSettings,
  type MapSourceSpec,
  type MapStyle,
  type MapViewState,
  mapEventTypes,
} from "./map.js";
