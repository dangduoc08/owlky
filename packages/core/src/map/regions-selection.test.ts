import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import { cleanupDom, mapFixtureStyle, mount, nextEvent } from "../test-utils.js";
import { mapRegionLayers, mapScale } from "./choropleth.js";
import { setMapWorkerUrl } from "./index.js";
import { createMapController, type MapController, type MapControllerOptions } from "./map.js";

/* Multiple and box selection, linked maps (ADR-0065, roadmap 4.18.98). */

beforeAll(() => {
  setMapWorkerUrl(workerUrl);
  const style = document.createElement("style");
  style.textContent = tokensCss;
  document.head.append(style);
});

const controllers: MapController[] = [];
afterEach(() => {
  for (const each of controllers.splice(0)) each.destroy();
  cleanupDom();
});

const box = (name: string, w: number, s: number, e: number, n: number) => ({
  type: "Feature" as const,
  properties: { name },
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [w, s],
        [e, s],
        [e, n],
        [w, n],
        [w, s],
      ],
    ],
  },
});
const DATA = {
  type: "FeatureCollection" as const,
  features: [box("A", -120, 30, -100, 45), box("B", -95, 30, -80, 45), box("C", 10, -20, 30, 0)],
};

const regions = (id: string, attrs = "") => `
  <div data-ok-map-regions id="${id}" data-ok-source="boxes" data-ok-layer="boxes" ${attrs}>
    <div data-ok-map-regions-list role="listbox" tabindex="0"></div>
    <table><caption>Values</caption>
      <thead><tr><th scope="col">Region</th><th scope="col">Value</th></tr></thead>
      <tbody>
        <tr data-ok-id="A"><th scope="row">A</th><td data-ok-value="1">1</td></tr>
        <tr data-ok-id="B"><th scope="row">B</th><td data-ok-value="5">5</td></tr>
        <tr data-ok-id="C"><th scope="row">C</th><td data-ok-value="9">9</td></tr>
      </tbody>
    </table>
  </div>`;

const create = (inner: string, options: MapControllerOptions = {}) => {
  const root = mount(`<div data-ok-map style="position: relative; width: 700px; height: 400px">
    <div data-ok-map-view style="position: absolute; inset: 0"></div>
    ${inner}
  </div>`).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
  const c = createMapController(root, {
    mapStyle: mapFixtureStyle(),
    initialViewState: { longitude: -40, latitude: 20, zoom: 1 },
    ...options,
  });
  controllers.push(c);
  const scale = mapScale([1, 9], { method: "threshold", thresholds: [3] });
  c.setSource("boxes", { type: "geojson", data: DATA, promoteId: "name" });
  for (const layer of mapRegionLayers({ id: "boxes", source: "boxes", scale }))
    c.setLayer(layer as never);
  return { root, c };
};
const ready = async (c: MapController) => {
  if (!c.loaded) await nextEvent(c, "load");
  const map = c.map as NonNullable<MapController["map"]>;
  while (map.queryRenderedFeatures({ layers: ["boxes"] }).length < 3) {
    const idle = new Promise<void>((resolve) => map.once("idle", () => resolve()));
    map.triggerRepaint();
    await idle;
  }
};
const state = (c: MapController, id: string) =>
  (c.map as NonNullable<MapController["map"]>).getFeatureState({ source: "boxes", id });
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const selectedOptions = (root: HTMLElement) =>
  [...root.querySelectorAll('[role="option"][aria-selected="true"]')].map((option) =>
    option.getAttribute("data-ok-id"),
  );

