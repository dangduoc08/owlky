import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanupDom, mapFixtureStyle, mount, nextEvent, nextFrame } from "../test-utils.js";
import { setMapWorkerUrl } from "./index.js";
import {
  createMapController,
  type MapController,
  type MapControllerOptions,
  type MapEvent,
  type MapLayerSpec,
} from "./map.js";

beforeAll(() => setMapWorkerUrl(workerUrl));

let controller: MapController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanupDom();
});

const PIN = `<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"></path></svg>`;
const CONTROLS = `
  <div data-ok-map-corner="top-left">
    <div data-ok-map-control data-ok-map-geolocate>
      <button type="button" data-ok-map-action="geolocate">G</button>
    </div>
    <div data-ok-map-control>
      <button type="button" data-ok-map-action="fullscreen" aria-pressed="false">F</button>
      <button type="button" data-ok-map-action="globe" aria-pressed="false">O</button>
      <button type="button" data-ok-map-action="terrain" data-ok-source="dem" data-ok-exaggeration="1.5">T</button>
    </div>
  </div>
  <div data-ok-map-corner="bottom-left">
    <div data-ok-map-control data-ok-map-navigation>
      <button type="button" data-ok-map-action="zoom-in">+</button>
      <button type="button" data-ok-map-action="zoom-out">-</button>
      <button type="button" data-ok-map-action="compass"><svg data-ok-map-compass-icon></svg></button>
    </div>
    <div data-ok-map-scale data-ok-unit="metric"></div>
  </div>
  <div data-ok-map-corner="bottom-right">
    <details data-ok-map-attribution><summary>i</summary><div data-ok-map-attribution-text></div></details>
  </div>`;

const markup = (
  inner = "",
  width = 700,
) => `<div data-ok-map style="position: relative; width: ${width}px; height: 400px">
  <div data-ok-map-view style="position: absolute; inset: 0"></div>
  <div data-ok-map-fallback></div>
  <p data-ok-map-description id="desc">Two land boxes.</p>
  <div data-ok-map-status role="status"></div>
  ${inner}
  ${CONTROLS}
</div>`;

const create = (options: MapControllerOptions = {}, inner = "", width = 700) => {
  const root = mount(markup(inner, width)).querySelector<HTMLElement>(
    "[data-ok-map]",
  ) as HTMLElement;
  controller = createMapController(root, {
    mapStyle: mapFixtureStyle(),
    initialViewState: { longitude: -95, latitude: 38, zoom: 2 },
    ...options,
  });
  return { root, c: controller };
};
const loaded = async (c: MapController) => {
  if (!c.loaded) await nextEvent(c, "load");
};
const styled = async (c: MapController) => {
  const map = c.map as NonNullable<MapController["map"]>;
  if (!map.isStyleLoaded())
    await nextEvent(
      { addEventListener: (_t: string, h: () => void) => map.once("style.load", h) },
      "style.load",
    );
};
const microtask = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const settle = async () => {
  await microtask();
  await nextFrame();
};
const action = (root: HTMLElement, name: string) =>
  root.querySelector(`[data-ok-map-action="${name}"]`) as HTMLButtonElement;
const stubGeolocation = (value: unknown) =>
  vi.spyOn(navigator, "geolocation", "get").mockReturnValue(value as Geolocation);
const style = (node: Element, name: string) => (node as HTMLElement).style.getPropertyValue(name);

describe("createMapController: setup", () => {
  it("needs a view element", () => {
    const root = mount("<div data-ok-map></div>").firstElementChild as HTMLElement;
    expect(() => createMapController(root)).toThrow(/data-ok-map-view/);
  });

  it("mounts MapLibre, labels and describes the canvas", async () => {
    const { root, c } = create({ labels: { map: "Test map" } });
    await loaded(c);
    expect(root.hasAttribute("data-ok-ready")).toBe(true);
    expect(root.hasAttribute("data-ok-loaded")).toBe(true);
    const canvas = root.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.getAttribute("aria-label")).toBe("Test map");
    expect(canvas.getAttribute("aria-describedby")).toBe("desc");
    expect(canvas.getAttribute("aria-roledescription")).toBe("map");
    expect(canvas.getAttribute("tabindex")).toBe("0");
    expect(c.fallback).toBe(false);
    expect(c.getViewState()).toMatchObject({ zoom: 2, pitch: 0, bearing: 0 });
    c.setLabels({ map: "Renamed", zoomIn: "Closer" });
    expect(canvas.getAttribute("aria-label")).toBe("Renamed");
    expect(action(root, "zoom-in").getAttribute("aria-label")).toBe("Closer");
  });

  it("fits initial bounds and reads every handler option", async () => {
    const { c } = create({
      initialViewState: { bounds: [-10, -10, 10, 10], fitBoundsOptions: { padding: 10 } },
      scrollZoom: false,
      keyboard: false,
      maxBounds: [-60, -40, 60, 40],
      cooperativeGestures: true,
    });
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    expect(map.scrollZoom.isEnabled()).toBe(false);
    expect(map.keyboard.isEnabled()).toBeFalsy();
    expect(map.dragPan.isEnabled()).toBe(true);
    expect(map.cooperativeGestures.isEnabled()).toBe(true);
    expect(Math.round(map.getCenter().lng)).toBe(0);
  });

  it("ignores unsafe style URLs (an empty map instead)", async () => {
    const { c } = create({ mapStyle: "javascript:alert(1)" });
    await loaded(c);
    expect(c.map?.getStyle().layers).toEqual([]);
  });
});

