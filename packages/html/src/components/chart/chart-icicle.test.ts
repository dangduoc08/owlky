import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import icicle from "./examples/icicle-group.html?raw";

/* Icicle charts in the HTML runtime (ADR-0058, roadmap 4.18.21). */

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
const sized = (html: string, width = 600) => {
  const host = mount(html);
  host.style.width = `${width}px`;
  return host;
};
const title = (root: Element) =>
  root.querySelector("[data-ok-chart-tooltip-title]")?.textContent ?? null;
const key = (target: HTMLElement, value: string) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: value }),
  );
const cells = (root: Element) => root.querySelectorAll("rect[data-ok-chart-icicle-cell]");

describe("chart runtime (icicle)", () => {
  it("draws every snippet from its nodes table, accessibly", async () => {
    const host = sized(icicle);
    start();
    const [first, sources] = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")] as [
      HTMLElement,
      HTMLElement,
    ];
    expect(cells(first)).toHaveLength(13);
    expect(cells(sources)).toHaveLength(8);
    // Icicle leaves stop at their band by default (DNS is as tall as the root's band).
    const [rootCell, , dns] = [...cells(first)];
    expect(dns?.getAttribute("height")).toBe(rootCell?.getAttribute("height"));
    expect(first.querySelector("[data-ok-chart-drill]")).not.toBeNull();
    // Left icicles: the roots in the first column.
    const [search] = [...cells(sources)];
    expect(search?.getAttribute("x")).toBe("0");
    await expectNoAxeViolations(host);
  });

  it("drills into a branch with the keyboard and a click, and back", () => {
    const host = sized(icicle);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "Home");
    key(plot, "ArrowDown");
    key(plot, "ArrowRight");
    expect(title(root)).toBe("Page load › Scripts");
    key(plot, "Enter");
    expect(root.getAttribute("data-ok-drill-node")).toBe("Scripts");
    // The ancestor stays as a band above the branch (zoomType value).
    expect(cells(root)).toHaveLength(6);
    expect(root.querySelector("[data-ok-chart-drill-path]")?.textContent).toBe(
      "Page load › Scripts",
    );
    // A click on the ancestor's band zooms out to it.
    const top = cells(root)[0] as SVGRectElement;
    const box = top.getBoundingClientRect();
    plot.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height / 2,
      }),
    );
    expect(root.getAttribute("data-ok-drill-node")).toBe("Page load");
    expect(cells(root)).toHaveLength(13);
    key(plot, "Escape");
    expect(root.hasAttribute("data-ok-drill-node")).toBe(false);
  });

  it("makes the branch the top level with zoomType both", () => {
    const host = sized(icicle);
    start();
    const root = host.querySelectorAll("[data-ok-chart]")[1] as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    key(plot, "Home");
    expect(title(root)).toBe("Search");
    key(plot, "Enter");
    expect(cells(root)).toHaveLength(3);
    expect(cells(root)[0]?.getAttribute("height")).toBe(
      String(root.querySelector("svg")?.getAttribute("height")),
    );
  });
});
