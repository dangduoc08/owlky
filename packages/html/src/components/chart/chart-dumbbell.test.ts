import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import dumbbell from "./examples/dumbbell-group.html?raw";

/* Dumbbell charts (4.18.21) in the HTML runtime. */

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
const colors = (root: Element) =>
  [...root.querySelectorAll("[data-ok-chart-dumbbell]")].map((end) =>
    end.getAttribute("data-ok-color"),
  );

describe("dumbbell", () => {
  it("reads the ends from the table and the colors from the root", async () => {
    const host = mount(dumbbell);
    start();
    const [loads, pay] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect((loads as Element).querySelectorAll("[data-ok-chart-dumbbell-line]")).toHaveLength(5);
    expect(colors(loads as Element).every((color) => color === null)).toBe(true);
    expect(colors(pay as Element).slice(0, 2)).toEqual(["warning-dark", "info-dark"]);
    await expectNoAxeViolations(host);
  });

  it("redraws when the colors change and names the parts from the table", async () => {
    const host = mount(dumbbell);
    const rt = start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-dumbbell-colors", "error success");
    await settle();
    expect(colors(root).slice(0, 2)).toEqual(["error", "success"]);
    const chart = rt.get<ChartInstance>(root, "chart") as ChartInstance;
    chart.setActive({ kind: "index", index: 0 });
    expect(
      [...root.querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent),
    ).toEqual(["Before3.2", "After1.8"]);
  });
});
