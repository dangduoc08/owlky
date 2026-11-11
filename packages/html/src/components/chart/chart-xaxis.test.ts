import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import annotations from "./examples/annotations-text-group.html?raw";
import forecast from "./examples/forecast-group.html?raw";
import noData from "./examples/no-data-group.html?raw";
import groups from "./examples/x-axis-groups-group.html?raw";
import rotation from "./examples/x-axis-rotation-group.html?raw";
import fixedWindow from "./examples/x-axis-window-group.html?raw";

/* X axis options, forecasts, no-data messages and text annotations (4.18.65) in the HTML runtime. */

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

describe("chart x axis options", () => {
  it("draws the groups' row", async () => {
    const host = mount(groups);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(chart.getAttribute("data-ok-xaxis-groups")).toBe("4 2024; 4 2025");
    expect(chart.querySelectorAll("[data-ok-chart-axis-group]")).toHaveLength(2);
    await expectNoAxeViolations(host);
  });

  it("rotates long labels", () => {
    const host = mount(rotation);
    start();
    const tick = host.querySelector("[data-ok-chart-tick][transform]");
    expect(tick?.getAttribute("transform")).toMatch(/^rotate\(/);
  });

  it("shows a fixed window", () => {
    const host = mount(fixedWindow);
    start();
    const [chart] = host.querySelectorAll("[data-ok-chart]");
    expect(
      chart?.querySelectorAll('[data-ok-chart-axis="x"] [data-ok-chart-tick]').length,
    ).toBeLessThanOrEqual(5);
  });

  it("dashes the forecast", async () => {
    const host = mount(forecast);
    start();
    expect(host.querySelector("path[data-ok-chart-line][data-ok-chart-forecast]")).not.toBeNull();
    expect(host.querySelector("path[data-ok-chart-area][data-ok-chart-forecast]")).not.toBeNull();
    expect(host.querySelector("path[data-ok-chart-bar][data-ok-chart-forecast]")).not.toBeNull();
    await expectNoAxeViolations(host);
  });

  it("shows the no-data message", async () => {
    const host = mount(noData);
    start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(chart.querySelector("[data-ok-chart-no-data]")?.textContent).toBe("No orders yet");
    expect(chart.querySelector("[data-ok-chart-plot]")?.getAttribute("aria-label")).toBe(
      "Orders this week: No orders yet",
    );
    await expectNoAxeViolations(host);
  });

  it("draws text annotations", () => {
    const host = mount(annotations);
    start();
    const texts = [...host.querySelectorAll("[data-ok-chart-annotation-text]")].map(
      (node) => node.textContent,
    );
    expect(texts).toEqual(["Campaign paused", "New pricing"]);
  });
});
