import { mapHandlers, mapOptions, readBehavior, readNumber, readStyle } from "@owlky/core";
import {
  createMapController,
  type MapController,
  type MapEvent,
  type MapEventType,
  type MapLayerSpec,
  type MapLibreMap,
  type MapSettings,
  type MapSourceSpec,
  type MapViewState,
  readLayerDeclaration,
  readSourceDeclaration,
} from "@owlky/core/map";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface MapInstance extends ComponentInstance {
  /** The core controller. */
  readonly controller: MapController;
  /** The MapLibre map (escape hatch), or `null` without WebGL. */
  readonly map: MapLibreMap | null;
  readonly viewState: MapViewState;
  flyTo: MapController["flyTo"];
  easeTo: MapController["easeTo"];
  jumpTo: MapController["jumpTo"];
  fitBounds: MapController["fitBounds"];
  /** Replaces the data of a GeoJSON source (no markup change; for animations). */
  setSourceData(id: string, data: unknown): void;
  getClusterExpansionZoom(sourceId: string, clusterId: number): Promise<number>;
  /** Shows a popup of this map (an element or its id). */
  openPopup(popup: Element | string): void;
  /** Hides a popup of this map; no event. */
  closePopup(popup: Element | string): void;
  readonly fullscreen: boolean;
  setFullscreen(fullscreen: boolean): void;
}

/** Map events re-dispatched as `ok:map:<type>` (detail: the core `MapEvent`). */
const EMITTED: readonly MapEventType[] = [
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
];
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
  mapOptions.options.cooperativeGestures.attr,
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
 *          ok:map:trackuserlocation ({ tracking }), ok:map:fallback ({ reason }).
 */
export const map = defineComponent<MapInstance>({
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
    const dispatch = (target: Element, type: string, detail: unknown, cancelable = false) =>
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
        dispatch(marker, phase === "drag" ? "markerdrag" : `markerdrag${phase}`, { lngLat });
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
      setSourceData: controller.setSourceData,
      getClusterExpansionZoom: controller.getClusterExpansionZoom,
      openPopup,
      closePopup,
      get fullscreen() {
        return element.hasAttribute(mapOptions.options.fullscreen.attr);
      },
      setFullscreen: controller.setFullscreen,
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
