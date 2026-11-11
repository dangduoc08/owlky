"use client";

import {
  type MapHandler,
  type MapPosition,
  type MapProjection,
  mapAttributes,
  mapHandlers,
  mapPositions,
} from "@owlky/core";
import {
  createMapController,
  type MapController,
  type MapEvent,
  type MapEventType,
  type MapInitialViewState,
  type MapLabels,
  type MapLibreMap,
  type MapLight,
  type MapPadding,
  type MapSettings,
  type MapSky,
  type MapStyle,
  type MapViewState,
  mapEventTypes,
  mapLabels,
  mapPadding,
} from "@owlky/core/map";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { type GeolocateHandlers, MapContext, type MapContextValue } from "./map-context.js";
import { AttributionControl } from "./map-controls.js";

export type {
  MapEvent,
  MapLight,
  MapPadding,
  MapSky,
  MapStyle,
  MapViewState,
} from "@owlky/core/map";

/** Map event → callback prop (react-map-gl names): `movestart` → `onMoveStart`. */
const EVENT_PROPS = {
  load: "onLoad",
  error: "onError",
  idle: "onIdle",
  resize: "onResize",
  remove: "onRemove",
  render: "onRender",
  data: "onData",
  styledata: "onStyleData",
  sourcedata: "onSourceData",
  movestart: "onMoveStart",
  move: "onMove",
  moveend: "onMoveEnd",
  zoomstart: "onZoomStart",
  zoom: "onZoom",
  zoomend: "onZoomEnd",
  rotatestart: "onRotateStart",
  rotate: "onRotate",
  rotateend: "onRotateEnd",
  pitchstart: "onPitchStart",
  pitch: "onPitch",
  pitchend: "onPitchEnd",
  dragstart: "onDragStart",
  drag: "onDrag",
  dragend: "onDragEnd",
  boxzoomstart: "onBoxZoomStart",
  boxzoomend: "onBoxZoomEnd",
  boxzoomcancel: "onBoxZoomCancel",
  click: "onClick",
  dblclick: "onDblClick",
  contextmenu: "onContextMenu",
  mousedown: "onMouseDown",
  mouseup: "onMouseUp",
  mousemove: "onMouseMove",
  mouseover: "onMouseOver",
  mouseout: "onMouseOut",
  mouseenter: "onMouseEnter",
  mouseleave: "onMouseLeave",
  wheel: "onWheel",
  touchstart: "onTouchStart",
  touchend: "onTouchEnd",
  touchmove: "onTouchMove",
  touchcancel: "onTouchCancel",
} as const satisfies Record<MapEventType, string>;

/** Map event callbacks: `onLoad`, `onMove`, `onClick`, `onMouseEnter`… (MapLibre events). */
export type MapEventProps = {
  [K in MapEventType as (typeof EVENT_PROPS)[K]]?: ((event: MapEvent) => void) | undefined;
};

type DomEventNames =
  | "onLoad"
  | "onError"
  | "onResize"
  | "onClick"
  | "onDoubleClick"
  | "onContextMenu"
  | "onMouseDown"
  | "onMouseUp"
  | "onMouseMove"
  | "onMouseOver"
  | "onMouseOut"
  | "onMouseEnter"
  | "onMouseLeave"
  | "onWheel"
  | "onTouchStart"
  | "onTouchEnd"
  | "onTouchMove"
  | "onTouchCancel"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd";

