import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import { cleanupDom, mapFixtureStyle, mount, nextEvent } from "../test-utils.js";
import { mapRegionLayers, mapScale } from "./choropleth.js";
import { setMapWorkerUrl } from "./index.js";
import { createMapController, type MapController, type MapControllerOptions } from "./map.js";

beforeAll(() => {
  setMapWorkerUrl(workerUrl);
  // The layers' colors are tokens: the controller reads them from the page.
  const style = document.createElement("style");
  style.textContent = tokensCss;
  document.head.append(style);
});

let controller: MapController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  vi.restoreAllMocks();
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

const regions = (
  rows = [
    ["A", "1"],
    ["B", "5"],
    ["C", ""],
  ],
) => `
  <div data-ok-map-regions id="regions" data-ok-source="boxes" data-ok-layer="boxes">
    <div data-ok-map-regions-list role="listbox" tabindex="0"></div>
    <table>
      <caption>Values</caption>
      <thead><tr><th scope="col">Region</th><th scope="col">Value</th></tr></thead>
      <tbody>${rows
        .map(
          ([id, value]) =>
            `<tr data-ok-id="${id}"><th scope="row">${id}</th><td${value ? ` data-ok-value="${value}"` : ""}>${value ? `${value} units` : "—"}</td></tr>`,
        )
        .join("")}</tbody>
    </table>
  </div>`;

const legend = (interactive = true) => `
  <div data-ok-map-corner="bottom-left">
    <div data-ok-map-legend data-ok-variant="classes"${interactive ? "" : ' data-ok-interactive="false"'} role="group" aria-label="Legend">
      <ul data-ok-map-legend-classes>
        <li><button type="button" data-ok-map-legend-class data-ok-min="1" data-ok-max="3" aria-pressed="false"><span data-ok-map-legend-swatch data-ok-swatch="var(--ok-palette-primary-light)"></span>1 – 3</button></li>
        <li><button type="button" data-ok-map-legend-class data-ok-min="3" data-ok-max="5" aria-pressed="false"><span data-ok-map-legend-swatch data-ok-swatch="#ff0000"></span>3 – 5</button></li>
        <li><button type="button" data-ok-map-legend-class data-ok-null aria-pressed="false"><span data-ok-map-legend-swatch data-ok-swatch="url(x)"></span>No data</button></li>
      </ul>
      <div data-ok-map-legend-gradient>
        <span data-ok-map-legend-bar><span data-ok-map-legend-stop data-ok-swatch="#000"></span><span data-ok-map-legend-stop data-ok-swatch="#fff"></span></span>
      </div>
    </div>
  </div>`;

