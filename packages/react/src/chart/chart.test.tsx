import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

const HOSTILE = '"><img src=x onerror=alert(1)>';
const MONTHS = ["Jan", "Feb", "Mar", "Apr"];
const TWO = [
  { name: "Series A", data: [31, 40, 28, 64] },
  { name: "Series B", data: [11, 32, 45, 34] },
];

const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => screen.getByRole("group", { name: "Sales" });
const tooltip = () => document.querySelector("[data-ok-chart-tooltip]") as HTMLElement;
const legendItems = () => screen.queryAllByRole("button");
const css = (element: Element) => getComputedStyle(element);

function renderChart(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 600 }}>
      <Chart label="Sales" categories={MONTHS} series={TWO} {...props} />
    </div>,
  );
}

/** Moves the pointer to SVG coordinates of the chart. */
function hoverAt(x: number, y: number, pointerType = "mouse") {
  const box = plot().getBoundingClientRect();
  fireEvent.pointerMove(plot(), { clientX: box.left + x, clientY: box.top + y, pointerType });
}

function Owner() {
  const [hidden, setHidden] = useState<number[]>([]);
  return (
    <Chart
      label="Owned"
      categories={MONTHS}
      series={TWO}
      hiddenSeries={hidden}
      onHiddenSeriesChange={setHidden}
    />
  );
}

