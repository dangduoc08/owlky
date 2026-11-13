import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GridChart, preloadGridChart } from "./grid-chart.js";

// This file never preloads: the Chart module is not in yet when the first test renders.
const props = {
  id: "c",
  label: "Units",
  categories: ["Tea", "Coffee"],
  series: [{ name: "Units", data: [3, { x: "Coffee", y: 5 }] }],
} as const;

describe("GridChart (ADR-0068 S5)", () => {
  it("renders the chart's root and data table until the Chart loads, then the Chart", async () => {
    const { container } = render(<GridChart {...props} />);
    const figure = container.querySelector("figure[data-ok-chart]") as HTMLElement;
    expect(figure.getAttribute("data-ok-runtime")).toBe("off");
    expect(figure.getAttribute("aria-busy")).toBe("true");
    expect(figure.querySelector("caption")?.textContent).toBe("Units");
    expect(
      [...figure.querySelectorAll("tbody tr")].map((row) =>
        [...row.children].map((cell) => cell.textContent),
      ),
    ).toEqual([
      ["Tea", "3"],
      ["Coffee", "5"],
    ]);
    await act(async () => {
      await preloadGridChart();
    });
    const chart = container.querySelector("figure[data-ok-chart]") as HTMLElement;
    expect(chart.hasAttribute("aria-busy")).toBe(false);
    expect(chart.hasAttribute("data-ok-ready")).toBe(true);
    expect(chart.querySelector("svg")).not.toBeNull();
  });

  it("renders the Chart at once, on the server too, once loaded", async () => {
    await preloadGridChart();
    expect(renderToString(<GridChart {...props} />)).toContain("data-ok-ready");
    const { container } = render(<GridChart {...props} />);
    expect(container.querySelector("figure svg")).not.toBeNull();
  });
});
