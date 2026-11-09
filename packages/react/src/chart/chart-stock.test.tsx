import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Stock charts in React (ADR-0047, phase 2.2): indicators, panes, the navigator. */

const DAYS = Array.from({ length: 30 }, (_, i) =>
  new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
);
const BARS = DAYS.map((_, i) => {
  const open = 100 + 5 * Math.sin(i / 3);
  const close = open + 2 * Math.cos(i);
  return { y: [open, Math.max(open, close) + 1, Math.min(open, close) - 1, close], v: 1000 + i };
});

function renderStock(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 600 }}>
      <Chart
        id="stock"
        label="ACME"
        type="candlestick"
        xType="datetime"
        categories={DAYS}
        series={[{ name: "ACME", data: BARS }]}
        indicators={[{ type: "sma", period: 5 }, { type: "volume" }, { type: "rsi", period: 5 }]}
        navigator
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;

describe("Chart (stock)", () => {
  it("draws panes, the navigator and the indicator columns; accessible", async () => {
    renderStock();
    expect(root().getAttribute("data-ok-indicators")).toBe("sma 5; volume; rsi 5");
    expect(root().hasAttribute("data-ok-navigator")).toBe(true);
    expect(root().querySelectorAll("[data-ok-chart-pane]")).toHaveLength(3);
    expect(root().querySelector("[data-ok-chart-navigator]")).not.toBeNull();
    const headers = [...root().querySelectorAll("thead th")].map((th) => th.textContent);
    expect(headers).toEqual([
      "Date",
      "ACME",
      "SMA 5",
      "RSI 5",
      "Open",
      "High",
      "Low",
      "Close",
      "Volume",
    ]);
    expect(root().querySelector('th[data-ok-indicator="rsi"]')).not.toBeNull();
    // The legend toggles indicators.
    expect(root().querySelectorAll("[data-ok-chart-legend-item]")).toHaveLength(4);
    await expectNoAxeViolations(document.body);
  });

  it("reads every pane at the active date with the keyboard; the navigator zooms with keys", () => {
    const onZoom = vi.fn();
    renderStock({ onZoomRangeChange: onZoom });
    fireEvent.keyDown(plot(), { key: "End" });
    const rows = [...root().querySelectorAll("[data-ok-chart-tooltip-row]")].map(
      (row) => row.children[1]?.textContent,
    );
    expect(rows).toEqual(["Open", "High", "Low", "Close", "SMA 5", "Volume", "RSI 5"]);
    // Zoom keys work without `zoom`: the navigator turns them on.
    fireEvent.keyDown(plot(), { key: "Escape" });
    fireEvent.keyDown(plot(), { key: "+" });
    expect(onZoom).toHaveBeenCalledWith({ min: 7, max: 22 }, "user");
    const selection = root().querySelector("[data-ok-chart-navigator] [data-ok-chart-selection]");
    expect(Number(selection?.getAttribute("width"))).toBeLessThan(400);
  });

  it("drags on the navigator move the zoom", () => {
    const onZoom = vi.fn();
    renderStock({ zoomRange: { min: 5, max: 14 }, onZoomRangeChange: onZoom, paneHeight: 80 });
    const frame = root().querySelector("[data-ok-chart-navigator-frame]") as SVGRectElement;
    const box = frame.getBoundingClientRect();
    const selection = root()
      .querySelector("[data-ok-chart-navigator] [data-ok-chart-selection]")
      ?.getBoundingClientRect() as DOMRect;
    const y = box.y + box.height / 2;
    const x = selection.x + selection.width / 2;
    const init = { pointerId: 1, pointerType: "mouse", button: 0, clientY: y };
    fireEvent.pointerDown(plot(), { ...init, clientX: x });
    fireEvent.pointerMove(plot(), { ...init, clientX: x + 100 });
    fireEvent.pointerUp(plot(), { ...init, clientX: x + 100 });
    const [range, reason] = onZoom.mock.calls.at(-1) ?? [];
    expect(reason).toBe("user");
    expect(range.min).toBeGreaterThan(5);
    expect(range.max - range.min).toBe(9);
  });
});
