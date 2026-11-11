import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import zero from "./examples/column-zero-bars-group.html?raw";
import rows from "./examples/timeline-rows-group.html?raw";

/* Timeline rows and zero bars (4.18.67) in the HTML runtime. */

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

describe("chart rows", () => {
  it("draws bars sharing rows from repeated row headers", async () => {
    const host = mount(rows);
    start();
    const [grouped, lanes] = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    const barsOf = (chart: HTMLElement | undefined) => [
      ...(chart as HTMLElement).querySelectorAll("rect[data-ok-chart-bar]"),
    ];
    const heights = (chart: HTMLElement | undefined) =>
      barsOf(chart).map((bar) => Number(bar.getAttribute("height")));
    expect(barsOf(grouped)).toHaveLength(4);
    expect(new Set(heights(lanes)).size).toBeGreaterThan(1);
    await expectNoAxeViolations(host);
  });

  it("closes up zero bars", () => {
    const host = mount(zero);
    start();
    expect(host.querySelector("[data-ok-hide-zero-bars-when-grouped]")).not.toBeNull();
    expect(host.querySelectorAll("path[data-ok-chart-bar]").length).toBeGreaterThan(0);
  });
});
