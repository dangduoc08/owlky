import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import drag from "./examples/annotations-drag-group.html?raw";
import measure from "./examples/measure-group.html?raw";

/* Measure rulers and draggable annotations (4.18.20) in the HTML runtime. */

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
const key = (target: Element, name: string) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }),
  );

describe("chart measure", () => {
  it("builds the tools, measures with the keyboard and clears", async () => {
    const host = mount(measure);
    const run = start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    const tools = [...chart.querySelectorAll("[data-ok-chart-tool]")];
    expect(tools.map((tool) => tool.getAttribute("data-ok-chart-tool"))).toEqual([
      "measure",
      "clearMeasures",
    ]);
    (tools[0] as HTMLButtonElement).click();
    expect(tools[0]?.getAttribute("aria-pressed")).toBe("true");
    const details: unknown[] = [];
    chart.addEventListener("ok:chart:measure", (event) =>
      details.push((event as CustomEvent).detail),
    );
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "Home");
    key(plot, "Enter");
    expect(chart.querySelector("[data-ok-chart-status]")?.textContent).toBe("Measure from Jan");
    key(plot, "ArrowRight");
    key(plot, "Enter");
    expect(details).toHaveLength(1);
    expect(chart.querySelector("[data-ok-chart-measure-label]")?.textContent).toBe(
      "Jan → Feb: +7 (+58.3%)",
    );
    const instance = run.get(chart, "chart") as ChartInstance;
    expect(instance.measures).toEqual([{ x1: 0, y1: 12, x2: 1, y2: 19 }]);
    instance.clearMeasures();
    expect(chart.querySelector("[data-ok-chart-measures]")).toBeNull();
    instance.setMeasures([{ x1: 1, y1: 19, x2: 3, y2: 25 }]);
    expect(chart.querySelector("[data-ok-chart-measure-band]")).not.toBeNull();
    (chart.querySelector('[data-ok-chart-tool="clearMeasures"]') as HTMLButtonElement).click();
    expect(instance.measures).toEqual([]);
    await expectNoAxeViolations(host);
  });

  it("Escape forgets a start; Enter without an active point does nothing", () => {
    const host = mount(measure);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    (chart.querySelector('[data-ok-chart-tool="measure"]') as HTMLButtonElement).click();
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const status = chart.querySelector("[data-ok-chart-status]") as HTMLElement;
    key(plot, "Enter");
    expect(status.textContent).toBe("");
    key(plot, "Home");
    key(plot, "Enter");
    expect(status.textContent).toBe("Measure from Jan");
    key(plot, "Escape");
    key(plot, "ArrowRight");
    // The start was forgotten: Enter starts again at Feb instead of adding a ruler.
    key(plot, "Enter");
    expect(status.textContent).toBe("Measure from Feb");
    expect(chart.querySelector("[data-ok-chart-measures]")).toBeNull();
  });

  it("a drag previews the ruler, keeping earlier ones with pin on release", () => {
    const host = mount(measure);
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    chart.setAttribute("data-ok-measure-pin-on-release", "");
    const run = start();
    const instance = run.get(chart, "chart") as ChartInstance;
    instance.setMeasures([{ x1: 0, y1: 12, x2: 1, y2: 19 }]);
    (chart.querySelector('[data-ok-chart-tool="measure"]') as HTMLButtonElement).click();
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const box = plot.getBoundingClientRect();
    const fire = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + box.width * x,
          clientY: box.top + box.height * 0.5,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          bubbles: true,
        }),
      );
    fire("pointerdown", 0.3);
    fire("pointermove", 0.6);
    fire("pointermove", 0.8);
    expect(chart.querySelectorAll("[data-ok-chart-measure-band]")).toHaveLength(2);
    expect(instance.measures).toHaveLength(1);
    fire("pointerup", 0.8);
    expect(instance.measures).toHaveLength(2);
  });
});

describe("chart draggable annotations", () => {
  it("moves an annotation with the keyboard and rewrites its list item", async () => {
    const host = mount(drag);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(chart.querySelector(":scope > [data-ok-chart-status]")).not.toBeNull();
    const details: unknown[] = [];
    chart.addEventListener("ok:chart:annotation", (event) =>
      details.push((event as CustomEvent).detail),
    );
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "a");
    expect(chart.querySelector("[data-ok-picked]")).not.toBeNull();
    key(plot, "ArrowUp");
    key(plot, "Enter");
    const target = chart.querySelector('li[data-ok-annotation="y"]') as HTMLElement;
    expect(Number(target.getAttribute("data-ok-y"))).toBeGreaterThan(60);
    expect(details).toHaveLength(1);
    expect(chart.querySelector("[data-ok-picked]")).toBeNull();
    // A again picks the next draggable annotation (the x line).
    key(plot, "a");
    key(plot, "ArrowRight");
    key(plot, "Escape");
    expect(chart.querySelector('li[data-ok-annotation="x"]')?.getAttribute("data-ok-x")).toBe(
      "Jul",
    );
    await expectNoAxeViolations(host);
  });

  it("keys a picked annotation can't use pass through; one removed while picked drops quietly", async () => {
    const host = mount(drag);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    const details: unknown[] = [];
    chart.addEventListener("ok:chart:annotation", (event) =>
      details.push((event as CustomEvent).detail),
    );
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "a");
    // Home doesn't move an annotation: the key goes to the chart (the first category).
    key(plot, "Home");
    expect(chart.querySelector("[data-ok-picked]")).not.toBeNull();
    // The owner empties the list while it is picked.
    const list = chart.querySelector("[data-ok-chart-annotations]") as HTMLElement;
    const redrawn = new Promise<void>((resolve) =>
      new MutationObserver((_, observer) => {
        observer.disconnect();
        resolve();
      }).observe(chart.querySelector("[data-ok-chart-svg]") as Element, {
        childList: true,
        subtree: true,
        attributes: true,
      }),
    );
    list.replaceChildren();
    await redrawn;
    key(plot, "ArrowUp");
    key(plot, "Enter");
    expect(details).toEqual([]);
    expect(chart.querySelector("[data-ok-picked]")).toBeNull();
  });
});
