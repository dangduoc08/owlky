import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import { gridChartKit, loadGridChartKit } from "./chart-kit.js";
import donut from "./examples/charts-donut.html?raw";

// This file never preloads: the grid's first draw finds the chart helpers missing.
let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

describe("data grid chart helpers (ADR-0068 S5)", () => {
  it("load with the first chart, then the grid draws it", async () => {
    expect(gridChartKit()).toBeUndefined();
    const host = mount(donut);
    const root = host.querySelector("[data-ok-data-grid]") as HTMLElement;
    root.setAttribute("data-ok-disable-virtualization", "");
    // Without the chart runtime the grid writes the table itself, through the engine.
    runtime = createRuntime()
      .register(...components.filter((c) => c.name !== "chart"))
      .start();
    const figure = host.querySelector("[data-ok-data-grid-chart] [data-ok-chart]") as HTMLElement;
    figure.removeAttribute("data-ok-type");
    expect(figure.hasAttribute("data-ok-type")).toBe(false);
    await loadGridChartKit();
    await settle();
    expect(gridChartKit()).toBeDefined();
    expect(figure.getAttribute("data-ok-type")).toBe("donut");
    expect([...figure.querySelectorAll("tbody th")].map((th) => th.textContent)).toEqual([
      "Tea",
      "Juice",
      "Coffee",
    ]);
  });
});
