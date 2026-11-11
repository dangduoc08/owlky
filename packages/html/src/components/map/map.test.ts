import { setMapWorkerUrl } from "@owlky/core/map";
import workerUrl from "@owlky/core/map-worker.js?url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import pointsUrl from "./fixtures/points.json?url";
import styleUrl from "./fixtures/style.json?url";
import { type MapInstance, map } from "./map.js";

beforeAll(() => setMapWorkerUrl(workerUrl));

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  String(snippets.find(([path]) => path.endsWith(`/${name}-group.html`))?.[1])
    // Offline: the test style and data instead of OpenFreeMap and the story data.
    .replace(/https:\/\/tiles\.openfreemap\.org\/styles\/[a-z]+/g, styleUrl)
    .replace(/maps\/[a-z-]+\.geojson/g, pointsUrl);

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  vi.restoreAllMocks();
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components, map)
    .start();
  return runtime;
};
const instanceOf = (root: Element) => runtime?.get<MapInstance>(root, "map") as MapInstance;
/** Resolves on the next `ok:map:<type>` event of `target`. */
const next = (target: EventTarget, type: string) =>
  new Promise<CustomEvent>((resolve) =>
    target.addEventListener(`ok:map:${type}`, (event) => resolve(event as CustomEvent), {
      once: true,
    }),
  );
/** Mounts markup and waits for its first map to load. */
const setup = async (html: string) => {
  const host = mount(html);
  const root = host.querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
  const load = next(root, "load");
  start();
  await load;
  return { host, root, instance: instanceOf(root) };
};
const BASIC = (
  inner = "",
  attributes = "",
) => `<div data-ok-map id="m" data-ok-map-style="${styleUrl}" data-ok-longitude="-95" data-ok-latitude="38" data-ok-zoom="2" ${attributes} style="width: 600px; height: 400px">
  <div data-ok-map-view></div>
  <div data-ok-map-fallback></div>
  <div data-ok-map-status role="status"></div>
  ${inner}
</div>`;

describe("map snippets", () => {
  it.each(snippets.map(([path]) => path.replace(/^.*\/(.+)-group\.html$/, "$1")))(
    "%s: mounts, is CSP-safe and labels its controls",
    async (name) => {
      const html = snippet(name);
      const host = mount(html);
      // The markup as written (MapLibre adds inline styles through CSSOM once it runs).
      expectCspSafe(host, html);
      expectNamedButtons(host);
      start();
      await settle();
      const roots = host.querySelectorAll<HTMLElement>("[data-ok-map]");
      expect(roots.length).toBeGreaterThan(0);
      for (const root of roots) expect(instanceOf(root)?.controller).toBeDefined();
    },
  );

  it("passes axe with the map loaded", async () => {
    const { host } = await setup(snippet("markers-popups"));
    await expectNoAxeViolations(host);
  });

  it("adds the declared sources and layers", async () => {
    const { instance } = await setup(snippet("clusters"));
    const style = instance.map?.getStyle();
    expect(Object.keys(style?.sources ?? {})).toContain("earthquakes");
    expect(style?.layers.map((layer) => layer.id)).toEqual(
      expect.arrayContaining(["clusters", "cluster-count", "unclustered-point"]),
    );
  });
});

