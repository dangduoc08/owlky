import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Crossfilter (4.18.19, ADR-0054) in React. */

const REGIONS = ["North", "South", "East", "West"];
const ORDERS = [{ name: "Orders", data: [4, 3, 2, 5] }];
const REVENUE = [{ name: "Revenue", data: [9, 7, 6, 8] }];

const plots = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-ok-chart-plot]"),
];

describe("Chart crossfilter", () => {
  it("a selection filters and highlights the group; Clear filter clears it", async () => {
    const onFilter = vi.fn();
    const onSelection = vi.fn();
    const { container } = render(
      <>
        <Chart
          label="Orders"
          type="bar"
          group="regions"
          crossfilter="highlight"
          categories={REGIONS}
          series={ORDERS}
          onDataPointSelection={onSelection}
        />
        <Chart
          label="Revenue"
          type="bar"
          group="regions"
          crossfilter="filter"
          categories={REGIONS}
          series={REVENUE}
          onFilterChange={onFilter}
        />
        <Chart
          label="Returns"
          type="bar"
          group="regions"
          crossfilter="highlight"
          categories={REGIONS}
          series={REVENUE}
        />
      </>,
    );
    const [orders, revenue, returns] = [...container.querySelectorAll("[data-ok-chart]")];
    // At rest: hidden Clear buttons, empty statuses.
    expect(orders?.getAttribute("data-ok-crossfilter")).toBe("highlight");
    const clears = container.querySelectorAll<HTMLButtonElement>("[data-ok-chart-filter-clear]");
    expect([...clears].map((button) => button.hidden)).toEqual([true, true, true]);
    const [plot] = plots(container);
    fireEvent.keyDown(plot as HTMLElement, { key: "End" });
    fireEvent.keyDown(plot as HTMLElement, { key: "Enter" });
    expect(onFilter).toHaveBeenLastCalledWith([3], false);
    expect(revenue?.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(1);
    expect(returns?.querySelectorAll("[data-ok-chart-filter-band]")).toHaveLength(1);
    // The source draws its selection, not the filter.
    expect(orders?.querySelector("[data-ok-chart-filter-layer]")).toBeNull();
    expect(orders?.querySelector("[data-ok-chart-filter-status]")?.textContent).toBe(
      "Filter: West",
    );
    expect(revenue?.querySelector("[data-ok-chart-filter-status]")?.textContent).toBe("");
    expect([...clears].map((button) => button.hidden)).toEqual([false, false, false]);
    await expectNoAxeViolations(container);
    // Clearing from another chart clears the source's selection too.
    act(() => (clears[1] as HTMLButtonElement).click());
    expect(onFilter).toHaveBeenLastCalledWith(null, false);
    expect(revenue?.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(4);
    expect(orders?.querySelector("[data-ok-chart-selected-mark]")).toBeNull();
    expect(onSelection).toHaveBeenLastCalledWith({
      seriesIndex: 0,
      dataPointIndex: 3,
      selected: false,
      selectedDataPoints: [],
    });
    expect(revenue?.querySelector("[data-ok-chart-filter-status]")?.textContent).toBe(
      "Filter cleared",
    );
    expect([...clears].map((button) => button.hidden)).toEqual([true, true, true]);
  });

  it("clears with the selection, localizes texts and ignores charts without a group", () => {
    const { container } = render(
      <>
        <Chart
          label="Orders"
          type="bar"
          group="loc"
          crossfilter="filter"
          localeText={{ clearFilter: "Effacer", filter: "Filtre", filterCleared: "Sans filtre" }}
          categories={REGIONS}
          series={ORDERS}
        />
        <Chart
          label="Revenue"
          type="bar"
          group="loc"
          crossfilter="filter"
          categories={REGIONS}
          series={REVENUE}
        />
        <Chart label="Alone" type="bar" crossfilter="filter" categories={REGIONS} series={ORDERS} />
      </>,
    );
    const [first, second, alone] = [...container.querySelectorAll("[data-ok-chart]")];
    const [plot, , lonely] = plots(container);
    expect(first?.querySelector("[data-ok-chart-filter-clear]")?.textContent).toBe("Effacer");
    fireEvent.keyDown(plot as HTMLElement, { key: "Home" });
    fireEvent.keyDown(plot as HTMLElement, { key: " " });
    expect(first?.querySelector("[data-ok-chart-filter-status]")?.textContent).toBe(
      "Filtre: North",
    );
    expect(second?.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(1);
    fireEvent.keyDown(plot as HTMLElement, { key: " " });
    expect(first?.querySelector("[data-ok-chart-filter-status]")?.textContent).toBe("Sans filtre");
    expect(second?.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(4);
    // Without a group, a selection filters nothing and announces nothing.
    fireEvent.keyDown(lonely as HTMLElement, { key: "Home" });
    fireEvent.keyDown(lonely as HTMLElement, { key: "Enter" });
    expect(alone?.querySelector("[data-ok-chart-filter-status]")?.textContent).toBe("");
    expect(second?.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(4);
  });

  it("a brush chart filters its group by the categories it covers", () => {
    const onFilter = vi.fn();
    const { container } = render(
      <>
        <Chart id="cf-target" label="Orders" type="bar" categories={REGIONS} series={ORDERS} />
        <Chart
          label="Overview"
          type="bar"
          brushTarget="cf-target"
          group="brushed"
          crossfilter="highlight"
          height={120}
          categories={REGIONS}
          series={ORDERS}
        />
        <Chart
          label="Revenue"
          type="bar"
          group="brushed"
          crossfilter="filter"
          categories={REGIONS}
          series={REVENUE}
          onFilterChange={onFilter}
        />
      </>,
    );
    const [, overview] = plots(container);
    fireEvent.keyDown(overview as HTMLElement, { key: "+" });
    expect(onFilter).toHaveBeenLastCalledWith([1, 2], false);
    fireEvent.keyDown(overview as HTMLElement, { key: "0" });
    expect(onFilter).toHaveBeenLastCalledWith(null, false);
  });

  it("a chart whose filter was replaced by another's keeps the newer one when it deselects", () => {
    const onFilter = vi.fn();
    const { container } = render(
      <>
        <Chart
          label="A"
          type="bar"
          group="swap"
          crossfilter="highlight"
          categories={REGIONS}
          series={ORDERS}
        />
        <Chart
          label="B"
          type="bar"
          group="swap"
          crossfilter="highlight"
          categories={REGIONS}
          series={REVENUE}
        />
        <Chart
          label="C"
          type="bar"
          group="swap"
          crossfilter="filter"
          categories={REGIONS}
          series={REVENUE}
          onFilterChange={onFilter}
        />
      </>,
    );
    const [a, b] = plots(container);
    fireEvent.keyDown(a as HTMLElement, { key: "Home" });
    fireEvent.keyDown(a as HTMLElement, { key: "Enter" });
    expect(onFilter).toHaveBeenLastCalledWith([0], false);
    fireEvent.keyDown(b as HTMLElement, { key: "End" });
    fireEvent.keyDown(b as HTMLElement, { key: "Enter" });
    expect(onFilter).toHaveBeenLastCalledWith([3], false);
    // A deselects North: the group's filter is B's, so nothing changes.
    fireEvent.keyDown(a as HTMLElement, { key: "Enter" });
    expect(onFilter).toHaveBeenLastCalledWith([3], false);
    const third = container.querySelectorAll("[data-ok-chart]")[2] as HTMLElement;
    expect(third.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(1);
  });

  it("a chart linking again with a selection still filters its group", () => {
    const onFilter = vi.fn();
    const view = (mode: "filter" | "highlight") => (
      <>
        <Chart
          label="A"
          type="bar"
          group="relink"
          crossfilter={mode}
          categories={REGIONS}
          series={ORDERS}
        />
        <Chart
          label="B"
          type="bar"
          group="relink"
          crossfilter="filter"
          categories={REGIONS}
          series={REVENUE}
          onFilterChange={onFilter}
        />
      </>
    );
    const { container, rerender } = render(view("filter"));
    const [a] = plots(container);
    fireEvent.keyDown(a as HTMLElement, { key: "Home" });
    fireEvent.keyDown(a as HTMLElement, { key: "Enter" });
    expect(onFilter).toHaveBeenLastCalledWith([0], false);
    onFilter.mockClear();
    rerender(view("highlight"));
    expect(onFilter).toHaveBeenLastCalledWith([0], false);
    const second = container.querySelectorAll("[data-ok-chart]")[1] as HTMLElement;
    expect(second.querySelectorAll("[data-ok-chart-bar]")).toHaveLength(1);
  });
});