const create = (inner: string, options: MapControllerOptions = {}) => {
  const root = mount(`<div data-ok-map style="position: relative; width: 700px; height: 400px">
    <div data-ok-map-view style="position: absolute; inset: 0"></div>
    <div data-ok-map-fallback></div>
    ${inner}
  </div>`).querySelector<HTMLElement>("[data-ok-map]") as HTMLElement;
  controller = createMapController(root, {
    mapStyle: mapFixtureStyle(),
    initialViewState: { longitude: -40, latitude: 20, zoom: 1 },
    ...options,
  });
  const scale = mapScale([1, 5], { method: "threshold", thresholds: [3] });
  controller.setSource("boxes", { type: "geojson", data: DATA, promoteId: "name" });
  for (const layer of mapRegionLayers({ id: "boxes", source: "boxes", scale }))
    controller.setLayer(layer as never);
  return { root, c: controller };
};
const ready = async (c: MapController) => {
  if (!c.loaded) await nextEvent(c, "load");
  const map = c.map as NonNullable<MapController["map"]>;
  // Until the regions' source is drawn (queryRenderedFeatures finds it).
  while (map.queryRenderedFeatures({ layers: ["boxes"] }).length === 0) {
    const idle = new Promise<void>((resolve) => map.once("idle", () => resolve()));
    map.triggerRepaint();
    await idle;
  }
};
const state = (c: MapController, id: string) =>
  (c.map as NonNullable<MapController["map"]>).getFeatureState({ source: "boxes", id });
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("map regions", () => {
  it("joins the table to the source through feature state and builds the listbox", async () => {
    const { root, c } = create(regions());
    await ready(c);
    expect(state(c, "A")).toMatchObject({ value: 1, muted: false, selected: false });
    expect(state(c, "C")).toMatchObject({ value: null });
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    expect(list.id).toBe("regions-list");
    expect(list.getAttribute("aria-label")).toBe("Regions");
    const options = [...list.querySelectorAll('[role="option"]')];
    expect(options.map((o) => o.textContent)).toEqual(["A: 1 units", "B: 5 units", "C: No data"]);
    expect(options.map((o) => o.id)).toEqual([
      "regions-list-0",
      "regions-list-1",
      "regions-list-2",
    ]);
    // Rows that change are written again; rows that go away lose their state.
    const td = root.querySelector('tr[data-ok-id="B"] td') as HTMLElement;
    td.setAttribute("data-ok-value", "4");
    await flush();
    expect(state(c, "B")).toMatchObject({ value: 4 });
    root.querySelector('tr[data-ok-id="C"]')?.remove();
    await flush();
    expect(state(c, "C")).toEqual({});
    expect(list.querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it("moves through regions with the keyboard and selects one", async () => {
    const selections: unknown[] = [];
    const { root, c } = create(regions(), {
      onRegionSelect: (_part, id) => selections.push(id),
      labels: { noData: "n/a" },
    });
    await ready(c);
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    list.focus();
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-0");
    expect(state(c, "A")).toMatchObject({ focus: true });
    await userEvent.keyboard("{ArrowDown}");
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-1");
    expect(state(c, "A")).toMatchObject({ focus: false });
    expect(state(c, "B")).toMatchObject({ focus: true });
    await userEvent.keyboard("{End}{ArrowRight}");
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-2");
    expect(list.querySelector("[data-ok-active]")?.textContent).toBe("C: n/a");
    await userEvent.keyboard("{Home}{ArrowUp}{PageDown}");
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-2");
    await userEvent.keyboard("{PageUp}{ArrowLeft}b");
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-1");
    await userEvent.keyboard("{Enter}");
    expect(state(c, "B")).toMatchObject({ selected: true });
    expect(
      root.querySelector('[data-ok-id="B"][role="option"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    await userEvent.keyboard("{Home}{ }");
    expect(state(c, "A")).toMatchObject({ selected: true });
    expect(state(c, "B")).toMatchObject({ selected: false });
    await userEvent.keyboard("{Escape}{Escape}x{Control>}a{/Control}");
    expect(state(c, "A")).toMatchObject({ selected: false });
    expect(selections).toEqual(["B", "A", null]);
    list.blur();
    expect(state(c, "A")).toMatchObject({ focus: false });
    // Focus again: the active region is kept.
    list.focus();
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-0");
    // A press on an option selects it.
    (root.querySelector('[data-ok-id="C"][role="option"]') as HTMLElement).click();
    expect(selections.at(-1)).toBe("C");
  });

  it("hovers and selects regions with the pointer", async () => {
    const selections: unknown[] = [];
    const { root, c } = create(regions(), { onRegionSelect: (_part, id) => selections.push(id) });
    await ready(c);
    const map = c.map as NonNullable<MapController["map"]>;
    const a = map.project([-110, 38]);
    const water = map.project([-150, -40]);
    map.fire("mousemove", { point: a });
    expect(state(c, "A")).toMatchObject({ hover: true });
    expect(map.getCanvas().style.cursor).toBe("pointer");
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    expect(list.hasAttribute("data-ok-hovering")).toBe(true);
    expect(list.querySelector("[data-ok-hovered]")?.textContent).toBe("A: 1 units");
    map.fire("mousemove", { point: water });
    expect(state(c, "A")).toMatchObject({ hover: false });
    expect(list.hasAttribute("data-ok-hovering")).toBe(false);
    map.fire("mousemove", { point: a });
    map.fire("mouseout", {});
    expect(state(c, "A")).toMatchObject({ hover: false });
    map.fire("click", { point: a });
    map.fire("click", { point: water });
    expect(state(c, "A")).toMatchObject({ selected: true });
    map.fire("click", { point: a });
    expect(selections).toEqual(["A", null]);
  });

  it("mutes regions outside the pressed legend classes and paints swatches", async () => {
    const toggles: unknown[] = [];
    const { root, c } = create(`${regions()}${legend()}`, {
      onLegendToggle: (_legend, index, active) => toggles.push([index, [...active]]),
    });
    await ready(c);
    const [low, high, none] = root.querySelectorAll<HTMLButtonElement>("button");
    const swatches = root.querySelectorAll<HTMLElement>("[data-ok-swatch]");
    const prop = (node: HTMLElement, name: string) => node.style.getPropertyValue(name);
    expect(prop(swatches[0] as HTMLElement, "--_ok-map-swatch")).toBe(
      "var(--ok-palette-primary-light)",
    );
    expect(prop(swatches[1] as HTMLElement, "--_ok-map-swatch")).toBe("#ff0000");
    expect(prop(swatches[2] as HTMLElement, "--_ok-map-swatch")).toBe("");
    const bar = root.querySelector("[data-ok-map-legend-bar]") as HTMLElement;
    expect(prop(bar, "--_ok-map-gradient")).toBe("linear-gradient(to right, #000, #fff)");
    low?.click();
    expect(low?.getAttribute("aria-pressed")).toBe("true");
    expect(state(c, "A")).toMatchObject({ muted: false });
    expect(state(c, "B")).toMatchObject({ muted: true });
    expect(state(c, "C")).toMatchObject({ muted: true });
    // The last class includes its maximum (5).
    high?.click();
    expect(state(c, "B")).toMatchObject({ muted: false });
    none?.click();
    expect(state(c, "C")).toMatchObject({ muted: false });
    low?.click();
    high?.click();
    none?.click();
    expect(state(c, "A")).toMatchObject({ muted: false });
    expect(toggles).toEqual([
      [0, [0]],
      [1, [0, 1]],
      [2, [0, 1, 2]],
      [0, [1, 2]],
      [1, [2]],
      [2, []],
    ]);
  });

  it("ignores static legends, keeps states across style reloads and re-created sources", async () => {
    const { root, c } = create(`${regions()}${legend(false)}`);
    await ready(c);
    (root.querySelector("button") as HTMLButtonElement).click();
    expect(root.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
    c.setMapStyle(mapFixtureStyle("#00ff00"));
    await nextEvent(
      { addEventListener: (_t: string, h: () => void) => c.map?.once("style.load", h) },
      "style.load",
    );
    expect(state(c, "B")).toMatchObject({ value: 5 });
    // A changed source spec re-creates the source: its states come back.
    c.setSource("boxes", { type: "geojson", data: DATA, promoteId: "name", buffer: 64 });
    await nextEvent(c, "idle");
    expect(state(c, "B")).toMatchObject({ value: 5 });
  });

  it("works without a map (fallback) and with numeric ids", async () => {
    const { root } = create(
      `${regions([
        ["12", "3"],
        ["01", "4"],
      ])}`,
      { forceFallback: true },
    );
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    expect([...list.children].map((o) => o.textContent)).toEqual(["12: 3 units", "01: 4 units"]);
    list.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(list.querySelector('[aria-selected="true"]')?.textContent).toBe("01: 4 units");
    // An empty table: nothing to move through.
    root.querySelector("tbody")?.replaceChildren();
    await flush();
    list.blur();
    list.focus();
    expect(list.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("keeps the active, hovered and selected regions across row changes", async () => {
    const { root, c } = create(regions());
    await ready(c);
    const map = c.map as NonNullable<MapController["map"]>;
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    list.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    map.fire("mousemove", { point: map.project([-110, 38]) });
    // A value changes: the list is rebuilt, the states stay.
    root.querySelector('tr[data-ok-id="B"] td')?.setAttribute("data-ok-value", "6");
    await flush();
    expect(list.getAttribute("aria-activedescendant")).toBe("regions-list-1");
    expect(list.querySelector('[aria-selected="true"]')?.textContent).toBe("B: 5 units");
    expect(state(c, "B")).toMatchObject({ value: 6, focus: true, selected: true });
    expect(state(c, "A")).toMatchObject({ hover: true });
    // The selected row goes away: the selection with it.
    root.querySelector('tr[data-ok-id="B"]')?.remove();
    await flush();
    expect(list.querySelector('[aria-selected="true"]')).toBeNull();
    expect(list.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("reads loose markup: missing parts, cells and colors", async () => {
    const { root } = create(
      `<div data-ok-map-regions data-ok-source="boxes" data-ok-source-layer="none">
        <div data-ok-map-regions-list role="listbox" tabindex="0" aria-labelledby="x"></div>
        <table><tbody>
          <tr data-ok-id="A"><td data-ok-value="2"></td></tr>
          <tr data-ok-id="B"></tr>
          <tr data-ok-id="C"><th>C</th><td>7.5</td></tr>
        </tbody></table>
      </div>
      <div data-ok-map-regions data-ok-source="boxes"></div>
      <div data-ok-map-legend>
        <span data-ok-map-legend-swatch data-ok-swatch="rgb(1 2 3)"></span>
        <span data-ok-map-legend-swatch data-ok-swatch=""></span>
        <span data-ok-map-legend-swatch data-ok-swatch="not a color"></span>
        <span data-ok-map-legend-bar><span data-ok-map-legend-stop data-ok-swatch="#123"></span></span>
        <span data-ok-map-legend-bar></span>
      </div>`,
      { forceFallback: true },
    );
    const list = root.querySelector("[data-ok-map-regions-list]") as HTMLElement;
    expect(list.id).toMatch(/^ok-map-regions-\d+$/);
    expect(list.hasAttribute("aria-label")).toBe(false);
    expect([...list.children].map((o) => o.textContent)).toEqual(["A: 2", "B: No data", "C: 7.5"]);
    const [rgb, empty, bad] = root.querySelectorAll<HTMLElement>("[data-ok-map-legend-swatch]");
    expect(rgb?.style.getPropertyValue("--_ok-map-swatch")).toBe("rgb(1 2 3)");
    expect(empty?.style.getPropertyValue("--_ok-map-swatch")).toBe("");
    expect(bad?.style.getPropertyValue("--_ok-map-swatch")).toBe("");
    const [one, none] = root.querySelectorAll<HTMLElement>("[data-ok-map-legend-bar]");
    expect(one?.style.getPropertyValue("--_ok-map-gradient")).toBe("#123");
    expect(none?.style.getPropertyValue("--_ok-map-gradient")).toBe("");
    // Clicks and keys outside a regions list are not its business.
    (root.querySelector("[data-ok-map-legend]") as HTMLElement).click();
    list.click();
  });

  it("writes vector source layers and skips layers it can't hit", async () => {
    const { root, c } = create(
      `<div data-ok-map-regions data-ok-source="boxes" data-ok-source-layer="regions" data-ok-layer="missing">
        <div data-ok-map-regions-list role="listbox" tabindex="0"></div>
        <table><tbody><tr data-ok-id="A"><th>A</th><td data-ok-value="1">1</td></tr></tbody></table>
      </div>`,
    );
    await ready(c);
    const map = c.map as NonNullable<MapController["map"]>;
    const set = vi.spyOn(map, "setFeatureState");
    root.querySelector("td")?.setAttribute("data-ok-value", "2");
    await flush();
    expect(set).toHaveBeenCalledWith(
      { source: "boxes", id: "A", sourceLayer: "regions" },
      expect.anything(),
    );
    const remove = vi.spyOn(map, "removeFeatureState");
    root.querySelector("tr")?.remove();
    await flush();
    expect(remove).toHaveBeenCalledWith({ source: "boxes", id: "A", sourceLayer: "regions" });
    expect(c.map?.getCanvas().style.cursor).toBe("");
    map.fire("mousemove", { point: map.project([-110, 38]) });
    expect(map.getCanvas().style.cursor).toBe("");
  });
});
