import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import axisScales from "./examples/axis-scales-group.html?raw";
import multipleYAxes from "./examples/multiple-y-axes-group.html?raw";

/* Value axes (4.18.59) in the HTML runtime: `data-ok-yaxis`, `th[data-ok-y-axis]`, x titles. */

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
const axes = (root: Element) => [...root.querySelectorAll('[data-ok-chart-axis="y"]')];

describe("value axes", () => {
  it("reads the axes and each series' axis from the markup", async () => {
    const host = mount(multipleYAxes);
    host.style.width = "600px";
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(axes(root).map((axis) => axis.getAttribute("data-ok-index"))).toEqual(["0", "1"]);
    expect(axes(root)[1]?.hasAttribute("data-ok-opposite")).toBe(true);
    expect(
      [...root.querySelectorAll("[data-ok-chart-axis-title]")].map((title) => title.textContent),
    ).toEqual(["Blog visits", "Social mentions", "Month"]);
    await expectNoAxeViolations(host);
  });

  it("redraws when the axes or a column's axis change", async () => {
    const host = mount(multipleYAxes);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-yaxis", "title Blog visits; hidden");
    await settle();
    expect(axes(root)).toHaveLength(1);
    expect(root.querySelectorAll("[data-ok-chart-axis-title]")).toHaveLength(2);
    // Both series on the first axis: one axis left, drawn.
    root.setAttribute("data-ok-yaxis", "; opposite");
    root.querySelector('th[data-ok-y-axis="1"]')?.setAttribute("data-ok-y-axis", "0");
    await settle();
    expect(axes(root).map((axis) => axis.getAttribute("data-ok-index"))).toEqual(["0"]);
    root.removeAttribute("data-ok-x-title");
    await settle();
    expect(root.querySelector('[data-ok-chart-axis-title="x"]')).toBeNull();
  });

  it("logarithmic and reversed scales", () => {
    const host = mount(axisScales);
    start();
    const [log, reversed] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    const ticks = (root: Element | undefined) =>
      [...(root?.querySelectorAll('[data-ok-chart-axis="y"] text') ?? [])].map(
        (t) => t.textContent,
      );
    expect(ticks(log)).toEqual(["10", "100", "1000", "10000", "100000", "1000000"]);
    expect(ticks(reversed)).toEqual(["1", "2", "3", "4", "5"]);
    const ys = [...(reversed?.querySelectorAll('[data-ok-chart-axis="y"] text') ?? [])].map((t) =>
      Number(t.getAttribute("y")),
    );
    expect(ys[0]).toBeLessThan(ys[4] as number);
  });
});
