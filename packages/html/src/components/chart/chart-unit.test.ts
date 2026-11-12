import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import unit from "./examples/unit-group.html?raw";

/* Unit charts (4.18.21) in the HTML runtime. */

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

describe("unit", () => {
  it("draws every layout from the table", async () => {
    const host = mount(unit);
    start();
    const charts = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(charts).toHaveLength(4);
    expect((charts[0] as Element).querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(153);
    expect((charts[0] as Element).querySelectorAll("[data-ok-chart-unit-title]")).toHaveLength(4);
    expect((charts[1] as Element).querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(97);
    expect((charts[3] as Element).querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(60);
    await expectNoAxeViolations(host);
  });

  it("redraws on option changes and reads categories with the keyboard", async () => {
    const host = mount(unit);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-unit-layout", "packed");
    root.setAttribute("data-ok-disable-sort-by-group", "");
    root.setAttribute("data-ok-arc-rows", "3");
    root.removeAttribute("data-ok-cluster-labels");
    await settle();
    expect(root.querySelector("[data-ok-chart-unit-title]")).toBeNull();
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    expect(root.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Da Nang");
  });
});