export interface MapProps
  extends Omit<HTMLAttributes<HTMLDivElement>, DomEventNames | "aria-label">,
    MapEventProps,
    Partial<Record<MapHandler, boolean>> {
  /** Style for light color schemes (and dark ones without `mapStyleDark`): a URL or a style object. */
  mapStyle?: MapStyle | undefined;
  /** Style used while the map sits in a dark color scheme (follows Owlky's theme). */
  mapStyleDark?: MapStyle | undefined;
  /** Where the map starts (uncontrolled). */
  initialViewState?: MapInitialViewState | undefined;
  /** Controlled view: the map shows it; follow `onMove` to let people move the map. */
  viewState?: Partial<MapViewState> | undefined;
  longitude?: number | undefined;
  latitude?: number | undefined;
  zoom?: number | undefined;
  pitch?: number | undefined;
  bearing?: number | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  minPitch?: number | undefined;
  maxPitch?: number | undefined;
  /** `[west, south, east, north]`: people can't move the map outside. */
  maxBounds?: [number, number, number, number] | undefined;
  projection?: MapProjection | undefined;
  renderWorldCopies?: boolean | undefined;
  cooperativeGestures?: boolean | undefined;
  /** Layers whose features mouse events report (`event.features`) and that show a pointer. */
  interactiveLayerIds?: readonly string[] | undefined;
  /** Cursor over the map (default: grab, pointer over interactive features). */
  cursor?: string | undefined;
  /** 3D terrain from a `raster-dem` source. */
  terrain?: { source: string; exaggeration?: number } | null | undefined;
  /** The light of 3D extrusions (MapLibre light: `anchor`, `color`, `intensity`, `position`). */
  light?: MapLight | null | undefined;
  /** The sky and the globe's atmosphere (MapLibre sky, such as `atmosphere-blend`). */
  sky?: MapSky | null | undefined;
  /** Camera padding in px, such as `{ left: 320 }` for a panel over the map's left side. */
  padding?: Partial<MapPadding> | null | undefined;
  /**
   * Compares a new `mapStyle` with the current one and applies only the differences. `false`
   * reloads the style. Default `true`.
   */
  styleDiffing?: boolean | undefined;
  /** Shows the attribution control (bottom right). Default `true`; required by most map data. */
  attributionControl?: boolean | undefined;
  /** Any other MapLibre option, read once (`transformRequest`, `fadeDuration`, `hash`…). */
  mapOptions?: MapControllerExtras | undefined;
  /** Texts: control names, status messages, the fallback (English by default). */
  labels?: Partial<MapLabels> | undefined;
  /** Name of the map (its canvas). Default "Map". */
  "aria-label"?: string | undefined;
  /** A text alternative for what the map shows (visually hidden; shown when it can't draw). */
  description?: ReactNode;
  /** Shown instead of the map without WebGL (default: a sentence from `labels.fallback`). */
  fallback?: ReactNode;
  /** Called when the map enters or leaves full screen. */
  onFullscreenChange?: ((fullscreen: boolean) => void) | undefined;
  /** Called when the map falls back to its static content (no WebGL, or an error). */
  onFallback?: ((reason: "webgl" | "error") => void) | undefined;
  children?: ReactNode;
}

type MapControllerExtras = NonNullable<Parameters<typeof createMapController>[1]>["mapOptions"];

/** What a `ref` on `MapView` gives: the controller, the MapLibre map and its camera methods. */
export interface MapRef {
  /** The MapLibre map, or `null` before it starts or without WebGL. */
  getMap(): MapLibreMap | null;
  readonly controller: MapController | null;
  getViewState(): MapViewState | null;
  flyTo: MapController["flyTo"];
  easeTo: MapController["easeTo"];
  jumpTo: MapController["jumpTo"];
  fitBounds: MapController["fitBounds"];
  /**
   * The canvas as a PNG `Blob`, also saved as a file unless `download` is `false`. Rejects outside a
   * user gesture, before the map is drawn, or when the browser can't read the canvas.
   */
  exportMap: MapController["exportMap"];
}

const SETTING_KEYS = [
  ...mapHandlers,
  "minZoom",
  "maxZoom",
  "minPitch",
  "maxPitch",
  "projection",
  "renderWorldCopies",
  "cooperativeGestures",
  "cursor",
  "light",
  "sky",
  "padding",
  "styleDiffing",
] as const;

