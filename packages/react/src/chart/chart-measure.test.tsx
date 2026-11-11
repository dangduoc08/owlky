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

  it("A cycles through draggable annotations; keys it can't use pass through", () => {
    const onAnnotationChange = vi.fn();
    const { container } = render(
      <Chart
        label="Sales"
        categories={MONTHS}
        series={SALES}
        annotations={[
          { axis: "x", x: "Feb", label: "One", draggable: true },
          { axis: "x", x: "Apr", label: "Two", draggable: true },
        ]}
        onAnnotationChange={onAnnotationChange}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const status = () => root.querySelector("[data-ok-chart-status]")?.textContent;
    act(() => {
      fireEvent.keyDown(plot, { key: "a" });
    });
    expect(status()).toBe("One: Feb");
    // Home moves nothing: the annotation stays picked.
    fireEvent.keyDown(plot, { key: "Home" });
    expect(root.querySelector("[data-ok-picked]")).not.toBeNull();
    fireEvent.keyDown(plot, { key: "Escape" });
    act(() => {
      fireEvent.keyDown(plot, { key: "A" });
    });
    expect(status()).toBe("Two: Apr");
    fireEvent.keyDown(plot, { key: " " });
    // After the last one, A starts over at the first.
    act(() => {
      fireEvent.keyDown(plot, { key: "a" });
    });
    expect(status()).toBe("One: Feb");
    // With a modifier, A is left to the page.
    fireEvent.keyDown(plot, { key: "Enter" });
    fireEvent.keyDown(plot, { key: "a", ctrlKey: true });
    expect(root.querySelector("[data-ok-picked]")).toBeNull();
    expect(onAnnotationChange).toHaveBeenCalledTimes(3);
  });

  it("new annotations from the owner replace local moves; a picked one that went away drops quietly", () => {
    const onAnnotationChange = vi.fn();
    const first = [{ axis: "x" as const, x: "Mar", label: "Launch", draggable: true }];
    const view = (annotations: typeof first | undefined) => (
      <Chart
        label="Sales"
        categories={MONTHS}
        series={SALES}
        annotations={annotations}
        onAnnotationChange={onAnnotationChange}
      />
    );
    const { container, rerender } = render(view(first));
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const x = () => root.querySelector('li[data-ok-annotation="x"]')?.getAttribute("data-ok-x");
    act(() => {
      fireEvent.keyDown(plot, { key: "a" });
    });
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(x()).toBe("Apr");
    // The owner sends a new list: the local move is dropped.
    rerender(view([{ axis: "x", x: "Jan", label: "Launch", draggable: true }]));
    expect(x()).toBe("Jan");
    // The owner removes every annotation while one is picked: keys do nothing, Enter drops it.
    rerender(view(undefined));
    fireEvent.keyDown(plot, { key: "ArrowRight" });
    expect(root.querySelector("[data-ok-picked]")).toBeNull();
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(onAnnotationChange).not.toHaveBeenCalled();
    expect(root.querySelector("[data-ok-picked]")).toBeNull();
  });
});

describe("Chart measure edge cases", () => {
  const drag = (plot: HTMLElement, from: number, to: number, end = true) => {
    const box = plot.getBoundingClientRect();
    const at = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + box.width * x,
          clientY: box.top + box.height * 0.5,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          buttons: 1,
          bubbles: true,
        }),
      );
    act(() => at("pointerdown", from));
    act(() => at("pointermove", (from + to) / 2));
    act(() => at("pointermove", to));
    if (end) act(() => at("pointerup", to));
  };

  it("previews a dragged ruler, keeps earlier ones with pin on release, and adds it on release", () => {
    const onMeasured = vi.fn();
    const { container } = render(
      <div style={{ width: 640 }}>
        <Chart
          label="Sales"
          measure="span"
          measurePinOnRelease
          measures={[{ x1: 0, y1: 10, x2: 1, y2: 20 }]}
          categories={MONTHS}
          series={SALES}
          onMeasured={onMeasured}
        />
      </div>,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    fireEvent.click(root.querySelector('[data-ok-chart-tool="measure"]') as Element);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const bands = () => root.querySelectorAll("[data-ok-chart-measure-band]").length;
    expect(bands()).toBe(1);
    drag(plot, 0.3, 0.8, false);
    // The earlier ruler stays while the new one is drawn.
    expect(bands()).toBe(2);
    expect(onMeasured).not.toHaveBeenCalled();
    act(() =>
      plot.dispatchEvent(
        new PointerEvent("pointerup", {
          clientX: plot.getBoundingClientRect().left + plot.getBoundingClientRect().width * 0.8,
          clientY: plot.getBoundingClientRect().top + 10,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      ),
    );
    expect(onMeasured).toHaveBeenCalledTimes(1);
    expect(onMeasured.mock.calls[0]?.[0].measures).toHaveLength(2);
  });

  it("without pin on release, the preview replaces the drawn rulers", () => {
    const { container } = render(
      <div style={{ width: 640 }}>
        <Chart
          label="Sales"
          measure="free"
          measures={[{ x1: 0, y1: 10, x2: 1, y2: 20 }]}
          categories={MONTHS}
          series={SALES}
        />
      </div>,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    fireEvent.click(root.querySelector('[data-ok-chart-tool="measure"]') as Element);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    drag(plot, 0.2, 0.6, false);
    expect(root.querySelectorAll("[data-ok-chart-measure-line]")).toHaveLength(1);
  });

  it("Enter in measure mode without an active point does nothing", () => {
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
    fireEvent.click(root.querySelector('[data-ok-chart-tool="measure"]') as Element);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.keyDown(plot, { key: "Enter" });
    expect(root.querySelector("[data-ok-chart-status]")?.textContent).toBe("");
    expect(onMeasured).not.toHaveBeenCalled();
  });
});
