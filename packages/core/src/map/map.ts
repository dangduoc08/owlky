import {
  type EaseToOptions,
  type FitBoundsOptions,
  type FlyToOptions,
  type JumpToOptions,
  type LngLatBoundsLike,
  type MapGeoJSONFeature,
  Map as MapLibreMap,
  type MapOptions,
} from "maplibre-gl";
import {
  type MapAnchor,
  type MapHandler,
  type MapProjection,
  type MapScaleUnit,
  mapAnchors,
  mapHandlers,
  mapScaleUnits,
} from "../anatomy/anatomy.js";
import {
  autoAnchor,
  distanceMeters,
  mapOffset,
  mapScale,
  parseAttribution,
  safeMapUrl,
  supportsWebGL,
} from "./helpers.js";
import { type MapLabels, mapLabels } from "./icons.js";

/** A MapLibre style: a style URL or a style object. */
export type MapStyle = Exclude<Parameters<MapLibreMap["setStyle"]>[0], null>;
/** A MapLibre source specification (`{ type: "geojson", data, … }`). */
export type MapSourceSpec = Parameters<MapLibreMap["addSource"]>[1];
/** A MapLibre layer specification (`{ id, type, source, paint, … }`). */
export type MapLayerSpec = Parameters<MapLibreMap["addLayer"]>[0];
/** The MapLibre map (escape hatch for everything Owlky doesn't wrap). */
export type { MapLibreMap };

export interface MapViewState {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
  readonly pitch: number;
  readonly bearing: number;
}

export interface MapInitialViewState extends Partial<MapViewState> {
  /** Fits these bounds instead of a center and zoom: `[west, south, east, north]`. */
  readonly bounds?: LngLatBoundsLike | undefined;
  readonly fitBoundsOptions?: FitBoundsOptions | undefined;
}

/** Settings that can change after the map is created. */
export interface MapSettings extends Record<MapHandler, boolean> {
  cooperativeGestures: boolean;
  renderWorldCopies: boolean;
  minZoom: number;
  maxZoom: number;
  minPitch: number;
  maxPitch: number;
  maxBounds: LngLatBoundsLike | null;
  projection: MapProjection;
  /** Layers whose features mouse events report (and that show a pointer cursor). */
  interactiveLayerIds: readonly string[];
  /** Cursor over the map (default: grab, pointer over interactive features). */
  cursor: string | null;
  /** 3D terrain from a `raster-dem` source, or `null`. */
  terrain: { source: string; exaggeration?: number } | null;
}

export const mapEventTypes = [
  "load",
  "error",
  "idle",
  "resize",
  "remove",
  "render",
  "data",
  "styledata",
  "sourcedata",
  "movestart",
  "move",
  "moveend",
  "zoomstart",
  "zoom",
  "zoomend",
  "rotatestart",
  "rotate",
  "rotateend",
  "pitchstart",
  "pitch",
  "pitchend",
  "dragstart",
  "drag",
  "dragend",
  "boxzoomstart",
  "boxzoomend",
  "boxzoomcancel",
  "click",
  "dblclick",
  "contextmenu",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseover",
  "mouseout",
  "mouseenter",
  "mouseleave",
  "wheel",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
] as const;
export type MapEventType = (typeof mapEventTypes)[number];

/** What a map event reports (MapLibre's event, plus the view state and the features hit). */
export interface MapEvent {
  readonly type: MapEventType;
  readonly viewState: MapViewState;
  readonly originalEvent?: Event | undefined;
  readonly lngLat?: { lng: number; lat: number } | undefined;
  readonly point?: { x: number; y: number } | undefined;
  /** Mouse and touch events: features of `interactiveLayerIds` under the pointer. */
  readonly features?: MapGeoJSONFeature[] | undefined;
  readonly error?: Error | undefined;
  /** Source events: the source's id. */
  readonly sourceId?: string | undefined;
}

export type MapPopupCloseReason = "close-button" | "click" | "move" | "escape";
export type MapDragPhase = "start" | "drag" | "end";
export type MapGeolocateState = "off" | "waiting" | "active" | "error";

export interface MapControllerOptions extends Partial<MapSettings> {
  /** Style for light color schemes (and dark ones without `mapStyleDark`). */
  readonly mapStyle?: MapStyle | undefined;
  /** Style used while the map sits in a dark color scheme. */
  readonly mapStyleDark?: MapStyle | undefined;
  readonly initialViewState?: MapInitialViewState | undefined;
  /** Texts: control names, the map's name, status messages (English by default). */
  readonly labels?: Partial<MapLabels> | undefined;
  /** Any other MapLibre option (`transformRequest`, `fadeDuration`, `hash`, `locale`…). */
  readonly mapOptions?: Partial<MapOptions> | undefined;
  /** Tests: behave as if WebGL were missing. */
  readonly forceFallback?: boolean | undefined;
  /** Tests: never use the Fullscreen API (the CSS fallback fills the window). */
  readonly forcePseudoFullscreen?: boolean | undefined;
  /** The map can't be drawn (no WebGL, or MapLibre failed to start). */
  readonly onFallback?: ((reason: "webgl" | "error") => void) | undefined;
  /** A draggable marker moved (pointer or arrow keys). */
  readonly onMarkerDrag?:
    | ((marker: HTMLElement, phase: MapDragPhase, lngLat: { lng: number; lat: number }) => void)
    | undefined;
  /** A popup asks to close; the owner hides or removes it. */
  readonly onPopupClose?: ((popup: HTMLElement, reason: MapPopupCloseReason) => void) | undefined;
  readonly onFullscreenChange?: ((fullscreen: boolean) => void) | undefined;
  readonly onGeolocate?: ((position: GeolocationPosition) => void) | undefined;
  readonly onGeolocateError?: ((error: GeolocationPositionError | Error) => void) | undefined;
  readonly onTrackUserLocationChange?: ((tracking: boolean) => void) | undefined;
}

