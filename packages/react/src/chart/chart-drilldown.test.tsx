import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";
import { ChartTrellis } from "./chart-trellis.js";

/* Drilldown levels and trellis small multiples (4.18.68, ADR-0060) in React. */

const levels = [
  { id: "q1", name: "Q1", categories: ["Jan", "Feb"], series: [{ name: "Sales", data: [3, 4] }] },
];

describe("Chart drilldown", () => {
  it("opens a level with Enter and goes back with Escape and Back", async () => {
    const onDrilldownChange = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        type="bar"
        categories={["Q1", "Q2"]}
        series={[{ name: "Sales", data: [{ y: 7, drilldown: "q1" }, 11] }]}
        drilldown={levels}
        onDrilldownChange={onDrilldownChange}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.querySelector('table[data-ok-chart-drilldown="q1"] caption')?.textContent).toBe(
      "Q1",
    );
    const back = root.querySelector("[data-ok-chart-drill-up]") as HTMLButtonElement;
    expect(back.hidden).toBe(true);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "Home" });
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(onDrilldownChange).toHaveBeenLastCalledWith(["q1"]);
    expect(root.getAttribute("data-ok-drilldown-path")).toBe("q1");
    expect(root.querySelector("[data-ok-chart-drill-path]")?.textContent).toBe("All › Q1");
    expect(root.querySelector('[data-ok-chart-axis="x"]')?.textContent).toContain("Jan");
    expect(back.hidden).toBe(false);
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(onDrilldownChange).toHaveBeenLastCalledWith([]);
    fireEvent.keyDown(plot, { key: "End" });
    fireEvent.keyDown(plot, { key: "Enter" });
    // Q2 opens nothing: Enter selects it.
    expect(onDrilldownChange).toHaveBeenCalledTimes(2);
    await expectNoAxeViolations(container);
  });

  it("follows a controlled path and the Back button", () => {
    const onDrilldownChange = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        type="bar"
        categories={["Q1"]}
        series={[{ name: "Sales", data: [{ y: 7, drilldown: "q1" }] }]}
        drilldown={levels}
        drilldownPath={["q1"]}
        onDrilldownChange={onDrilldownChange}
      />,
    );
    const back = container.querySelector("[data-ok-chart-drill-up]") as HTMLButtonElement;
    fireEvent.click(back);
    expect(onDrilldownChange).toHaveBeenCalledWith([]);
  });
});

describe("ChartTrellis", () => {
  it("renders one chart per series on a shared scale and promotes a panel", async () => {
    const onPromotedChange = vi.fn();
    const { container } = render(
      <ChartTrellis
        label="Visits"
        categories={["Jan", "Feb"]}
        columns={2}
        promote
        onPromotedChange={onPromotedChange}
        series={[
          { name: "North", data: [10, 40] },
          { name: "South", data: [5, 15] },
        ]}
      />,
    );
    const root = container.querySelector("[data-ok-chart-trellis]") as HTMLElement;
    expect(root.getAttribute("data-ok-columns")).toBe("2");
    const charts = [...root.querySelectorAll("[data-ok-chart]")];
    expect(charts).toHaveLength(2);
    expect(charts[0]?.getAttribute("data-ok-y-max")).toBe(charts[1]?.getAttribute("data-ok-y-max"));
    expect(charts[1]?.querySelector("caption")?.textContent).toBe("Visits: South");
    const headers = [
      ...root.querySelectorAll<HTMLButtonElement>("button[data-ok-chart-trellis-header]"),
    ];
    fireEvent.click(headers[1] as HTMLButtonElement);
    expect(onPromotedChange).toHaveBeenLastCalledWith(1);
    const panels = [...root.querySelectorAll<HTMLElement>("[data-ok-chart-trellis-panel]")];
    expect(panels[0]?.hidden).toBe(true);
    expect(panels[1]?.hasAttribute("data-ok-promoted")).toBe(true);
    expect(headers[1]?.getAttribute("aria-expanded")).toBe("true");
    const back = root.querySelector("[data-ok-chart-trellis-back]") as HTMLButtonElement;
    expect(back.hidden).toBe(false);
    fireEvent.click(back);
    expect(onPromotedChange).toHaveBeenLastCalledWith(null);
    await expectNoAxeViolations(container);
  });

  it("uses plain headers without promote", () => {
    const { container } = render(
      <ChartTrellis
        label="Visits"
        by="category"
        categories={["Jan"]}
        series={[{ name: "A", data: [1] }]}
      />,
    );
    expect(container.querySelector("div[data-ok-chart-trellis-header]")?.textContent).toBe("Jan");
    expect(container.querySelector("[data-ok-chart-trellis-back]")).toBeNull();
  });
});