describe("map regions: multiple selection", () => {
  it("toggles regions from clicks and the keyboard, with a keyboard path for everything", async () => {
    const events: unknown[] = [];
    const { root, c } = create(regions("r", "data-ok-multiple"), {
      onRegionSelect: (_part, id, ids) => events.push([id, ids]),
    });
    await ready(c);
    const map = c.map as NonNullable<MapController["map"]>;
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    expect(list.getAttribute("aria-multiselectable")).toBe("true");
    map.fire("click", { point: map.project([-110, 38]) });
    map.fire("click", { point: map.project([-88, 38]) });
    expect(selectedOptions(root)).toEqual(["A", "B"]);
    expect(state(c, "A")).toMatchObject({ selected: true });
    map.fire("click", { point: map.project([-110, 38]) });
    expect(selectedOptions(root)).toEqual(["B"]);
    list.focus();
    await userEvent.keyboard("{Home}{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    expect(selectedOptions(root)).toEqual(["B", "C"]);
    await userEvent.keyboard("{Home}{Enter}");
    expect(selectedOptions(root)).toEqual(["A", "B", "C"]);
    await userEvent.keyboard("{Escape}");
    expect(selectedOptions(root)).toEqual([]);
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(selectedOptions(root)).toEqual(["A", "B", "C"]);
    expect(events).toEqual([
      ["A", ["A"]],
      ["B", ["A", "B"]],
      [null, ["B"]],
      ["C", ["B", "C"]],
      ["A", ["A", "B", "C"]],
      [null, []],
      ["C", ["A", "B", "C"]],
    ]);
    // Set from outside; unknown ids are ignored, equal selections report nothing.
    c.selectRegions(root.querySelector("#r") as HTMLElement, ["C", "Z"]);
    expect(selectedOptions(root)).toEqual(["C"]);
    c.selectRegions(root.querySelector("#r") as HTMLElement, ["C"]);
    expect(events).toHaveLength(8);
  });

  it("keeps one region in single groups, set before or after the scan", async () => {
    const { root, c } = create(regions("r"));
    const part = root.querySelector("#r") as HTMLElement;
    c.selectRegions(part, ["A", "B"]);
    await ready(c);
    await flush();
    expect(selectedOptions(root)).toEqual(["B"]);
    // Ctrl + A does nothing in a single group.
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    list.focus();
    await userEvent.keyboard("{Control>}a{/Control}{Shift>}{ArrowDown}{/Shift}");
    expect(selectedOptions(root)).toEqual(["B"]);
    // Turning multiple off drops the extra regions.
    part.setAttribute("data-ok-multiple", "");
    await flush();
    c.selectRegions(part, ["A", "C"]);
    expect(selectedOptions(root)).toEqual(["A", "C"]);
    part.removeAttribute("data-ok-multiple");
    await flush();
    expect(selectedOptions(root)).toEqual(["C"]);
  });
});

describe("map regions: box selection", () => {
  const press = (
    target: Element,
    type: string,
    x: number,
    y: number,
    init: PointerEventInit = {},
  ) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        button: 0,
        ...init,
      }),
    );

  it("selects the regions whose anchor is in a Shift + drag box; Alt adds; Escape cancels", async () => {
    const events: unknown[] = [];
    const { root, c } = create(regions("r", "data-ok-box-select"), {
      onRegionSelect: (_part, id, ids) => events.push([id, ids]),
    });
    await ready(c);
    const map = c.map as NonNullable<MapController["map"]>;
    expect(map.boxZoom.isEnabled()).toBe(false);
    const canvas = map.getCanvas();
    const rect = map.getCanvasContainer().getBoundingClientRect();
    const at = (lng: number, lat: number) => {
      const p = map.project([lng, lat]);
      return [rect.left + p.x, rect.top + p.y] as const;
    };
    // A box around A's center.
    const [ax0, ay0] = at(-118, 43);
    const [ax1, ay1] = at(-102, 32);
    press(canvas, "pointerdown", ax0, ay0, { shiftKey: true });
    expect(map.dragPan.isEnabled()).toBe(false);
    press(document.body, "pointermove", ax1, ay1);
    const frame = root.querySelector<HTMLElement>("[data-ok-map-selection-box]");
    expect(frame?.getAttribute("aria-hidden")).toBe("true");
    expect(frame?.style.getPropertyValue("--_ok-map-box-width")).not.toBe("0px");
    press(document.body, "pointerup", ax1, ay1);
    expect(root.querySelector("[data-ok-map-selection-box]")).toBeNull();
    expect(map.dragPan.isEnabled()).toBe(true);
    expect(selectedOptions(root)).toEqual(["A"]);
    // Alt adds B.
    const [bx0, by0] = at(-93, 43);
    const [bx1, by1] = at(-82, 32);
    press(canvas, "pointerdown", bx0, by0, { shiftKey: true, altKey: true });
    press(document.body, "pointerup", bx1, by1);
    expect(selectedOptions(root)).toEqual(["A", "B"]);
    // Without Alt the box replaces; Escape cancels a drag; a tiny drag is a click.
    press(canvas, "pointerdown", bx0, by0, { shiftKey: true });
    press(document.body, "pointermove", bx1, by1);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    press(document.body, "pointerup", bx1, by1);
    expect(selectedOptions(root)).toEqual(["A", "B"]);
    press(canvas, "pointerdown", bx0, by0, { shiftKey: true });
    press(document.body, "pointerup", bx0 + 1, by0 + 1);
    expect(selectedOptions(root)).toEqual(["A", "B"]);
    press(canvas, "pointerdown", bx0, by0, { shiftKey: true });
    press(document.body, "pointerup", bx1, by1);
    expect(selectedOptions(root)).toEqual(["B"]);
    // Without Shift the map pans as usual.
    press(canvas, "pointerdown", bx0, by0);
    expect(root.querySelector("[data-ok-map-selection-box]")).toBeNull();
    expect(events.at(-1)).toEqual(["B", ["B"]]);
    // Box selection off: Shift + drag zooms again.
    (root.querySelector("#r") as HTMLElement).removeAttribute("data-ok-box-select");
    await flush();
    expect(map.boxZoom.isEnabled()).toBe(true);
  });

  it("keeps the box zoom off when the map's setting is off", async () => {
    const { root, c } = create(regions("r", "data-ok-box-select"), { boxZoom: false });
    await ready(c);
    const map = c.map as NonNullable<MapController["map"]>;
    c.setSettings({ boxZoom: true });
    expect(map.boxZoom.isEnabled()).toBe(false);
    (root.querySelector("#r") as HTMLElement).setAttribute("data-ok-box-select", "false");
    await flush();
    expect(map.boxZoom.isEnabled()).toBe(true);
  });
});

