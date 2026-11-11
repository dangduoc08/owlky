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
  type GeoDescriptionInput,
  type GeoDescriptionItem,
  type GeoDescriptionKind,
  type GeoDescriptionStrings,
  geoDescription,
  geoDescriptionStrings,
} from "./describe.js";
export {
  type GreatCircleFeature,
  type GreatCircleOptions,
  greatCircle,
  type MapLngLat,
} from "./geo.js";
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
export {
  type MapHexbinAggregate,
  type MapHexbinCollection,
  type MapHexbinFeature,
  type MapHexbinOptions,
  type MapHexbinPoint,
  mapHexbin,
  mapHexbinAggregates,
} from "./hexbin.js";
export { type MapIconName, type MapLabels, mapIcons, mapLabels } from "./icons.js";
export {
  type MapPixelGridOptions,
  type MapPixelShape,
  mapPixelGrid,
  mapPixelShapes,
} from "./lattice.js";
export {
  createMapController,
  type MapController,
  type MapControllerOptions,
  type MapDragPhase,
  type MapEvent,
  type MapEventType,
  type MapExportFormat,
  type MapExportOptions,
  type MapGeolocateState,
  type MapInitialViewState,
  type MapLayerSpec,
  type MapLibreMap,
  type MapLight,
  type MapPadding,
  type MapPopupCloseReason,
  type MapSettings,
  type MapSky,
  type MapSourceSpec,
  type MapStyle,
  type MapViewState,
  mapEventTypes,
  mapPadding,
  parseMapJson,
  parseMapPadding,
} from "./map.js";
export {
  drawMapPattern,
  type MapPatternLayerOptions,
  type MapPatternStyle,
  mapClassPatterns,
  mapPatternImage,
  mapPatternLayer,
  mapPatternStyle,
  mapPatternStyles,
} from "./patterns.js";
export {
  type MapBubbleLayerOptions,
  type MapSizeLegendItem,
  type MapSizeMethod,
  type MapSizeScaleOptions,
  type MapSizeScaleResult,
  mapBubbleLayer,
  mapSizeMethods,
  mapSizeScale,
} from "./symbols.js";
