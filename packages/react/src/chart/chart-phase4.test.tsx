import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Phase 4 (ADR-0027, ADR-0031) in React: toolbar, zoom, links, annotations, texts. */

const DAYS = Array.from({ length: 10 }, (_, i) => `D${i}`);
const SERIES = [{ name: "Visits", data: DAYS.map((_, i) => (i * 7) % 11) }];

afterEach(() => vi.restoreAllMocks());

function renderChart(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 600 }}>
      <Chart label="Visits" categories={DAYS} series={SERIES} {...props} />
    </div>,
  );
}
const figures = () => [...document.querySelectorAll<HTMLElement>("[data-ok-chart]")];
const plotOf = (root: Element) => root.querySelector("[data-ok-chart-plot]") as HTMLElement;
const titleOf = (root: Element) =>
  root.querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const tool = (name: string, root: Element = document.body) =>
  root.querySelector(`[data-ok-chart-tool="${name}"]`) as HTMLButtonElement;
const textChanged = (target: Node) =>
  new Promise<void>((resolve) =>
    new MutationObserver((_, observer) => {
      observer.disconnect();
      resolve();
    }).observe(target, { childList: true, characterData: true, subtree: true }),
  );

/** Live data with an uncontrolled zoom (the zoom follows the end). */
function Live() {
  const [data, setData] = useState(SERIES[0]?.data ?? []);
  return (
    <div style={{ width: 600 }}>
      <Chart
        label="Live"
        zoom
        defaultZoomRange={{ min: 6, max: 9 }}
        categories={data.map((_, i) => `D${i}`)}
        series={[{ name: "V", data }]}
      />
      <button type="button" onClick={() => setData((d) => [...d, 1, 2])}>
        Add
      </button>
    </div>
  );
}