describe("map regions: linked maps", () => {
  it("filters the other maps of a group, both ways, and clears with the source", async () => {
    const first = create(regions("one", 'data-ok-group="g" data-ok-multiple'));
    const second = create(regions("two", 'data-ok-group="g"'));
    const third = create(regions("three", 'data-ok-group="g" data-ok-link-filter="emit"'));
    await Promise.all([ready(first.c), ready(second.c), ready(third.c)]);
    const one = first.root.querySelector("#one") as HTMLElement;
    const two = second.root.querySelector("#two") as HTMLElement;
    first.c.selectRegions(one, ["A", "B"]);
    expect(state(second.c, "C")).toMatchObject({ muted: true });
    expect(state(second.c, "A")).toMatchObject({ muted: false });
    expect(
      second.root.querySelector('[data-ok-id="C"][role="option"]')?.hasAttribute("data-ok-muted"),
    ).toBe(true);
    // The source keeps its own regions; `emit` members never show filters.
    expect(state(first.c, "C")).toMatchObject({ muted: false });
    expect(state(third.c, "C")).toMatchObject({ muted: false });
    // A late member receives the current filter.
    const late = create(regions("late", 'data-ok-group="g" data-ok-link-filter="receive"'));
    await ready(late.c);
    await flush();
    expect(state(late.c, "C")).toMatchObject({ muted: true });
    // The other way: a selection in the second map replaces the filter.
    second.c.selectRegions(two, ["C"]);
    expect(state(first.c, "A")).toMatchObject({ muted: true });
    expect(state(second.c, "A")).toMatchObject({ muted: false });
    // `receive` members never filter the others.
    late.c.selectRegions(late.root.querySelector("#late") as HTMLElement, ["A"]);
    expect(state(first.c, "A")).toMatchObject({ muted: true });
    // Clearing the source's selection clears the filter; so does leaving.
    second.c.selectRegions(two, []);
    expect(state(first.c, "A")).toMatchObject({ muted: false });
    first.c.selectRegions(one, ["B"]);
    expect(state(second.c, "A")).toMatchObject({ muted: true });
    first.c.destroy();
    expect(state(second.c, "A")).toMatchObject({ muted: false });
    expect(second.root.querySelector("[data-ok-muted]")).toBeNull();
  });

  it("moves a part to another group when its attribute changes", async () => {
    const first = create(regions("one", 'data-ok-group="g"'));
    const second = create(regions("two", 'data-ok-group="g"'));
    await Promise.all([ready(first.c), ready(second.c)]);
    first.c.selectRegions(first.root.querySelector("#one") as HTMLElement, ["A"]);
    expect(state(second.c, "B")).toMatchObject({ muted: true });
    (first.root.querySelector("#one") as HTMLElement).setAttribute("data-ok-group", "other");
    await flush();
    expect(state(second.c, "B")).toMatchObject({ muted: false });
  });
});