describe("map runtime", () => {
  it("exports a PNG and refuses outside a gesture", async () => {
    const { instance } = await setup(BASIC());
    const blob = await instance.exportMap("png", { download: false });
    expect(blob.type).toBe("image/png");
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue({
      isActive: false,
    } as UserActivation);
    await expect(instance.exportMap("png")).rejects.toMatchObject({ name: "NotAllowedError" });
  });

  it("offers greatCircle to pages without a bundler", async () => {
    const { instance } = await setup(BASIC());
    const arc = instance.greatCircle([0, 0], [10, 0], { steps: 2 });
    expect(arc.geometry.coordinates).toHaveLength(3);
  });

  it("reports map events with the view state", async () => {
    const host = mount(BASIC());
    const root = host.querySelector("[data-ok-map]") as HTMLElement;
    const load = next(root, "load");
    start();
    expect((await load).detail.viewState.zoom).toBe(2);
    const moved = next(root, "moveend");
    instanceOf(root).jumpTo({ zoom: 3 });
    expect((await moved).detail.viewState.zoom).toBe(3);
    expect(instanceOf(root).viewState.zoom).toBe(3);
  });

  it("follows root attributes: view, settings, style and label", async () => {
    // Without diffing, an equal style at a new URL still reloads (`style.load`).
    const { root, instance } = await setup(BASIC("", 'data-ok-style-diffing="false"'));
    const m = instance.map as NonNullable<MapInstance["map"]>;
    root.setAttribute("data-ok-zoom", "4");
    root.setAttribute("data-ok-scroll-zoom", "false");
    root.setAttribute("data-ok-cooperative-gestures", "");
    root.setAttribute("data-ok-max-bounds", "-120,20,-60,50");
    root.setAttribute("data-ok-label", "Renamed map");
    await settle();
    expect(m.getZoom()).toBe(4);
    expect(m.scrollZoom.isEnabled()).toBe(false);
    expect(m.cooperativeGestures.isEnabled()).toBe(true);
    expect(m.getMaxBounds()).not.toBeNull();
    expect(root.querySelector("canvas")?.getAttribute("aria-label")).toBe("Renamed map");
    root.removeAttribute("data-ok-label");
    root.setAttribute("data-ok-max-bounds", "bad");
    await settle();
    expect(root.querySelector("canvas")?.getAttribute("aria-label")).toBe("Map");
    expect(m.getMaxBounds()).toBeNull();
    const styled = new Promise<void>((resolve) => m.once("style.load", () => resolve()));
    root.setAttribute("data-ok-map-style-dark", styleUrl);
    root.setAttribute("data-ok-map-style", `${styleUrl}?v=2`);
    await styled;
    root.removeAttribute("data-ok-map-style-dark");
    root.removeAttribute("data-ok-map-style");
    await settle();
  });

  it("follows light, sky and padding attributes, and marker scale and click tolerance", async () => {
    const { root, instance } = await setup(
      BASIC(
        `<div data-ok-map-marker data-ok-longitude="-95" data-ok-latitude="38" data-ok-draggable data-ok-scale="2" data-ok-click-tolerance="10"></div>`,
        `data-ok-light='{"intensity":0.8}' data-ok-sky='{"atmosphere-blend":0.25}' data-ok-padding="0 0 0 120"`,
      ),
    );
    const m = instance.map as NonNullable<MapInstance["map"]>;
    expect(m.getLight()).toMatchObject({ intensity: 0.8 });
    expect(m.getSky()).toMatchObject({ "atmosphere-blend": 0.25 });
    expect(m.getPadding()).toEqual({ top: 0, right: 0, bottom: 0, left: 120 });
    root.setAttribute("data-ok-light", '{"intensity":0.3}');
    root.setAttribute("data-ok-sky", "not json");
    root.setAttribute("data-ok-padding", "20");
    await settle();
    expect(m.getLight()).toMatchObject({ intensity: 0.3 });
    expect(m.getSky()).toBeUndefined();
    expect(m.getPadding()).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
    const marker = root.querySelector<HTMLElement>("[data-ok-map-marker]") as HTMLElement;
    expect(marker.style.getPropertyValue("--_ok-map-pin-scale")).toBe("2");
    const drags = vi.fn();
    marker.addEventListener("ok:map:markerdragstart", drags);
    const pointer = (type: string, x: number) =>
      marker.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: 0, button: 0, pointerId: 1 }),
      );
    pointer("pointerdown", 0);
    pointer("pointermove", 8);
    expect(drags).not.toHaveBeenCalled();
    pointer("pointermove", 14);
    pointer("pointerup", 14);
    expect(drags).toHaveBeenCalledTimes(1);
  });

  it("reads bounds, interactive layers and reports features under the pointer", async () => {
    const { root, instance } = await setup(
      BASIC(
        `<div data-ok-map-source data-ok-id="points" data-ok-type="geojson" data-ok-data="${pointsUrl}" hidden>
           <div data-ok-map-layer data-ok-id="dots" data-ok-type="circle" data-ok-paint='{"circle-radius":12}' hidden></div>
         </div>`,
        'data-ok-bounds="-120,25,-75,45" data-ok-interactive-layer-ids="dots"',
      ),
    );
    const m = instance.map as NonNullable<MapInstance["map"]>;
    if (!m.isSourceLoaded("points"))
      await new Promise<void>((resolve) => m.once("idle", () => resolve()));
    expect(m.getCenter().lng).toBeCloseTo(-97.5, 0);
    const point = m.project([-99.1, 31.1]);
    const enter = next(root, "mouseenter");
    m.fire("mousemove", { point, lngLat: m.unproject(point) });
    expect((await enter).detail.features[0].properties.name).toBe("Texas");
  });

  it("follows declarations as they change, appear and go", async () => {
    const { host, instance } = await setup(
      BASIC(
        `<div data-ok-map-source data-ok-id="points" data-ok-type="geojson" data-ok-data="${pointsUrl}" hidden>
           <div data-ok-map-layer data-ok-id="dots" data-ok-type="circle" hidden></div>
         </div>
         <div data-ok-map-source data-ok-id="bad" data-ok-type="sparkles" hidden></div>
         <div data-ok-map-layer data-ok-id="loose" data-ok-type="circle" hidden></div>
         <p id="note">Not a declaration</p>`,
      ),
    );
    const m = instance.map as NonNullable<MapInstance["map"]>;
    const layer = host.querySelector('[data-ok-id="dots"]') as HTMLElement;
    layer.setAttribute("data-ok-filter", '["==",["get","region"],"West"]');
    await settle();
    expect(m.getFilter("dots")).toEqual(["==", ["get", "region"], "West"]);
    // A new layer element is picked up; others (a paragraph) are ignored.
    const extra = document.createElement("div");
    extra.setAttribute("data-ok-map-layer", "");
    extra.setAttribute("data-ok-id", "rings");
    extra.setAttribute("data-ok-type", "circle");
    extra.setAttribute("data-ok-source", "points");
    extra.hidden = true;
    host.querySelector("[data-ok-map]")?.append(extra);
    (host.querySelector("#note") as HTMLElement).textContent = "Changed";
    await settle();
    expect(m.getLayer("rings")).toBeDefined();
    const wrapper = document.createElement("div");
    wrapper.append(extra.cloneNode());
    (wrapper.firstElementChild as HTMLElement).setAttribute("data-ok-id", "rings-2");
    host.querySelector("[data-ok-map]")?.append(wrapper);
    await settle();
    expect(m.getLayer("rings-2")).toBeDefined();
    // Removing the source removes it and its layers.
    host.querySelector('[data-ok-map-source][data-ok-id="points"]')?.remove();
    extra.remove();
    wrapper.remove();
    await settle();
    expect(m.getSource("points")).toBeUndefined();
    expect(m.getLayer("dots")).toBeUndefined();
    instance.setSourceData("missing", {});
  });

  it("opens popups from markers, closes them and gives focus back", async () => {
    const { host, root, instance } = await setup(snippet("markers-popups"));
    const marker = host.querySelector('[aria-label="Kenya"]') as HTMLElement;
    const popup = host.querySelector("#map-popup-ke") as HTMLElement;
    const opened = next(popup, "popupopen");
    marker.focus();
    marker.click();
    await opened;
    await settle();
    expect(popup.hidden).toBe(false);
    expect(document.activeElement).toBe(popup.querySelector("[data-ok-map-popup-close]"));
    // Another marker closes it and opens its own.
    (host.querySelector('[aria-label="Peru"]') as HTMLElement).click();
    expect(popup.hidden).toBe(true);
    const peru = host.querySelector("#map-popup-pe") as HTMLElement;
    expect(peru.hidden).toBe(false);
    // The same marker again closes its popup.
    (host.querySelector('[aria-label="Peru"]') as HTMLElement).click();
    expect(peru.hidden).toBe(true);
    // Close requests can be canceled.
    instance.openPopup("map-popup-ke");
    instance.openPopup(popup);
    const cancel = (event: Event) => event.preventDefault();
    root.addEventListener("ok:map:popupclose", cancel);
    (popup.querySelector("[data-ok-map-popup-close]") as HTMLButtonElement).click();
    expect(popup.hidden).toBe(false);
    root.removeEventListener("ok:map:popupclose", cancel);
    const closed = next(popup, "popupclose");
    (popup.querySelector("[data-ok-map-popup-close]") as HTMLButtonElement).click();
    expect((await closed).detail.reason).toBe("close-button");
    expect(popup.hidden).toBe(true);
    instance.openPopup("map-popup-ke");
    instance.closePopup("map-popup-ke");
    expect(popup.hidden).toBe(true);
    instance.closePopup("nothing");
    instance.openPopup(marker);
    // A trigger whose popup doesn't exist does nothing.
    marker.setAttribute("data-ok-map-popup-open", "nothing");
    marker.click();
  });

  it("stores dragged markers' positions and reports the drag on the marker", async () => {
    const { host } = await setup(snippet("draggable-markers"));
    const marker = host.querySelector("[data-ok-map-marker]") as HTMLElement;
    const ended = next(marker, "markerdragend");
    const started = next(marker, "markerdragstart");
    const moved = next(marker, "markerdrag");
    marker.focus();
    marker.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await Promise.all([started, moved]);
    const { lngLat } = (await ended).detail;
    expect(marker.getAttribute("data-ok-longitude")).toBe(
      String(Math.round(lngLat.lng * 1e6) / 1e6),
    );
    expect(Number(marker.getAttribute("data-ok-longitude"))).toBeGreaterThan(-100);
  });

  it("flies the map from data-ok-map-fly-to triggers", async () => {
    const { host, instance } = await setup(
      `${snippet("viewport-animation")}
       <button type="button" data-ok-map-fly-to="map-viewport" data-ok-view="2.35,48.86,9">Paris</button>
       <button type="button" data-ok-map-fly-to="map-viewport" data-ok-view="2.35,48.86,9,30,15" data-ok-duration="0">Tilted</button>
       <button type="button" data-ok-map-fly-to="map-viewport" data-ok-view="nowhere">Bad</button>
       <button type="button" data-ok-map-fly-to="missing" data-ok-view="1,2">Missing</button>
       <button type="button" data-ok-map-fly-to="map-viewport">No view</button>`,
    );
    const fly = vi.spyOn(instance.map as NonNullable<MapInstance["map"]>, "flyTo");
    const button = (name: string) =>
      [...host.querySelectorAll("button")].find((each) => each.textContent === name) as HTMLElement;
    button("Paris").click();
    expect(fly).toHaveBeenLastCalledWith({ center: [2.35, 48.86], zoom: 9 });
    button("Tilted").click();
    expect(fly).toHaveBeenLastCalledWith({
      center: [2.35, 48.86],
      zoom: 9,
      pitch: 30,
      bearing: 15,
      duration: 0,
    });
    button("Bad").click();
    button("Missing").click();
    button("No view").click();
    expect(fly).toHaveBeenCalledTimes(2);
    const radio = host.querySelector('input[value="Tokyo"]') as HTMLInputElement;
    radio.click();
    expect(fly).toHaveBeenLastCalledWith({ center: [139.692, 35.69], zoom: 11, duration: 4000 });
    expect(fly).toHaveBeenCalledTimes(3);
    // An unchecked radio's change does nothing.
    const other = host.querySelector('input[value="Paris"]') as HTMLInputElement;
    other.dispatchEvent(new Event("change", { bubbles: true }));
    expect(fly).toHaveBeenCalledTimes(3);
  });

  it("reports fullscreen, location and the fallback", async () => {
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue({
      getCurrentPosition: (success: PositionCallback) =>
        success({ coords: { longitude: 1, latitude: 2, accuracy: 3 } } as GeolocationPosition),
      watchPosition: (_s: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "denied" } as GeolocationPositionError);
        return 1;
      },
      clearWatch: () => {},
    } as unknown as Geolocation);
    const { host, root, instance } = await setup(snippet("change-theme"));
    const full = next(root, "fullscreen");
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(false);
    instance.setFullscreen(true);
    expect((await full).detail.fullscreen).toBe(true);
    expect(instance.fullscreen).toBe(true);
    instance.setFullscreen(false);
    const located = next(root, "geolocate");
    (host.querySelector('[data-ok-map-action="geolocate"]') as HTMLButtonElement).click();
    expect((await located).detail.coords).toEqual({ longitude: 1, latitude: 2, accuracy: 3 });
    host.querySelector("[data-ok-map-geolocate]")?.setAttribute("data-ok-track-user-location", "");
    const tracking = next(root, "trackuserlocation");
    const failed = next(root, "geolocateerror");
    (host.querySelector('[data-ok-map-action="geolocate"]') as HTMLButtonElement).click();
    expect((await failed).detail).toEqual({ code: 1, message: "denied" });
    expect((await tracking).detail.tracking).toBe(true);
    instance.controller.geolocate();
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue(undefined as unknown as Geolocation);
    const unsupported = next(root, "geolocateerror");
    instance.controller.geolocate();
    expect((await unsupported).detail.code).toBe(0);
  });

  it("emits the fallback without WebGL", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const host = mount(BASIC());
    const root = host.querySelector("[data-ok-map]") as HTMLElement;
    const fallback = next(root, "fallback");
    start();
    expect((await fallback).detail.reason).toBe("webgl");
    expect(root.hasAttribute("data-ok-fallback")).toBe(true);
    await expect(instanceOf(root).getClusterExpansionZoom("none", 1)).rejects.toThrow();
  });

  it("starts without a style, and ignores the click that ends a marker drag", async () => {
    const host = mount(
      BASIC(
        `<div data-ok-map-marker role="button" tabindex="0" aria-label="Pin" data-ok-draggable data-ok-longitude="-95" data-ok-latitude="38" data-ok-map-popup-open="p"><svg aria-hidden="true"></svg></div>
         <div data-ok-map-popup id="p" data-ok-longitude="-95" data-ok-latitude="38" role="dialog" aria-label="Pin" hidden><div>Pin</div></div>`,
      ).replace(/data-ok-map-style="[^"]*"/, ""),
    );
    const root = host.querySelector("[data-ok-map]") as HTMLElement;
    const load = next(root, "load");
    start();
    await load;
    expect(instanceOf(root).map?.getStyle().layers).toEqual([]);
    const marker = host.querySelector("[data-ok-map-marker]") as HTMLElement;
    const pointer = (type: string, x: number) =>
      marker.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: 0, button: 0, pointerId: 1 }),
      );
    pointer("pointerdown", 0);
    pointer("pointermove", 40);
    pointer("pointerup", 40);
    marker.click();
    expect((host.querySelector("#p") as HTMLElement).hidden).toBe(true);
  });

  it("cleans up on stop", async () => {
    const { root } = await setup(BASIC());
    runtime?.stop();
    expect(root.querySelector("canvas")).toBeNull();
  });
});