describe("Chart phase 4", () => {
  it("toolbar: zoom in and out, reset, pan; reports zoom changes", async () => {
    const onZoom = vi.fn();
    renderChart({ zoom: true, toolbar: true, onZoomRangeChange: onZoom });
    const toolbar = screen.getByRole("group", { name: "Chart tools" });
    expect(toolbar.parentElement?.firstElementChild).toBe(toolbar);
    expect(tool("reset").disabled).toBe(true);
    await userEvent.click(tool("zoomIn"));
    expect(onZoom).toHaveBeenLastCalledWith({ min: 2, max: 7 }, "user");
    expect(tool("reset").disabled).toBe(false);
    await userEvent.click(tool("zoomOut"));
    expect(onZoom).toHaveBeenLastCalledWith(null, "user");
    await userEvent.click(tool("pan"));
    expect(tool("pan").getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(tool("zoomIn"));
    await userEvent.click(tool("reset"));
    expect(onZoom).toHaveBeenLastCalledWith(null, "user");
    await expectNoAxeViolations(document.body);
  });

  it("downloads on a gesture; refused downloads are announced (localized)", async () => {
    renderChart({ toolbar: true, localeText: { exportFailed: "Lỗi", svg: "Tải SVG" } });
    expect(tool("svg").getAttribute("aria-label")).toBe("Tải SVG");
    expect(tool("zoomIn")).toBeNull();
    const activation = vi
      .spyOn(navigator, "userActivation", "get")
      .mockReturnValue({ isActive: false } as UserActivation);
    const status = document.querySelector("[data-ok-chart-status]") as HTMLElement;
    const changed = textChanged(status);
    act(() => tool("csv").click());
    await changed;
    expect(status.textContent).toBe("Lỗi");
    activation.mockRestore();
    const saved = new Promise<string>((resolve) => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        resolve(this.download);
      });
    });
    await userEvent.click(tool("png"));
    expect(await saved).toBe("visits.png");
  });

  it("keys zoom and pan; Escape hides the tooltip, then resets", () => {
    renderChart({ zoom: true });
    const [root] = figures() as [HTMLElement];
    const plot = plotOf(root);
    act(() => plot.focus());
    fireEvent.keyDown(plot, { key: "+" });
    fireEvent.keyDown(plot, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(plot, { key: "Home" });
    expect(titleOf(root)).toBe("D3");
    fireEvent.keyDown(plot, { key: "-", ctrlKey: true });
    expect(titleOf(root)).toBe("D3");
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(titleOf(root)).toBeNull();
    fireEvent.keyDown(plot, { key: "Escape" });
    fireEvent.keyDown(plot, { key: "End" });
    expect(titleOf(root)).toBe("D9");
  });

  it("a drag zooms (previewed); controlled zoom; uncontrolled zoom follows live data", () => {
    render(<Live />);
    const [root] = figures() as [HTMLElement];
    const ticks = () =>
      [...root.querySelectorAll("[data-ok-chart-tick]")].map((t) => t.textContent);
    expect(ticks()).toContain("D9");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    // The first zoom wasn't set on a known axis: it stays where it is.
    expect(ticks()).not.toContain("D11");
    // Reset, then a drag sets a zoom at the end, which then follows new points.
    fireEvent.keyDown(plotOf(root), { key: "0" });
    const plot = plotOf(root);
    const box = plot.getBoundingClientRect();
    const at = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + x,
          clientY: box.top + 80,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    act(() => at("pointerdown", box.width * 0.4));
    act(() => at("pointermove", box.width - 1));
    expect(root.querySelector("[data-ok-chart-selection]")).not.toBeNull();
    act(() => at("pointerup", box.width - 1));
    expect(root.querySelector("[data-ok-chart-selection]")).toBeNull();
    expect(ticks()).toContain("D11");
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(ticks()).toContain("D13");
  });

  it("controlled zoom: the owner decides", () => {
    const onZoom = vi.fn();
    renderChart({ zoom: true, zoomRange: { min: 0, max: 2 }, onZoomRangeChange: onZoom });
    const [root] = figures() as [HTMLElement];
    const ticks = [...root.querySelectorAll("[data-ok-chart-tick]")].map((t) => t.textContent);
    expect(ticks).toContain("D2");
    expect(ticks).not.toContain("D3");
    fireEvent.keyDown(plotOf(root), { key: "0" });
    expect(onZoom).toHaveBeenCalledWith(null, "user");
    expect(root.querySelectorAll("[data-ok-chart-tick]")).toHaveLength(ticks.length);
  });

  it("a group shares the active category and the zoom", () => {
    const onZoom = vi.fn();
    render(
      <div style={{ width: 600 }}>
        <Chart id="a" label="A" group="g" zoom categories={DAYS} series={SERIES} />
        <Chart label="B" group="g" categories={DAYS} series={SERIES} onZoomRangeChange={onZoom} />
      </div>,
    );
    const [a, b] = figures() as [HTMLElement, HTMLElement];
    const plot = plotOf(a);
    act(() => plot.focus());
    fireEvent.keyDown(plot, { key: "End" });
    expect(titleOf(b)).toBe("D9");
    fireEvent.keyDown(plot, { key: "+" });
    expect(onZoom).toHaveBeenCalledWith({ min: 2, max: 7 }, "group");
    expect(b.getAttribute("data-ok-group")).toBe("g");
    act(() => plot.blur());
    expect(titleOf(b)).toBeNull();
  });

  it("a focused chart keeps its keyboard point when another chart of the group changes", () => {
    render(
      <div style={{ width: 600 }}>
        <Chart label="A" group="g" categories={DAYS} series={SERIES} />
        <Chart label="B" group="g" categories={DAYS} series={SERIES} />
      </div>,
    );
    const [a, b] = figures() as [HTMLElement, HTMLElement];
    const plot = plotOf(b);
    act(() => plot.focus());
    fireEvent.keyDown(plot, { key: "Home" });
    expect(titleOf(b)).toBe("D0");
    // A pointer leaving the other chart (a layout shift under it) clears the group's point.
    fireEvent.pointerLeave(plotOf(a));
    expect(titleOf(b)).toBe("D0");
  });

  it("a brush chart zooms its target and follows it", () => {
    const onZoom = vi.fn();
    render(
      <div style={{ width: 600 }}>
        <Chart
          id="target"
          label="Target"
          categories={DAYS}
          series={SERIES}
          onZoomRangeChange={onZoom}
        />
        <Chart label="Brush" brushTarget="target" height={80} categories={DAYS} series={SERIES} />
      </div>,
    );
    const [, brush] = figures() as [HTMLElement, HTMLElement];
    expect(brush.querySelectorAll("[data-ok-chart-handle]")).toHaveLength(2);
    expect(brush.getAttribute("data-ok-brush-target")).toBe("target");
    const plot = plotOf(brush);
    fireEvent.keyDown(plot, { key: "+" });
    expect(onZoom).toHaveBeenCalledWith({ min: 2, max: 7 }, "brush");
    const box = plot.getBoundingClientRect();
    const fire = (type: string, x: number) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: box.left + x,
          clientY: box.top + 30,
          pointerId: 1,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    act(() => fire("pointerdown", box.width * 0.5));
    act(() => fire("pointermove", box.width * 0.7));
    act(() => fire("pointerup", box.width * 0.7));
    const last = onZoom.mock.calls.at(-1)?.[0] as { min: number };
    expect(last.min).toBeGreaterThan(2);
    fireEvent.keyDown(plot, { key: "Escape" });
    expect(onZoom).toHaveBeenLastCalledWith(null, "brush");
  });

  it("annotations, legend values, data label badges and formatters, color ranges, texts", async () => {
    render(
      <div style={{ width: 600 }}>
        <Chart
          label="Visits"
          categories={DAYS}
          series={[...SERIES, { name: "Other", data: [1, 2] }]}
          legendValues
          dataLabels
          dataLabelBackground
          dataLabelFormatter={(value) => `${value}!`}
          annotations={[{ axis: "x", x: "D3", label: "Deploy", color: "error" }]}
        />
        <Chart
          label="Heat"
          type="heatmap"
          colorRanges={[{ from: 0, to: 5, color: "info" }]}
          categories={["a"]}
          series={[{ name: "R", data: [3] }]}
        />
        <Chart
          label="Spread"
          type="boxPlot"
          localeText={{ median: "Trung vị" }}
          categories={["a"]}
          series={[{ name: "S", data: [{ y: [1, 2, 3, 4, 5] }] }]}
        />
      </div>,
    );
    const [line, heat, box] = figures() as [HTMLElement, HTMLElement, HTMLElement];
    expect(line.querySelector("[data-ok-chart-annotations] > li")?.textContent).toBe("Deploy");
    expect(line.querySelector("[data-ok-chart-annotation-label]")?.textContent).toBe("Deploy");
    expect(
      [...line.querySelectorAll("[data-ok-chart-legend-value]")].map((n) => n.textContent),
    ).toEqual(["8", "2"]);
    expect(line.querySelector("[data-ok-chart-data-label]")?.textContent).toBe("0!");
    expect(line.querySelectorAll("[data-ok-chart-data-label-badge]").length).toBeGreaterThan(0);
    expect(heat.getAttribute("data-ok-color-ranges")).toBe("0 5 info");
    expect(heat.querySelector("[data-ok-chart-cell]")?.getAttribute("data-ok-color")).toBe("info");
    expect(box.querySelector("[data-ok-part=median]")?.textContent).toBe("Trung vị");
    await expectNoAxeViolations(document.body);
  });

  it("new types and options render on the server", () => {
    const html = renderToString(
      <>
        <Chart
          label="Candles"
          type="candlestick"
          candleUpColor="info"
          candleDownColor="warning"
          categories={["a", "b"]}
          series={[{ name: "P", data: [{ y: [1, 3, 0, 2] }, { y: [2, 3, 0, 1] }] }]}
        />
        <Chart
          label="Polar"
          type="polarArea"
          donutSize={50}
          animations
          categories={["a", "b"]}
          series={[{ name: "P", data: [1, 2] }]}
        />
        <Chart
          label="Plan"
          type="timeline"
          toolbar
          zoom
          series={[{ name: "P", data: [{ x: "A", y: ["2026-01-01", "2026-01-05"] }] }]}
        />
      </>,
    );
    expect(html).toContain('data-ok-chart-candle="down"');
    expect(html).toContain('data-ok-candle-up-color="info"');
    expect(html).toContain("data-ok-animations");
    expect(html).toContain('data-ok-chart-tool="svg"');
    // Timelines don't zoom (horizontal): no zoom tools.
    expect(html).not.toContain('data-ok-chart-tool="zoomIn"');
  });
});
