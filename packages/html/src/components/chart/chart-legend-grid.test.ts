import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import grid from "./examples/grid-group.html?raw";
import legend from "./examples/legend-group.html?raw";

/* Legend and grid options (4.18.64) in the HTML runtime. */

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

describe("legend and grid", () => {
  it("single-series legends, labels without toggling and custom names", async () => {
    const host = mount(legend);
    start();
    const [single, fixed] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(single?.querySelectorAll("button[data-ok-chart-legend-item]")).toHaveLength(1);
    const items = [...(fixed as HTMLElement).querySelectorAll("[data-ok-chart-legend-item]")];
    expect(items.map((item) => item.localName)).toEqual(["span", "span"]);
    expect(items.map((item) => item.textContent)).toEqual([
      "Income (after tax)",
      "Spending (all accounts)",
    ]);
    (items[0] as HTMLElement).click();
    await settle();
    expect(fixed?.querySelectorAll("[data-ok-chart-series]")).toHaveLength(2);
    await expectNoAxeViolations(host);
    // Toggling turned back on: buttons again.
    fixed?.removeAttribute("data-ok-disable-legend-toggle");
    await settle();
    const button = fixed?.querySelector("button[data-ok-chart-legend-item]") as HTMLElement;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    button.click();
    await settle();
    expect(fixed?.querySelectorAll("[data-ok-chart-series]")).toHaveLength(1);
  });

  it("grid lines and stripes from the attributes", async () => {
    const host = mount(grid);
    start();
    const [lines, bars] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(lines?.querySelectorAll('[data-ok-chart-stripe="row"]').length).toBeGreaterThan(0);
    expect(bars?.querySelectorAll("[data-ok-chart-grid-line]")).toHaveLength(0);
    expect(bars?.querySelectorAll('[data-ok-chart-stripe="column"]')).toHaveLength(3);
    (bars as HTMLElement).setAttribute("data-ok-grid", "y");
    (bars as HTMLElement).removeAttribute("data-ok-grid-column-colors");
    await settle();
    expect(bars?.querySelectorAll("[data-ok-chart-grid-line]").length).toBeGreaterThan(0);
    expect(bars?.querySelectorAll("[data-ok-chart-stripe]")).toHaveLength(0);
  });
});