describe("createMapController: fallback", () => {
  it("shows the fallback without WebGL", () => {
    const onFallback = vi.fn();
    const { root, c } = create({ forceFallback: true, onFallback });
    expect(c.map).toBeNull();
    expect(c.fallback).toBe(true);
    expect(root.hasAttribute("data-ok-fallback")).toBe(true);
    expect(root.querySelector("[data-ok-map-fallback]")?.textContent).toMatch(/WebGL/);
    expect(onFallback).toHaveBeenCalledWith("webgl");
    expect(c.getViewState()).toEqual({
      longitude: -95,
      latitude: 38,
      zoom: 2,
      pitch: 0,
      bearing: 0,
    });
    expect(action(root, "zoom-in").getAttribute("aria-disabled")).toBe("true");
    // Everything is a no-op without a map.
    c.flyTo({ center: [0, 0] });
    c.easeTo({ center: [0, 0] });
    c.jumpTo({ center: [0, 0] });
    c.fitBounds([0, 0, 1, 1]);
    c.setViewState({ zoom: 4 });
    c.setSettings({ scrollZoom: false });
    c.setSource("a", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    c.setLayer({ id: "a", type: "circle", source: "a" });
    c.setSourceData("a", { type: "FeatureCollection", features: [] });
    c.removeLayer("a");
    c.removeSource("a");
    c.geolocate();
    action(root, "zoom-in").click();
    return expect(c.getClusterExpansionZoom("a", 1)).rejects.toThrow(/clustered/);
  });

  it("keeps an author's fallback text and also covers the empty-style view state", () => {
    const root = mount(markup()).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
    (root.querySelector("[data-ok-map-fallback]") as HTMLElement).textContent = "No map here.";
    controller = createMapController(root, { forceFallback: true });
    expect(root.querySelector("[data-ok-map-fallback]")?.textContent).toBe("No map here.");
    expect(controller.getViewState()).toEqual({
      longitude: 0,
      latitude: 0,
      zoom: 0,
      pitch: 0,
      bearing: 0,
    });
  });

  it("falls back when MapLibre can't start", () => {
    const onFallback = vi.fn();
    const { root, c } = create({ minZoom: 20, maxZoom: 2, onFallback });
    expect(c.map).toBeNull();
    expect(root.hasAttribute("data-ok-fallback")).toBe(true);
    expect(onFallback).toHaveBeenCalledWith("error");
  });

  it("falls back on a WebGL error before the first load", () => {
    const { root, c } = create();
    c.map?.fire("error", { error: new Error("Failed to initialize WebGL") });
    expect(c.map).toBeNull();
    expect(root.hasAttribute("data-ok-fallback")).toBe(true);
  });

  it("ignores other errors", () => {
    const { c } = create();
    c.map?.fire("error", { error: new Error("Tile 404") });
    c.map?.fire("error", {});
    expect(c.fallback).toBe(false);
  });
});

describe("createMapController: events", () => {
  it("reports map events with the view state, once per handler, until unsubscribed", async () => {
    const { c } = create();
    const moves: MapEvent[] = [];
    const off = c.on("move", (event) => moves.push(event));
    c.on("move", () => {});
    await loaded(c);
    c.jumpTo({ zoom: 3 });
    expect(moves.at(-1)?.type).toBe("move");
    expect(moves.at(-1)?.viewState.zoom).toBe(3);
    const count = moves.length;
    off();
    c.jumpTo({ zoom: 4 });
    expect(moves.length).toBe(count);
  });

  it("subscribes to events registered before the map exists", async () => {
    const { c } = create();
    const sources: string[] = [];
    c.on("sourcedata", (event) => sources.push(String(event.sourceId)));
    await loaded(c);
    expect(sources).toContain("land");
  });

  it("reports features of interactive layers, the pointer cursor, enter and leave", async () => {
    const { c } = create({ interactiveLayerIds: ["land", "missing"] });
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    const land = map.project([-95, 38]);
    const water = map.project([-150, 0]);
    const events: string[] = [];
    let features: unknown[] | undefined;
    c.on("click", (event) => {
      features = event.features;
    });
    c.on("mouseenter", (event) => events.push(`enter:${event.features?.length}`));
    c.on("mouseleave", () => events.push("leave"));
    map.fire("click", {
      point: land,
      lngLat: map.unproject(land),
      originalEvent: new MouseEvent("click"),
    });
    expect(features).toHaveLength(1);
    map.fire("mousemove", { point: land });
    expect(map.getCanvas().style.cursor).toBe("pointer");
    map.fire("mousemove", { point: land });
    map.fire("mousemove", { point: water });
    expect(map.getCanvas().style.cursor).toBe("");
    map.fire("mousemove", { point: land });
    map.fire("mouseout", {});
    map.fire("mouseout", {});
    expect(events).toEqual(["enter:1", "leave", "enter:1", "leave"]);
    c.setSettings({ interactiveLayerIds: ["missing"] });
    map.fire("click", { point: land });
    expect(features).toEqual([]);
    c.setSettings({ interactiveLayerIds: [], cursor: "crosshair" });
    map.fire("click", { point: land });
    expect(features).toBeUndefined();
    map.fire("mousemove", { point: land });
    expect(map.getCanvas().style.cursor).toBe("crosshair");
    c.setSettings({ cursor: null });
    expect(map.getCanvas().style.cursor).toBe("");
  });
});

describe("createMapController: view and settings", () => {
  it("jumps to a new view state only when it differs", async () => {
    const { c } = create();
    await loaded(c);
    const jump = vi.spyOn(c.map as NonNullable<MapController["map"]>, "jumpTo");
    c.setViewState({ zoom: 2, longitude: -95 });
    expect(jump).not.toHaveBeenCalled();
    c.setViewState({ zoom: 5, pitch: 20, bearing: 10, latitude: 10, longitude: 5 });
    expect(c.getViewState()).toMatchObject({ zoom: 5, pitch: 20, bearing: 10 });
    c.easeTo({ zoom: 6, duration: 0 });
    c.flyTo({ zoom: 6, duration: 0, animate: false });
    c.fitBounds([-10, -10, 10, 10], { duration: 0 });
    expect(Math.round(c.getViewState().longitude)).toBe(0);
  });

  it("applies settings to the handlers, limits and projection", async () => {
    const { root, c } = create();
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    c.setSettings({
      boxZoom: false,
      doubleClickZoom: false,
      dragPan: false,
      dragRotate: false,
      keyboard: false,
      scrollZoom: false,
      touchPitch: false,
      touchZoomRotate: false,
      cooperativeGestures: true,
      minZoom: 1,
      maxZoom: 2,
      minPitch: 5,
      maxPitch: 50,
      maxBounds: [-100, -50, 100, 50],
      renderWorldCopies: false,
      projection: "globe",
    });
    expect(map.boxZoom.isEnabled()).toBe(false);
    expect(map.dragPan.isEnabled()).toBe(false);
    expect(map.cooperativeGestures.isEnabled()).toBe(true);
    expect(map.getMaxZoom()).toBe(2);
    expect(map.getMinPitch()).toBe(5);
    expect(map.getMaxBounds()).not.toBeNull();
    expect(map.getRenderWorldCopies()).toBe(false);
    expect(map.getProjection()?.type).toBe("globe");
    expect(action(root, "globe").getAttribute("aria-pressed")).toBe("true");
    expect(action(root, "zoom-in").getAttribute("aria-disabled")).toBe("true");
    c.setSettings({
      boxZoom: true,
      cooperativeGestures: false,
      maxBounds: null,
    });
    expect(map.boxZoom.isEnabled()).toBe(true);
    expect(map.cooperativeGestures.isEnabled()).toBe(false);
    expect(map.getMaxBounds()).toBeNull();
  });
});

describe("createMapController: styles and tokens", () => {
  it("switches styles, follows dark color schemes and keeps owner layers", async () => {
    const dark = mapFixtureStyle("#333333");
    const { root, c } = create({ mapStyleDark: dark });
    await loaded(c);
    c.setSource("dots", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    c.setLayer({ id: "dots", type: "circle", source: "dots", paint: { "circle-radius": 3 } });
    const map = c.map as NonNullable<MapController["map"]>;
    expect(map.getLayer("dots")).toBeDefined();
    // A dark scope around the map: the dark style loads, and the owner layer comes back.
    const scope = root.parentElement as HTMLElement;
    scope.style.colorScheme = "dark";
    scope.setAttribute("data-ok-theme", "dark");
    await nextEvent(
      { addEventListener: (_t: string, h: () => void) => map.once("style.load", h) },
      "style.load",
    );
    expect(map.getPaintProperty("land", "fill-color")).toBe("#333333");
    expect(map.getLayer("dots")).toBeDefined();
    // `light dark` follows the system setting (light in tests).
    scope.style.colorScheme = "light dark";
    scope.setAttribute("data-ok-theme", "system");
    await nextEvent(
      { addEventListener: (_t: string, h: () => void) => map.once("style.load", h) },
      "style.load",
    );
    expect(map.getPaintProperty("land", "fill-color")).toBe("#f8f8f6");
    // A new light style without a dark one.
    c.setMapStyle(mapFixtureStyle("#00ff00"));
    await nextEvent(
      { addEventListener: (_t: string, h: () => void) => map.once("style.load", h) },
      "style.load",
    );
    expect(map.getPaintProperty("land", "fill-color")).toBe("#00ff00");
    c.setMapStyle(undefined);
  });

  it("resolves Owlky tokens in paint values, again when the theme changes", async () => {
    const { root, c } = create();
    root.style.setProperty("--ok-palette-info-main", "#112233");
    await loaded(c);
    c.setSource("dots", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    c.setLayer({
      id: "dots",
      type: "circle",
      source: "dots",
      paint: {
        "circle-color": ["case", true, "var(--ok-palette-info-main)", "#000000"],
        "circle-radius": 3,
      },
      layout: { visibility: "visible" },
    } as MapLayerSpec);
    const map = c.map as NonNullable<MapController["map"]>;
    expect(map.getPaintProperty("dots", "circle-color")).toEqual([
      "case",
      true,
      "#112233",
      "#000000",
    ]);
    // An unknown token stays as written (MapLibre then reports the invalid color).
    c.setLayer({
      id: "broken",
      type: "circle",
      source: "dots",
      paint: { "circle-color": "var(--ok-missing)" },
    });
    expect(map.getLayer("broken")).toBeUndefined();
    root.style.setProperty("--ok-palette-info-main", "#445566");
    document.documentElement.setAttribute("data-ok-theme", "light");
    await settle();
    document.documentElement.removeAttribute("data-ok-theme");
    expect((map.getPaintProperty("dots", "circle-color") as unknown[])[2]).toBe("#445566");
  });
});

describe("createMapController: sources and layers", () => {
  const empty = { type: "FeatureCollection" as const, features: [] };
  const point = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [-95, 38] },
      },
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [-95.1, 38.1] },
      },
    ],
  };

  it("adds sources and layers given before the style loads, in order", async () => {
    const { c } = create();
    c.setLayer({ id: "late", type: "circle", source: "dots" }, "dots-layer");
    c.setLayer({ id: "dots-layer", type: "circle", source: "dots" });
    c.setLayer({ id: "bg2", type: "background" });
    c.setSource("dots", { type: "geojson", data: point });
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    expect(map.getSource("dots")).toBeDefined();
    expect(map.getStyle().layers.map((layer) => layer.id)).toEqual([
      "background",
      "land",
      "late",
      "dots-layer",
      "bg2",
    ]);
  });

  it("updates data in place and re-creates a changed source with its layers", async () => {
    const { c } = create();
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    c.setSource("dots", { type: "geojson", data: empty });
    c.setLayer({ id: "dots", type: "circle", source: "dots" });
    const source = map.getSource("dots") as unknown as { setData(data: unknown): void };
    const setData = vi.spyOn(source, "setData");
    c.setSource("dots", { type: "geojson", data: empty });
    expect(setData).not.toHaveBeenCalled();
    c.setSource("dots", { type: "geojson", data: point });
    expect(setData).toHaveBeenCalledWith(point);
    c.setSource("dots", { type: "geojson", data: point, cluster: true });
    expect(map.getSource("dots")).not.toBe(source);
    expect(map.getLayer("dots")).toBeDefined();
    c.setSourceData("dots", empty);
    c.setSourceData("nothing", empty);
    c.removeSource("dots");
    expect(map.getSource("dots")).toBeUndefined();
    expect(map.getLayer("dots")).toBeUndefined();
    c.removeSource("dots");
  });

  it("checks source URLs", async () => {
    const { c } = create();
    await loaded(c);
    c.setSource("bad", { type: "geojson", data: "javascript:alert(1)" });
    c.setSource("tiles", {
      type: "raster",
      tiles: ["javascript:x()", "https://tiles.invalid/{z}/{x}/{y}.png"],
      url: "data/tiles.json",
      tileSize: 256,
    } as never);
    const map = c.map as NonNullable<MapController["map"]>;
    // A GeoJSON source without (safe) data is refused by MapLibre.
    expect(map.getSource("bad")).toBeUndefined();
    expect((map.getStyle().sources["tiles"] as { tiles?: string[] }).tiles).toEqual([
      "https://tiles.invalid/{z}/{x}/{y}.png",
    ]);
  });

  it("updates paint, layout, filter, zoom range and order in place", async () => {
    const { c } = create();
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    c.setSource("dots", { type: "geojson", data: point });
    c.setLayer({
      id: "dots",
      type: "circle",
      source: "dots",
      paint: { "circle-radius": 3, "circle-color": "#000" },
    });
    const add = vi.spyOn(map, "addLayer");
    c.setLayer(
      {
        id: "dots",
        type: "circle",
        source: "dots",
        paint: { "circle-radius": 6 },
        layout: { visibility: "none" },
        filter: ["has", "mag"],
        minzoom: 1,
        maxzoom: 10,
      },
      "land",
    );
    expect(add).not.toHaveBeenCalled();
    expect(map.getPaintProperty("dots", "circle-radius")).toBe(6);
    expect(map.getLayoutProperty("dots", "visibility")).toBe("none");
    expect(map.getFilter("dots")).toEqual(["has", "mag"]);
    expect(map.getLayer("dots")?.minzoom).toBe(1);
    expect(map.getStyle().layers.map((layer) => layer.id)).toEqual(["background", "dots", "land"]);
    c.setLayer({ id: "dots", type: "circle", source: "dots" });
    expect(map.getFilter("dots")).toBeUndefined();
    expect(map.getLayer("dots")?.maxzoom).toBe(24);
    // A new type re-creates the layer.
    c.setLayer({ id: "dots", type: "heatmap", source: "dots" });
    expect(map.getLayer("dots")?.type).toBe("heatmap");
    c.removeLayer("dots");
    expect(map.getLayer("dots")).toBeUndefined();
    c.removeLayer("dots");
  });

  it("finds the zoom at which a cluster breaks apart", async () => {
    const { c } = create();
    await loaded(c);
    c.setSource("quakes", { type: "geojson", data: point, cluster: true, clusterRadius: 80 });
    c.setLayer({ id: "clusters", type: "circle", source: "quakes" });
    const map = c.map as NonNullable<MapController["map"]>;
    await new Promise<void>((resolve) => map.once("idle", () => resolve()));
    const cluster = map.querySourceFeatures("quakes").find((f) => f.properties?.["cluster"]);
    expect(cluster).toBeDefined();
    const zoom = await c.getClusterExpansionZoom("quakes", cluster?.properties?.["cluster_id"]);
    expect(zoom).toBeGreaterThan(2);
    await expect(c.getClusterExpansionZoom("nothing", 1)).rejects.toThrow();
  });
});