export interface MapController {
  /** The MapLibre map, or `null` in the fallback. */
  readonly map: MapLibreMap | null;
  readonly fallback: boolean;
  /** `true` once the style and the first tiles loaded. */
  readonly loaded: boolean;
  /** Subscribes to a map event; returns the unsubscribe function. */
  on(type: MapEventType, handler: (event: MapEvent) => void): () => void;
  getViewState(): MapViewState;
  /** Jumps to the given view when it differs from the current one. */
  setViewState(view: Partial<MapViewState>): void;
  flyTo(options: FlyToOptions): void;
  easeTo(options: EaseToOptions): void;
  jumpTo(options: JumpToOptions): void;
  fitBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions): void;
  setSettings(settings: Partial<MapSettings>): void;
  setMapStyle(style: MapStyle | undefined, dark?: MapStyle | undefined): void;
  setLabels(labels: Partial<MapLabels>): void;
  setSource(id: string, spec: MapSourceSpec): void;
  removeSource(id: string): void;
  setSourceData(id: string, data: unknown): void;
  setLayer(spec: MapLayerSpec, beforeId?: string): void;
  removeLayer(id: string): void;
  /** Zoom level at which a cluster of a clustered GeoJSON source breaks apart. */
  getClusterExpansionZoom(sourceId: string, clusterId: number): Promise<number>;
  setFullscreen(fullscreen: boolean): void;
  geolocate(): void;
  /** Whether the click that just happened ended a drag of this marker (ignore it). */
  wasDragged(marker: Element): boolean;
  /** Re-reads markers, popups and controls (the controller also watches the DOM itself). */
  sync(): void;
  destroy(): void;
}

const DEFAULTS: MapSettings = {
  boxZoom: true,
  doubleClickZoom: true,
  dragPan: true,
  dragRotate: true,
  keyboard: true,
  scrollZoom: true,
  touchPitch: true,
  touchZoomRotate: true,
  cooperativeGestures: false,
  renderWorldCopies: true,
  minZoom: 0,
  maxZoom: 22,
  minPitch: 0,
  maxPitch: 60,
  maxBounds: null,
  projection: "mercator",
  interactiveLayerIds: [],
  cursor: null,
  terrain: null,
};

/** Mouse and touch events: they carry a point and report interactive features. */
const POINTER_EVENTS = new Set<string>([
  "click",
  "dblclick",
  "contextmenu",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseover",
  "mouseout",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
]);
const OVERLAY_ATTRIBUTES = [
  "data-ok-longitude",
  "data-ok-latitude",
  "data-ok-anchor",
  "data-ok-offset",
  "data-ok-rotation",
  "data-ok-rotation-alignment",
  "data-ok-pitch-alignment",
  "data-ok-max-width",
  "hidden",
];
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const TOLERANCE = 3;
const TOKEN = /^var\((--ok-[a-z0-9-]+)\)$/;
const TOKEN_MARK = '"var(--ok-';
const EARTH = 40075016.686;

const finite = (value: string | null) => {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};
const sameNumber = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const json = (value: unknown) => JSON.stringify(value);

/** Checks a style URL (objects pass: MapLibre validates them). */
function safeStyle(style: MapStyle | undefined): MapStyle | undefined {
  if (typeof style !== "string") return style;
  return safeMapUrl(style) ?? undefined;
}

/** A source spec whose URLs are checked (`data`, `url`, `tiles`, image / video `url(s)`). */
function safeSource(spec: MapSourceSpec): MapSourceSpec {
  const copy = { ...spec } as Record<string, unknown>;
  for (const key of ["data", "url"]) {
    const value = copy[key];
    if (typeof value === "string") {
      const url = safeMapUrl(value);
      if (url === null) delete copy[key];
      else copy[key] = url;
    }
  }
  for (const key of ["tiles", "urls"]) {
    const value = copy[key];
    if (Array.isArray(value))
      copy[key] = value
        .map((each) => safeMapUrl(each as string))
        .filter((each): each is string => each !== null);
  }
  return copy as MapSourceSpec;
}

/**
 * Map controller (spec: specs/components/map.md, ADR-0025): mounts MapLibre on
 * `[data-ok-map-view]` inside `element` (`[data-ok-map]`) and drives the Owlky parts around it —
 * markers and popups (positioned through CSSOM), controls, scale, attribution and status. It reports
 * intent (popup close, marker drag, fullscreen) and owns no content: the owner (React or the HTML
 * runtime) changes the markup. Without WebGL it sets `data-ok-fallback` and draws nothing.
 */
