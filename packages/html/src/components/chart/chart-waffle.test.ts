import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import waffle from "./examples/waffle-group.html?raw";

/* Waffle charts (4.18.21) in the HTML runtime. */

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

describe("waffle", () => {
  it("reads categories and colors from the table", async () => {
    const host = mount(waffle);
    start();
    const [first, second] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect((first as Element).querySelectorAll("[data-ok-chart-unit-cell]")).toHaveLength(100);
    expect(
      (second as Element).querySelectorAll("[data-ok-chart-unit-track]").length,
    ).toBeGreaterThan(0);
    expect((second as Element).querySelectorAll("[data-ok-chart-unit-title]")).toHaveLength(3);
    await expectNoAxeViolations(host);
  });

  it("redraws on options, walks categories and hides one from the legend", async () => {
    const host = mount(waffle);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-columns", "5");
    root.setAttribute("data-ok-fill-from", "top");
    root.setAttribute("data-ok-cell-radius", "0");
    root.setAttribute("data-ok-unit-value", "2");
    root.setAttribute("data-ok-max-units", "60");
    root.setAttribute("data-ok-tile-columns", "1");
    root.setAttribute("data-ok-split-max", "50");
    root.setAttribute("data-ok-track-color", "info");
    root.removeAttribute("data-ok-total");
    await settle();
    expect(root.querySelectorAll("[data-ok-chart-unit-cell]").length).toBeLessThan(100);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await settle();
    expect(root.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Operations");
    (root.querySelector("[data-ok-chart-legend-item]") as HTMLElement).click();
    await settle();
    expect(root.querySelectorAll("[data-ok-chart-unit-group]")).toHaveLength(3);
  });
});
