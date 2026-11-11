import { mapHandlers, mapOptions, readBehavior, readNumber, readStyle } from "@owlky/core";
import {
  createMapController,
  type GeoDescriptionStrings,
  greatCircle,
  type MapController,
  type MapEvent,
  type MapEventType,
  type MapLayerSpec,
  type MapLibreMap,
  type MapLight,
  type MapSettings,
  type MapSky,
  type MapSourceSpec,
  type MapViewState,
  mapHexbin,
  mapPixelGrid,
  mapScale,
  mapSizeScale,
  parseMapJson,
  parseMapPadding,
  readLayerDeclaration,
  readSourceDeclaration,
} from "@owlky/core/map";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface MapEvents {
  /** After the map and its first style loaded. */
  load: EventSpec<MapEvent>;
  /** After MapLibre reported an error (a tile or a style failed). */
  error: EventSpec<MapEvent>;
  /** After the map finished drawing. */
  idle: EventSpec<MapEvent>;
  /** When a move (pan, zoom, rotation) starts. */
  movestart: EventSpec<MapEvent>;
  /** While the map moves. */
  move: EventSpec<MapEvent>;
  /** After a move ended. */
  moveend: EventSpec<MapEvent>;
  /** After a zoom ended. */
  zoomend: EventSpec<MapEvent>;
  /** After a rotation ended. */
  rotateend: EventSpec<MapEvent>;
  /** After a pitch change ended. */
  pitchend: EventSpec<MapEvent>;
  /** After a click on the map. */
  click: EventSpec<MapEvent>;
  /** After a double click on the map. */
  dblclick: EventSpec<MapEvent>;
  /** After a right click or a long press on the map. */
  contextmenu: EventSpec<MapEvent>;
  /** While the pointer moves over the map. */
  mousemove: EventSpec<MapEvent>;
  /** When the pointer enters the map. */
  mouseenter: EventSpec<MapEvent>;
  /** When the pointer leaves the map. */
  mouseleave: EventSpec<MapEvent>;
  /** After a popup opened (dispatched on the popup). */
  popupopen: EventSpec<Record<string, never>>;
  /** Before a popup closes (dispatched on the popup). Call `preventDefault()` to keep it open. */
  popupclose: EventSpec<{ reason: string }, true>;
  /** When a draggable marker starts moving (dispatched on the marker). */
  markerdragstart: EventSpec<{ lngLat: { lng: number; lat: number } }>;
  /** While a marker is dragged (dispatched on the marker). */
  markerdrag: EventSpec<{ lngLat: { lng: number; lat: number } }>;
  /** After a marker was dropped; its `data-ok-longitude` and `data-ok-latitude` hold the new place. */
  markerdragend: EventSpec<{ lngLat: { lng: number; lat: number } }>;
  /** After the map entered or left full screen. */
  fullscreen: EventSpec<{ fullscreen: boolean }>;
  /** After the geolocate control found the user's position. */
  geolocate: EventSpec<{ coords: { longitude: number; latitude: number; accuracy: number } }>;
  /** After the geolocate control failed (`code` from the Geolocation API). */
  geolocateerror: EventSpec<{ code: number; message: string }>;
  /** After tracking the user's location started or stopped. */
  trackuserlocation: EventSpec<{ tracking: boolean }>;
  /** After the map fell back to its static content (no WebGL, or MapLibre failed). */
  fallback: EventSpec<{ reason: string }>;
  /** After the selection of regions changed (dispatched on `[data-ok-map-regions]`): `id` is the region toggled (`null` when cleared), `ids` every selected region in row order. */
  regionselect: EventSpec<{ id: string | number | null; ids: (string | number)[] }>;
  /** After a class of an interactive legend was pressed or released (dispatched on the legend; `active` lists the pressed classes). */
  legendtoggle: EventSpec<{ classIndex: number; active: number[] }>;
}