const bounds = (value: MapProps["maxBounds"]) =>
  value
    ? ([
        [value[0], value[1]],
        [value[2], value[3]],
      ] as [[number, number], [number, number]])
    : null;

/** `{ top, right, bottom, left }` → CSS-like `"t r b l"` (HTML `data-ok-padding`). */
const paddingAttribute = (value: MapProps["padding"]) => {
  if (!value) return undefined;
  const { top, right, bottom, left } = mapPadding(value);
  return `${top} ${right} ${bottom} ${left}`;
};

const csv = (value: unknown) =>
  Array.isArray(value) && value.length === 4 && value.every((each) => typeof each === "number")
    ? value.join(",")
    : undefined;

// --- MapProvider / useMap ------------------------------------------------------------------------

interface MapRegistry {
  maps: Record<string, MapRef>;
  register(id: string, ref: MapRef | null): void;
}
const ProviderContext = createContext<MapRegistry | null>(null);
const CurrentMap = createContext<MapRef | null>(null);

/** Lets `useMap()` reach every map with an `id` inside it (for example, a map beside its controls). */
export function MapProvider({ children }: { children?: ReactNode }) {
  const [maps, setMaps] = useState<Record<string, MapRef>>({});
  const register = useCallback((id: string, ref: MapRef | null) => {
    setMaps((current) => {
      const { [id]: _removed, ...rest } = current;
      return ref === null ? rest : { ...rest, [id]: ref };
    });
  }, []);
  const value = useMemo(() => ({ maps, register }), [maps, register]);
  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

/**
 * The maps around: `current` is the enclosing `MapView` (inside its children), and every map with an
 * `id` under a `MapProvider` is there by id.
 */
export function useMap(): { current?: MapRef | undefined } & Record<string, MapRef | undefined> {
  const registry = useContext(ProviderContext);
  const current = useContext(CurrentMap);
  return useMemo(
    () => ({ ...registry?.maps, ...(current ? { current } : {}) }),
    [registry, current],
  );
}

// --- Map -------------------------------------------------------------------------------------------

/**
 * MapView — spec: specs/components/map.md (ADR-0025). react-map-gl's `Map`, renamed so that it
 * doesn't shadow the global `Map` in your modules. An interactive vector map drawn by MapLibre GL JS
 * through the core map controller shared with the HTML runtime. Children: `Marker`, `Popup`,
 * `Source` / `Layer`, controls (`NavigationControl`, `GeolocateControl`, `FullscreenControl`,
 * `ScaleControl`, `AttributionControl`, `GlobeControl`, `TerrainControl`, `MapControl`) and
 * `MapPanel`s. Props follow react-map-gl's.
 */
export const MapView = forwardRef<MapRef, MapProps>(function MapView(props, ref) {
  const {
    mapStyle,
    mapStyleDark,
    initialViewState,
    viewState,
    longitude,
    latitude,
    zoom,
    pitch,
    bearing,
    minZoom,
    maxZoom,
    minPitch,
    maxPitch,
    maxBounds,
    projection,
    renderWorldCopies,
    cooperativeGestures,
    interactiveLayerIds,
    cursor,
    terrain,
    light,
    sky,
    padding,
    styleDiffing,
    attributionControl = true,
    mapOptions,
    labels,
    "aria-label": ariaLabel,
    description,
    fallback,
    onFullscreenChange,
    onFallback,
    children,
    id,
    ...rest
  } = props;
  const domProps: Record<string, unknown> = { ...rest };
  for (const type of mapEventTypes) delete domProps[EVENT_PROPS[type]];
  for (const handler of mapHandlers) delete domProps[handler];

  const base = useId();
  const descriptionId = `${id ?? base}-description`;
  const rootRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const [controller, setController] = useState<MapController | null>(null);
  const [corners, setCorners] = useState<Partial<Record<MapPosition, HTMLElement>>>({});
  const drags = useMemo(() => new WeakMap(), []);
  const popups = useMemo(() => new WeakMap(), []);
  const geolocate = useMemo(() => new Set<GeolocateHandlers>(), []);
  const regions = useMemo(() => new WeakMap(), []);
  const legends = useMemo(() => new WeakMap(), []);
  const mergedLabels = useMemo<MapLabels>(
    () => ({ ...mapLabels, ...labels, ...(ariaLabel ? { map: ariaLabel } : {}) }),
    [labels, ariaLabel],
  );
  const labelsRef = useRef(mergedLabels);
  labelsRef.current = mergedLabels;

  const controlled: Partial<MapViewState> = {
    ...viewState,
    ...(longitude === undefined ? {} : { longitude }),
    ...(latitude === undefined ? {} : { latitude }),
    ...(zoom === undefined ? {} : { zoom }),
    ...(pitch === undefined ? {} : { pitch }),
    ...(bearing === undefined ? {} : { bearing }),
  };
  const settings: Partial<MapSettings> = {};
  for (const key of SETTING_KEYS) {
    const value = (props as Record<string, unknown>)[key];
    if (value !== undefined) (settings as Record<string, unknown>)[key] = value;
  }
  if (maxBounds !== undefined) settings.maxBounds = bounds(maxBounds);
  if (interactiveLayerIds !== undefined) settings.interactiveLayerIds = interactiveLayerIds;
  if (terrain !== undefined) settings.terrain = terrain;

  // Create once; props reach the controller through refs and the effects below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: created once (StrictMode: twice).
  useEffect(() => {
    const root = rootRef.current as HTMLDivElement;
    const call = (name: string, ...args: unknown[]) =>
      (propsRef.current as unknown as Record<string, ((...a: unknown[]) => void) | undefined>)[
        name
      ]?.(...args);
    const instance = createMapController(root, {
      mapStyle: propsRef.current.mapStyle,
      mapStyleDark: propsRef.current.mapStyleDark,
      initialViewState: { ...propsRef.current.initialViewState, ...controlled },
      labels: labelsRef.current,
      mapOptions: propsRef.current.mapOptions,
      ...settings,
      onFallback: (reason) => call("onFallback", reason),
      onFullscreenChange: (on) => call("onFullscreenChange", on),
      onMarkerDrag: (marker, phase, lngLat) => drags.get(marker)?.(phase, lngLat),
      onPopupClose: (popup, reason) => popups.get(popup)?.(reason),
      onRegionSelect: (part, id, ids) => regions.get(part)?.(id, ids),
      onLegendToggle: (legend, index, active) => legends.get(legend)?.(index, active),
      onGeolocate: (position) => {
        for (const each of geolocate) each.onGeolocate?.(position);
      },
      onGeolocateError: (error) => {
        for (const each of geolocate) each.onError?.(error);
      },
      onTrackUserLocationChange: (tracking) => {
        for (const each of geolocate)
          (tracking ? each.onTrackUserLocationStart : each.onTrackUserLocationEnd)?.();
      },
    });
    for (const type of mapEventTypes) {
      const name = EVENT_PROPS[type];
      instance.on(type, (event) => call(name, event));
    }
    setController(instance);
    return () => {
      instance.destroy();
      setController(null);
    };
  }, []);

  const settingsKey = JSON.stringify(settings);
  // biome-ignore lint/correctness/useExhaustiveDependencies: settingsKey stands for settings.
  useEffect(() => {
    controller?.setSettings(settings);
  }, [controller, settingsKey]);
  useEffect(() => {
    controller?.setMapStyle(mapStyle, mapStyleDark);
  }, [controller, mapStyle, mapStyleDark]);
  useEffect(() => {
    controller?.setLabels(mergedLabels);
  }, [controller, mergedLabels]);
  const viewKey = JSON.stringify(controlled);
  // biome-ignore lint/correctness/useExhaustiveDependencies: viewKey stands for the controlled view.
  useEffect(() => {
    if (Object.keys(controlled).length > 0) controller?.setViewState(controlled);
  }, [controller, viewKey]);

  const mapRef = useMemo<MapRef>(
    () => ({
      getMap: () => controller?.map ?? null,
      controller,
      getViewState: () => controller?.getViewState() ?? null,
      flyTo: (options) => controller?.flyTo(options),
      easeTo: (options) => controller?.easeTo(options),
      jumpTo: (options) => controller?.jumpTo(options),
      fitBounds: (target, options) => controller?.fitBounds(target, options),
      exportMap: (format, options) =>
        controller
          ? controller.exportMap(format, options)
          : Promise.reject(new DOMException("The map is not drawn.", "InvalidStateError")),
    }),
    [controller],
  );
  useImperativeHandle(ref, () => mapRef, [mapRef]);
  // The stable `register` only: the registry object changes with every registration.
  const register = useContext(ProviderContext)?.register;
  useEffect(() => {
    if (!register || !id) return;
    register(id, mapRef);
    return () => register(id, null);
  }, [register, id, mapRef]);

  const context = useMemo<MapContextValue>(
    () => ({
      controller,
      corners,
      labels: mergedLabels,
      drags,
      popups,
      geolocate,
      regions,
      legends,
    }),
    [controller, corners, mergedLabels, drags, popups, geolocate, regions, legends],
  );
  // One stable ref callback per corner (a new one each render would set state in a loop).
  const cornerRefs = useMemo(
    () =>
      Object.fromEntries(
        mapPositions.map((position) => [
          position,
          // Called on mount and unmount only (stable callbacks).
          (node: HTMLDivElement | null) =>
            setCorners((current) => ({ ...current, [position]: node ?? undefined })),
        ]),
      ) as Record<MapPosition, (node: HTMLDivElement | null) => void>,
    [],
  );

  const shown = { ...initialViewState, ...controlled };
  const styleUrl = (style: MapStyle | undefined) => (typeof style === "string" ? style : undefined);
  const handlers: Partial<Record<MapHandler, boolean>> = {};
  for (const handler of mapHandlers) {
    const value = props[handler];
    if (value !== undefined) handlers[handler] = value;
  }

  return (
    <MapContext.Provider value={context}>
      <CurrentMap.Provider value={mapRef}>
        <div
          {...domProps}
          ref={rootRef}
          id={id}
          {...mapAttributes({
            longitude: shown.longitude,
            latitude: shown.latitude,
            zoom: shown.zoom,
            pitch: shown.pitch,
            bearing: shown.bearing,
            minZoom,
            maxZoom,
            minPitch,
            maxPitch,
            projection,
            renderWorldCopies,
            styleDiffing,
            cooperativeGestures,
            ...handlers,
          })}
          data-ok-light={light ? JSON.stringify(light) : undefined}
          data-ok-sky={sky ? JSON.stringify(sky) : undefined}
          data-ok-padding={paddingAttribute(padding)}
          data-ok-map-style={styleUrl(mapStyle)}
          data-ok-map-style-dark={styleUrl(mapStyleDark)}
          data-ok-bounds={csv(initialViewState?.bounds)}
          data-ok-max-bounds={maxBounds?.join(",")}
          data-ok-interactive-layer-ids={interactiveLayerIds?.join(" ") || undefined}
          data-ok-label={ariaLabel}
          data-ok-runtime="off"
        >
          <div data-ok-map-view="" />
          <div data-ok-map-fallback="">{fallback}</div>
          {description === undefined ? null : (
            <p data-ok-map-description="" id={descriptionId}>
              {description}
            </p>
          )}
          <div data-ok-map-status="" role="status" />
          {children}
          {attributionControl ? <AttributionControl /> : null}
          {mapPositions.map((position) => (
            <div key={position} data-ok-map-corner={position} ref={cornerRefs[position]} />
          ))}
        </div>
      </CurrentMap.Provider>
    </MapContext.Provider>
  );
});
