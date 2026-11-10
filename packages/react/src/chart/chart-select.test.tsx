import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Data point selection (4.18.60) in React: click, Enter / Space, outlines, the callback. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr"];
const SERIES = [{ name: "Visits", data: [10, 20, 30, 40] }];

const renderChart = (props: Partial<ChartProps> = {}) =>
  render(
    <div style={{ width: 600 }}>
      <Chart label="Visits" type="bar" categories={MONTHS} series={SERIES} {...props} />
    </div>,
  );
const plot = () => document.querySelector("[data-ok-chart-plot]") as HTMLElement;
const outlines = () => [...document.querySelectorAll("[data-ok-chart-selected-mark]")];
/** Clicks the middle of the `index`-th bar. */
const clickBar = (index: number) => {
  const bar = document.querySelectorAll("[data-ok-chart-bar]")[index] as SVGGraphicsElement;
  const box = bar.getBoundingClientRect();
  fireEvent.click(plot(), {
    clientX: box.left + box.width / 2,
    clientY: box.top + box.height / 2,
  });
};

/** A controlled chart: the selection lives in the parent's state. */
function Controlled() {
  const [selected, setSelected] = useState([{ seriesIndex: 0, dataPointIndex: 0 }]);
  return (
    <div style={{ width: 600 }}>
      <Chart
        label="Visits"
        type="bar"
        categories={MONTHS}
        series={SERIES}
        selectedDataPoints={selected}
        onDataPointSelection={(detail) => setSelected(detail.selectedDataPoints)}
      />
    </div>
  );
}

describe("Chart selection", () => {
  it("a click selects a bar and reports it; a second click clears it", async () => {
    const onSelect = vi.fn();
    const { container } = renderChart({ onDataPointSelection: onSelect });
    clickBar(2);
    expect(onSelect).toHaveBeenLastCalledWith({
      seriesIndex: 0,
      dataPointIndex: 2,
      selected: true,
      selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 2 }],
    });
    expect(outlines()).toHaveLength(1);
    // One at a time without `allowMultipleDataPointsSelection`.
    clickBar(1);
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dataPointIndex: 1,
        selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 1 }],
      }),
    );
    clickBar(1);
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ selected: false, selectedDataPoints: [] }),
    );
    expect(outlines()).toHaveLength(0);
    // Empty space selects nothing.
    const box = plot().getBoundingClientRect();
    fireEvent.click(plot(), { clientX: box.left + 2, clientY: box.top + 2 });
    expect(onSelect).toHaveBeenCalledTimes(3);
    await expectNoAxeViolations(container);
  });

  it("Enter and Space select the active category; the tooltip says it is selected", async () => {
    renderChart({ allowMultipleDataPointsSelection: true, localeText: { selected: "Chosen" } });
    await userEvent.tab();
    expect(document.activeElement).toBe(plot());
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard(" ");
    expect(outlines()).toHaveLength(2);
    expect(document.querySelector("[data-ok-chart-tooltip-state]")?.textContent).toBe("Chosen");
    expect(screen.getByRole("status", { name: "" }).textContent).toContain("Chosen");
    await userEvent.keyboard(" ");
    expect(outlines()).toHaveLength(1);
    expect(document.querySelector("[data-ok-chart-tooltip-state]")).toBeNull();
  });

  it("controlled: follows selectedDataPoints", () => {
    render(<Controlled />);
    expect(outlines()).toHaveLength(1);
    const before = Number(outlines()[0]?.getAttribute("x"));
    act(() => clickBar(3));
    expect(outlines()).toHaveLength(1);
    expect(Number(outlines()[0]?.getAttribute("x"))).toBeGreaterThan(before);
  });

  it("brush charts and keys outside a value don't select", () => {
    const onSelect = vi.fn();
    renderChart({ brushTarget: "nowhere", onDataPointSelection: onSelect });
    clickBar(0);
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    const second = render(
      <Chart
        label="Flows"
        type="sankey"
        edges={[{ source: "a", target: "b", value: 1 }]}
        onDataPointSelection={onSelect}
      />,
    );
    const flow = second.container.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(flow, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