describe("createMapController: markers and popups", () => {
  it("places markers and popups through CSSOM", async () => {
    const { root, c } = create(
      {},
      `<div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38" data-ok-offset="2,3" data-ok-rotation="45" data-ok-rotation-alignment="map" data-ok-pitch-alignment="map">${PIN}</div>
       <div data-ok-map-marker data-ok-longitude="nope">${PIN}</div>
       <div data-ok-map-popup data-ok-longitude="-95" data-ok-latitude="38" data-ok-max-width="300" data-ok-offset="10"><div>Hi</div></div>
       <div data-ok-map-popup data-ok-longitude="-95" data-ok-latitude="38" data-ok-anchor="left" data-ok-max-width="20rem"><div>Left</div></div>
       <div data-ok-map-popup data-ok-longitude="-95" data-ok-latitude="38" data-ok-anchor="nowhere" data-ok-max-width="calc(1px)"><div>Bad</div></div>
       <div data-ok-map-popup data-ok-latitude="38"><div>No point</div></div>
       <div data-ok-map-popup data-ok-longitude="-95" data-ok-latitude="38" hidden></div>`,
    );
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    const [marker, invalid] = root.querySelectorAll<HTMLElement>("[data-ok-map-marker]");
    const [auto, left, bad, noPoint] = root.querySelectorAll<HTMLElement>("[data-ok-map-popup]");
    const at = map.project([-95, 38]);
    expect(style(marker as Element, "--_ok-map-x")).toBe(`${Math.round((at.x + 2) * 100) / 100}px`);
    expect(style(marker as Element, "--_ok-map-rotate-z")).toBe("45deg");
    expect(style(invalid as Element, "--_ok-map-visibility")).toBe("hidden");
    expect(auto?.getAttribute("data-ok-current-anchor")).toBe("bottom");
    expect(style(auto as Element, "--_ok-map-y")).toBe(`${Math.round((at.y - 10) * 100) / 100}px`);
    expect(style(auto as Element, "--_ok-map-popup-max-width")).toBe("300px");
    expect(left?.getAttribute("data-ok-current-anchor")).toBe("left");
    expect(style(left as Element, "--_ok-map-popup-max-width")).toBe("20rem");
    expect(bad?.getAttribute("data-ok-current-anchor")).toBe("bottom");
    expect(style(bad as Element, "--_ok-map-popup-max-width")).toBe("");
    expect(style(noPoint as Element, "--_ok-map-visibility")).toBe("hidden");
    c.jumpTo({ bearing: 30, pitch: 20 });
    expect(style(marker as Element, "--_ok-map-rotate-z")).toBe("15deg");
    expect(style(marker as Element, "--_ok-map-rotate-x")).toBe("20deg");
    // Markup changes are picked up by the controller's observer.
    marker?.setAttribute("data-ok-longitude", "-90");
    await settle();
    expect(style(marker as Element, "--_ok-map-x")).toBe(
      `${Math.round((map.project([-90, 38]).x + 2) * 100) / 100}px`,
    );
    c.sync();
  });

  it("moves focus into popups that open, and back when they close", async () => {
    const { root, c } = create(
      {},
      `<button type="button" id="trigger">Open</button>
       <div data-ok-map-popup id="pop" data-ok-longitude="-95" data-ok-latitude="38" tabindex="-1" hidden>
         <div>Text</div><button type="button" data-ok-map-popup-close>x</button>
       </div>
       <div data-ok-map-popup id="quiet" data-ok-longitude="-95" data-ok-latitude="38" data-ok-focus-after-open="false" hidden><div>Hover</div></div>
       <div data-ok-map-popup id="plain" data-ok-longitude="-95" data-ok-latitude="38" tabindex="-1" hidden><div>Plain</div></div>`,
    );
    await loaded(c);
    const trigger = root.querySelector("#trigger") as HTMLButtonElement;
    const pop = root.querySelector("#pop") as HTMLElement;
    trigger.focus();
    pop.hidden = false;
    await settle();
    expect(document.activeElement).toBe(pop.querySelector("[data-ok-map-popup-close]"));
    pop.hidden = true;
    await settle();
    expect(document.activeElement).toBe(trigger);
    const quiet = root.querySelector("#quiet") as HTMLElement;
    quiet.hidden = false;
    await settle();
    expect(document.activeElement).toBe(trigger);
    quiet.hidden = true;
    // No focusable content: the popup itself; removed while focused, focus comes back.
    const plain = root.querySelector("#plain") as HTMLElement;
    (document.activeElement as HTMLElement).blur();
    plain.hidden = false;
    await settle();
    expect(document.activeElement).toBe(plain);
    plain.remove();
    await settle();
    expect(document.activeElement).toBe(document.body);
  });

  it("reports popup close requests: close button, Escape, map click, move", async () => {
    const onPopupClose = vi.fn();
    const { root, c } = create(
      { onPopupClose },
      `<div data-ok-map-popup id="a" data-ok-longitude="-95" data-ok-latitude="38"><div>A</div><button type="button" data-ok-map-popup-close>x</button></div>
       <div data-ok-map-popup id="b" data-ok-longitude="-95" data-ok-latitude="38" data-ok-close-on-click="false" data-ok-close-on-move><div><input aria-label="Field"></div></div>
       <div data-ok-map-popup id="c" data-ok-longitude="-95" data-ok-latitude="38" hidden></div>`,
    );
    await loaded(c);
    const [a, b] = root.querySelectorAll<HTMLElement>("[data-ok-map-popup]");
    ((a as HTMLElement).querySelector("[data-ok-map-popup-close]") as HTMLButtonElement).click();
    expect(onPopupClose).toHaveBeenLastCalledWith(a, "close-button");
    b?.querySelector("input")?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(onPopupClose).toHaveBeenLastCalledWith(b, "escape");
    onPopupClose.mockClear();
    c.map?.fire("click", {});
    expect(onPopupClose.mock.calls).toEqual([[a, "click"]]);
    onPopupClose.mockClear();
    c.jumpTo({ zoom: 3 });
    expect(onPopupClose.mock.calls).toEqual([[b, "move"]]);
  });

  it("clicks button markers with Enter and Space, and moves draggable ones with the arrow keys", async () => {
    const onMarkerDrag = vi.fn();
    const { root, c } = create(
      { onMarkerDrag },
      `<div data-ok-map-marker role="button" tabindex="0" data-ok-longitude="-95" data-ok-latitude="38" data-ok-draggable>${PIN}</div>
       <div data-ok-map-marker tabindex="0" data-ok-longitude="-95" data-ok-latitude="38">${PIN}</div>`,
    );
    await loaded(c);
    const [marker, still] = root.querySelectorAll<HTMLElement>("[data-ok-map-marker]");
    const clicks = vi.fn();
    marker?.addEventListener("click", clicks);
    const key = (target: Element | undefined, init: KeyboardEventInit) =>
      target?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
      );
    key(marker, { key: "Enter" });
    key(marker, { key: " " });
    expect(clicks).toHaveBeenCalledTimes(2);
    key(marker, { key: "ArrowRight" });
    expect(onMarkerDrag.mock.calls.map((call) => call[1])).toEqual(["start", "drag", "end"]);
    const [, , start] = onMarkerDrag.mock.calls[0] as [Element, string, { lng: number }];
    const [, , end] = onMarkerDrag.mock.calls[2] as [Element, string, { lng: number }];
    expect(start.lng).toBe(-95);
    expect(end.lng).toBeGreaterThan(-95);
    key(marker, { key: "ArrowUp", shiftKey: true });
    key(marker, { key: "ArrowDown" });
    key(marker, { key: "ArrowLeft" });
    key(marker, { key: "Home" });
    expect(onMarkerDrag).toHaveBeenCalledTimes(12);
    key(still, { key: "ArrowRight" });
    key(still, { key: "Enter" });
    key(marker?.querySelector("svg") ?? undefined, { key: "Enter" });
    expect(onMarkerDrag).toHaveBeenCalledTimes(12);
    // The owner stores the position: the drag override goes away.
    marker?.setAttribute("data-ok-longitude", "-80");
    await settle();
    expect(style(marker as Element, "--_ok-map-x")).toBe(
      `${Math.round((c.map?.project([-80, 38]).x ?? 0) * 100) / 100}px`,
    );
  });

  it("drags markers with the pointer and swallows the click that ends a drag", async () => {
    const onMarkerDrag = vi.fn();
    const { root, c } = create(
      { onMarkerDrag },
      `<div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38" data-ok-draggable style="width: 20px; height: 20px">${PIN}</div>`,
    );
    await loaded(c);
    const marker = root.querySelector("[data-ok-map-marker]") as HTMLElement;
    const pointer = (type: string, x: number, y: number, target: Element = marker) =>
      target.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 }),
      );
    pointer("pointerdown", 100, 100);
    pointer("pointermove", 101, 101);
    expect(onMarkerDrag).not.toHaveBeenCalled();
    pointer("pointermove", 140, 120);
    expect(marker.hasAttribute("data-ok-dragging")).toBe(true);
    pointer("pointermove", 160, 120);
    pointer("pointerup", 160, 120);
    expect(onMarkerDrag.mock.calls.map((call) => call[1])).toEqual([
      "start",
      "drag",
      "drag",
      "end",
    ]);
    expect(marker.hasAttribute("data-ok-dragging")).toBe(false);
    expect(c.wasDragged(marker)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(c.wasDragged(marker)).toBe(false);
    // A press without moving is a click, not a drag; other buttons do nothing.
    pointer("pointerdown", 100, 100);
    pointer("pointerup", 100, 100);
    marker.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
    root
      .querySelector("p")
      ?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(onMarkerDrag).toHaveBeenCalledTimes(4);
  });
});

