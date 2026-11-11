import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";

/* Geo charts in the HTML runtime (ADR-0059, roadmap 4.18.17). */

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
};

const square = (name: string, x: number) => ({
  type: "Feature",
  properties: { name },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, 0],
        [x + 20, 0],
        [x + 20, 20],
        [x, 20],
        [x, 0],
      ],
    ],
  },
});
const GEOMETRY = { type: "FeatureCollection", features: [square("West", -60), square("East", 20)] };

const TABLE = `<table data-ok-chart-data><caption>Sales</caption>
  <thead><tr><th data-ok-part="name">Name</th><th data-ok-part="y">Value</th></tr></thead>
  <tbody>
    <tr><th>West</th><td data-ok-value="2">2</td></tr>
    <tr><th>East</th><td data-ok-value="8">8</td></tr>
  </tbody></table>`;
const figure = (attrs = "") =>
  `<figure data-ok-chart data-ok-type="geo" data-ok-join-by="name" ${attrs}>${TABLE}</figure>`;
const json = (id: string, value: unknown) =>
  `<script type="application/json" id="${id}">${JSON.stringify(value)}</script>`;

const regions = (host: Element) => host.querySelectorAll("path[data-ok-chart-region]");
const root = (host: Element) => host.querySelector("[data-ok-chart]") as HTMLElement;
const plot = (host: Element) => host.querySelector("[data-ok-chart-plot]") as HTMLElement;
const title = (host: Element) =>
  host.querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const instance = (host: Element) =>
  runtime?.get<ChartInstance>(root(host), "chart") as ChartInstance;
const key = (target: HTMLElement, value: string) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: value }),
  );

describe("chart runtime (geo)", () => {
  it("draws the geometry of a JSON element and the regions from the table", async () => {
    const host = mount(`${json("shapes", GEOMETRY)}${figure('data-ok-geometry="shapes"')}`);
    start();
    expect(regions(host)).toHaveLength(2);
    expect(host.querySelectorAll("[data-ok-chart-legend-item]").length).toBeGreaterThan(0);
    await expectNoAxeViolations(host);
  });

  it("takes the geometry from a script and keeps the table as the data", () => {
    const host = mount(figure());
    start();
    expect(regions(host)).toHaveLength(0);
    instance(host).setGeometry(GEOMETRY as Parameters<ChartInstance["setGeometry"]>[0]);
    expect(regions(host)).toHaveLength(2);
    instance(host).setGeometry(null);
    expect(regions(host)).toHaveLength(0);
  });

  it("ignores a broken JSON element", () => {
    const host = mount(
      `<script type="application/json" id="bad">{not json</script>${figure('data-ok-geometry="bad"')}`,
    );
    start();
    expect(regions(host)).toHaveLength(0);
    expect(root(host).hasAttribute("data-ok-ready")).toBe(true);
  });

  it("reads projection, scale and globe options and redraws when they change", async () => {
    const host = mount(`${json("shapes", GEOMETRY)}${figure('data-ok-geometry="shapes"')}`);
    start();
    const before = regions(host)[0]?.getAttribute("d");
    root(host).setAttribute("data-ok-projection", "mercator");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(regions(host)[0]?.getAttribute("d")).not.toBe(before);
    root(host).setAttribute("data-ok-sphere", "");
    root(host).setAttribute("data-ok-graticule", "");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(host.querySelector("path[data-ok-chart-sphere]")).not.toBeNull();
    expect(host.querySelector("path[data-ok-chart-graticule]")).not.toBeNull();
  });

  it("moves the tooltip with the keyboard", () => {
    const host = mount(`${json("shapes", GEOMETRY)}${figure('data-ok-geometry="shapes"')}`);
    start();
    plot(host).focus();
    key(plot(host), "Home");
    expect(title(host)).toBe("West");
    key(plot(host), "ArrowRight");
    expect(title(host)).toBe("East");
  });

  it("draws pixel maps, patterns and pictures from attributes (4.18.96, 4.18.97)", async () => {
    const PIXEL =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
    const host = mount(
      `${json("shapes", GEOMETRY)}${figure(
        'data-ok-geometry="shapes" data-ok-geo-layout="pixel" data-ok-pixel-shape="hexagon" data-ok-fill="pattern"',
      ).replace("<th>West</th>", `<th data-ok-image="${PIXEL}">West</th>`)}`,
    );
    start();
    expect(host.querySelector('[data-ok-chart-series][data-ok-layout="pixel"]')).not.toBeNull();
    const [west, east] = regions(host);
    expect(west?.getAttribute("fill")).toMatch(/-image-0\)$/);
    expect(east?.getAttribute("data-ok-pattern")).toBe("verticalLines");
    expect(host.querySelector("image")?.getAttribute("href")).toBe(PIXEL);
    expect(host.querySelector("pattern[data-ok-chart-pattern]")).not.toBeNull();
    root(host).setAttribute("data-ok-image-fit", "fill");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(host.querySelector("image")?.getAttribute("preserveAspectRatio")).toBe("none");
    await expectNoAxeViolations(host);
  });

  it("draws hex tiles from the table's cells, no geometry needed", () => {
    const host =
      mount(`<figure data-ok-chart data-ok-type="geo" data-ok-geo-layout="hex"><table data-ok-chart-data>
      <thead><tr><th data-ok-part="name">Name</th><th data-ok-part="y">Value</th></tr></thead>
      <tbody>
        <tr><th data-ok-cell="0,0" data-ok-label="WE">West</th><td data-ok-value="2">2</td></tr>
        <tr><th data-ok-cell="1,0">East</th><td data-ok-value="8">8</td></tr>
      </tbody></table></figure>`);
    start();
    expect(regions(host)).toHaveLength(2);
  });
});
