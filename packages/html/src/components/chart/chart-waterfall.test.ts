import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import waterfall from "./examples/waterfall-group.html?raw";

/* Waterfall charts (4.18.21) in the HTML runtime. */

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
const steps = (root: Element) =>
  [...root.querySelectorAll("[data-ok-chart-bar]")].map((bar) =>
    bar.getAttribute("data-ok-chart-step"),
  );

describe("waterfall", () => {
  it("reads steps and sums from the table", async () => {
    const host = mount(waterfall);
    start();
    const [cash, people] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(steps(cash as Element)).toEqual([
      "up",
      "up",
      "up",
      "down",
      "down",
      "subtotal",
      "down",
      "total",
    ]);
    expect((cash as Element).querySelectorAll("[data-ok-chart-connector]")).toHaveLength(7);
    expect(
      [...(people as Element).querySelectorAll("[data-ok-chart-bar]")].map((bar) =>
        bar.getAttribute("data-ok-color"),
      ),
    ).toEqual(["info", "info", "info", "warning-dark", "warning-dark", "secondary"]);
    await expectNoAxeViolations(host);
  });

  it("redraws on option and table changes, and announces steps", async () => {
    const host = mount(waterfall);
    const rt = start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-hide-connectors", "");
    await settle();
    expect(root.querySelector("[data-ok-chart-connector]")).toBeNull();
    // A step becomes a total.
    const cell = root.querySelectorAll("tbody td")[2] as HTMLElement;
    cell.setAttribute("data-ok-sum", "total");
    await settle();
    expect(steps(root)[2]).toBe("total");
    const chart = rt.get<ChartInstance>(root, "chart") as ChartInstance;
    chart.setActive({ kind: "index", index: 1 });
    expect(
      [...root.querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent),
    ).toEqual(["Cash+260", "Total380"]);
    // updateSeries rewrites the table with the computed totals.
    chart.updateSeries([{ name: "Cash", data: [10, 5, { isTotal: true }] }], ["A", "B", "C"]);
    const cells = [...root.querySelectorAll("tbody td")];
    expect(cells.map((td) => td.textContent)).toEqual(["10", "5", "15"]);
    expect(cells[2]?.getAttribute("data-ok-sum")).toBe("total");
  });
});