export function createMapController(
  element: HTMLElement,
  options: MapControllerOptions = {},
): MapController {
  const view = element.querySelector<HTMLElement>("[data-ok-map-view]");
  if (!view) throw new Error("Map markup needs a [data-ok-map-view] element.");
  const abort = new AbortController();
  const { signal } = abort;
  const settings: MapSettings = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof MapSettings)[])
    if (options[key] !== undefined)
      (settings as unknown as Record<string, unknown>)[key] = options[key];
  let labels: MapLabels = { ...mapLabels, ...options.labels };
  let lightStyle = safeStyle(options.mapStyle);
  let darkStyle = safeStyle(options.mapStyleDark);
  let appliedStyle: MapStyle | undefined;
  const sources = new Map<string, MapSourceSpec>();
  const layers = new Map<string, { spec: MapLayerSpec; beforeId: string | undefined }>();
  const handlers = new Map<MapEventType, Set<(event: MapEvent) => void>>();
  const bound = new Set<string>();
  let map: MapLibreMap | null = null;
  let fallback = false;
  let loaded = false;
  let styleReady = false;
  let destroyed = false;

  const own = <T extends Element = HTMLElement>(selector: string) =>
    [...element.querySelectorAll<T & Element>(selector)].filter(
      (node) => node.closest("[data-ok-map]") === element,
    ) as T[];
  const status = (text: string) => {
    for (const region of own("[data-ok-map-status]")) region.textContent = text;
  };

  // --- Fallback ---------------------------------------------------------------------------------

  const enterFallback = (reason: "webgl" | "error") => {
    fallback = true;
    element.setAttribute("data-ok-fallback", "");
    for (const node of own("[data-ok-map-fallback]"))
      if (node.textContent?.trim() === "") node.textContent = labels.fallback;
    options.onFallback?.(reason);
  };

  // --- View state -------------------------------------------------------------------------------

  const initial = options.initialViewState ?? {};
  const getViewState = (): MapViewState => {
    if (!map)
      return {
        longitude: initial.longitude ?? 0,
        latitude: initial.latitude ?? 0,
        zoom: initial.zoom ?? 0,
        pitch: initial.pitch ?? 0,
        bearing: initial.bearing ?? 0,
      };
    const center = map.getCenter();
    return {
      longitude: center.lng,
      latitude: center.lat,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    };
  };

  // --- Color scheme -----------------------------------------------------------------------------

  const media = matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => {
    const scheme = getComputedStyle(element).colorScheme;
    const dark = /\bdark\b/.test(scheme);
    const light = /\blight\b/.test(scheme);
    return dark && light ? media.matches : dark;
  };
  const currentStyle = () => (darkStyle && isDark() ? darkStyle : lightStyle);

  // --- Sources and layers -----------------------------------------------------------------------

  /** `"var(--ok-…)"` strings in paint and layout values → the token's current value. */
  const resolve = (value: unknown): unknown => {
    if (typeof value === "string") {
      const token = TOKEN.exec(value)?.[1];
      return token ? getComputedStyle(element).getPropertyValue(token).trim() || value : value;
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === "object")
      return Object.fromEntries(Object.entries(value).map(([key, each]) => [key, resolve(each)]));
    return value;
  };
  const resolved = (spec: MapLayerSpec) => {
    const copy = { ...spec } as Record<string, unknown>;
    for (const group of ["paint", "layout"]) if (copy[group]) copy[group] = resolve(copy[group]);
    return copy as MapLayerSpec;
  };
  /** Re-reads the tokens of every layer (the color scheme changed). */
  const refreshTokens = () => {
    if (!map || !styleReady) return;
    for (const { spec } of layers.values()) {
      const paint = (spec as { paint?: Record<string, unknown> }).paint ?? {};
      for (const [key, value] of Object.entries(paint))
        if (map.getLayer(spec.id) && JSON.stringify(value).includes(TOKEN_MARK))
          map.setPaintProperty(
            spec.id,
            key as Parameters<MapLibreMap["setPaintProperty"]>[1],
            resolve(value) as Parameters<MapLibreMap["setPaintProperty"]>[2],
          );
    }
  };
  const addLayerToMap = (map: MapLibreMap, spec: MapLayerSpec, beforeId: string | undefined) =>
    map.addLayer(resolved(spec), beforeId && map.getLayer(beforeId) ? beforeId : undefined);
  /** Adds every registered source and layer the style lacks (after each style load). */
  const restore = (map: MapLibreMap) => {
    for (const [id, spec] of sources) if (!map.getSource(id)) map.addSource(id, spec);
    for (const { spec, beforeId } of layers.values())
      if (
        !map.getLayer(spec.id) &&
        (!("source" in spec) || typeof spec.source !== "string" || map.getSource(spec.source))
      )
        addLayerToMap(map, spec, beforeId);
    applyStyleSettings();
  };
  const applyStyleSettings = () => {
    if (!map || !styleReady) return;
    map.setProjection({ type: settings.projection });
    const terrain = settings.terrain;
    map.setTerrain(terrain && map.getSource(terrain.source) ? terrain : null);
  };

  // --- Events -----------------------------------------------------------------------------------

  let hovered = false;
  const queryFeatures = (point: { x: number; y: number }) => {
    if (!map || settings.interactiveLayerIds.length === 0) return undefined;
    const ids = settings.interactiveLayerIds.filter((id) => map?.getLayer(id));
    return ids.length > 0 ? map.queryRenderedFeatures([point.x, point.y], { layers: ids }) : [];
  };
  const emit = (type: MapEventType, event: Omit<MapEvent, "type" | "viewState">) => {
    const set = handlers.get(type);
    if (!set || set.size === 0) return;
    const full: MapEvent = { type, viewState: getViewState(), ...event };
    for (const handler of [...set]) handler(full);
  };
  const toEvent = (raw: Record<string, unknown>): Omit<MapEvent, "type" | "viewState"> => {
    const point = raw["point"] as { x: number; y: number } | undefined;
    const lngLat = raw["lngLat"] as { lng: number; lat: number } | undefined;
    return {
      originalEvent: raw["originalEvent"] as Event | undefined,
      point: point ? { x: point.x, y: point.y } : undefined,
      lngLat: lngLat ? { lng: lngLat.lng, lat: lngLat.lat } : undefined,
      error: raw["error"] as Error | undefined,
      sourceId: raw["sourceId"] as string | undefined,
    };
  };
  /** Listens to a MapLibre event once per type, however many handlers there are. */
  const bind = (type: string) => {
    if (!map || bound.has(type) || type === "mouseenter" || type === "mouseleave") return;
    bound.add(type);
    map.on(type as "click", (raw: unknown) => {
      const event = toEvent(raw as Record<string, unknown>);
      emit(
        type as MapEventType,
        POINTER_EVENTS.has(type) && event.point
          ? { ...event, features: queryFeatures(event.point) }
          : event,
      );
    });
  };
  const on = (type: MapEventType, handler: (event: MapEvent) => void) => {
    let set = handlers.get(type);
    if (!set) {
      set = new Set();
      handlers.set(type, set);
    }
    set.add(handler);
    bind(type);
    return () => {
      set?.delete(handler);
    };
  };

  /** Pointer cursor and mouseenter / mouseleave over interactive features. */
  const hover = (raw: { point: { x: number; y: number }; originalEvent?: Event }) => {
    const features = queryFeatures(raw.point) ?? [];
    const over = features.length > 0;
    (map as MapLibreMap).getCanvas().style.cursor = settings.cursor ?? (over ? "pointer" : "");
    if (over === hovered) return;
    hovered = over;
    emit(over ? "mouseenter" : "mouseleave", {
      point: { x: raw.point.x, y: raw.point.y },
      originalEvent: raw.originalEvent,
      features,
    });
  };

  // --- Overlays: markers, popups, the user location ---------------------------------------------

  let markers: HTMLElement[] = [];
  let popups: HTMLElement[] = [];
  const written = new WeakMap<Element, string>();
  const dragged = new WeakMap<Element, { lng: number; lat: number }>();
  const justDragged = new WeakSet<Element>();
  let shown = new Set<HTMLElement>();
  const returnFocus = new WeakMap<HTMLElement, HTMLElement>();
  let firstScan = true;
  let userLocation: { lng: number; lat: number; accuracy: number } | null = null;
  let userDot: HTMLElement | null = null;

  const lngLatOf = (node: Element) => {
    const override = dragged.get(node);
    if (override) return override;
    const lng = finite(node.getAttribute("data-ok-longitude"));
    const lat = finite(node.getAttribute("data-ok-latitude"));
    return lng === undefined || lat === undefined ? null : { lng, lat };
  };
  const write = (node: HTMLElement, values: Record<string, string>) => {
    const key = json(values);
    if (written.get(node) === key) return;
    written.set(node, key);
    for (const [name, value] of Object.entries(values)) node.style.setProperty(name, value);
  };
  const anchorOf = (node: Element, fallbackAnchor: MapAnchor) => {
    const value = node.getAttribute("data-ok-anchor");
    return mapAnchors.includes(value as MapAnchor) ? (value as MapAnchor) : fallbackAnchor;
  };

  const positionMarker = (marker: HTMLElement) => {
    const point = lngLatOf(marker);
    if (!map || !point) {
      write(marker, { "--_ok-map-visibility": "hidden" });
      return;
    }
    const projected = map.project([point.lng, point.lat]);
    const [dx, dy] = mapOffset(marker.getAttribute("data-ok-offset"), "center");
    const rotation = finite(marker.getAttribute("data-ok-rotation")) ?? 0;
    const rotateWithMap = marker.getAttribute("data-ok-rotation-alignment") === "map";
    const flat = marker.getAttribute("data-ok-pitch-alignment") === "map";
    write(marker, {
      "--_ok-map-visibility": "visible",
      "--_ok-map-x": `${Math.round((projected.x + dx) * 100) / 100}px`,
      "--_ok-map-y": `${Math.round((projected.y + dy) * 100) / 100}px`,
      "--_ok-map-rotate-x": `${flat ? map.getPitch() : 0}deg`,
      "--_ok-map-rotate-z": `${rotation - (rotateWithMap ? map.getBearing() : 0)}deg`,
    });
  };

  const positionPopup = (popup: HTMLElement) => {
    const point = lngLatOf(popup);
    if (!map || !point) {
      write(popup, { "--_ok-map-visibility": "hidden" });
      return;
    }
    const projected = map.project([point.lng, point.lat]);
    const container = map.getContainer();
    const anchor = popup.hasAttribute("data-ok-anchor")
      ? anchorOf(popup, "bottom")
      : autoAnchor(
          projected,
          { width: popup.offsetWidth, height: popup.offsetHeight },
          { width: container.clientWidth, height: container.clientHeight },
        );
    if (popup.getAttribute("data-ok-current-anchor") !== anchor)
      popup.setAttribute("data-ok-current-anchor", anchor);
    const [dx, dy] = mapOffset(popup.getAttribute("data-ok-offset"), anchor);
    const maxWidth = popup.getAttribute("data-ok-max-width");
    write(popup, {
      "--_ok-map-visibility": "visible",
      "--_ok-map-x": `${Math.round((projected.x + dx) * 100) / 100}px`,
      "--_ok-map-y": `${Math.round((projected.y + dy) * 100) / 100}px`,
      "--_ok-map-popup-max-width":
        maxWidth === null
          ? ""
          : /^\d+(\.\d+)?$/.test(maxWidth)
            ? `${maxWidth}px`
            : /^\d+(\.\d+)?(px|rem|em)$/.test(maxWidth)
              ? maxWidth
              : "",
    });
  };

  const positionUser = () => {
    if (!map || !userDot || !userLocation) return;
    const projected = map.project([userLocation.lng, userLocation.lat]);
    const metersPerPixel =
      (EARTH * Math.cos((userLocation.lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
    write(userDot, {
      "--_ok-map-x": `${Math.round(projected.x * 100) / 100}px`,
      "--_ok-map-y": `${Math.round(projected.y * 100) / 100}px`,
      "--_ok-map-accuracy": `${Math.round((userLocation.accuracy / metersPerPixel) * 2)}px`,
    });
  };

  const position = () => {
    for (const marker of markers) positionMarker(marker);
    for (const popup of popups) if (!popup.hidden) positionPopup(popup);
    positionUser();
  };

  /** Moves focus into popups that just opened, and back when they close. */
  const focusPopups = () => {
    const visible = new Set(popups.filter((popup) => !popup.hidden));
    if (!firstScan) {
      for (const popup of visible) {
        if (shown.has(popup) || popup.getAttribute("data-ok-focus-after-open") === "false")
          continue;
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== document.body)
          returnFocus.set(popup, active);
        const target = popup.querySelector<HTMLElement>(FOCUSABLE) ?? popup;
        target.focus({ preventScroll: true });
      }
      for (const popup of shown) {
        if (visible.has(popup) && popup.isConnected) continue;
        const target = returnFocus.get(popup);
        const active = document.activeElement;
        if (
          target?.isConnected &&
          (active === null || active === document.body || popup.contains(active))
        )
          target.focus({ preventScroll: true });
      }
    }
    shown = visible;
  };

  // --- Controls ---------------------------------------------------------------------------------

  let geolocateState: MapGeolocateState = "off";
  let watchId: number | null = null;
  const attributions = new WeakMap<Element, string>();

  const actions = (name: string) => own<HTMLButtonElement>(`[data-ok-map-action="${name}"]`);
  const setDisabled = (button: HTMLElement, disabled: boolean) => {
    const value = String(disabled);
    if (button.getAttribute("aria-disabled") !== value) button.setAttribute("aria-disabled", value);
  };
  const label = (button: HTMLElement, text: string) => {
    if (button.getAttribute("aria-label") !== text) button.setAttribute("aria-label", text);
  };

  const paintScale = () => {
    if (!map) return;
    const height = map.getContainer().clientHeight;
    for (const scale of own("[data-ok-map-scale]")) {
      const maxWidth = finite(scale.getAttribute("data-ok-max-width")) ?? 100;
      const unitValue = scale.getAttribute("data-ok-unit");
      const unit = mapScaleUnits.includes(unitValue as MapScaleUnit)
        ? (unitValue as MapScaleUnit)
        : "metric";
      const left = map.unproject([0, height / 2]);
      const right = map.unproject([Math.max(1, maxWidth), height / 2]);
      const { label: text, width } = mapScale(
        distanceMeters([left.lng, left.lat], [right.lng, right.lat]),
        Math.max(1, maxWidth),
        unit,
      );
      if (scale.textContent !== text) scale.textContent = text;
      write(scale, { "--_ok-map-scale-width": `${width}px` });
    }
  };

  const paintAttribution = () => {
    if (!map) return;
    const texts = new Set<string>();
    const style = styleReady ? map.getStyle() : undefined;
    for (const id of Object.keys(style?.sources ?? {})) {
      const attribution = (map.getSource(id) as { attribution?: unknown } | undefined)?.attribution;
      if (typeof attribution === "string" && attribution.trim() !== "") texts.add(attribution);
    }
    const joined = [...texts].join(" | ");
    const narrow = element.clientWidth < 640;
    for (const box of own("[data-ok-map-attribution]")) {
      const compact = box.hasAttribute("data-ok-compact") || narrow;
      // Folded on narrow maps, open otherwise; a person's own toggle stays until that changes.
      if (box.hasAttribute("data-ok-narrow") !== compact || !attributions.has(box)) {
        box.toggleAttribute("data-ok-narrow", compact);
        box.toggleAttribute("open", !compact);
      }
      const target = box.querySelector<HTMLElement>("[data-ok-map-attribution-text]");
      if (!target || attributions.get(box) === joined) continue;
      attributions.set(box, joined);
      const nodes: Node[] = [];
      for (const [index, text] of [...texts].entries()) {
        if (index > 0) nodes.push(document.createTextNode(" | "));
        for (const part of parseAttribution(text)) {
          if (!part.href) {
            nodes.push(document.createTextNode(part.text));
            continue;
          }
          const link = document.createElement("a");
          link.href = part.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = part.text;
          nodes.push(link);
        }
      }
      target.replaceChildren(...nodes);
    }
  };

  const paintControls = () => {
    const zoom = map?.getZoom() ?? 0;
    const bearing = map?.getBearing() ?? 0;
    const pitch = map?.getPitch() ?? 0;
    for (const button of actions("zoom-in")) {
      label(button, labels.zoomIn);
      setDisabled(button, !map || zoom >= map.getMaxZoom() - 1e-6);
    }
    for (const button of actions("zoom-out")) {
      label(button, labels.zoomOut);
      setDisabled(button, !map || zoom <= map.getMinZoom() + 1e-6);
    }
    for (const button of actions("compass")) {
      label(button, labels.compass);
      setDisabled(button, !map);
      const tilt = button.closest("[data-ok-visualize-pitch]") ? pitch : 0;
      const icon = button.querySelector<HTMLElement>("[data-ok-map-compass-icon]") ?? button;
      write(icon, {
        "--_ok-map-bearing": `${Math.round(-bearing * 100) / 100}deg`,
        "--_ok-map-pitch": `${Math.round(tilt * 100) / 100}deg`,
      });
    }
    for (const button of actions("geolocate")) {
      label(button, labels.geolocate);
      setDisabled(button, !map);
      if (button.getAttribute("data-ok-state") !== geolocateState)
        button.setAttribute("data-ok-state", geolocateState);
      if (button.closest("[data-ok-track-user-location]")) {
        const pressed = String(watchId !== null);
        if (button.getAttribute("aria-pressed") !== pressed)
          button.setAttribute("aria-pressed", pressed);
      }
    }
    const fullscreen = element.hasAttribute("data-ok-fullscreen");
    for (const button of actions("fullscreen")) {
      label(button, fullscreen ? labels.fullscreenExit : labels.fullscreenEnter);
      if (button.getAttribute("aria-pressed") !== String(fullscreen))
        button.setAttribute("aria-pressed", String(fullscreen));
    }
    for (const button of actions("globe")) {
      label(button, labels.globe);
      setDisabled(button, !map);
      const pressed = String(settings.projection === "globe");
      if (button.getAttribute("aria-pressed") !== pressed)
        button.setAttribute("aria-pressed", pressed);
    }
    for (const button of actions("terrain")) {
      label(button, labels.terrain);
      setDisabled(button, !map);
      const pressed = String(settings.terrain !== null);
      if (button.getAttribute("aria-pressed") !== pressed)
        button.setAttribute("aria-pressed", pressed);
    }
    for (const summary of own("[data-ok-map-attribution] > summary"))
      label(summary, labels.attribution);
    paintScale();
  };

  // --- Scan (DOM changed) -----------------------------------------------------------------------

  const scan = () => {
    if (destroyed) return;
    markers = own("[data-ok-map-marker]");
    popups = own("[data-ok-map-popup]");
    position();
    focusPopups();
    paintControls();
    paintAttribution();
    firstScan = false;
  };
  // One callback per batch of mutations (a microtask after them).
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (
        record.type === "attributes" &&
        (record.attributeName === "data-ok-longitude" ||
          record.attributeName === "data-ok-latitude")
      )
        dragged.delete(record.target as Element);
    }
    scan();
  });
  observer.observe(element, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: OVERLAY_ATTRIBUTES,
  });

  // --- Fullscreen -------------------------------------------------------------------------------

  const fullscreenSupported = () =>
    !options.forcePseudoFullscreen &&
    typeof element.requestFullscreen === "function" &&
    document.fullscreenEnabled;
  const markFullscreen = (on: boolean) => {
    if (element.hasAttribute("data-ok-fullscreen") === on) return;
    element.toggleAttribute("data-ok-fullscreen", on);
    paintControls();
    map?.resize();
    options.onFullscreenChange?.(on);
  };
  const setFullscreen = (on: boolean) => {
    if (on === element.hasAttribute("data-ok-fullscreen")) return;
    if (on && fullscreenSupported()) {
      element.requestFullscreen().catch(() => markFullscreen(true));
      return;
    }
    if (!on && document.fullscreenElement === element) {
      void document.exitFullscreen();
      return;
    }
    markFullscreen(on);
  };
  document.addEventListener(
    "fullscreenchange",
    () => {
      const native = document.fullscreenElement === element;
      if (native || element.hasAttribute("data-ok-fullscreen")) markFullscreen(native);
    },
    { signal },
  );

  // --- Geolocation ------------------------------------------------------------------------------

  const geolocateButton = () => actions("geolocate")[0];
  const flag = (name: string, fallbackValue: boolean) => {
    const value = geolocateButton()?.closest("[data-ok-map-geolocate]")?.getAttribute(name);
    return value === null || value === undefined ? fallbackValue : value !== "false";
  };
  const showUser = () => {
    if (!flag("data-ok-show-user-location", true) || !userLocation) {
      userDot?.remove();
      userDot = null;
      return;
    }
    if (!userDot) {
      userDot = document.createElement("div");
      userDot.setAttribute("data-ok-map-user-location", "");
      userDot.setAttribute("aria-hidden", "true");
      view.append(userDot);
    }
    userDot.toggleAttribute("data-ok-show-accuracy", flag("data-ok-show-accuracy-circle", true));
    written.delete(userDot);
    positionUser();
  };
  const located = (position: GeolocationPosition, move: boolean) => {
    if (destroyed) return;
    const { longitude: lng, latitude: lat, accuracy } = position.coords;
    userLocation = { lng, lat, accuracy };
    geolocateState = "active";
    showUser();
    paintControls();
    if (move && map) {
      const dLat = accuracy / 111320;
      const dLng = dLat / Math.max(0.01, Math.cos((lat * Math.PI) / 180));
      map.fitBounds(
        [
          [lng - dLng, lat - dLat],
          [lng + dLng, lat + dLat],
        ],
        { maxZoom: 15 },
      );
    }
    status(labels.locationFound);
    options.onGeolocate?.(position);
  };
  const failed = (error: GeolocationPositionError | Error) => {
    if (destroyed) return;
    geolocateState = "error";
    if (watchId !== null) {
      navigator.geolocation?.clearWatch(watchId);
      watchId = null;
      options.onTrackUserLocationChange?.(false);
    }
    paintControls();
    status(
      "code" in error && error.code === 1 ? labels.locationDenied : labels.locationUnavailable,
    );
    options.onGeolocateError?.(error);
  };
  const stopTracking = (id: number) => {
    navigator.geolocation.clearWatch(id);
    watchId = null;
    geolocateState = "off";
    userLocation = null;
    showUser();
    paintControls();
    options.onTrackUserLocationChange?.(false);
  };
  const geolocate = () => {
    if (!map) return;
    if (!navigator.geolocation) {
      failed(new Error("Geolocation is not supported."));
      return;
    }
    const tracking = Boolean(geolocateButton()?.closest("[data-ok-track-user-location]"));
    if (tracking && watchId !== null) {
      stopTracking(watchId);
      return;
    }
    geolocateState = "waiting";
    paintControls();
    if (tracking) {
      let first = true;
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          located(position, first);
          first = false;
        },
        failed,
        { enableHighAccuracy: true },
      );
      options.onTrackUserLocationChange?.(true);
      paintControls();
    } else
      navigator.geolocation.getCurrentPosition((position) => located(position, true), failed, {
        enableHighAccuracy: true,
      });
  };

  // --- Settings ---------------------------------------------------------------------------------

  const applySettings = (next: Partial<MapSettings>) => {
    for (const [key, value] of Object.entries(next))
      if (value !== undefined) (settings as unknown as Record<string, unknown>)[key] = value;
    if (!map) {
      paintControls();
      return;
    }
    for (const handler of mapHandlers) {
      if (next[handler] === undefined) continue;
      if (next[handler]) map[handler].enable();
      else map[handler].disable();
    }
    if (next.cooperativeGestures !== undefined) {
      if (next.cooperativeGestures) map.cooperativeGestures.enable();
      else map.cooperativeGestures.disable();
    }
    if (next.minZoom !== undefined) map.setMinZoom(next.minZoom);
    if (next.maxZoom !== undefined) map.setMaxZoom(next.maxZoom);
    if (next.minPitch !== undefined) map.setMinPitch(next.minPitch);
    if (next.maxPitch !== undefined) map.setMaxPitch(next.maxPitch);
    if (next.maxBounds !== undefined) map.setMaxBounds(next.maxBounds ?? undefined);
    if (next.renderWorldCopies !== undefined) map.setRenderWorldCopies(next.renderWorldCopies);
    if (next.projection !== undefined || next.terrain !== undefined) applyStyleSettings();
    if (next.cursor !== undefined) map.getCanvas().style.cursor = next.cursor ?? "";
    paintControls();
  };

  const applyStyle = () => {
    const style = currentStyle();
    if (!map || style === undefined || style === appliedStyle) return;
    appliedStyle = style;
    styleReady = false;
    map.setStyle(style, { diff: false });
  };
  const schemeChanged = () => {
    applyStyle();
    refreshTokens();
  };

  // --- Create -----------------------------------------------------------------------------------

  if (options.forceFallback || !supportsWebGL()) enterFallback("webgl");
  else {
    try {
      appliedStyle = currentStyle();
      const mapOptions: MapOptions = {
        ...options.mapOptions,
        container: view,
        style: appliedStyle ?? { version: 8, sources: {}, layers: [] },
        center: [initial.longitude ?? 0, initial.latitude ?? 0],
        zoom: initial.zoom ?? 0,
        pitch: initial.pitch ?? 0,
        bearing: initial.bearing ?? 0,
        attributionControl: false,
        maplibreLogo: false,
        minZoom: settings.minZoom,
        maxZoom: settings.maxZoom,
        minPitch: settings.minPitch,
        maxPitch: settings.maxPitch,
        renderWorldCopies: settings.renderWorldCopies,
        cooperativeGestures: settings.cooperativeGestures,
        locale: { ...options.mapOptions?.locale, "Map.Title": labels.map },
      };
      if (settings.maxBounds) mapOptions.maxBounds = settings.maxBounds;
      for (const handler of mapHandlers) mapOptions[handler] = settings[handler];
      if (initial.bounds) {
        mapOptions.bounds = initial.bounds;
        if (initial.fitBoundsOptions) mapOptions.fitBoundsOptions = initial.fitBoundsOptions;
      }
      map = new MapLibreMap(mapOptions);
    } catch {
      map = null;
      enterFallback("error");
    }
  }

  if (map) {
    const instance = map;
    instance.on("style.load", () => {
      styleReady = true;
      restore(instance);
      // Ready once the first style is in: overlays are placed (tiles may still be loading, and a
      // source updated every frame can hold MapLibre's `load` back).
      if (!element.hasAttribute("data-ok-ready")) {
        element.setAttribute("data-ok-ready", "");
        scan();
      } else paintAttribution();
    });
    instance.on("load", () => {
      loaded = true;
      element.setAttribute("data-ok-loaded", "");
      scan();
    });
    instance.on("error", (event) => {
      const error = (event as unknown as { error?: Error }).error;
      if (!loaded && /webgl/i.test(error?.message ?? "")) {
        instance.remove();
        map = null;
        enterFallback("error");
      }
    });
    instance.on("move", position);
    instance.on("move", paintControls);
    instance.on("resize", () => {
      position();
      paintControls();
      paintAttribution();
    });
    instance.on("sourcedata", () => paintAttribution());
    instance.on("click", () => {
      for (const popup of popups)
        if (!popup.hidden && popup.getAttribute("data-ok-close-on-click") !== "false")
          options.onPopupClose?.(popup, "click");
    });
    instance.on("movestart", () => {
      for (const popup of popups)
        if (!popup.hidden && popup.hasAttribute("data-ok-close-on-move"))
          options.onPopupClose?.(popup, "move");
    });
    instance.on("mousemove", hover);
    instance.on("mouseout", () => {
      if (!hovered) return;
      hovered = false;
      emit("mouseleave", { features: [] });
    });
    for (const type of handlers.keys()) bind(type);
    // Labels the canvas with the map's description (text alternative).
    const canvas = instance.getCanvas();
    const described = own("[data-ok-map-description]")
      .map((node) => node.id)
      .filter(Boolean);
    if (described.length > 0) canvas.setAttribute("aria-describedby", described.join(" "));
    canvas.setAttribute("aria-roledescription", "map");
    media?.addEventListener("change", schemeChanged, { signal });
  }

  // The color scheme can change on any ancestor (`data-ok-theme` scopes, ADR-0017).
  const themeObserver = new MutationObserver(schemeChanged);
  themeObserver.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-ok-theme"],
  });

  // --- DOM listeners: controls, popups, markers -------------------------------------------------

  element.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      const close = target.closest("[data-ok-map-popup-close]");
      const popup = close?.closest<HTMLElement>("[data-ok-map-popup]");
      if (popup && popup.closest("[data-ok-map]") === element) {
        options.onPopupClose?.(popup, "close-button");
        return;
      }
      const button = target.closest<HTMLElement>("[data-ok-map-action]");
      if (!button || button.closest("[data-ok-map]") !== element || !map) return;
      if (button.getAttribute("aria-disabled") === "true" || compassDragged) {
        compassDragged = false;
        return;
      }
      const action = button.getAttribute("data-ok-map-action");
      if (action === "zoom-in") map.zoomIn();
      else if (action === "zoom-out") map.zoomOut();
      else if (action === "compass") {
        if (button.closest("[data-ok-visualize-pitch]")) map.resetNorthPitch();
        else map.resetNorth();
      } else if (action === "geolocate") geolocate();
      else if (action === "fullscreen") setFullscreen(!element.hasAttribute("data-ok-fullscreen"));
      else if (action === "globe")
        applySettings({ projection: settings.projection === "globe" ? "mercator" : "globe" });
      else if (action === "terrain") {
        const source = button.getAttribute("data-ok-source");
        const exaggeration = finite(button.getAttribute("data-ok-exaggeration"));
        applySettings({
          terrain:
            settings.terrain || !source
              ? null
              : exaggeration === undefined
                ? { source }
                : { source, exaggeration },
        });
      }
    },
    { signal },
  );

  /** Shows a dragged marker at `lngLat` until its owner stores the position. */
  const place = (marker: HTMLElement, lngLat: { lng: number; lat: number }) => {
    dragged.set(marker, lngLat);
    written.delete(marker);
    positionMarker(marker);
  };

  element.addEventListener(
    "keydown",
    (event) => {
      const target = event.target as HTMLElement;
      if (event.key === "Escape") {
        const popup = target.closest<HTMLElement>("[data-ok-map-popup]");
        if (popup && popup.closest("[data-ok-map]") === element && !popup.hidden) {
          event.preventDefault();
          options.onPopupClose?.(popup, "escape");
          return;
        }
        if (element.hasAttribute("data-ok-fullscreen") && document.fullscreenElement !== element) {
          event.preventDefault();
          setFullscreen(false);
        }
        return;
      }
      const marker = target.closest<HTMLElement>("[data-ok-map-marker]");
      if (!marker || marker !== target || marker.closest("[data-ok-map]") !== element) return;
      if (
        (event.key === "Enter" || event.key === " ") &&
        marker.getAttribute("role") === "button"
      ) {
        event.preventDefault();
        marker.click();
        return;
      }
      const step = event.shiftKey ? 50 : 10;
      const delta = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }[event.key];
      const start = lngLatOf(marker);
      if (!delta || !marker.hasAttribute("data-ok-draggable") || !map || !start) return;
      event.preventDefault();
      const projected = map.project([start.lng, start.lat]);
      const next = map.unproject([
        projected.x + (delta[0] as number),
        projected.y + (delta[1] as number),
      ]);
      const lngLat = { lng: next.lng, lat: next.lat };
      place(marker, lngLat);
      options.onMarkerDrag?.(marker, "start", start);
      options.onMarkerDrag?.(marker, "drag", lngLat);
      options.onMarkerDrag?.(marker, "end", lngLat);
    },
    { signal },
  );

  let compassDragged = false;
  element.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !map) return;
      const target = event.target as Element;
      const compass = target.closest<HTMLElement>('[data-ok-map-action="compass"]');
      const marker = target.closest<HTMLElement>("[data-ok-map-marker][data-ok-draggable]");
      const node = compass ?? marker;
      if (!node || node.closest("[data-ok-map]") !== element) return;
      const instance = map;
      const startX = event.clientX;
      const startY = event.clientY;
      const startBearing = instance.getBearing();
      const startPitch = instance.getPitch();
      const tilt = Boolean(compass?.closest("[data-ok-visualize-pitch]"));
      const from = marker ? lngLatOf(marker) : null;
      if (!compass && !from) return;
      const origin = from ? instance.project([from.lng, from.lat]) : null;
      let moving = false;
      compassDragged = false;
      try {
        node.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is gone already (or synthetic): moves still reach the node while over it.
      }
      const move = (next: PointerEvent) => {
        const dx = next.clientX - startX;
        const dy = next.clientY - startY;
        if (!moving && Math.hypot(dx, dy) <= TOLERANCE) return;
        if (compass) {
          moving = compassDragged = true;
          instance.setBearing(startBearing + dx * 0.8);
          if (tilt) instance.setPitch(startPitch - dy * 0.5);
          return;
        }
        // A marker drag (pointerdown checked that it has a position).
        const dragging = marker as HTMLElement;
        const at = origin as { x: number; y: number };
        if (!moving) {
          moving = true;
          dragging.setAttribute("data-ok-dragging", "");
          options.onMarkerDrag?.(dragging, "start", from as { lng: number; lat: number });
        }
        const next2 = instance.unproject([at.x + dx, at.y + dy]);
        const lngLat = { lng: next2.lng, lat: next2.lat };
        place(dragging, lngLat);
        options.onMarkerDrag?.(dragging, "drag", lngLat);
      };
      const up = () => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
        node.removeEventListener("pointercancel", up);
        if (!marker || !moving) return;
        marker.removeAttribute("data-ok-dragging");
        justDragged.add(marker);
        setTimeout(() => justDragged.delete(marker), 0);
        options.onMarkerDrag?.(marker, "end", dragged.get(marker) as { lng: number; lat: number });
      };
      node.addEventListener("pointermove", move, { signal });
      node.addEventListener("pointerup", up, { signal });
      node.addEventListener("pointercancel", up, { signal });
    },
    { signal },
  );

  scan();

  return {
    get map() {
      return map;
    },
    get fallback() {
      return fallback;
    },
    get loaded() {
      return loaded;
    },
    on,
    getViewState,
    setViewState(next) {
      if (!map) return;
      const current = getViewState();
      const changed = (Object.keys(next) as (keyof MapViewState)[]).some(
        (key) => next[key] !== undefined && !sameNumber(next[key] as number, current[key]),
      );
      if (!changed) return;
      map.jumpTo({
        center: [next.longitude ?? current.longitude, next.latitude ?? current.latitude],
        zoom: next.zoom ?? current.zoom,
        pitch: next.pitch ?? current.pitch,
        bearing: next.bearing ?? current.bearing,
      });
    },
    flyTo(target) {
      map?.flyTo(target);
    },
    easeTo(target) {
      map?.easeTo(target);
    },
    jumpTo(target) {
      map?.jumpTo(target);
    },
    fitBounds(bounds, fit) {
      map?.fitBounds(bounds, fit);
    },
    setSettings: applySettings,
    setMapStyle(style, dark) {
      lightStyle = safeStyle(style);
      darkStyle = safeStyle(dark);
      applyStyle();
    },
    setLabels(next) {
      labels = { ...labels, ...next };
      map?.getCanvas().setAttribute("aria-label", labels.map);
      paintControls();
    },
    setSource(id, spec) {
      const safe = safeSource(spec);
      const previous = sources.get(id);
      sources.set(id, safe);
      if (!map || !styleReady) return;
      const existing = map.getSource(id) as { setData?: (data: unknown) => void } | undefined;
      if (!existing) {
        restore(map);
        return;
      }
      if (previous) {
        if (json(previous) === json(safe)) return;
        const { data: _old, ...restOld } = previous as Record<string, unknown>;
        const { data, ...restNew } = safe as Record<string, unknown>;
        // Only the data changed: update it in place (GeoJSON).
        if (existing.setData && json(restOld) === json(restNew)) {
          existing.setData(data);
          return;
        }
      }
      // Anything else changed: re-create the source and the layers that use it.
      const users = map
        .getStyle()
        .layers.filter((layer) => "source" in layer && layer.source === id)
        .map((layer) => layer.id);
      for (const layer of users) map.removeLayer(layer);
      map.removeSource(id);
      restore(map);
    },
    removeSource(id) {
      sources.delete(id);
      if (!map || !styleReady || !map.getSource(id)) return;
      for (const layer of map.getStyle().layers)
        if ("source" in layer && layer.source === id) map.removeLayer(layer.id);
      map.removeSource(id);
    },
    setSourceData(id, data) {
      const spec = sources.get(id);
      if (spec) sources.set(id, { ...spec, data } as MapSourceSpec);
      const source = map && styleReady ? map.getSource(id) : undefined;
      (source as { setData?: (value: unknown) => void } | undefined)?.setData?.(data);
    },
    setLayer(spec, beforeId) {
      const previous = layers.get(spec.id);
      layers.set(spec.id, { spec, beforeId });
      if (!map || !styleReady) return;
      if (!map.getLayer(spec.id) || !previous) {
        if (map.getLayer(spec.id)) map.removeLayer(spec.id);
        restore(map);
        return;
      }
      const before = previous.spec as Record<string, unknown>;
      const after = spec as Record<string, unknown>;
      const same = (key: string) => json(before[key]) === json(after[key]);
      if (!same("type") || !same("source") || !same("source-layer")) {
        map.removeLayer(spec.id);
        restore(map);
        return;
      }
      for (const group of ["paint", "layout"] as const) {
        if (same(group)) continue;
        const old = (before[group] ?? {}) as Record<string, unknown>;
        const next = (after[group] ?? {}) as Record<string, unknown>;
        for (const key of new Set([...Object.keys(old), ...Object.keys(next)])) {
          if (json(old[key]) === json(next[key])) continue;
          if (group === "paint")
            map.setPaintProperty(
              spec.id,
              key as Parameters<MapLibreMap["setPaintProperty"]>[1],
              resolve(next[key]) as Parameters<MapLibreMap["setPaintProperty"]>[2],
            );
          else
            map.setLayoutProperty(
              spec.id,
              key as Parameters<MapLibreMap["setLayoutProperty"]>[1],
              resolve(next[key]) as Parameters<MapLibreMap["setLayoutProperty"]>[2],
            );
        }
      }
      if (!same("filter"))
        map.setFilter(
          spec.id,
          (after["filter"] ?? null) as Parameters<MapLibreMap["setFilter"]>[1],
        );
      if (!same("minzoom") || !same("maxzoom"))
        map.setLayerZoomRange(
          spec.id,
          (after["minzoom"] as number | undefined) ?? 0,
          (after["maxzoom"] as number | undefined) ?? 24,
        );
      if (previous.beforeId !== beforeId && (!beforeId || map.getLayer(beforeId)))
        map.moveLayer(spec.id, beforeId);
    },
    removeLayer(id) {
      layers.delete(id);
      if (map && styleReady && map.getLayer(id)) map.removeLayer(id);
    },
    getClusterExpansionZoom(sourceId, clusterId) {
      const source = map?.getSource(sourceId) as
        | { getClusterExpansionZoom?: (id: number) => Promise<number> }
        | undefined;
      if (!source?.getClusterExpansionZoom)
        return Promise.reject(new Error(`No clustered source "${sourceId}".`));
      return source.getClusterExpansionZoom(clusterId);
    },
    setFullscreen,
    geolocate,
    wasDragged(marker) {
      return justDragged.has(marker);
    },
    sync: scan,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      abort.abort();
      observer.disconnect();
      themeObserver.disconnect();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (element.hasAttribute("data-ok-fullscreen") && document.fullscreenElement !== element)
        element.removeAttribute("data-ok-fullscreen");
      userDot?.remove();
      map?.remove();
      map = null;
    },
  };
}
