import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import dataLabels from "./examples/column-data-labels-group.html?raw";
import stacked100 from "./examples/column-stacked-100-group.html?raw";
import totals from "./examples/stack-totals-group.html?raw";

/* Stacks and bars (4.18.61) in the HTML runtime. */

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
const ticks = (root: Element) =>
  [...root.querySelectorAll('[data-ok-chart-axis="y"] text')].map((t) => t.textContent);

describe("stacks and bars", () => {
  it("reads 100% stacks and redraws when the stack type changes", async () => {
    const host = mount(stacked100);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(ticks(root).at(-1)).toBe("100%");
    await expectNoAxeViolations(host);
    root.setAttribute("data-ok-stack-type", "normal");
    await settle();
    expect(ticks(root).at(-1)).not.toBe("100%");
  });

  it("prints stack totals; stackOnlyBar keeps the line apart", async () => {
    const host = mount(totals);
    start();
    const [first, second] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(
      [...(first as Element).querySelectorAll('[data-ok-chart-data-label="total"]')].map(
        (t) => t.textContent,
      ),
    ).toEqual(["63", "72", "94", "99", "66", "105"]);
    const line = (second as Element).querySelector('[data-ok-type="line"] [data-ok-chart-line]');
    const before = line?.getAttribute("d");
    (second as Element).removeAttribute("data-ok-stack-only-bar");
    await settle();
    expect(line?.getAttribute("d")).not.toBe(before);
  });

  it("draws background bars from the attributes", async () => {
    const host = mount(dataLabels);
    start();
    const [grey, colored] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(grey?.querySelectorAll("[data-ok-chart-background-bar]")).toHaveLength(9);
    const tracks = [...(colored as Element).querySelectorAll("[data-ok-chart-background-bar]")];
    expect(tracks.map((t) => t.getAttribute("data-ok-color"))).toEqual([
      "success-lighter",
      "info-lighter",
      "success-lighter",
      "info-lighter",
      "success-lighter",
    ]);
    expect(tracks[0]?.getAttribute("fill-opacity")).toBe("0.48");
    (colored as Element).setAttribute("data-ok-background-bar-radius", "0");
    await settle();
    expect(colored?.querySelector("[data-ok-chart-background-bar]")?.getAttribute("rx")).toBe("0");
  });
});
