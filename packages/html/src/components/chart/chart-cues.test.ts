import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import colorBlind from "./examples/color-blind-group.html?raw";
import dashed from "./examples/dashed-lines-group.html?raw";
import shapes from "./examples/marker-shapes-group.html?raw";
import patterns from "./examples/patterns-group.html?raw";

/* Non-color series cues (4.18.62) in the HTML runtime. */

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

describe("series cues", () => {
  it("reads marker shapes from the column headers and discrete markers from the root", async () => {
    const host = mount(shapes);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    expect(root.querySelectorAll('[data-ok-chart-marker][data-ok-shape="triangle"]')).toHaveLength(
      7,
    );
    expect(
      root
        .querySelector('[data-ok-chart-marker][data-ok-shape="star"]')
        ?.getAttribute("data-ok-color"),
    ).toBe("error");
    expect(
      [...root.querySelectorAll("[data-ok-chart-legend-marker]")].map((m) =>
        m.getAttribute("data-ok-shape"),
      ),
    ).toEqual([null, "square", "triangle"]);
    await expectNoAxeViolations(host);
    root
      .querySelector('thead th[data-ok-marker-shape="square"]')
      ?.setAttribute("data-ok-marker-shape", "plus");
    root.removeAttribute("data-ok-discrete-markers");
    await settle();
    expect(root.querySelectorAll('[data-ok-chart-marker][data-ok-shape="plus"]')).toHaveLength(7);
    expect(root.querySelector('[data-ok-shape="star"]')).toBeNull();
    expect(
      root.querySelectorAll('[data-ok-chart-legend-marker][data-ok-shape="plus"]'),
    ).toHaveLength(1);
  });

  it("draws widths and dashes per series", () => {
    const host = mount(dashed);
    start();
    const lines = [...host.querySelectorAll("[data-ok-chart-line]")];
    expect(
      lines.map((l) => [l.getAttribute("stroke-width"), l.getAttribute("stroke-dasharray")]),
    ).toEqual([
      ["4", null],
      ["5", "8"],
      ["3", "4"],
    ]);
  });

  it("fills bars and slices with patterns; colorBlindMode turns cues on", async () => {
    const host = mount(patterns);
    start();
    const [bars, pie] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect(bars?.querySelectorAll("pattern")).toHaveLength(3);
    expect(pie?.querySelector("[data-ok-chart-slice]")?.getAttribute("fill")).toMatch(/^url\(#/);
    (bars as HTMLElement).setAttribute("data-ok-fill-pattern", "squares");
    await settle();
    expect(
      [...(bars as HTMLElement).querySelectorAll("pattern")].map((p) =>
        p.getAttribute("data-ok-chart-pattern"),
      ),
    ).toEqual(["squares", "squares", "squares"]);
    resetPage();
    runtime?.stop();
    const other = mount(colorBlind);
    start();
    const line = other.querySelector("[data-ok-chart]") as HTMLElement;
    expect(line.querySelectorAll("[data-ok-chart-marker]")).toHaveLength(27);
    line.removeAttribute("data-ok-color-blind-mode");
    await settle();
    expect(line.querySelectorAll("[data-ok-chart-marker]")).toHaveLength(0);
  });
});
