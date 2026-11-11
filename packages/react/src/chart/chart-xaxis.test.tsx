import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Chart } from "./chart.js";

/* X axis options, forecasts, no-data messages and text annotations (4.18.65) in React. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SALES = [{ name: "Sales", data: [1, 2, 3, 4, 5, 6] }];

describe("Chart x axis and forecast", () => {
  it("writes the options and draws groups, a window and a forecast", async () => {
    const { container } = render(
      <Chart
        label="Sales"
        categories={MONTHS}
        xMin={1}
        xMax={4}
        xaxisGroups={[
          { title: "H1", cols: 3 },
          { title: "H2", cols: 3 },
        ]}
        forecastCount={3}
        series={SALES}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-x-min")).toBe("1");
    expect(root.getAttribute("data-ok-xaxis-groups")).toBe("3 H1; 3 H2");
    expect(root.getAttribute("data-ok-forecast-count")).toBe("3");
    expect(root.querySelectorAll("[data-ok-chart-axis-group]")).toHaveLength(2);
    expect(root.querySelector("tbody th")?.getAttribute("aria-label")).toBe("H1, Jan");
    expect(root.querySelector("[data-ok-chart-forecast]")).not.toBeNull();
    await expectNoAxeViolations(container);
  });

  it("shows the no-data message and adds it to the plot's name", async () => {
    const { container } = render(
      <Chart
        label="Sales"
        noDataText="No sales yet"
        categories={[]}
        series={[{ name: "Sales", data: [] }]}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-no-data-text")).toBe("No sales yet");
    expect(root.querySelector("[data-ok-chart-no-data]")?.textContent).toBe("No sales yet");
    expect(root.querySelector("[data-ok-chart-plot]")?.getAttribute("aria-label")).toBe(
      "Sales: No sales yet",
    );
    await expectNoAxeViolations(container);
  });

  it("draws text annotations and joins a list of brush targets", () => {
    const { container } = render(
      <Chart
        label="Sales"
        brushTarget={["a", "b"]}
        categories={MONTHS}
        annotations={[{ axis: "text", x: "Mar", y: 2, label: "Note", textAnchor: "start" }]}
        series={SALES}
      />,
    );
    const root = container.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.getAttribute("data-ok-brush-target")).toBe("a b");
    // A list of empty ids is no brush at all.
    const { container: none } = render(
      <Chart label="Plain" brushTarget={["", ""]} categories={MONTHS} series={SALES} />,
    );
    expect(none.querySelector("[data-ok-chart]")?.hasAttribute("data-ok-brush-target")).toBe(false);
    expect(root.querySelector("[data-ok-chart-annotation-text]")?.textContent).toBe("Note");
    expect(
      root
        .querySelector('[data-ok-chart-annotations] li[data-ok-annotation="text"]')
        ?.getAttribute("data-ok-text-anchor"),
    ).toBe("start");
  });
});
