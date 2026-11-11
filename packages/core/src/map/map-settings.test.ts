import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanupDom, mapFixtureStyle, mount, nextEvent } from "../test-utils.js";
import { setMapWorkerUrl } from "./index.js";
import {
  createMapController,
  type MapController,
  type MapControllerOptions,
  mapPadding,
  parseMapJson,
  parseMapPadding,
} from "./map.js";

// Light, sky, camera padding, style diffing and marker scale / click tolerance (roadmap 4.18.79).

beforeAll(() => setMapWorkerUrl(workerUrl));

let controller: MapController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  vi.restoreAllMocks();
  cleanupDom();
});

const create = (options: MapControllerOptions = {}, inner = "") => {
  const root = mount(`<div data-ok-map style="position: relative; width: 600px; height: 400px">
    <div data-ok-map-view style="position: absolute; inset: 0"></div>
    ${inner}
  </div>`).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
  controller = createMapController(root, {
    mapStyle: mapFixtureStyle(),
    initialViewState: { longitude: -95, latitude: 38, zoom: 2 },
    ...options,
  });
  const c = controller;
  return { root, c, map: () => c.map as NonNullable<MapController["map"]> };
};
const loaded = async (c: MapController) => {
  if (!c.loaded) await nextEvent(c, "load");
};
const styleLoad = (c: MapController) =>
  nextEvent(
    { addEventListener: (_t: string, h: () => void) => c.map?.once("style.load", h) },
    "style.load",
  );
const frame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

describe("map padding and JSON helpers", () => {
  it("fills every side and reads CSS-like padding", () => {
    expect(mapPadding(null)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(mapPadding({ left: 300, top: -4, right: Number.NaN })).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 300,
    });
    expect(parseMapPadding("10")).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    expect(parseMapPadding("10 20")).toEqual({ top: 10, right: 20, bottom: 10, left: 20 });
    expect(parseMapPadding("10px 20 30")).toEqual({ top: 10, right: 20, bottom: 30, left: 20 });
    expect(parseMapPadding("1 2 3 4")).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
    expect(parseMapPadding("1 2 3 4 5")).toBeNull();
    expect(parseMapPadding("wide")).toBeNull();
    expect(parseMapPadding("")).toBeNull();
    expect(parseMapPadding(null)).toBeNull();
    expect(parseMapJson('{"intensity":0.8}')).toEqual({ intensity: 0.8 });
    expect(parseMapJson("[1]")).toBeNull();
    expect(parseMapJson("null")).toBeNull();
    expect(parseMapJson("{oops")).toBeNull();
    expect(parseMapJson(null)).toBeNull();
  });
});

