import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import type { ChartTrellisInstance } from "../chart-trellis/chart-trellis.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import drilldown from "./examples/drilldown-group.html?raw";
import trellis from "./examples/trellis-group.html?raw";

/* Drilldown levels and trellis small multiples (4.18.68, ADR-0060) in the HTML runtime. */

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
const key = (target: Element, name: string) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }),
  );

describe("chart drilldown", () => {
  it("opens levels from the keyboard, goes back and drives the methods", async () => {
    const host = mount(drilldown);
    const run = start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    const events: unknown[] = [];
    chart.addEventListener("ok:chart:drilldown", (event) =>
      events.push((event as CustomEvent).detail),
    );
    const back = chart.querySelector("[data-ok-chart-drill-up]") as HTMLButtonElement;
    expect(back.hidden).toBe(true);
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "Home");
    key(plot, "Enter");
    expect(events).toEqual([{ id: "q1", path: ["q1"] }]);
    expect(chart.getAttribute("data-ok-drilldown-path")).toBe("q1");
    expect(chart.querySelector("[data-ok-chart-drill-path]")?.textContent).toBe("All › Q1");
    expect(back.hidden).toBe(false);
    key(plot, "Home");
    key(plot, "Enter");
    expect(chart.querySelector("[data-ok-chart-drill-path]")?.textContent).toBe(
      "All › Q1 › January",
    );
    back.click();
    expect(chart.getAttribute("data-ok-drilldown-path")).toBe("q1");
    const instance = run.get(chart, "chart") as ChartInstance;
    instance.drillToRoot();
    expect(instance.drilldownPath).toEqual([]);
    instance.drillDown("q3");
    expect(chart.querySelector('[data-ok-chart-series][data-ok-type="line"]')).not.toBeNull();
    instance.drillUp();
    expect(chart.hasAttribute("data-ok-drilldown-path")).toBe(false);
    // A refused drill keeps the level.
    chart.addEventListener("ok:chart:drilldown", (event) => event.preventDefault());
    key(plot, "Home");
    key(plot, "Enter");
    expect(instance.drilldownPath).toEqual([]);
    await expectNoAxeViolations(host);
  });

  it("Escape goes up one level; a chart without levels has an empty path", () => {
    const plain = `<figure data-ok-chart data-ok-type="bar" id="plain"><table data-ok-chart-data><caption>Plain</caption><thead><tr><th scope="col">x</th><th scope="col">S</th></tr></thead><tbody><tr><th scope="row">A</th><td>1</td></tr></tbody></table></figure>`;
    const host = mount(drilldown + plain);
    const run = start();
    const chart = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = chart.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "Home");
    key(plot, "Enter");
    key(plot, "Home");
    key(plot, "Enter");
    expect(chart.getAttribute("data-ok-drilldown-path")).toBe("q1; jan");
    key(plot, "Escape");
    expect(chart.getAttribute("data-ok-drilldown-path")).toBe("q1");
    key(plot, "Escape");
    expect(chart.hasAttribute("data-ok-drilldown-path")).toBe(false);
    // At the top, Escape is the chart's own (it hides the active point).
    key(plot, "Escape");
    expect(chart.hasAttribute("data-ok-drilldown-path")).toBe(false);
    const other = host.querySelector("#plain") as HTMLElement;
    expect((run.get(other, "chart") as ChartInstance).drilldownPath).toEqual([]);
  });
});

describe("chart trellis", () => {
  it("promotes a panel and shows every panel again", async () => {
    const host = mount(trellis);
    const run = start();
    const root = host.querySelector("[data-ok-chart-trellis]") as HTMLElement;
    expect(root.querySelectorAll("[data-ok-chart-plot]")).toHaveLength(3);
    const headers = [...root.querySelectorAll<HTMLButtonElement>("[data-ok-chart-trellis-header]")];
    const details: unknown[] = [];
    root.addEventListener("ok:chart-trellis:promote", (event) =>
      details.push((event as CustomEvent).detail),
    );
    headers[2]?.click();
    const panels = [...root.querySelectorAll<HTMLElement>("[data-ok-chart-trellis-panel]")];
    expect(panels.map((panel) => panel.hidden)).toEqual([true, true, false]);
    expect(headers[2]?.getAttribute("aria-expanded")).toBe("true");
    const back = root.querySelector("[data-ok-chart-trellis-back]") as HTMLButtonElement;
    expect(back.hidden).toBe(false);
    back.click();
    expect(panels.map((panel) => panel.hidden)).toEqual([false, false, false]);
    expect(details).toEqual([{ index: 2 }, { index: null }]);
    const instance = run.get(root, "chart-trellis") as ChartTrellisInstance;
    instance.promotePanel(0);
    expect(instance.promoted).toBe(0);
    instance.restorePanels();
    expect(instance.promoted).toBeNull();
    headers[1]?.click();
    headers[1]?.click();
    expect(instance.promoted).toBeNull();
    await expectNoAxeViolations(host);
  });

  it("starts with a promoted panel from the markup; refused or turned off, a header does nothing", () => {
    const host = mount(trellis);
    const root = host.querySelector("[data-ok-chart-trellis]") as HTMLElement;
    const panels = [...root.querySelectorAll<HTMLElement>("[data-ok-chart-trellis-panel]")];
    panels[1]?.setAttribute("data-ok-promoted", "");
    const run = start();
    const instance = run.get(root, "chart-trellis") as ChartTrellisInstance;
    expect(instance.promoted).toBe(1);
    expect(panels.map((panel) => panel.hidden)).toEqual([true, false, true]);
    const headers = [...root.querySelectorAll<HTMLButtonElement>("[data-ok-chart-trellis-header]")];
    // A refused promote keeps the layout.
    const refuse = (event: Event) => event.preventDefault();
    root.addEventListener("ok:chart-trellis:promote", refuse);
    headers[1]?.click();
    expect(instance.promoted).toBe(1);
    root.removeEventListener("ok:chart-trellis:promote", refuse);
    // Without `data-ok-promote`, headers and All panels do nothing.
    root.removeAttribute("data-ok-promote");
    headers[0]?.click();
    (root.querySelector("[data-ok-chart-trellis-back]") as HTMLButtonElement).click();
    expect(instance.promoted).toBe(1);
  });
});
