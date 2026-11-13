import { describe, expect, it, vi } from "vitest";
import type { Runtime } from "../../runtime/types.js";

/**
 * The grid's chart helpers wait for the Chart's stylesheet (ADR-0068 S4): `runtime.load("chart")`
 * attaches `modules/chart.css` on the CDN, so the kit is ready only once it has finished. The kit
 * is module state, so each test imports a fresh copy.
 */
const fresh = async () => {
  vi.resetModules();
  return import("./chart-kit.js");
};
const runtimeWith = (load: () => Promise<void>) => ({ load: vi.fn(load) }) as unknown as Runtime;

describe("data grid chart helpers and the Chart's stylesheet", () => {
  it("are ready only after the chart module and its stylesheet have loaded", async () => {
    const { gridChartKit, loadGridChartKit } = await fresh();
    let release: () => void = () => {};
    const sheet = new Promise<void>((resolve) => {
      release = resolve;
    });
    const runtime = runtimeWith(() => sheet);
    const loading = loadGridChartKit(runtime);
    // The engine is in a moment later; the kit still waits for the stylesheet.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(runtime.load).toHaveBeenCalledWith("chart");
    expect(gridChartKit()).toBeUndefined();
    release();
    await loading;
    expect(gridChartKit()).toBeDefined();
  });

  it("go on when the module can't load (no loader, or a failed stylesheet)", async () => {
    const { gridChartKit, loadGridChartKit } = await fresh();
    await loadGridChartKit(runtimeWith(() => Promise.reject(new Error("offline"))));
    expect(gridChartKit()).toBeDefined();
  });
});
