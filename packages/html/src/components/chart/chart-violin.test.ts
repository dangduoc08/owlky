import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import violin from "./examples/violin-group.html?raw";

/* Violin charts (4.18.21) in the HTML runtime. */

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

describe("violin", () => {
  it("reads observations and precomputed curves from the table", async () => {
    const host = mount(violin);
    start();
    const [first, second] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect((first as Element).querySelectorAll("[data-ok-chart-violin]")).toHaveLength(3);
    expect((first as Element).querySelectorAll("[data-ok-chart-violin-box]")).toHaveLength(3);
    expect(
      (first as Element).querySelectorAll("[data-ok-chart-violin-point]").length,
    ).toBeGreaterThan(40);
    expect((second as Element).querySelectorAll("[data-ok-chart-violin]")).toHaveLength(4);
    expect(
      (second as Element).querySelector("[data-ok-chart-violin]")?.getAttribute("fill"),
    ).toMatch(/^url\(#/);
    expect((second as Element).querySelector("[data-ok-chart-violin-point]")).toBeNull();
    await expectNoAxeViolations(host);
  });

  it("redraws on options and reads the summary with the keyboard", async () => {
    const host = mount(violin);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-violin-whiskers", "tukey");
    root.setAttribute("data-ok-violin-side", "left");
    root.setAttribute("data-ok-violin-normalize", "group");
    root.setAttribute("data-ok-bandwidth-scale", "1.1");
    root.setAttribute("data-ok-kde-bandwidth", "2");
    root.setAttribute("data-ok-kde-resolution", "16");
    root.setAttribute("data-ok-violin-point-size", "3");
    root.setAttribute("data-ok-violin-jitter", "0.1");
    root.setAttribute("data-ok-violin-max-points", "2");
    root.setAttribute("data-ok-unconstrained-violin-points", "");
    root.setAttribute("data-ok-hide-violin-points", "");
    await settle();
    expect(root.querySelector("[data-ok-chart-violin-point]")).toBeNull();
    root.removeAttribute("data-ok-hide-violin-points");
    await settle();
    expect(root.querySelectorAll("[data-ok-chart-violin-point]")).toHaveLength(6);
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await settle();
    const rows = [...root.querySelectorAll("[data-ok-chart-tooltip-row]")];
    expect(rows.at(-1)?.textContent).toBe("Count16");
    expect(rows).toHaveLength(6);
  });
});
