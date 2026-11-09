import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import basic from "./examples/stock-group.html?raw";
import line from "./examples/stock-line-group.html?raw";
import oscillators from "./examples/stock-oscillators-group.html?raw";
import overlays from "./examples/stock-overlays-group.html?raw";

/* Stock charts in the HTML runtime (ADR-0047, phase 2.2). */

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
};
const sized = (html: string, width = 700) => {
  const host = mount(html);
  host.style.width = `${width}px`;
  return host;
};
const key = (target: HTMLElement, value: string) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: value }),
  );

describe("chart runtime (stock)", () => {
  it("draws every snippet: panes, navigator, indicator columns kept", async () => {
    const host = sized([basic, overlays, oscillators, line].join(""));
    start();
    const roots = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")];
    expect(roots.map((r) => r.querySelectorAll("[data-ok-chart-pane]").length)).toEqual([
      2, 1, 4, 3,
    ]);
    expect(roots.map((r) => r.querySelector("[data-ok-chart-navigator]") !== null)).toEqual([
      true,
      false,
      true,
      true,
    ]);
    // The table keeps its indicator columns (rewritten in place, same text).
    expect(roots[2]?.querySelectorAll("th[data-ok-indicator]")).toHaveLength(6);
    await expectNoAxeViolations(host);
  });

  it("recomputes indicators when the attribute or the table changes", async () => {
    const host = sized(basic);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-indicators", "ema 10 info; rsi 7");
    await settle();
    const headers = [...root.querySelectorAll("thead th[data-ok-indicator]")].map(
      (th) => th.textContent,
    );
    expect(headers).toEqual(["EMA 10", "RSI 7"]);
    expect(root.querySelectorAll("[data-ok-chart-pane]")).toHaveLength(2);
    // A new close moves the last EMA value.
    const last = () => root.querySelector("tbody tr:last-child td:nth-last-child(2)")?.textContent;
    const before = last();
    const close = root.querySelector("tbody tr:last-child td:nth-child(5)") as HTMLElement;
    close.setAttribute("data-ok-value", "200");
    await settle();
    expect(last()).not.toBe(before);
    // updateSeries keeps the indicators.
    const chart = runtime?.get<ChartInstance>(root, "chart") as ChartInstance;
    chart.updateSeries(
      [
        {
          name: "ACME",
          data: [
            { y: [1, 2, 0.5, 1.5], v: 3 },
            { y: [1.5, 3, 1, 2], v: 4 },
          ],
        },
      ],
      ["2025-01-02", "2025-01-03"],
    );
    expect(root.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(root.querySelector("thead th[data-ok-indicator]")).not.toBeNull();
  });

  it("zooms from the keyboard (the navigator turns zoom on) and reads every pane", async () => {
    const host = sized(oscillators);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "End");
    const rows = root.querySelectorAll("[data-ok-chart-tooltip-row]");
    expect(rows).toHaveLength(4 + 1 + 3 + 2);
    key(plot, "Escape");
    key(plot, "+");
    const chart = runtime?.get<ChartInstance>(root, "chart") as ChartInstance;
    expect(chart.zoomRange).not.toBeNull();
    await settle();
    const selection = root.querySelector("[data-ok-chart-navigator] [data-ok-chart-selection]");
    expect(Number(selection?.getAttribute("width"))).toBeLessThan(500);
  });
});
