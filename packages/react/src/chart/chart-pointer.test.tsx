import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Chart } from "./chart.js";
import { ChartTrellis } from "./chart-trellis.js";

/* Pointer paths of the 4.18.20 and 4.18.68 features in React: rulers, annotation drags, drill clicks. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SALES = [{ name: "Sales", data: [10, 20, 15, 30, 25, 40] }];

/** Client coordinates of an SVG position (the SVG may be scaled to the plot). */
const at = (root: Element, x: number, y: number) => {
  const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
  const svg = root.querySelector("[data-ok-chart-svg]") as SVGSVGElement;
  const box = plot.getBoundingClientRect();
  const scale = box.width / Number(svg.getAttribute("width"));
  return { plot, clientX: box.left + x * scale, clientY: box.top + y * scale };
};
const drag = (root: Element, from: [number, number], to: [number, number]) => {
  const start = at(root, ...from);
  const end = at(root, ...to);
  const pointer = { pointerId: 1, pointerType: "mouse", button: 0, bubbles: true };
  act(() => {
    start.plot.dispatchEvent(new PointerEvent("pointerdown", { ...pointer, ...start }));
    start.plot.dispatchEvent(
      new PointerEvent("pointermove", {
        ...pointer,
        clientX: (start.clientX + end.clientX) / 2,
        clientY: (start.clientY + end.clientY) / 2,
      }),
    );
    start.plot.dispatchEvent(new PointerEvent("pointermove", { ...pointer, ...end }));
    start.plot.dispatchEvent(new PointerEvent("pointerup", { ...pointer, ...end }));
  });
};

describe("Chart pointer features", () => {
  it("draws a ruler with a drag in measure mode, pinning when asked", () => {
    const onMeasuresChange = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        measure="free"
        measurePinOnRelease
        categories={MONTHS}
        series={SALES}
        onMeasuresChange={onMeasuresChange}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    fireEvent.click(root.querySelector('[data-ok-chart-tool="measure"]') as Element);
    drag(root, [120, 120], [400, 60]);
    expect(onMeasuresChange).toHaveBeenCalledTimes(1);
    drag(root, [200, 120], [300, 60]);
    expect(onMeasuresChange.mock.lastCall?.[0]).toHaveLength(2);
    expect(root.querySelectorAll("[data-ok-chart-measure]")).toHaveLength(2);
    // The pan tool turns measure mode off.
    expect(root.querySelector('[data-ok-chart-tool="measure"]')?.getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("moves a draggable annotation with a drag", () => {
    const onAnnotationChange = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        categories={MONTHS}
        series={SALES}
        annotations={[{ axis: "y", y: 20, label: "Target", draggable: true }]}
        onAnnotationChange={onAnnotationChange}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    const line = root.querySelector("[data-ok-chart-annotation-line]") as SVGLineElement;
    const x = Number(line.getAttribute("x1")) + 40;
    const y = Number(line.getAttribute("y1"));
    drag(root, [x, y], [x, y - 60]);
    expect(onAnnotationChange).toHaveBeenCalledTimes(1);
    expect(onAnnotationChange.mock.lastCall?.[0].annotation.y).toBeGreaterThan(20);
    expect(root.querySelector(":scope > [data-ok-chart-status]")?.textContent).toMatch(/^Target: /);
  });

  it("opens a level with a click and goes back to the root with Back", () => {
    const { container } = render(
      <Chart
        label="Sales"
        type="bar"
        categories={["Q1", "Q2"]}
        series={[{ name: "Sales", data: [{ y: 7, drilldown: "q1" }, 11] }]}
        drilldown={[{ id: "q1", categories: ["Jan"], series: [{ name: "Sales", data: [3] }] }]}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    const bar = root.querySelector("path[data-ok-chart-bar]") as SVGPathElement;
    const box = bar.getBoundingClientRect();
    fireEvent.click(root.querySelector("[data-ok-chart-plot]") as Element, {
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    });
    expect(root.getAttribute("data-ok-drilldown-path")).toBe("q1");
    fireEvent.click(root.querySelector("[data-ok-chart-drill-up]") as Element);
    expect(root.hasAttribute("data-ok-drilldown-path")).toBe(false);
    expect(document.activeElement).toBe(root.querySelector("[data-ok-chart-plot]"));
  });

  it("restores a trellis from a promoted header", () => {
    const { container } = render(
      <ChartTrellis
        label="Visits"
        promote
        defaultPromoted={0}
        categories={["Jan"]}
        series={[
          { name: "A", data: [1] },
          { name: "B", data: [2] },
        ]}
      />,
    );
    const header = container.querySelector("button[data-ok-chart-trellis-header]") as Element;
    expect(header.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(header);
    expect(header.getAttribute("aria-expanded")).toBe("false");
  });
});