describe("Chart", () => {
  it("a figure with explicit defaults, a plot group, a legend and a data table", async () => {
    renderChart();
    expect({ ...root().dataset }).toEqual({
      okChart: "",
      okType: "line",
      okXType: "category",
      okCurve: "smooth",
      okLegend: "top",
      okFill: "gradient",
      okReady: "",
      okRuntime: "off",
    });
    expect(root().localName).toBe("figure");
    expect(plot()).toHaveAttribute("aria-roledescription", "chart");
    expect(plot()).toHaveAttribute("tabindex", "0");
    expect(plot().querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(legendItems().map((b) => [b.textContent, b.getAttribute("aria-pressed")])).toEqual([
      ["Series A", "true"],
      ["Series B", "true"],
    ]);
    const table = screen.getByRole("table", { name: "Sales" });
    expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual([
      "Category",
      "Series A",
      "Series B",
    ]);
    expect([...table.querySelectorAll("tbody th")].map((th) => th.textContent)).toEqual(MONTHS);
    expect(tooltip()).toHaveAttribute("hidden");
    await expectNoAxeViolations();
  });

  it("draws at the measured width and looks like the reference", () => {
    renderChart({ markerSize: 4 });
    const svg = plot().querySelector("svg") as SVGSVGElement;
    expect(svg.getAttribute("width")).toBe(String(plot().clientWidth));
    expect(svg.getAttribute("height")).toBe("320");
    const line = svg.querySelector("[data-ok-chart-line]") as SVGPathElement;
    expect(css(line).strokeWidth).toBe("2.5px");
    expect(css(line).stroke).toBe("rgb(0, 120, 103)");
    expect(css(svg.querySelector("[data-ok-chart-grid-line]") as Element).strokeDasharray).toBe(
      "3px",
    );
    expect(css(svg.querySelector("[data-ok-chart-tick]") as Element).fill).toBe(
      "rgb(99, 115, 129)",
    );
    expect(svg.querySelectorAll("[data-ok-chart-marker]")).toHaveLength(8);
    // The data table is visually hidden once the chart is drawn, and never wider than a glyph.
    const table = screen.getByRole("table");
    expect(css(table).clipPath).toBe("inset(50%)");
    expect(table.getBoundingClientRect().width).toBeLessThan(16);
  });

  it("redraws when the container resizes", async () => {
    renderChart();
    const svg = plot().querySelector("svg") as SVGSVGElement;
    const wrapper = root().parentElement as HTMLElement;
    const resized = new Promise<void>((resolve) => {
      new MutationObserver((_, observer) => {
        observer.disconnect();
        resolve();
      }).observe(svg, { attributes: true, attributeFilter: ["width"] });
    });
    wrapper.style.width = "400px";
    await resized;
    expect(svg.getAttribute("width")).toBe("400");
  });

  it("writes options as data attributes; invalid values fall back", () => {
    renderChart({
      type: "bar",
      stacked: true,
      horizontal: true,
      legend: "right",
      curve: "stepline",
      fill: "solid",
      height: 280,
      columnWidth: 58,
      barHeight: 30,
      markerSize: 3,
      yMin: -60,
      yMax: 20,
      yTitle: "Points",
      valuePrefix: "$",
      valueSuffix: "%",
      locale: "en-GB",
    });
    expect({ ...root().dataset }).toMatchObject({
      okType: "bar",
      okStacked: "",
      okHorizontal: "",
      okLegend: "right",
      okCurve: "stepline",
      okFill: "solid",
      okHeight: "280",
      okColumnWidth: "58",
      okBarHeight: "30",
      okMarkerSize: "3",
      okYMin: "-60",
      okYMax: "20",
      okYTitle: "Points",
      okValuePrefix: "$",
      okValueSuffix: "%",
      okLocale: "en-GB",
    });
    expect(plot().querySelector("svg")?.getAttribute("height")).toBe("280");
  });

  it("rejects hostile and invalid options", () => {
    renderChart({
      type: HOSTILE as never,
      legend: HOSTILE as never,
      colors: [HOSTILE as never],
      height: -5,
      markerSize: -1,
      yMin: Number.NaN,
      series: [{ name: HOSTILE, data: [1, 2], color: HOSTILE as never }],
    });
    expect(root().dataset).toMatchObject({ okType: "line", okLegend: "top" });
    expect(root()).not.toHaveAttribute("data-ok-height");
    expect(root()).not.toHaveAttribute("data-ok-y-min");
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("columnheader", { name: HOSTILE })).toBeTruthy();
    expect(document.querySelector("[data-ok-chart-series]")).toHaveAttribute(
      "data-ok-color",
      "primary-dark",
    );
  });

  it("scatter defaults to a numeric x axis; one series has no legend", () => {
    render(
      <Chart
        label="Points"
        type="scatter"
        series={[
          {
            name: "A",
            data: [
              [1, 2],
              [3, 4],
            ],
          },
        ]}
      />,
    );
    expect(root().dataset["okXType"]).toBe("numeric");
    expect(legendItems()).toHaveLength(0);
    expect(document.querySelectorAll("[data-ok-chart-marker]")).toHaveLength(2);
  });

  it("legend: toggles series, rescales, reports once per change", async () => {
    const onHiddenSeriesChange = vi.fn();
    renderChart({ onHiddenSeriesChange });
    const [a, b] = legendItems() as [HTMLElement, HTMLElement];
    await userEvent.click(a);
    expect(a).toHaveAttribute("aria-pressed", "false");
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith([0]);
    expect(document.querySelectorAll("[data-ok-chart-series]")).toHaveLength(1);
    await userEvent.click(b);
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith([0, 1]);
    await userEvent.click(a);
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith([1]);
    expect(onHiddenSeriesChange).toHaveBeenCalledTimes(3);
    expect(css(a).textDecorationLine).toBe("none");
    expect(css(b).textDecorationLine).toBe("line-through");
    // Hidden series stay in the data table.
    expect(screen.getByRole("columnheader", { name: "Series B" })).toBeTruthy();
  });

  it("controlled hidden series: the owner decides", async () => {
    const onHiddenSeriesChange = vi.fn();
    renderChart({ hiddenSeries: [1], onHiddenSeriesChange });
    const [a] = legendItems() as [HTMLElement];
    expect(legendItems()[1]).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(a);
    expect(onHiddenSeriesChange).toHaveBeenCalledWith([0, 1]);
    expect(a).toHaveAttribute("aria-pressed", "true");

    render(<Owner />);
    const owned = screen.getAllByRole("button", { name: "Series A" })[1] as HTMLElement;
    await userEvent.click(owned);
    expect(owned).toHaveAttribute("aria-pressed", "false");
  });

  it("default hidden series", () => {
    renderChart({ defaultHiddenSeries: [0] });
    expect(legendItems()[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("pointer: a crosshair, bigger markers and the tooltip; leaving hides it", () => {
    const onActiveChange = vi.fn();
    renderChart({ onActiveChange });
    const svg = plot().querySelector("svg") as SVGSVGElement;
    const slot = Number(
      (svg.querySelectorAll("[data-ok-chart-axis='x'] text")[3] as SVGTextElement).getAttribute(
        "x",
      ),
    );
    hoverAt(slot - 2, 100);
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 3 });
    expect(svg.querySelector("[data-ok-chart-crosshair-line]")).not.toBeNull();
    expect(svg.querySelectorAll("[data-ok-chart-active-marker]")).toHaveLength(2);
    expect(tooltip()).not.toHaveAttribute("hidden");
    expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Apr");
    expect(
      [...tooltip().querySelectorAll("[data-ok-chart-tooltip-row]")].map((row) => row.textContent),
    ).toEqual(["Series A64", "Series B34"]);
    expect(
      Number.parseFloat(tooltip().style.getPropertyValue("--_ok-chart-tip-x")),
    ).toBeGreaterThanOrEqual(0);
    // The same category again: no new event.
    hoverAt(slot + 1, 120);
    expect(onActiveChange).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(plot(), { pointerType: "touch" });
    expect(tooltip()).not.toHaveAttribute("hidden");
    fireEvent.pointerLeave(plot(), { pointerType: "mouse" });
    expect(tooltip()).toHaveAttribute("hidden");
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    hoverAt(-50, -50);
    expect(onActiveChange).toHaveBeenCalledTimes(2);
  });

  it("touch: a tap shows the tooltip", () => {
    renderChart();
    const box = plot().getBoundingClientRect();
    fireEvent.pointerDown(plot(), {
      clientX: box.left + box.width / 2,
      clientY: box.top + 100,
      pointerType: "touch",
    });
    expect(tooltip()).not.toHaveAttribute("hidden");
  });

  it("columns: the band highlight, no markers", () => {
    renderChart({ type: "bar" });
    const box = plot().getBoundingClientRect();
    hoverAt(box.width - 30, 150);
    expect(document.querySelector("[data-ok-chart-band]")).not.toBeNull();
    expect(document.querySelectorAll("[data-ok-chart-active-marker]")).toHaveLength(0);
    expect(css(document.querySelector("[data-ok-chart-bar]") as Element).fill).toBe(
      "rgb(0, 120, 103)",
    );
  });

  it("scatter: the nearest point", () => {
    const onActiveChange = vi.fn();
    render(
      <div style={{ width: 500 }}>
        <Chart
          label="Sales"
          type="scatter"
          onActiveChange={onActiveChange}
          series={[
            {
              name: "A",
              data: [
                [1, 1],
                [9, 9],
              ],
            },
            { name: "B", data: [[5, 5]], color: "info" },
          ]}
        />
      </div>,
    );
    const marker = document.querySelectorAll("[data-ok-chart-marker]")[2] as SVGCircleElement;
    hoverAt(Number(marker.getAttribute("cx")) + 2, Number(marker.getAttribute("cy")));
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "mark", mark: 2 });
    expect(tooltip().textContent).toBe("5B5");
  });

  it("keyboard: focus shows the first category, arrows, Home / End move, Escape hides", async () => {
    const onActiveChange = vi.fn();
    render(
      <>
        <input aria-label="Before" />
        <div style={{ width: 600 }}>
          <Chart
            label="Sales"
            categories={MONTHS}
            series={TWO}
            legend="none"
            onActiveChange={onActiveChange}
          />
        </div>
      </>,
    );
    screen.getByRole("textbox").focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(plot());
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 0 });
    await userEvent.keyboard("{ArrowRight}");
    expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Feb");
    await userEvent.keyboard("{End}");
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 3 });
    await userEvent.keyboard("{Home}");
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 0 });
    await userEvent.keyboard("{Escape}");
    expect(tooltip()).toHaveAttribute("hidden");
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("a");
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 0 });
    await expectNoAxeViolations();
    act(() => plot().blur());
    expect(tooltip()).toHaveAttribute("hidden");
  });

  it("keyboard focus keeps a category the pointer already chose", async () => {
    const onActiveChange = vi.fn();
    render(
      <>
        <input aria-label="Before" />
        <div style={{ width: 600 }}>
          <Chart
            label="Sales"
            categories={MONTHS}
            series={TWO}
            legend="none"
            onActiveChange={onActiveChange}
          />
        </div>
      </>,
    );
    const x = Number(
      document.querySelectorAll("[data-ok-chart-axis='x'] text")[2]?.getAttribute("x"),
    );
    hoverAt(x, 100);
    screen.getByRole("textbox").focus();
    await userEvent.keyboard("{Tab}");
    expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 2 });
  });

  it("a hidden chart keeps the default width; pointers on it activate nothing", () => {
    render(
      <div hidden>
        <Chart label="Sales" categories={MONTHS} series={TWO} />
      </div>,
    );
    expect(document.querySelector("[data-ok-chart-svg]")?.getAttribute("width")).toBe("640");
    const hiddenPlot = document.querySelector("[data-ok-chart-plot]") as HTMLElement;
    fireEvent.pointerMove(hiddenPlot, { clientX: 10, clientY: 10, pointerType: "mouse" });
    expect(tooltip()).toHaveAttribute("hidden");
    fireEvent.keyDown(hiddenPlot, { key: "Home" });
    expect(tooltip()).not.toHaveAttribute("hidden");
  });

  it("formatters, prefix / suffix and datetime axes", () => {
    renderChart({
      xType: "datetime",
      categories: ["2011-01-01", "2011-02-01", "2011-03-01", "2011-04-01"],
      valueSuffix: "%",
      xLabel: "Month",
    });
    expect(screen.getByRole("rowheader", { name: "Feb 2011" })).toHaveAttribute(
      "data-ok-value",
      "2011-02-01",
    );
    expect(screen.getByRole("columnheader", { name: "Month" })).toBeTruthy();
    expect(screen.getAllByRole("cell")[0]).toHaveTextContent("31%");
    expect(document.querySelector("[data-ok-chart-axis='y'] text")?.textContent).toMatch(/%$/);
  });

  it("custom formatters", () => {
    renderChart({ valueFormatter: (value) => `${value} pts`, labelFormatter: (x) => `M:${x}` });
    expect(screen.getAllByRole("cell")[0]).toHaveTextContent("31 pts");
    expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("M:Jan");
  });

  it("mixed charts carry series types in the table; per-point colors", () => {
    renderChart({
      type: "bar",
      yTitle: "Points",
      series: [
        { name: "A", type: "bar", data: [1, { y: -2, color: "error" }, 3, 4] },
        { name: "B", type: "line", data: [2, 3, 4, 5] },
      ],
    });
    expect(screen.getByRole("columnheader", { name: "B" })).toHaveAttribute("data-ok-type", "line");
    expect(css(document.querySelectorAll("[data-ok-chart-bar]")[1] as Element).fill).toBe(
      "rgb(255, 86, 48)",
    );
    expect(document.querySelector("[data-ok-chart-axis-title]")?.textContent).toBe("Points");
  });

  it("area gradients use unique ids", () => {
    render(
      <>
        <Chart label="One" type="area" series={[{ name: "A", data: [1, 2] }]} />
        <Chart label="Two" type="area" series={[{ name: "A", data: [1, 2] }]} />
      </>,
    );
    const ids = [...document.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^ok-chart-[\w-]+$/);
    expect(document.querySelector("[data-ok-chart-area]")?.getAttribute("fill")).toBe(
      `url(#${ids[0]})`,
    );
  });

  it("forwards the ref and rest props; StrictMode-safe", () => {
    const ref = createRef<HTMLElement>();
    render(
      <StrictMode>
        <Chart ref={ref} label="Sales" series={TWO} className="custom" data-testid="chart" />
      </StrictMode>,
    );
    expect(ref.current).toBe(root());
    expect(root()).toHaveClass("custom");
    expect(screen.getByTestId("chart")).toBe(root());
  });

  it("renders on the server with the default width and hydrates to the measured one", () => {
    const html = renderToString(<Chart label="Sales" categories={MONTHS} series={TWO} />);
    expect(html).toContain('width="640"');
    expect(html).toContain("data-ok-chart-data");
    expect(html).not.toContain("<img");
  });

  it("unmounts cleanly (the resize observer disconnects)", () => {
    const { unmount } = renderChart();
    act(() => unmount());
    expect(root()).toBeNull();
  });

  it("dark theme: paper tooltip and AA ticks", async () => {
    document.documentElement.setAttribute("data-ok-theme", "dark");
    try {
      renderChart();
      expect(css(document.querySelector("[data-ok-chart-tick]") as Element).fill).toBe(
        "rgb(145, 158, 171)",
      );
      await expectNoAxeViolations();
    } finally {
      document.documentElement.removeAttribute("data-ok-theme");
    }
  });

  describe("phase 2: polar charts", () => {
    const SLICES = ["Series A", "Series B", "Series C", "Series D"];
    const VALUES = [{ name: "Value", data: [44, 55, 13, 43] }];

    it("pie: slices with percentages, a legend of categories that hides slices", async () => {
      const onHiddenSeriesChange = vi.fn();
      renderChart({
        type: "pie",
        height: 240,
        dataLabels: true,
        categories: SLICES,
        series: VALUES,
        onHiddenSeriesChange,
      });
      const svg = plot().querySelector("svg") as SVGSVGElement;
      const slices = svg.querySelectorAll("[data-ok-chart-slice]");
      expect(slices).toHaveLength(4);
      expect(css(slices[0] as Element).fill).toBe("rgb(0, 120, 103)");
      const labels = [...svg.querySelectorAll("[data-ok-chart-data-label]")];
      expect(labels.map((label) => label.textContent)).toEqual(["28.4%", "35.5%", "8.4%", "27.7%"]);
      expect(css(labels[0] as Element).fill).toBe("rgb(255, 255, 255)");
      expect(legendItems().map((b) => b.textContent)).toEqual(SLICES);
      expect(css(root().querySelector("[data-ok-chart-legend]") as Element).justifyContent).toBe(
        "center",
      );
      await userEvent.click(screen.getByRole("button", { name: "Series B" }));
      expect(onHiddenSeriesChange).toHaveBeenCalledWith([1]);
      expect(svg.querySelectorAll("[data-ok-chart-slice]")).toHaveLength(3);
      // The table keeps every slice.
      expect(screen.getByRole("table").querySelectorAll("tbody tr")).toHaveLength(4);
      await expectNoAxeViolations();
    });

    it("pie: pointer over a slice shows a halo and its tooltip", () => {
      const onActiveChange = vi.fn();
      renderChart({ type: "pie", height: 240, categories: SLICES, series: VALUES, onActiveChange });
      const width = plot().clientWidth;
      // Up and right of the center: the first slice.
      hoverAt(width / 2 + 30, 120 - 40);
      expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 0 });
      const halo = plot().querySelector("[data-ok-chart-active-slice]") as Element;
      expect(halo).not.toBeNull();
      expect(css(halo).fillOpacity).toBe("0.32");
      expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe(
        "Series A",
      );
      expect(tooltip().querySelector("[data-ok-chart-tooltip-row]")?.textContent).toBe("Value44");
      hoverAt(2, 2);
      expect(onActiveChange).toHaveBeenLastCalledWith(null);
    });

    it("donut: a hole and the total in the center; keyboard moves through slices", async () => {
      renderChart({
        type: "donut",
        height: 240,
        totalLabel: "Total",
        categories: SLICES,
        series: VALUES,
        legend: "none",
        defaultHiddenSeries: [2],
      });
      expect(root()).toHaveAttribute("data-ok-total-label", "Total");
      const center = plot().querySelector("[data-ok-chart-center]") as Element;
      expect(center.textContent).toBe("Total142");
      expect(css(center.querySelector("[data-ok-chart-center-value]") as Element).fontWeight).toBe(
        "700",
      );
      await userEvent.tab();
      expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe(
        "Series A",
      );
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      // Series C is hidden: skipped.
      expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe(
        "Series D",
      );
    });

    it("radial bar: tracks, gradient bars, percentages and a total", async () => {
      renderChart({
        type: "radialBar",
        legend: "bottom",
        totalLabel: "Total",
        total: 2324,
        colors: ["secondary", "warning"],
        categories: ["Apples", "Oranges"],
        series: [{ name: "Share", data: [24, 50] }],
      });
      expect(root()).toHaveAttribute("data-ok-total", "2324");
      const svg = plot().querySelector("svg") as SVGSVGElement;
      const track = svg.querySelector("[data-ok-chart-track]") as Element;
      expect(css(track).fill).toBe("none");
      expect(css(track).strokeLinecap).toBe("round");
      const bar = svg.querySelector("[data-ok-chart-radial]") as Element;
      expect(bar.getAttribute("stroke")).toMatch(/^url\(#ok-chart-/);
      const stops = [...svg.querySelectorAll("[data-ok-chart-stop]")].map(
        (stop) => css(stop).stopColor,
      );
      expect(stops.slice(0, 2)).toEqual(["rgb(198, 132, 255)", "rgb(142, 51, 255)"]);
      expect(plot().querySelector("[data-ok-chart-center]")?.textContent).toBe("Total2,324");
      expect(screen.getByRole("table").querySelector("tbody td")?.textContent).toBe("24%");
      await expectNoAxeViolations();
    });

    it("gauges: angles, dashes and a full-width track", () => {
      renderChart({
        type: "radialBar",
        startAngle: -135,
        endAngle: 135,
        dashArray: 4,
        trackWidth: 100,
        colors: ["error"],
        categories: ["Median ratio"],
        series: [{ name: "Ratio", data: [75] }],
      });
      expect({ ...root().dataset }).toMatchObject({
        okStartAngle: "-135",
        okEndAngle: "135",
        okDashArray: "4",
        okTrackWidth: "100",
      });
      const bar = plot().querySelector("[data-ok-chart-radial]") as Element;
      expect(css(bar).strokeDasharray).toBe("4px");
      expect(css(bar).strokeLinecap).toBe("butt");
      expect(plot().querySelector("[data-ok-chart-center]")?.textContent).toBe("75%Median ratio");
      expect(legendItems()).toHaveLength(0);
    });

    it("radar: a web, a shape per series, a spoke and markers for the active category", async () => {
      const onActiveChange = vi.fn();
      renderChart({
        type: "radar",
        height: 280,
        categories: ["2011", "2012", "2013", "2014", "2015", "2016"],
        series: [
          { name: "Series A", data: [80, 50, 30, 40, 100, 20] },
          { name: "Series B", data: [20, 30, 40, 80, 20, 80] },
        ],
        onActiveChange,
      });
      const svg = plot().querySelector("svg") as SVGSVGElement;
      expect(svg.querySelectorAll("line[data-ok-chart-web]")).toHaveLength(6);
      const area = svg.querySelector("[data-ok-chart-area]") as Element;
      expect(css(area).fillOpacity).toBe("0.48");
      expect(css(svg.querySelector("[data-ok-chart-web]") as Element).fill).toBe("none");
      const width = plot().clientWidth;
      hoverAt(width / 2 + 2, 60);
      expect(onActiveChange).toHaveBeenLastCalledWith({ kind: "index", index: 0 });
      expect(svg.querySelector("[data-ok-chart-crosshair-line]")).not.toBeNull();
      expect(svg.querySelectorAll("[data-ok-chart-active-marker]")).toHaveLength(2);
      expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("2011");
      await expectNoAxeViolations();
    });

    it("data labels on columns and lines; renders on the server", () => {
      renderChart({ type: "bar", dataLabels: true });
      const labels = plot().querySelectorAll("[data-ok-chart-data-label='inside']");
      expect(labels.length).toBeGreaterThan(0);
      const html = renderToString(
        <Chart label="Pie" type="pie" dataLabels categories={SLICES} series={VALUES} />,
      );
      expect(html).toContain("data-ok-chart-slice");
      expect(html).toContain("28.4%");
    });
  });

  describe("phase 3: more types, sparklines and live data", () => {
    const BOXES = [
      { name: "Scores", data: [{ y: [54, 66, 69, 75, 88] }, { y: [31, 39, 45, 51, 59] }] },
    ];

    it("box plot: colored boxes, a two-row table, five tooltip rows", async () => {
      renderChart({
        type: "boxPlot",
        categories: ["2015", "2016"],
        series: BOXES,
        boxUpperColor: "info",
        boxLowerColor: "error",
      });
      expect(root().dataset).toMatchObject({ okBoxUpperColor: "info", okBoxLowerColor: "error" });
      const svg = plot().querySelector("svg") as SVGSVGElement;
      expect(css(svg.querySelector("[data-ok-chart-box='upper']") as Element).fill).toBe(
        "rgb(0, 184, 217)",
      );
      const table = screen.getByRole("table");
      const heads = table.querySelectorAll("thead tr");
      expect(heads).toHaveLength(2);
      expect(heads[0]?.querySelector("[colspan='5']")?.getAttribute("scope")).toBe("colgroup");
      expect(heads[1]?.textContent).toBe("MinimumQ1MedianQ3Maximum");
      hoverAt(300, 100);
      expect(tooltip().querySelectorAll("[data-ok-chart-tooltip-row]")).toHaveLength(5);
      await expectNoAxeViolations();
    });

    it("heatmap and treemap: cells, the arrow keys move between them", async () => {
      renderChart({
        type: "heatmap",
        legend: "none",
        categories: ["a", "b"],
        series: [
          { name: "M1", data: [1, 2] },
          { name: "M2", data: [3, 4] },
        ],
      });
      plot().focus();
      await userEvent.keyboard("{End}");
      expect(tooltip().textContent).toContain("M1");
      await userEvent.keyboard("{ArrowUp}");
      expect(tooltip().textContent).toContain("M24");
      expect(document.querySelectorAll("[data-ok-chart-active-cell]")).toHaveLength(1);
      await expectNoAxeViolations();
    });

    it("treemap: names, tags and a table row per category", async () => {
      renderChart({
        type: "treemap",
        categories: undefined,
        series: [
          {
            name: "Desktops",
            data: [
              { x: "ABC", y: 10 },
              { x: "DEF", y: 60 },
            ],
          },
          { name: "Mobile", data: [{ x: "WXYZ", y: 51 }] },
        ],
      });
      expect(document.querySelectorAll("[data-ok-chart-cell]")).toHaveLength(3);
      expect(document.querySelectorAll("[data-ok-chart-tag-label]")).toHaveLength(2);
      expect(screen.getAllByRole("rowheader").map((th) => th.textContent)).toEqual([
        "ABC",
        "DEF",
        "WXYZ",
      ]);
      await expectNoAxeViolations();
    });

    it("sparkline: no axes or legend, the container's height, at least `height`", () => {
      render(
        <div style={{ width: 200, height: 90 }}>
          <Chart label="Sales" sparkline height={30} categories={MONTHS} series={TWO} />
        </div>,
      );
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      expect(document.querySelector("[data-ok-chart-axis]")).toBeNull();
      expect(plot().style.getPropertyValue("--_ok-chart-height")).toBe("30px");
      const svg = plot().querySelector("svg") as SVGSVGElement;
      expect(svg.getAttribute("height")).toBe("90");
      expect(svg.getAttribute("width")).toBe("200");
    });

    it("sparkline without a height or a sized container: 40px", () => {
      render(
        <div style={{ width: 200 }}>
          <Chart label="Sales" sparkline type="bar" categories={MONTHS} series={TWO} />
        </div>,
      );
      expect(plot().style.getPropertyValue("--_ok-chart-height")).toBe("");
      expect(plot().querySelector("svg")?.getAttribute("height")).toBe("40");
    });

    it("live updates keep the active category and the hidden series; the table follows", () => {
      const { rerender } = render(
        <div style={{ width: 600 }}>
          <Chart label="Sales" categories={MONTHS} series={TWO} defaultHiddenSeries={[1]} />
        </div>,
      );
      hoverAt(590, 100);
      expect(tooltip().querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Apr");
      const svg = plot().querySelector("svg") as SVGSVGElement;
      const line = svg.querySelector("[data-ok-chart-line]");
      rerender(
        <div style={{ width: 600 }}>
          <Chart
            label="Sales"
            categories={["Feb", "Mar", "Apr", "May"]}
            series={[
              { name: "Series A", data: [40, 28, 64, 99] },
              { name: "Series B", data: [32, 45, 34, 12] },
            ]}
            defaultHiddenSeries={[1]}
          />
        </div>,
      );
      // Same position, new values; the same SVG elements (React reconciles them).
      expect(tooltip().textContent).toBe("MaySeries A99");
      expect(svg.querySelector("[data-ok-chart-line]")).toBe(line);
      expect(screen.getByRole("button", { name: "Series B" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(screen.getAllByRole("rowheader").at(-1)?.textContent).toBe("May");
    });

    it("bubble, range area, funnel and slope render on the server", () => {
      for (const [type, series] of [
        ["bubble", [{ name: "A", data: [[1, 2, 3]] }]],
        ["rangeArea", [{ name: "A", data: [{ y: [1, 2] }] }]],
        ["funnel", [{ name: "A", data: [3, 2] }]],
        ["slope", [{ name: "A", data: [3, 2] }]],
      ] as const) {
        const html = renderToString(
          <Chart label="Sales" type={type} categories={["a", "b"]} series={series as never} />,
        );
        expect(html).toContain(`data-ok-type="${type}"`);
      }
      const bubble = renderToString(
        <Chart label="B" type="bubble" series={[{ name: "A", data: [[1, 2, 3]] }]} />,
      );
      expect(bubble).toContain('data-ok-x-type="numeric"');
      expect(bubble).toContain("data-ok-chart-bubble");
    });
  });
});
