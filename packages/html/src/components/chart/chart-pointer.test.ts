import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import drag from "./examples/annotations-drag-group.html?raw";
import drilldown from "./examples/drilldown-group.html?raw";
import measure from "./examples/measure-group.html?raw";

/* Pointer paths of the 4.18.20 and 4.18.68 features in the HTML runtime. */

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
  return runtime;
};
const at = (root: Element, x: number, y: number) => {
  const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
  const svg = root.querySelector("[data-ok-chart-svg]") as SVGSVGElement;
  const box = plot.getBoundingClientRect();
  const scale = box.width / Number(svg.getAttribute("width"));
  return { plot, clientX: box.left + x * scale, clientY: box.top + y * scale };
};
const pointer = { pointerId: 1, pointerType: "mouse", button: 0, bubbles: true };
const dragFrom = (root: Element, from: [number, number], to: [number, number]) => {
  const start = at(root, ...from);
  const end = at(root, ...to);
  start.plot.dispatchEvent(new PointerEvent("pointerdown", { ...pointer, ...start }));
  start.plot.dispatchEvent(new PointerEvent("pointermove", { ...pointer, ...end }));
  start.plot.dispatchEvent(new PointerEvent("pointerup", { ...pointer, ...end }));
};

describe("chart pointer features", () => {
  it("draws pinned rulers with drags and reports them", () => {
    const host = mount(measure);
    const run = start();
    const chart = host.querySelectorAll<HTMLElement>("[data-ok-chart]")[1] as HTMLElement;
    const events: unknown[] = [];
    chart.addEventListener("ok:chart:measure", (event) =>
      events.push((event as CustomEvent).detail),
    );
    (chart.querySelector('[data-ok-chart-tool="measure"]') as HTMLButtonElement).click();
    dragFrom(chart, [120, 200], [420, 80]);
    dragFrom(chart, [150, 200], [300, 100]);
    expect(events).toHaveLength(2);
    expect((run.get(chart, "chart") as ChartInstance).measures).toHaveLength(2);
    // The pan tool turns measure mode off.
    (chart.querySelector('[data-ok-chart-tool="pan"]') as HTMLButtonElement | null)?.click();
  });

  it("moves an annotation with a drag and rewrites its list item", () => {
    const host = mount(drag);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    const line = chart.querySelector(
      '[data-ok-chart-annotation="y"] [data-ok-chart-annotation-line]',
    ) as SVGLineElement;
    const x = Number(line.getAttribute("x1")) + 40;
    const y = Number(line.getAttribute("y1"));
    dragFrom(chart, [x, y], [x, y - 50]);
    const item = chart.querySelector('li[data-ok-annotation="y"]') as HTMLElement;
    expect(Number(item.getAttribute("data-ok-y"))).toBeGreaterThan(60);
    expect(chart.querySelector(":scope > [data-ok-chart-status]")?.textContent).toMatch(
      /^Target: /,
    );
  });

  it("opens a level with a click and goes back to the root with Back", () => {
    const host = mount(drilldown);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    const bar = chart.querySelector("path[data-ok-chart-bar]") as SVGPathElement;
    const box = bar.getBoundingClientRect();
    chart.querySelector("[data-ok-chart-plot]")?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
      }),
    );
    expect(chart.getAttribute("data-ok-drilldown-path")).toBe("q1");
    (chart.querySelector("[data-ok-chart-drill-up]") as HTMLButtonElement).click();
    expect(chart.hasAttribute("data-ok-drilldown-path")).toBe(false);
    expect(document.activeElement).toBe(chart.querySelector("[data-ok-chart-plot]"));
  });

  it("starts a trellis with a promoted panel from its markup", () => {
    const host = mount(
      `<div data-ok-chart-trellis role="group" aria-label="T"><div data-ok-chart-trellis-panel data-ok-promoted><div data-ok-chart-trellis-header>A</div></div><div data-ok-chart-trellis-panel><div data-ok-chart-trellis-header>B</div></div></div>`,
    );
    start();
    const panels = [...host.querySelectorAll<HTMLElement>("[data-ok-chart-trellis-panel]")];
    expect(panels.map((panel) => panel.hidden)).toEqual([false, true]);
    // Without `data-ok-promote`, headers do nothing.
    (panels[0] as HTMLElement)
      .querySelector<HTMLElement>("[data-ok-chart-trellis-header]")
      ?.click();
    expect(panels[1]?.hidden).toBe(true);
  });
});
