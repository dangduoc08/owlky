import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import brush from "./examples/brush-group.html?raw";
import single from "./examples/column-single-group.html?raw";
import crossfilter from "./examples/crossfilter-group.html?raw";

/* Crossfilter (4.18.19, ADR-0054) in the HTML runtime. */

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
function setup() {
  const host = mount(crossfilter);
  const rt = createRuntime()
    .register(...components)
    .start();
  runtime = rt;
  const roots = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
  const instance = (root: HTMLElement) => rt.get<ChartInstance>(root, "chart") as ChartInstance;
  const events: { categories: number[] | null; own: boolean }[] = [];
  roots[1]?.addEventListener("ok:chart:filter", (event) =>
    events.push((event as CustomEvent).detail),
  );
  const key = (root: HTMLElement, name: string) =>
    root
      .querySelector("[data-ok-chart-plot]")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  return { host, roots, instance, events, key };
}
const clearButtons = (roots: HTMLElement[]) =>
  roots.map(
    (root) => (root.querySelector("[data-ok-chart-filter-clear]") as HTMLButtonElement).hidden,
  );
const status = (root: HTMLElement) =>
  root.querySelector("[data-ok-chart-filter-status]")?.textContent;

describe("crossfilter", () => {
  it("renders hidden controls at rest; a selection filters the group", async () => {
    const { host, roots, instance, events, key } = setup();
    const [orders, revenue, returns] = roots as [HTMLElement, HTMLElement, HTMLElement];
    expect(clearButtons(roots)).toEqual([true, true, true]);
    expect(orders.querySelector(":scope > [data-ok-chart-plot] + [data-ok-chart-filter]")).not.toBe(
      null,
    );
    key(orders, "Home");
    key(orders, "Enter");
    key(orders, "End");
    key(orders, "Enter");
    expect(events.at(-1)).toEqual({ categories: [0, 4], own: false });
    expect(instance(revenue).filter).toEqual([0, 4]);
    expect(revenue.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(2);
    expect(returns.querySelectorAll("[data-ok-chart-slice]")).toHaveLength(2);
    expect(status(orders)).toBe("Filter: North, Central");
    expect(status(revenue)).toBe("");
    expect(clearButtons(roots)).toEqual([false, false, false]);
    await expectNoAxeViolations(host);
    // A slice of the donut replaces the filter (its keys skip the slices it hides: Central).
    key(returns, "Home");
    key(returns, "ArrowRight");
    key(returns, "Enter");
    expect(orders.querySelectorAll("[data-ok-chart-filter-band]")).toHaveLength(1);
    expect(revenue.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(1);
    expect(instance(returns).filter).toEqual([4]);
  });

  it("clears from any chart, through the instance, and when the option goes", async () => {
    const { roots, instance, events, key } = setup();
    const [orders, revenue] = roots as [HTMLElement, HTMLElement];
    const cleared: boolean[] = [];
    orders.addEventListener("ok:chart:select", (event) =>
      cleared.push((event as CustomEvent).detail.selected),
    );
    key(orders, "Home");
    key(orders, "Enter");
    (revenue.querySelector("[data-ok-chart-filter-clear]") as HTMLButtonElement).click();
    expect(events.at(-1)).toEqual({ categories: null, own: false });
    expect(instance(orders).selectedDataPoints).toEqual([]);
    expect(cleared).toEqual([true, false]);
    expect(status(revenue)).toBe("Filter cleared");
    key(orders, "Home");
    key(orders, "Enter");
    instance(orders).clearFilter();
    expect(instance(revenue).filter).toBeNull();
    // Localized texts.
    instance(revenue).setLocaleText({ clearFilter: "Effacer" });
    expect(revenue.querySelector("[data-ok-chart-filter-clear]")?.textContent).toBe("Effacer");
    // A chart that leaves the crossfilter loses its controls and its filter.
    key(orders, "Home");
    key(orders, "Enter");
    revenue.removeAttribute("data-ok-crossfilter");
    await settle();
    expect(revenue.querySelector("[data-ok-chart-filter]")).toBeNull();
    expect(revenue.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(5);
    expect(events.at(-1)).toEqual({ categories: null, own: false });
    // Joining again shows the group's filter.
    revenue.setAttribute("data-ok-crossfilter", "highlight");
    await settle();
    expect(revenue.querySelectorAll("[data-ok-chart-filter-band]")).toHaveLength(1);
  });

  it("keeps the latest source's filter; a source linking again republishes it", async () => {
    const { roots, instance, key } = setup();
    const [orders, revenue] = roots as [HTMLElement, HTMLElement];
    key(orders, "Home");
    key(orders, "Enter");
    // Revenue shows North only; its selection replaces the filter.
    key(revenue, "Home");
    key(revenue, "Enter");
    expect(instance(orders).filter).toEqual([0]);
    expect(orders.querySelectorAll("[data-ok-chart-filter-band]")).toHaveLength(1);
    // Orders clears its own selection: the group keeps revenue's filter, nothing is announced.
    key(orders, "Enter");
    expect(instance(orders).filter).toEqual([0]);
    expect(status(orders)).toBe("Filter: North");
    // Revenue changes its mode: it links again and still filters with its selection.
    revenue.setAttribute("data-ok-crossfilter", "highlight");
    await settle();
    expect(instance(orders).filter).toEqual([0]);
  });

  it("brush charts filter their group; charts without a group never do", async () => {
    const host = mount(`${brush}${brush}${single}`);
    const figures = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    const [, overview, copy, receiver, lonely] = figures as HTMLElement[];
    // One brush and its target; the second pair becomes a plain chart of the brush's group.
    (copy as HTMLElement).removeAttribute("id");
    (receiver as HTMLElement).removeAttribute("data-ok-brush-target");
    for (const chart of [overview, receiver] as HTMLElement[]) {
      chart.setAttribute("data-ok-group", "b");
      chart.setAttribute("data-ok-crossfilter", "highlight");
    }
    (lonely as HTMLElement).setAttribute("data-ok-crossfilter", "filter");
    const rt = createRuntime()
      .register(...components)
      .start();
    runtime = rt;
    const plot = (root: HTMLElement) => root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const press = (root: HTMLElement, name: string) =>
      plot(root).dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
    const get = (root: HTMLElement) => rt.get<ChartInstance>(root, "chart") as ChartInstance;
    press(overview as HTMLElement, "+");
    expect(get(receiver as HTMLElement).filter?.length).toBeGreaterThan(0);
    expect((receiver as HTMLElement).querySelector("[data-ok-chart-filter-band]")).not.toBeNull();
    press(overview as HTMLElement, "0");
    expect(get(receiver as HTMLElement).filter).toBeNull();
    // Clearing a brush's filter: the brush keeps its range (it has no selection to clear).
    press(overview as HTMLElement, "+");
    get(receiver as HTMLElement).clearFilter();
    expect(get(receiver as HTMLElement).filter).toBeNull();
    // Without a group, a selection filters nothing.
    press(lonely as HTMLElement, "Home");
    press(lonely as HTMLElement, "Enter");
    expect(status(lonely as HTMLElement)).toBe("");
    expect(get(lonely as HTMLElement).filter).toBeNull();
  });
});
