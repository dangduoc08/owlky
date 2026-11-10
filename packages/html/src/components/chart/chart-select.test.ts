import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";

/* Data point selection (4.18.60) in the HTML runtime: click, keys, outlines, events, methods. */

const chart = (attrs = "", type = "bar") =>
  `<figure data-ok-chart data-ok-type="${type}" ${attrs}>
  <table data-ok-chart-data><caption>Visits</caption>
    <thead><tr><th scope="col">Month</th><th scope="col">Visits</th></tr></thead>
    <tbody><tr><th scope="row">Jan</th><td>10</td></tr><tr><th scope="row">Feb</th><td>20</td></tr><tr><th scope="row">Mar</th><td>30</td></tr><tr><th scope="row">Apr</th><td>40</td></tr></tbody>
  </table>
</figure>`;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const setup = (html: string) => {
  const host = mount(html);
  host.style.width = "600px";
  runtime = createRuntime()
    .register(...components)
    .start();
  const root = host.querySelector("[data-ok-chart]") as HTMLElement;
  const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
  const instance = runtime.get<ChartInstance>(root, "chart") as ChartInstance;
  const events: unknown[] = [];
  root.addEventListener("ok:chart:select", (event) => events.push((event as CustomEvent).detail));
  return { host, root, plot, instance, events };
};
const outlines = (root: Element) => [...root.querySelectorAll("[data-ok-chart-selected-mark]")];
const clickShape = (plot: HTMLElement, shape: Element) => {
  const box = shape.getBoundingClientRect();
  plot.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    }),
  );
};

describe("chart selection", () => {
  it("a click selects a bar, reports it and draws an outline", async () => {
    const { host, root, plot, instance, events } = setup(chart());
    const bars = () => [...root.querySelectorAll("[data-ok-chart-bar]")];
    clickShape(plot, bars()[2] as Element);
    expect(events).toEqual([
      {
        seriesIndex: 0,
        dataPointIndex: 2,
        selected: true,
        selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 2 }],
      },
    ]);
    expect(instance.selectedDataPoints).toEqual([{ seriesIndex: 0, dataPointIndex: 2 }]);
    expect(outlines(root)).toHaveLength(1);
    clickShape(plot, bars()[1] as Element);
    expect(instance.selectedDataPoints).toEqual([{ seriesIndex: 0, dataPointIndex: 1 }]);
    clickShape(plot, bars()[1] as Element);
    expect(instance.selectedDataPoints).toEqual([]);
    expect(outlines(root)).toHaveLength(0);
    await expectNoAxeViolations(host);
  });

  it("Enter and Space select the active item; the tooltip says so", async () => {
    const { root, plot, events, instance } = setup(
      chart("data-ok-allow-multiple-data-points-selection", "pie"),
    );
    plot.focus();
    instance.setActive({ kind: "index", index: 0 });
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");
    expect(events).toHaveLength(2);
    expect(outlines(root).map((outline) => outline.localName)).toEqual(["path", "path"]);
    expect(root.querySelector("[data-ok-chart-tooltip-state]")?.textContent).toBe("Selected");
    // The legend is unaffected: it still hides slices.
    expect(root.querySelectorAll("[data-ok-chart-legend-item][aria-pressed='true']")).toHaveLength(
      4,
    );
  });

  it("methods set and toggle the selection without events; localized state", () => {
    const { root, plot, instance, events } = setup(chart());
    instance.setSelectedDataPoints([
      { seriesIndex: 0, dataPointIndex: 3 },
      { seriesIndex: -1, dataPointIndex: 0 },
    ]);
    expect(instance.selectedDataPoints).toEqual([{ seriesIndex: 0, dataPointIndex: 3 }]);
    instance.toggleDataPointSelection(0, 0);
    expect(instance.selectedDataPoints).toEqual([{ seriesIndex: 0, dataPointIndex: 0 }]);
    instance.toggleDataPointSelection(0, 0);
    expect(instance.selectedDataPoints).toEqual([]);
    root.setAttribute("data-ok-allow-multiple-data-points-selection", "");
    instance.toggleDataPointSelection(0, 0);
    instance.toggleDataPointSelection(0, 1);
    expect(instance.selectedDataPoints).toHaveLength(2);
    expect(events).toEqual([]);
    instance.setLocaleText({ selected: "Ausgewählt" });
    instance.setActive({ kind: "index", index: 1 });
    expect(root.querySelector("[data-ok-chart-tooltip-state]")?.textContent).toBe("Ausgewählt");
    // Keys elsewhere and a click on empty space change nothing.
    const box = plot.getBoundingClientRect();
    plot.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: box.left + 2, clientY: box.top + 2 }),
    );
    expect(events).toEqual([]);
  });

  it("brush charts and drags don't select", () => {
    const { root, plot, events } = setup(chart('data-ok-brush-target="nowhere"'));
    clickShape(plot, root.querySelector("[data-ok-chart-bar]") as Element);
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(events).toEqual([]);
    runtime?.stop();
    resetPage();
    const zoom = setup(chart("data-ok-zoom", "bar"));
    const box = zoom.plot.getBoundingClientRect();
    const fire = (type: string, x: number) =>
      zoom.plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + x,
          clientY: box.top + 150,
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
        }),
      );
    vi.spyOn(zoom.plot, "setPointerCapture").mockImplementation(() => {});
    fire("pointerdown", 100);
    fire("pointermove", 300);
    fire("pointerup", 300);
    zoom.plot.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: box.left + 300, clientY: box.top + 150 }),
    );
    expect(zoom.events).toEqual([]);
  });
});