describe("map choropleth", () => {
  const GEO = JSON.stringify({
    type: "FeatureCollection",
    features: ["A", "B"].map((name, i) => ({
      type: "Feature",
      properties: { name },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-120 + i * 25, 30],
            [-100 + i * 25, 30],
            [-100 + i * 25, 45],
            [-120 + i * 25, 45],
            [-120 + i * 25, 30],
          ],
        ],
      },
    })),
  });
  const CHOROPLETH = BASIC(`
    <div data-ok-map-source data-ok-id="boxes" data-ok-type="geojson" data-ok-promote-id="name" data-ok-data='${GEO}' hidden>
      <div data-ok-map-layer data-ok-id="boxes-fill" data-ok-type="fill" data-ok-paint='{"fill-color":["step",["feature-state","value"],"#cccccc",5,"#333333"]}' hidden></div>
    </div>
    <div id="r" data-ok-map-regions data-ok-source="boxes" data-ok-layer="boxes-fill">
      <div data-ok-map-regions-list role="listbox" tabindex="0" aria-label="Boxes"></div>
      <table>
        <caption>Values</caption>
        <thead><tr><th scope="col">Box</th><th scope="col">Value</th></tr></thead>
        <tbody>
          <tr data-ok-id="A"><th scope="row">A</th><td data-ok-value="2">2</td></tr>
          <tr data-ok-id="B"><th scope="row">B</th><td data-ok-value="8">8</td></tr>
        </tbody>
      </table>
    </div>
    <div data-ok-map-corner="bottom-left">
      <div id="l" data-ok-map-legend data-ok-variant="classes" role="group" aria-label="Legend">
        <ul data-ok-map-legend-classes>
          <li><button type="button" data-ok-map-legend-class data-ok-min="2" data-ok-max="5" aria-pressed="false"><span data-ok-map-legend-swatch data-ok-swatch="#cccccc" aria-hidden="true"></span><span data-ok-map-legend-label>2 – 5</span></button></li>
          <li><button type="button" data-ok-map-legend-class data-ok-min="5" data-ok-max="8" aria-pressed="false"><span data-ok-map-legend-swatch data-ok-swatch="#333333" aria-hidden="true"></span><span data-ok-map-legend-label>5 – 8</span></button></li>
        </ul>
      </div>
    </div>`);

  it("fills the regions list and reports selections and legend toggles", async () => {
    const { host, instance } = await setup(CHOROPLETH);
    const list = host.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    expect([...list.querySelectorAll('[role="option"]')].map((o) => o.textContent)).toEqual([
      "A: 2",
      "B: 8",
    ]);
    const regions = host.querySelector("#r") as HTMLElement;
    const selected = next(regions, "regionselect");
    list.focus();
    list.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    list.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect((await selected).detail).toEqual({ id: "B" });
    const legend = host.querySelector("#l") as HTMLElement;
    const toggled = next(legend, "legendtoggle");
    (legend.querySelector("button") as HTMLButtonElement).click();
    expect((await toggled).detail).toEqual({ classIndex: 0, active: [0] });
    expect(instance.map?.getFeatureState({ source: "boxes", id: "B" })).toMatchObject({
      value: 8,
      muted: true,
      selected: true,
    });
    // CDN pages classify their data with the instance's `scale`.
    expect(instance.scale([1, 2, 3, 4], { classes: 2 }).breaks).toEqual([2.5]);
    await expectNoAxeViolations(host);
  });

  it("draws proportional symbols with a size legend (bubbles snippet)", async () => {
    const { host, instance } = await setup(snippet("bubbles"));
    const layer = instance.map?.getLayer("metros-bubbles");
    expect(layer?.type).toBe("circle");
    const sizes = host.querySelector("[data-ok-map-legend-sizes]") as HTMLElement;
    expect(sizes.style.getPropertyValue("--_ok-map-size-max")).toMatch(/px$/);
    const circles = host.querySelectorAll<HTMLElement>("[data-ok-map-legend-circle]");
    expect(circles).toHaveLength(3);
    expect(circles[2]?.offsetWidth).toBeLessThan(circles[0]?.offsetWidth ?? 0);
    expect(host.querySelectorAll("[data-ok-map-region]")).toHaveLength(20);
    // CDN pages build the scales and the cells with the instance's helpers.
    expect(instance.sizeScale([1, 4], { range: [1, 2] }).radiusOf(4)).toBe(2);
    expect(instance.hexbin([[0, 0]]).features).toHaveLength(1);
    expect(instance.pixelGrid([]).features).toEqual([]);
    await expectNoAxeViolations(host);
  });

  it("bins points into hexagons from a page script (hexbin snippet)", async () => {
    const { instance } = await setup(snippet("hexbin"));
    const bins = instance.hexbin(
      [
        [-100, 40],
        [-100.01, 40.01],
      ],
      { radius: 0.75 },
    );
    instance.setSourceData("quake-bins", bins);
    expect(bins.features[0]?.properties.count).toBe(2);
    expect(instance.map?.getLayer("quake-bins-fill")?.type).toBe("fill");
  });

  it("draws pattern fills per class (pattern-fills snippet)", async () => {
    const { host, instance } = await setup(snippet("pattern-fills"));
    expect(instance.map?.getLayer("patterns-texture")?.type).toBe("fill");
    instance.map?.fire("styleimagemissing", { id: "ok-pattern-circles" });
    expect(instance.map?.hasImage("ok-pattern-circles")).toBe(true);
    const swatches = host.querySelectorAll("[data-ok-map-legend-swatch][data-ok-pattern]");
    expect([...swatches].map((swatch) => swatch.getAttribute("data-ok-pattern"))).toEqual([
      "circles",
      "horizontalLines",
      "slantedLines",
      "squares",
    ]);
    expect(getComputedStyle(swatches[0] as Element).backgroundImage).toContain("gradient");
    await expectNoAxeViolations(host);
  });

  it("passes axe with the choropleth snippet loaded", async () => {
    const { host } = await setup(snippet("choropleth"));
    expect(host.querySelectorAll("[data-ok-map-region]")).toHaveLength(51);
    await expectNoAxeViolations(host);
  });
});