export interface MapInstance extends ComponentInstance {
  /** The core controller. */
  readonly controller: MapController;
  /** The MapLibre map (escape hatch), or `null` without WebGL. */
  readonly map: MapLibreMap | null;
  /** The camera: longitude, latitude, zoom, pitch and bearing. */
  readonly viewState: MapViewState;
  /** Flies the camera to a place, with an animation along a curve. */
  flyTo: MapController["flyTo"];
  /** Moves the camera to a place, with an animation. */
  easeTo: MapController["easeTo"];
  /** Moves the camera to a place at once. */
  jumpTo: MapController["jumpTo"];
  /** Moves the camera so that the bounds fit the map. */
  fitBounds: MapController["fitBounds"];
  /** The map's canvas as a PNG `Blob`, also saved as a file unless `download` is `false`. Rejects outside a user gesture or when the browser can't read the canvas. */
  exportMap: MapController["exportMap"];
  /** Replaces the data of a GeoJSON source (no markup change; for animations). */
  setSourceData(id: string, data: unknown): void;
  /** The zoom level at which a cluster of a clustered source breaks apart. */
  getClusterExpansionZoom(sourceId: string, clusterId: number): Promise<number>;
  /** Shows a popup of this map (an element or its id). */
  openPopup(popup: Element | string): void;
  /** Hides a popup of this map; no event. */
  closePopup(popup: Element | string): void;
  /** Whether the map is in full screen. */
  readonly fullscreen: boolean;
  /** Enters or leaves full screen. */
  setFullscreen(fullscreen: boolean): void;
  /** Selects these regions of a `[data-ok-map-regions]` part of the map (ids that aren't rows are ignored; one at most without `data-ok-multiple`). */
  selectRegions(regions: Element, ids: readonly (string | number)[]): void;
  /** Clears the selection of one `[data-ok-map-regions]` part, or of every part of the map. */
  clearSelection(regions?: Element): void;
  /** Sets the texts of the generated description (`p[data-ok-map-description][data-ok-auto]`), to translate it. */
  setDescriptionStrings(strings: Partial<GeoDescriptionStrings> | undefined): void;
  /** Classifies values for a choropleth (core `mapScale`): class breaks, token colors and the MapLibre expressions. */
  scale: typeof mapScale;
  /** The great circle arc between two `[longitude, latitude]` positions, as a GeoJSON feature (core `greatCircle`), for CDN pages. */
  greatCircle: typeof greatCircle;
  /** A size scale for proportional symbols (core `mapSizeScale`): radii, the `circle-radius` expression and the size legend's circles, for CDN pages. */
  sizeScale: typeof mapSizeScale;
  /** Bins points into hexagons with their count or mean (core `mapHexbin`), for CDN pages. */
  hexbin: typeof mapHexbin;
  /** The cells of a pixel map: a lattice of dots, squares or hexagons inside each region (core `mapPixelGrid`), for CDN pages. */
  pixelGrid: typeof mapPixelGrid;
}

/** Map events re-dispatched as `ok:map:<type>` (detail: the core `MapEvent`). */
const EMITTED = [
  "load",
  "error",
  "idle",
  "movestart",
  "move",
  "moveend",
  "zoomend",
  "rotateend",
  "pitchend",
  "click",
  "dblclick",
  "contextmenu",
  "mousemove",
  "mouseenter",
  "mouseleave",
] as const satisfies readonly MapEventType[];
const VIEW = ["longitude", "latitude", "zoom", "pitch", "bearing"] as const;
const SETTINGS_ATTRIBUTES = [
  ...VIEW.map((key) => mapOptions.options[key].attr),
  ...mapHandlers.map((key) => mapOptions.options[key].attr),
  mapOptions.options.minZoom.attr,
  mapOptions.options.maxZoom.attr,
  mapOptions.options.minPitch.attr,
  mapOptions.options.maxPitch.attr,
  mapOptions.options.projection.attr,
  mapOptions.options.renderWorldCopies.attr,
  mapOptions.options.styleDiffing.attr,
  mapOptions.options.cooperativeGestures.attr,
  "data-ok-light",
  "data-ok-sky",
  "data-ok-padding",
  "data-ok-max-bounds",
  "data-ok-interactive-layer-ids",
  "data-ok-map-style",
  "data-ok-map-style-dark",
  "data-ok-label",
];

/** `"w,s,e,n"` → `[[w, s], [e, n]]`, or `null`. */
function readBounds(value: string | null): [[number, number], [number, number]] | null {
  if (!value) return null;
  const numbers = value.split(",").map((each) => Number(each.trim()));
  if (numbers.length !== 4 || numbers.some((each) => !Number.isFinite(each))) return null;
  const [w, s, e, n] = numbers as [number, number, number, number];
  return [
    [w, s],
    [e, n],
  ];
}

