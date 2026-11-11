import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import streamgraph from "./examples/streamgraph-group.html?raw";

/* Streamgraphs (4.18.21) in the HTML runtime. */

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
  return runtime;
};

describe("streamgraph", () => {
  it("reads the table and draws one band per series", async () => {
    const host = mount(streamgraph);
    start();
    const [first, second] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect((first as Element).querySelectorAll("[data-ok-chart-stream-band]")).toHaveLength(5);
    expect(
      (second as Element).querySelector("[data-ok-chart-stream-band]")?.getAttribute("fill"),
    ).toMatch(/^url\(#/);
    await expectNoAxeViolations(host);
  });

  it("redraws on option changes and reads bands and the total with the keyboard", async () => {
    const host = mount(streamgraph);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const before = root.querySelector("[data-ok-chart-stream-band]")?.getAttribute("d");
    root.setAttribute("data-ok-stream-offset", "zero");
    root.setAttribute("data-ok-stream-order", "none");
    root.setAttribute("data-ok-hide-stream-labels", "");
    root.setAttribute("data-ok-stream-label-min-width", "30");
    root.setAttribute("data-ok-stream-hover-opacity", "0.5");
    await settle();
    expect(root.querySelector("[data-ok-chart-stream-band]")?.getAttribute("d")).not.toBe(before);
    expect(root.querySelector("[data-ok-chart-data-label]")).toBeNull();
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await settle();
    const rows = [...root.querySelectorAll("[data-ok-chart-tooltip-row]")];
    expect(rows.at(-1)?.textContent).toBe("Total162k");
    expect(rows).toHaveLength(6);
  });
});
