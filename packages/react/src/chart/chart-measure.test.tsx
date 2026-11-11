import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* Measure rulers and draggable annotations (4.18.20) in React. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SALES = [{ name: "Sales", data: [10, 20, 15, 30, 25, 40] }];

describe("Chart measure", () => {
  it("adds the measure tools and measures with the keyboard", async () => {
    const onMeasured = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        measure="span"
        categories={MONTHS}
        series={SALES}
        onMeasured={onMeasured}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-measure")).toBe("span");
    const tools = [...root.querySelectorAll("[data-ok-chart-tool]")];
    expect(tools.map((tool) => tool.getAttribute("data-ok-chart-tool"))).toEqual([
      "measure",
      "clearMeasures",
    ]);
    fireEvent.click(tools[0] as Element);
    expect(tools[0]?.getAttribute("aria-pressed")).toBe("true");
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "Home" });
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(root.querySelector("[data-ok-chart-status]")?.textContent).toBe("Measure from Jan");
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(onMeasured).toHaveBeenCalledWith(
      expect.objectContaining({
        measure: { x1: 0, y1: 10, x2: 2, y2: 15 },
        text: "Jan → Mar: +5 (+50%)",
      }),
    );
    expect(root.querySelector("[data-ok-chart-measure-label]")?.textContent).toBe(
      "Jan → Mar: +5 (+50%)",
    );
    expect(
      root.querySelector('[data-ok-chart-tool="clearMeasures"]')?.hasAttribute("disabled"),
    ).toBe(false);
    fireEvent.click(root.querySelector('[data-ok-chart-tool="clearMeasures"]') as Element);
    expect(root.querySelector("[data-ok-chart-measures]")).toBeNull();
    await expectNoAxeViolations(container);
  });

  it("draws controlled rulers and forgets a start with Escape", () => {
    const { container } = render(
      <Chart
        label="Sales"
        measure="free"
        toolbar
        measures={[{ x1: 0, y1: 10, x2: 3, y2: 30 }]}
        categories={MONTHS}
        series={SALES}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.querySelector("[data-ok-chart-measure-line]")).not.toBeNull();
    fireEvent.click(root.querySelector('[data-ok-chart-tool="measure"]') as Element);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "Home" });
    fireEvent.keyDown(plot, { key: "Enter" });
    fireEvent.keyDown(plot, { key: "Escape" });
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(root.querySelector("[data-ok-chart-status]")?.textContent).toBe("Measure from Jan");
  });
});

describe("Chart draggable annotations", () => {
  it("moves an annotation with the keyboard and reports it", async () => {
    const onAnnotationChange = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        categories={MONTHS}
        series={SALES}
        annotations={[
          { axis: "x", x: "Mar", label: "Launch", draggable: true },
          { axis: "y", y: 20, label: "Fixed" },
        ]}
        onAnnotationChange={onAnnotationChange}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    expect(root.querySelector(":scope > [data-ok-chart-status]")).not.toBeNull();
    act(() => {
      fireEvent.keyDown(plot, { key: "a" });
    });
    expect(root.querySelector("[data-ok-chart-annotation][data-ok-picked]")).not.toBeNull();
    expect(root.querySelector("[data-ok-chart-status]")?.textContent).toBe("Launch: Mar");
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(root.querySelector('li[data-ok-annotation="x"]')?.getAttribute("data-ok-x")).toBe("Apr");
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(onAnnotationChange).toHaveBeenLastCalledWith({
      index: 0,
      annotation: expect.objectContaining({ x: "Apr" }),
    });
    expect(root.querySelector("[data-ok-picked]")).toBeNull();
    expect(root.querySelector("[data-ok-chart-status]")?.textContent).toBe(
      "Annotation placed: Launch: Apr",
    );
    await expectNoAxeViolations(container);
  });
});