describe("createMapController: light, sky, padding, style diffing", () => {
  it("sets the light and the sky, follows them and keeps them across style reloads", async () => {
    const { c, map } = create({
      light: { color: "#ff0000", intensity: 0.8 },
      sky: { "atmosphere-blend": 0.25 },
      styleDiffing: false,
    });
    await loaded(c);
    expect(map().getLight()).toMatchObject({ color: "#ff0000", intensity: 0.8 });
    expect(map().getSky()).toMatchObject({ "atmosphere-blend": 0.25 });
    const setLight = vi.spyOn(map(), "setLight");
    c.setSettings({ light: { color: "#ff0000", intensity: 0.8 } });
    expect(setLight).not.toHaveBeenCalled();
    c.setSettings({ light: { intensity: 0.2 } });
    expect(map().getLight()).toMatchObject({ intensity: 0.2 });
    // A reload (no diffing) brings the style's own light and sky: ours come back.
    const reloaded = styleLoad(c);
    c.setMapStyle(mapFixtureStyle("#00ff00"));
    await reloaded;
    expect(map().getLight()).toMatchObject({ intensity: 0.2 });
    expect(map().getSky()).toMatchObject({ "atmosphere-blend": 0.25 });
    // `null` goes back to MapLibre's default light and removes the sky.
    c.setSettings({ light: null, sky: null });
    expect(map().getLight()).toMatchObject({ intensity: 0.5, anchor: "viewport" });
    expect(map().getSky()).toBeUndefined();
    const setSky = vi.spyOn(map(), "setSky");
    c.setSettings({ projection: "globe" });
    expect(setSky).not.toHaveBeenCalled();
  });

  it("leaves a style's own sky alone until one is set", async () => {
    const style = { ...mapFixtureStyle(), sky: { "sky-color": "#123456" } };
    const { c, map } = create({ mapStyle: style });
    await loaded(c);
    c.setSettings({ projection: "mercator", light: null, sky: null });
    expect(map().getSky()).toMatchObject({ "sky-color": "#123456" });
  });

  it("pads the camera and follows the padding", async () => {
    const { c, map } = create({ padding: { left: 200 } });
    await loaded(c);
    expect(map().getPadding()).toEqual({ top: 0, right: 0, bottom: 0, left: 200 });
    const setPadding = vi.spyOn(map(), "setPadding");
    c.setSettings({ padding: { left: 200 } });
    expect(setPadding).not.toHaveBeenCalled();
    c.setSettings({ padding: { top: 40 } });
    expect(map().getPadding()).toEqual({ top: 40, right: 0, bottom: 0, left: 0 });
    c.setSettings({ padding: null });
    expect(map().getPadding()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("diffs new styles by default and reloads them with styleDiffing off", async () => {
    const { c, map } = create();
    await loaded(c);
    const setStyle = vi.spyOn(map(), "setStyle");
    const diffed = styleLoad(c);
    c.setMapStyle(mapFixtureStyle("#00ff00"));
    await diffed;
    expect(setStyle).toHaveBeenLastCalledWith(expect.anything(), { diff: true });
    expect(map().getPaintProperty("land", "fill-color")).toBe("#00ff00");
    c.setSettings({ styleDiffing: false });
    const reloaded = styleLoad(c);
    c.setMapStyle(mapFixtureStyle("#0000ff"));
    expect(setStyle).toHaveBeenLastCalledWith(expect.anything(), { diff: false });
    await reloaded;
    expect(map().getPaintProperty("land", "fill-color")).toBe("#0000ff");
  });
});

describe("createMapController: marker scale and click tolerance", () => {
  it("writes the pin scale of each marker", async () => {
    const { root, c } = create(
      {},
      `<div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38" data-ok-scale="2"></div>
       <div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38" data-ok-scale="0"></div>
       <div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38"></div>`,
    );
    await loaded(c);
    const [big, zero, plain] = root.querySelectorAll<HTMLElement>("[data-ok-map-marker]");
    const scale = (node: HTMLElement | undefined) =>
      node?.style.getPropertyValue("--_ok-map-pin-scale");
    expect(scale(big)).toBe("2");
    expect(scale(zero)).toBe("");
    expect(scale(plain)).toBe("");
    big?.setAttribute("data-ok-scale", "0.5");
    await frame();
    expect(scale(big)).toBe("0.5");
  });

  it("starts a drag only past the marker's click tolerance, else the map's", async () => {
    const onMarkerDrag = vi.fn();
    const { root, c } = create(
      { onMarkerDrag, mapOptions: { clickTolerance: 6 } },
      `<div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38" data-ok-draggable data-ok-click-tolerance="10"></div>
       <div data-ok-map-marker data-ok-longitude="-90" data-ok-latitude="38" data-ok-draggable></div>`,
    );
    await loaded(c);
    const [own, inherited] = root.querySelectorAll<HTMLElement>("[data-ok-map-marker]");
    const pointer = (target: HTMLElement | undefined, type: string, x: number) =>
      target?.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: 0, button: 0, pointerId: 1 }),
      );
    pointer(own, "pointerdown", 0);
    pointer(own, "pointermove", 8);
    expect(onMarkerDrag).not.toHaveBeenCalled();
    pointer(own, "pointermove", 12);
    expect(onMarkerDrag.mock.calls[0]?.[1]).toBe("start");
    pointer(own, "pointerup", 12);
    onMarkerDrag.mockClear();
    pointer(inherited, "pointerdown", 0);
    pointer(inherited, "pointermove", 5);
    expect(onMarkerDrag).not.toHaveBeenCalled();
    pointer(inherited, "pointermove", 7);
    expect(onMarkerDrag.mock.calls[0]?.[1]).toBe("start");
    pointer(inherited, "pointerup", 7);
  });
});