describe("createMapController: controls", () => {
  it("zooms, resets north and turns the map with the compass", async () => {
    const { root, c } = create({ maxZoom: 4, minZoom: 1 });
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    vi.spyOn(map, "zoomIn").mockImplementation(() => map.setZoom(map.getZoom() + 1));
    vi.spyOn(map, "zoomOut").mockImplementation(() => map.setZoom(map.getZoom() - 1));
    action(root, "zoom-in").click();
    expect(map.getZoom()).toBe(3);
    action(root, "zoom-in").click();
    expect(action(root, "zoom-in").getAttribute("aria-disabled")).toBe("true");
    action(root, "zoom-in").click();
    expect(map.getZoom()).toBe(4);
    action(root, "zoom-out").click();
    action(root, "zoom-out").click();
    action(root, "zoom-out").click();
    expect(action(root, "zoom-out").getAttribute("aria-disabled")).toBe("true");
    map.jumpTo({ bearing: 40, pitch: 30 });
    const icon = root.querySelector("[data-ok-map-compass-icon]") as Element;
    expect(style(icon, "--_ok-map-bearing")).toBe("-40deg");
    expect(style(icon, "--_ok-map-pitch")).toBe("0deg");
    const north = vi.spyOn(map, "resetNorth").mockImplementation(() => map.setBearing(0));
    action(root, "compass").click();
    expect(north).toHaveBeenCalled();
    // Visualize pitch: the compass tilts and resets the tilt too.
    root.querySelector("[data-ok-map-navigation]")?.setAttribute("data-ok-visualize-pitch", "");
    map.jumpTo({ bearing: 10 });
    expect(style(icon, "--_ok-map-pitch")).toBe("30deg");
    const both = vi
      .spyOn(map, "resetNorthPitch")
      .mockImplementation(() => map.jumpTo({ bearing: 0, pitch: 0 }));
    action(root, "compass").click();
    expect(both).toHaveBeenCalled();
    // Dragging the compass turns and tilts the map, and the click after it does nothing.
    const compass = action(root, "compass");
    const pointer = (type: string, x: number, y: number) =>
      compass.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 }),
      );
    pointer("pointerdown", 0, 0);
    pointer("pointermove", 50, -20);
    pointer("pointerup", 50, -20);
    expect(map.getBearing()).toBeCloseTo(40);
    expect(map.getPitch()).toBeCloseTo(10);
    both.mockClear();
    compass.click();
    expect(both).not.toHaveBeenCalled();
    compass.click();
    expect(both).toHaveBeenCalled();
  });

  it("toggles the globe and terrain", async () => {
    const { root, c } = create();
    await loaded(c);
    const map = c.map as NonNullable<MapController["map"]>;
    action(root, "globe").click();
    expect(map.getProjection()?.type).toBe("globe");
    action(root, "globe").click();
    expect(map.getProjection()?.type).toBe("mercator");
    const terrain = vi.spyOn(map, "setTerrain");
    action(root, "terrain").click();
    expect(action(root, "terrain").getAttribute("aria-pressed")).toBe("true");
    expect(terrain).toHaveBeenLastCalledWith(null);
    c.setSource("dem", {
      type: "raster-dem",
      tiles: ["https://dem.invalid/{z}/{x}/{y}.png"],
      tileSize: 256,
    });
    expect(terrain).toHaveBeenLastCalledWith({ source: "dem", exaggeration: 1.5 });
    action(root, "terrain").click();
    expect(action(root, "terrain").getAttribute("aria-pressed")).toBe("false");
    action(root, "terrain").removeAttribute("data-ok-exaggeration");
    action(root, "terrain").click();
    expect(terrain).toHaveBeenLastCalledWith({ source: "dem" });
    action(root, "terrain").click();
    action(root, "terrain").removeAttribute("data-ok-source");
    action(root, "terrain").click();
    expect(action(root, "terrain").getAttribute("aria-pressed")).toBe("false");
  });

  it("fills the window without the Fullscreen API, and Escape leaves", async () => {
    const onFullscreenChange = vi.fn();
    const { root, c } = create({ forcePseudoFullscreen: true, onFullscreenChange });
    await loaded(c);
    const button = action(root, "fullscreen");
    button.click();
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Exit fullscreen");
    c.setFullscreen(true);
    root
      .querySelector("canvas")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(false);
    root
      .querySelector("canvas")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(onFullscreenChange.mock.calls).toEqual([[true], [false]]);
    c.setFullscreen(true);
    c.destroy();
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(false);
  });

  it("uses the Fullscreen API when it can, and the CSS fallback when it refuses", async () => {
    const { root, c } = create();
    await loaded(c);
    const request = vi
      .spyOn(root, "requestFullscreen")
      .mockImplementation(() => Promise.reject(new Error("No user gesture")));
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(true);
    c.setFullscreen(true);
    expect(request).toHaveBeenCalled();
    await settle();
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(true);
    // The browser reports a native fullscreen element.
    let current: Element | null = root;
    vi.spyOn(document, "fullscreenElement", "get").mockImplementation(() => current);
    const exit = vi.spyOn(document, "exitFullscreen").mockImplementation(() => {
      current = null;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    });
    document.dispatchEvent(new Event("fullscreenchange"));
    c.setFullscreen(false);
    expect(exit).toHaveBeenCalled();
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(false);
    document.dispatchEvent(new Event("fullscreenchange"));
  });

  it("finds the person's location, shows it and announces it", async () => {
    const onGeolocate = vi.fn();
    const position = {
      coords: { longitude: 2.35, latitude: 48.86, accuracy: 500 },
    } as GeolocationPosition;
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) => success(position),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    });
    const { root, c } = create({ onGeolocate });
    await loaded(c);
    action(root, "geolocate").click();
    expect(onGeolocate).toHaveBeenCalledWith(position);
    expect(action(root, "geolocate").getAttribute("data-ok-state")).toBe("active");
    expect(root.querySelector("[data-ok-map-status]")?.textContent).toBe(
      "Map moved to your location.",
    );
    const dot = root.querySelector("[data-ok-map-user-location]") as HTMLElement;
    expect(dot.hasAttribute("data-ok-show-accuracy")).toBe(true);
    expect(style(dot, "--_ok-map-accuracy")).toMatch(/px$/);
    // Without the dot.
    root
      .querySelector("[data-ok-map-geolocate]")
      ?.setAttribute("data-ok-show-user-location", "false");
    action(root, "geolocate").click();
    expect(root.querySelector("[data-ok-map-user-location]")).toBeNull();
  });

  it("tracks the location and stops on the next press", async () => {
    let report: PositionCallback = () => {};
    const clearWatch = vi.fn();
    stubGeolocation({
      getCurrentPosition: vi.fn(),
      watchPosition: (success: PositionCallback) => {
        report = success;
        return 7;
      },
      clearWatch,
    });
    const onTrack = vi.fn();
    const { root, c } = create({ onTrackUserLocationChange: onTrack });
    root.querySelector("[data-ok-map-geolocate]")?.setAttribute("data-ok-track-user-location", "");
    root
      .querySelector("[data-ok-map-geolocate]")
      ?.setAttribute("data-ok-show-accuracy-circle", "false");
    await loaded(c);
    action(root, "geolocate").click();
    expect(action(root, "geolocate").getAttribute("data-ok-state")).toBe("waiting");
    expect(action(root, "geolocate").getAttribute("aria-pressed")).toBe("true");
    const fit = vi.spyOn(c.map as NonNullable<MapController["map"]>, "fitBounds");
    report({ coords: { longitude: 0, latitude: 0, accuracy: 10 } } as GeolocationPosition);
    report({ coords: { longitude: 1, latitude: 1, accuracy: 10 } } as GeolocationPosition);
    expect(fit).toHaveBeenCalledTimes(1);
    expect(
      root.querySelector("[data-ok-map-user-location]")?.hasAttribute("data-ok-show-accuracy"),
    ).toBe(false);
    c.geolocate();
    expect(clearWatch).toHaveBeenCalledWith(7);
    expect(onTrack.mock.calls).toEqual([[true], [false]]);
    expect(action(root, "geolocate").getAttribute("data-ok-state")).toBe("off");
    // Destroying while tracking clears the watch.
    c.geolocate();
    c.destroy();
    expect(clearWatch).toHaveBeenCalledTimes(2);
  });

  it("announces errors: denied, unavailable and unsupported", async () => {
    const onGeolocateError = vi.fn();
    let fail: PositionErrorCallback = () => {};
    stubGeolocation({
      getCurrentPosition: vi.fn(),
      watchPosition: (_s: PositionCallback, error: PositionErrorCallback) => {
        fail = error;
        return 3;
      },
      clearWatch: vi.fn(),
    });
    const { root, c } = create({ onGeolocateError });
    root.querySelector("[data-ok-map-geolocate]")?.setAttribute("data-ok-track-user-location", "");
    await loaded(c);
    const status = root.querySelector("[data-ok-map-status]") as HTMLElement;
    c.geolocate();
    fail({ code: 1, message: "denied" } as GeolocationPositionError);
    expect(status.textContent).toBe("Location permission denied.");
    expect(action(root, "geolocate").getAttribute("data-ok-state")).toBe("error");
    c.geolocate();
    fail({ code: 2, message: "unavailable" } as GeolocationPositionError);
    expect(status.textContent).toBe("Your location isn't available.");
    stubGeolocation(undefined);
    c.geolocate();
    expect(onGeolocateError).toHaveBeenCalledTimes(3);
  });

  it("writes the scale in every unit and the attribution with safe links", async () => {
    const { root, c } = create({}, "", 700);
    await loaded(c);
    const scale = root.querySelector("[data-ok-map-scale]") as HTMLElement;
    expect(scale.textContent).toMatch(/^\d+ (km|m)$/);
    expect(style(scale, "--_ok-map-scale-width")).toMatch(/px$/);
    scale.setAttribute("data-ok-unit", "imperial");
    scale.setAttribute("data-ok-max-width", "80");
    c.jumpTo({ zoom: 2.5 });
    expect(scale.textContent).toMatch(/mi$/);
    scale.setAttribute("data-ok-unit", "parsecs");
    c.jumpTo({ zoom: 2.6 });
    expect(scale.textContent).toMatch(/(km|m)$/);
    const box = root.querySelector("[data-ok-map-attribution]") as HTMLDetailsElement;
    const link = box.querySelector("a") as HTMLAnchorElement;
    expect(link.href).toBe("https://example.com/data");
    expect(link.rel).toBe("noopener noreferrer");
    expect(link.target).toBe("_blank");
    expect(box.querySelector("[data-ok-map-attribution-text]")?.textContent).toBe(
      "© Test data & friends",
    );
    expect(box.open).toBe(true);
    expect(box.hasAttribute("data-ok-narrow")).toBe(false);
    box.setAttribute("data-ok-compact", "");
    c.map?.resize();
    expect(box.open).toBe(false);
    expect(box.querySelector("summary")?.getAttribute("aria-label")).toBe("Map credits");
  });

  it("folds the attribution on narrow maps and joins several sources", async () => {
    const { root, c } = create({}, "", 400);
    await loaded(c);
    c.setSource("extra", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      attribution: "USGS",
    });
    c.setLayer({ id: "extra", type: "circle", source: "extra" });
    await new Promise<void>((resolve) => c.map?.once("idle", () => resolve()));
    const box = root.querySelector("[data-ok-map-attribution]") as HTMLDetailsElement;
    expect(box.hasAttribute("data-ok-narrow")).toBe(true);
    expect(box.open).toBe(false);
    expect(box.textContent).toContain("USGS");
    expect(box.textContent).toContain(" | ");
  });
});

describe("createMapController: lifecycle", () => {
  it("destroys once and stops watching the DOM", async () => {
    const { root, c } = create(
      {},
      `<div data-ok-map-marker data-ok-longitude="1" data-ok-latitude="1">${PIN}</div>`,
    );
    await loaded(c);
    c.destroy();
    c.destroy();
    expect(c.map).toBeNull();
    expect(root.querySelector("canvas")).toBeNull();
    root.querySelector("[data-ok-map-marker]")?.setAttribute("data-ok-longitude", "5");
    await settle();
    controller = undefined;
  });

  it("reacts to the system color scheme", async () => {
    const listeners: (() => void)[] = [];
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
      removeEventListener: () => {},
    }));
    const root = mount(markup()).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
    root.style.colorScheme = "light dark";
    controller = createMapController(root, {
      mapStyle: mapFixtureStyle(),
      mapStyleDark: mapFixtureStyle("#222222"),
    });
    await loaded(controller);
    const map = controller.map as NonNullable<MapController["map"]>;
    expect(map.getPaintProperty("land", "fill-color")).toBe("#222222");
    expect(listeners.length).toBeGreaterThan(0);
    for (const listener of listeners) listener();
    await styled(controller);
  });
});