function readSettings(element: Element): Partial<MapSettings> {
  const settings: Partial<MapSettings> = {};
  for (const handler of mapHandlers)
    settings[handler] = readBehavior(element, mapOptions.options[handler]);
  settings.renderWorldCopies = readBehavior(element, mapOptions.options.renderWorldCopies);
  settings.styleDiffing = readBehavior(element, mapOptions.options.styleDiffing);
  settings.light = parseMapJson<MapLight>(element.getAttribute("data-ok-light"));
  settings.sky = parseMapJson<MapSky>(element.getAttribute("data-ok-sky"));
  settings.padding = parseMapPadding(element.getAttribute("data-ok-padding"));
  settings.cooperativeGestures = element.hasAttribute(mapOptions.options.cooperativeGestures.attr);
  settings.minZoom = readNumber(element, mapOptions.options.minZoom) as number;
  settings.maxZoom = readNumber(element, mapOptions.options.maxZoom) as number;
  settings.minPitch = readNumber(element, mapOptions.options.minPitch) as number;
  settings.maxPitch = readNumber(element, mapOptions.options.maxPitch) as number;
  settings.projection = readStyle(element, mapOptions.options.projection);
  settings.maxBounds = readBounds(element.getAttribute("data-ok-max-bounds"));
  settings.interactiveLayerIds = (element.getAttribute("data-ok-interactive-layer-ids") ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return settings;
}

function readView(element: Element): Partial<MapViewState> {
  const view: Record<string, number> = {};
  for (const key of VIEW) {
    if (!element.hasAttribute(mapOptions.options[key].attr)) continue;
    view[key] = readNumber(element, mapOptions.options[key]) as number;
  }
  return view;
}

const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

/** `"lng,lat[,zoom[,pitch[,bearing]]]"` → fly-to options. */
function readFlyTarget(trigger: Element) {
  const numbers = (trigger.getAttribute("data-ok-view") ?? "")
    .split(",")
    .filter((each) => each.trim() !== "")
    .map(Number);
  if (numbers.length < 2 || numbers.some((each) => !Number.isFinite(each))) return null;
  const [longitude, latitude, zoom, pitch, bearing] = numbers as number[];
  const duration = Number(trigger.getAttribute("data-ok-duration"));
  return {
    center: [longitude, latitude] as [number, number],
    ...(zoom === undefined ? {} : { zoom }),
    ...(pitch === undefined ? {} : { pitch }),
    ...(bearing === undefined ? {} : { bearing }),
    ...(Number.isFinite(duration) && trigger.hasAttribute("data-ok-duration") ? { duration } : {}),
  };
}

/**
 * Map — spec: specs/components/map.md (ADR-0025). Not in the default `components` list (it loads
 * MapLibre): import `@owlky/html/map`, or load `owlky-map.js` after `owlky.js`.
 *
 * Markup:  <div data-ok-map data-ok-map-style="…/style.json" data-ok-longitude data-ok-latitude data-ok-zoom>
 *            <div data-ok-map-view></div> <div data-ok-map-fallback></div>
 *            <div data-ok-map-status role="status"></div>
 *            …markers, popups, sources / layers (hidden), panels…
 *            <div data-ok-map-corner="top-left">…controls…</div> (four corners)
 *          </div>
 * Behavior: mounts MapLibre (WebGL, or the fallback), adds the declared sources and layers and
 *          follows their markup, follows root attributes (view, settings, style), opens popups from
 *          `data-ok-map-popup-open`, hides them when they ask to close, stores dragged markers'
 *          positions in their attributes. `[data-ok-map-fly-to="<map id>"][data-ok-view="lng,lat,zoom"]`
 *          anywhere flies the map there (click, or change for inputs).
 * Events:  ok:map:<load|error|idle|movestart|move|moveend|zoomend|rotateend|pitchend|click|dblclick|
 *          contextmenu|mousemove|mouseenter|mouseleave> (detail: MapEvent), ok:map:popupopen,
 *          ok:map:popupclose (cancelable, detail { reason }), ok:map:markerdragstart|markerdrag|
 *          markerdragend (on the marker, detail { lngLat }), ok:map:fullscreen ({ fullscreen }),
 *          ok:map:geolocate ({ coords }), ok:map:geolocateerror ({ code, message }),
 *          ok:map:trackuserlocation ({ tracking }), ok:map:fallback ({ reason }),
 *          ok:map:regionselect (on the regions, { id, ids }), ok:map:legendtoggle (on the legend,
 *          { classIndex, active }). Choropleth: `[data-ok-map-regions]` (a listbox the runtime fills
 *          and the data table) joins its rows to a source through feature state; legends mute the
 *          regions outside their pressed classes.
 */
export const map = defineComponent<MapInstance, MapEvents>({
  name: "map",
  selector: "[data-ok-map]",

  setup(element, { emit, signal }) {
    const own = (selector: string) =>
      [...element.querySelectorAll<HTMLElement>(selector)].filter(
        (node) => node.closest("[data-ok-map]") === element,
      );
    const popupOf = (popup: Element | string) => {
      const node = typeof popup === "string" ? byId(element, popup) : popup;
      return node instanceof HTMLElement &&
        node.hasAttribute("data-ok-map-popup") &&
        node.closest("[data-ok-map]") === element
        ? node
        : null;
    };
    const dispatch = <K extends keyof MapEvents>(
      target: Element,
      type: K,
      detail: MapEvents[K]["detail"],
      cancelable = false,
    ) =>
      target.dispatchEvent(
        new CustomEvent(`ok:map:${type}`, { bubbles: true, cancelable, detail }),
      );
    const openPopup = (popup: Element | string) => {
      const node = popupOf(popup);
      if (!node?.hidden) return;
      node.hidden = false;
      dispatch(node, "popupopen", {});
    };
    const closePopup = (popup: Element | string) => {
      const node = popupOf(popup);
      if (node) node.hidden = true;
    };

    const view = readView(element);
    const controller = createMapController(element, {
      mapStyle: element.getAttribute("data-ok-map-style") ?? undefined,
      mapStyleDark: element.getAttribute("data-ok-map-style-dark") ?? undefined,
      initialViewState: {
        ...view,
        bounds: readBounds(element.getAttribute("data-ok-bounds")) ?? undefined,
      },
      labels: element.hasAttribute("data-ok-label")
        ? { map: element.getAttribute("data-ok-label") as string }
        : undefined,
      ...readSettings(element),
      onFallback: (reason) => emit("fallback", { reason }),
      onPopupClose: (popup, reason) => {
        if (dispatch(popup, "popupclose", { reason }, true)) popup.hidden = true;
      },
      onMarkerDrag: (marker, phase, lngLat) => {
        if (phase === "end") {
          marker.setAttribute("data-ok-longitude", String(Math.round(lngLat.lng * 1e6) / 1e6));
          marker.setAttribute("data-ok-latitude", String(Math.round(lngLat.lat * 1e6) / 1e6));
        }
        dispatch(marker, phase === "drag" ? "markerdrag" : (`markerdrag${phase}` as const), {
          lngLat,
        });
      },
      onFullscreenChange: (fullscreen) => emit("fullscreen", { fullscreen }),
      onGeolocate: (position) =>
        emit("geolocate", {
          coords: {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: position.coords.accuracy,
          },
        }),
      onGeolocateError: (error) =>
        emit("geolocateerror", {
          code: "code" in error ? error.code : 0,
          message: error.message,
        }),
      onTrackUserLocationChange: (tracking) => emit("trackuserlocation", { tracking }),
      onRegionSelect: (regions, id, ids) => dispatch(regions, "regionselect", { id, ids }),
      onLegendToggle: (legend, classIndex, active) =>
        dispatch(legend, "legendtoggle", { classIndex, active: [...active] }),
    });
    for (const type of EMITTED) controller.on(type, (event: MapEvent) => emit(type, event));

    // --- Sources and layers declared in the markup ------------------------------------------------

    let sourceIds = new Set<string>();
    let layerIds = new Set<string>();
    const syncDeclarations = () => {
      const nextSources = new Map<string, Record<string, unknown>>();
      for (const node of own("[data-ok-map-source]")) {
        const declaration = readSourceDeclaration(node);
        if (declaration) nextSources.set(declaration.id, declaration.spec);
      }
      const nextLayers = own("[data-ok-map-layer]")
        .map(readLayerDeclaration)
        .filter((each) => each !== null);
      const nextLayerIds = new Set(nextLayers.map((each) => each.spec["id"] as string));
      for (const id of layerIds) if (!nextLayerIds.has(id)) controller.removeLayer(id);
      for (const id of sourceIds) if (!nextSources.has(id)) controller.removeSource(id);
      for (const [id, spec] of nextSources) controller.setSource(id, spec as MapSourceSpec);
      for (const { spec, beforeId } of nextLayers)
        controller.setLayer(spec as unknown as MapLayerSpec, beforeId);
      sourceIds = new Set(nextSources.keys());
      layerIds = nextLayerIds;
    };
    syncDeclarations();

    let pending = false;
    const declarations = new MutationObserver((records) => {
      const relevant = records.some((record) => {
        const target = record.target as Element;
        return record.type === "childList"
          ? [...record.addedNodes, ...record.removedNodes].some(
              (node) =>
                node instanceof Element &&
                (node.matches("[data-ok-map-source], [data-ok-map-layer]") ||
                  node.querySelector("[data-ok-map-source], [data-ok-map-layer]") !== null),
            )
          : target.matches("[data-ok-map-source], [data-ok-map-layer]");
      });
      if (!relevant || pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        syncDeclarations();
      });
    });
    declarations.observe(element, { subtree: true, childList: true, attributes: true });

    // --- Root attributes: view, settings, style -------------------------------------------------

    const attributes = new MutationObserver((records) => {
      const names = new Set(records.map((record) => record.attributeName));
      if (VIEW.some((key) => names.has(mapOptions.options[key].attr)))
        controller.setViewState(readView(element));
      controller.setSettings(readSettings(element));
      if (names.has("data-ok-map-style") || names.has("data-ok-map-style-dark"))
        controller.setMapStyle(
          element.getAttribute("data-ok-map-style") ?? undefined,
          element.getAttribute("data-ok-map-style-dark") ?? undefined,
        );
      if (names.has("data-ok-label"))
        controller.setLabels({ map: element.getAttribute("data-ok-label") ?? "Map" });
    });
    attributes.observe(element, { attributes: true, attributeFilter: SETTINGS_ATTRIBUTES });

    // --- Popup triggers -------------------------------------------------------------------------

    element.addEventListener(
      "click",
      (event) => {
        const trigger = (event.target as Element).closest("[data-ok-map-popup-open]");
        if (!trigger || trigger.closest("[data-ok-map]") !== element) return;
        if (controller.wasDragged(trigger)) return;
        const popup = popupOf(trigger.getAttribute("data-ok-map-popup-open") as string);
        if (!popup) return;
        if (popup.hidden) {
          // One popup at a time: opening one closes the others.
          for (const other of own("[data-ok-map-popup]"))
            if (other !== popup && !other.hidden) other.hidden = true;
          openPopup(popup);
        } else popup.hidden = true;
      },
      { signal },
    );

    return {
      controller,
      get map() {
        return controller.map;
      },
      get viewState() {
        return controller.getViewState();
      },
      flyTo: controller.flyTo,
      easeTo: controller.easeTo,
      jumpTo: controller.jumpTo,
      fitBounds: controller.fitBounds,
      exportMap: controller.exportMap,
      setSourceData: controller.setSourceData,
      getClusterExpansionZoom: controller.getClusterExpansionZoom,
      openPopup,
      closePopup,
      get fullscreen() {
        return element.hasAttribute(mapOptions.options.fullscreen.attr);
      },
      setFullscreen: controller.setFullscreen,
      setDescriptionStrings: controller.setDescriptionStrings,
      selectRegions(regions, ids) {
        controller.selectRegions(regions as HTMLElement, ids);
      },
      clearSelection(regions) {
        const parts = regions
          ? [regions as HTMLElement]
          : [...element.querySelectorAll<HTMLElement>("[data-ok-map-regions]")];
        for (const part of parts) controller.selectRegions(part, []);
      },
      scale: mapScale,
      greatCircle,
      sizeScale: mapSizeScale,
      hexbin: mapHexbin,
      pixelGrid: mapPixelGrid,
      destroy() {
        declarations.disconnect();
        attributes.disconnect();
        controller.destroy();
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-map-fly-to]",
      handle(trigger, _event, runtime) {
        if (trigger instanceof HTMLInputElement) return;
        fly(trigger, runtime);
      },
    },
    {
      event: "change",
      selector: "[data-ok-map-fly-to]",
      handle(trigger, _event, runtime) {
        if (trigger instanceof HTMLInputElement && trigger.type === "radio" && !trigger.checked)
          return;
        fly(trigger, runtime);
      },
    },
  ],
});

function fly(
  trigger: Element,
  runtime: {
    getOrCreate<I extends ComponentInstance>(e: Element | null, n: string): I | undefined;
  },
) {
  const target = byId(trigger, trigger.getAttribute("data-ok-map-fly-to") as string);
  const options = readFlyTarget(trigger);
  if (!target || !options) return;
  runtime.getOrCreate<MapInstance>(target, "map")?.flyTo(options);
}
