import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanupDom, mapFixtureStyle, mount, nextEvent, nextFrame } from "../test-utils.js";
import { mapIcons, mapLabels, setMapWorkerUrl } from "./index.js";
import { createMapController, type MapController } from "./map.js";

beforeAll(() => setMapWorkerUrl(workerUrl));

let controller: MapController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  vi.restoreAllMocks();
  cleanupDom();
});

const PIN = `<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"></path></svg>`;
const create = (inner = "", options: Parameters<typeof createMapController>[1] = {}) => {
  const root = mount(`<div data-ok-map style="position: relative; width: 600px; height: 400px">
    <div data-ok-map-view style="position: absolute; inset: 0"></div>
    ${inner}
  </div>`).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
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
const map = (c: MapController) => c.map as NonNullable<MapController["map"]>;

describe("map controller edge cases", () => {
  it("ships icons and labels for every control", () => {
    expect(Object.keys(mapIcons)).toContain("compassNorth");
    for (const path of Object.values(mapIcons)) expect(path).toMatch(/^M/);
    expect(mapLabels.fallback).toMatch(/WebGL/);
  });

  it("works without a description, controls or status, and fits bounds without options", async () => {
    const { root, c } = create("", { initialViewState: { bounds: [-20, -20, 20, 20] } });
    c.setSettings({ projection: "globe" });
    await loaded(c);
    expect(root.querySelector("canvas")?.hasAttribute("aria-describedby")).toBe(false);
    expect(map(c).getProjection()?.type).toBe("globe");
    // Partial view states keep the rest of the view.
    c.setViewState({ zoom: 3 });
    expect(c.getViewState()).toMatchObject({ zoom: 3 });
    expect(Math.round(c.getViewState().longitude)).toBe(0);
    // Events without listeners, enter / leave without interactive layers.
    map(c).fire("mousemove", { point: { x: 10, y: 10 } });
    map(c).fire("mouseout", {});
    c.sync();
  });

  it("keeps sources and layers in their place across updates", async () => {
    const { c } = create();
    const point = {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: { type: "Point" as const, coordinates: [0, 0] },
        },
      ],
    };
    c.setSource("dots", { type: "geojson", data: point });
    c.setLayer({ id: "under", type: "circle", source: "dots" }, "land");
    c.setLayer({ id: "plain", type: "circle", source: "dots" });
    await loaded(c);
    const m = map(c);
    expect(m.getStyle().layers.map((layer) => layer.id)).toEqual([
      "background",
      "under",
      "land",
      "plain",
    ]);
    // Same paint, new layout; one paint key changes, the other stays.
    c.setLayer({
      id: "plain",
      type: "circle",
      source: "dots",
      paint: { "circle-radius": 2, "circle-opacity": 1 },
    });
    c.setLayer({
      id: "plain",
      type: "circle",
      source: "dots",
      paint: { "circle-radius": 2, "circle-opacity": 0.5 },
    });
    c.setLayer({
      id: "plain",
      type: "circle",
      source: "dots",
      paint: { "circle-radius": 2, "circle-opacity": 0.5 },
      layout: { visibility: "none" },
    });
    expect(m.getPaintProperty("plain", "circle-opacity")).toBe(0.5);
    expect(m.getLayoutProperty("plain", "visibility")).toBe("none");
    // Moving before a layer that doesn't exist keeps the order.
    c.setLayer(
      {
        id: "plain",
        type: "circle",
        source: "dots",
        paint: { "circle-radius": 2, "circle-opacity": 0.5 },
        layout: { visibility: "none" },
      },
      "missing",
    );
    expect(m.getStyle().layers.at(-1)?.id).toBe("plain");
    // Taking over one of the style's own layers and sources.
    c.setLayer({ id: "land", type: "fill", source: "land", paint: { "fill-color": "#ff0000" } });
    expect(m.getPaintProperty("land", "fill-color")).toBe("#ff0000");
    c.setSource("land", mapFixtureStyle("#0000ff").sources.land);
    expect(m.getLayer("land")).toBeDefined();
  });

  it("ignores keys and drags on markers without a position, and the compass without an icon", async () => {
    const onMarkerDrag = vi.fn();
    const { root, c } = create(
      `<div data-ok-map-marker data-ok-draggable tabindex="0">${PIN}</div>
       <div data-ok-map-control>
         <button type="button" data-ok-map-action="compass">N</button>
         <button type="button" data-ok-map-action="teleport">?</button>
       </div>`,
      { onMarkerDrag },
    );
    await loaded(c);
    const marker = root.querySelector("[data-ok-map-marker]") as HTMLElement;
    marker.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    marker.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    marker.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 50, clientY: 50 }),
    );
    expect(onMarkerDrag).not.toHaveBeenCalled();
    const compass = root.querySelector('[data-ok-map-action="compass"]') as HTMLButtonElement;
    expect(compass.style.getPropertyValue("--_ok-map-bearing")).toBe("0deg");
    // Without visualize pitch, dragging the compass only turns the map.
    const pointer = (type: string, x: number, y: number) =>
      compass.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, pointerId: 1 }),
      );
    pointer("pointerdown", 0, 0);
    pointer("pointermove", 25, 40);
    pointer("pointercancel", 25, 40);
    expect(map(c).getBearing()).toBeCloseTo(20);
    expect(map(c).getPitch()).toBe(0);
    (root.querySelector('[data-ok-map-action="teleport"]') as HTMLButtonElement).click();
  });

  it("ignores location results that arrive after destroy", async () => {
    let success: PositionCallback = () => {};
    let failure: PositionErrorCallback = () => {};
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue({
      getCurrentPosition: (ok: PositionCallback, error: PositionErrorCallback) => {
        success = ok;
        failure = error;
      },
      watchPosition: () => 1,
      clearWatch: () => {},
    } as unknown as Geolocation);
    const onGeolocate = vi.fn();
    const { root, c } = create(
      `<div data-ok-map-control><button type="button" data-ok-map-action="geolocate">G</button></div>`,
      { onGeolocate, onGeolocateError: onGeolocate },
    );
    await loaded(c);
    c.geolocate();
    c.destroy();
    success({ coords: { longitude: 0, latitude: 0, accuracy: 1 } } as GeolocationPosition);
    failure({ code: 1, message: "late" } as GeolocationPositionError);
    expect(onGeolocate).not.toHaveBeenCalled();
    c.sync();
    root.remove();
    await nextFrame();
  });
});
