import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart, type ChartProps } from "./chart.js";

/* Geo charts in React (ADR-0059, roadmap 4.18.17). */

const square = (id: string, x: number) => ({
  type: "Feature" as const,
  properties: { name: id },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, 0],
        [x + 20, 0],
        [x + 20, 20],
        [x, 20],
        [x, 0],
      ],
    ],
  },
});
const GEOMETRY: ChartProps["geometry"] = {
  type: "FeatureCollection",
  features: [square("West", -60), square("East", 20)],
};
const REGIONS = [
  { id: "West", name: "West", value: 2 },
  { id: "East", name: "East", value: 8 },
];

function renderGeo(props: Partial<ChartProps> = {}) {
  return render(
    <div style={{ width: 400 }}>
      <Chart
        label="Sales"
        type="geo"
        geometry={GEOMETRY}
        regions={REGIONS}
        joinBy="name"
        {...props}
      />
    </div>,
  );
}
const root = () => document.querySelector("[data-ok-chart]") as HTMLElement;
const plot = () => root().querySelector("[data-ok-chart-plot]") as HTMLElement;
const regions = () => [...root().querySelectorAll("path[data-ok-chart-region]")];
const title = () => root().querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;

describe("Chart (geo)", () => {
  it("draws the regions, the class legend and the data table", async () => {
    renderGeo({ projection: "mercator", scaleMethod: "equalInterval", scaleClasses: 2 });
    expect(regions()).toHaveLength(2);
    expect(root().getAttribute("data-ok-projection")).toBe("mercator");
    expect(root().querySelectorAll("[data-ok-chart-legend-item]")).toHaveLength(2);
    expect(root().querySelector("tbody")?.textContent).toContain("West");
    await expectNoAxeViolations(document.body);
  });

  it("writes the geo options the HTML side reads", () => {
    renderGeo({ sphere: true, graticule: true, geoLayout: "geographic", scaleThresholds: [3, 5] });
    expect(root().hasAttribute("data-ok-sphere")).toBe(true);
    expect(root().hasAttribute("data-ok-graticule")).toBe(true);
    expect(root().getAttribute("data-ok-geo-layout")).toBe("geographic");
    expect(root().getAttribute("data-ok-scale-thresholds")).toBe("3; 5");
    expect(root().getAttribute("data-ok-join-by")).toBe("name");
  });

  it("moves the tooltip with the keyboard and mutes classes from the legend", () => {
    const onHiddenSeriesChange = vi.fn();
    renderGeo({ scaleClasses: 2, onHiddenSeriesChange });
    fireEvent.keyDown(plot(), { key: "Home" });
    expect(title()).toBe("West");
    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(title()).toBe("East");
    fireEvent.click(root().querySelector("[data-ok-chart-legend-item]") as Element);
    expect(onHiddenSeriesChange).toHaveBeenCalledWith([0]);
    expect(regions()[0]?.getAttribute("fill-opacity")).toBe("0.18");
  });

  it("selects the region under a click", () => {
    const onDataPointSelection = vi.fn();
    renderGeo({ onDataPointSelection });
    fireEvent.keyDown(plot(), { key: "Home" });
    fireEvent.keyDown(plot(), { key: "Enter" });
    expect(onDataPointSelection).toHaveBeenCalledTimes(1);
    expect(root().querySelector("[data-ok-chart-selected-mark]")).not.toBeNull();
  });

  it("draws pixel maps, pattern fills and pictures (4.18.96, 4.18.97)", async () => {
    const PIXEL =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
    const { rerender } = renderGeo({ geoLayout: "pixel", pixelShape: "square", pixelSpacing: 6 });
    expect(root().getAttribute("data-ok-pixel-shape")).toBe("square");
    expect(root().getAttribute("data-ok-pixel-spacing")).toBe("6");
    expect(root().querySelector('[data-ok-chart-series][data-ok-layout="pixel"]')).not.toBeNull();
    expect((regions()[0]?.getAttribute("d") ?? "").split("M").length).toBeGreaterThan(3);
    rerender(
      <div style={{ width: 400 }}>
        <Chart
          label="Sales"
          type="geo"
          geometry={GEOMETRY}
          regions={[{ ...REGIONS[0], image: PIXEL } as never, REGIONS[1] as never]}
          joinBy="name"
          fill="pattern"
          imageFit="contain"
        />
      </div>,
    );
    const [west, east] = regions();
    expect(west?.getAttribute("fill")).toMatch(/^url\(#.+-image-0\)$/);
    expect(east?.getAttribute("data-ok-pattern")).toBe("verticalLines");
    expect(root().querySelector("image")?.getAttribute("preserveAspectRatio")).toBe(
      "xMidYMid meet",
    );
    expect(root().getAttribute("data-ok-image-fit")).toBe("contain");
    expect(root().querySelector("th[data-ok-image]")?.getAttribute("data-ok-image")).toBe(PIXEL);
    expect(root().querySelector("[data-ok-chart-legend-marker][data-ok-pattern]")).not.toBeNull();
    await expectNoAxeViolations(document.body);
  });

  it("describes the plot, generated or given (4.18.99)", async () => {
    const { rerender } = renderGeo({ description: "auto", scaleClasses: 2 });
    const described = plot().getAttribute("aria-describedby") as string;
    const text = document.getElementById(described);
    expect(text?.closest("[data-ok-chart-plot]")).toBe(plot());
    expect(text?.textContent).toMatch(
      /^Choropleth map of 2 regions\. Values range from 2 in West to 8 in East\./,
    );
    expect(root().getAttribute("data-ok-description")).toBe("auto");
    rerender(
      <div style={{ width: 400 }}>
        <Chart
          label="Sales"
          type="geo"
          geometry={GEOMETRY}
          regions={REGIONS}
          joinBy="name"
          description="auto"
          descriptionStrings={{ summary: "{count} zonas." }}
        />
      </div>,
    );
    expect(document.getElementById(described)?.textContent).toMatch(/^2 zonas\./);
    rerender(
      <div style={{ width: 400 }}>
        <Chart label="Sales" type="geo" geometry={GEOMETRY} regions={REGIONS} joinBy="name" />
      </div>,
    );
    expect(plot().hasAttribute("aria-describedby")).toBe(false);
    expect(root().querySelector("[data-ok-chart-description]")).toBeNull();
    await expectNoAxeViolations(document.body);
  });

  it("annotates regions and coordinates; labels give way (4.18.100)", () => {
    renderGeo({
      dataLabels: true,
      annotations: [
        { axis: "point", region: "West", label: "Here" },
        { axis: "text", x: 30, y: 10, label: "East" },
      ],
    });
    const items = root().querySelectorAll("[data-ok-chart-annotations] li");
    expect(items[0]?.getAttribute("data-ok-region")).toBe("West");
    expect(root().querySelector("[data-ok-chart-annotation-outline]")).not.toBeNull();
    expect(root().querySelector("[data-ok-chart-annotation-text]")?.textContent).toBe("East");
    const labels = [...root().querySelectorAll("[data-ok-chart-partition-label]")].map(
      (label) => label.textContent,
    );
    expect(labels).not.toContain("West");
  });

  it("draws hex tiles without geometry", () => {
    render(
      <Chart
        label="Tiles"
        type="geo"
        geoLayout="hex"
        hexCells={[
          { id: "West", col: 0, row: 0 },
          { id: "East", col: 1, row: 0 },
        ]}
        regions={REGIONS}
        dataLabels
      />,
    );
    expect(regions()).toHaveLength(2);
    expect(root().querySelector("[data-ok-chart-data-labels] text")).not.toBeNull();
    expect(root().querySelector("th[data-ok-cell]")?.getAttribute("data-ok-cell")).toBe("0,0");
  });
});
