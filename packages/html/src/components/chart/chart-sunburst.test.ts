import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { ChartInstance } from "./chart.js";
import sunburst from "./examples/sunburst-group.html?raw";

/* Sunburst charts in the HTML runtime (ADR-0058, roadmap 4.18.21). */

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
const instance = (root: Element) => runtime?.get<ChartInstance>(root, "chart") as ChartInstance;
const arcs = (root: Element) => root.querySelectorAll("path[data-ok-chart-arc]");

describe("chart runtime (sunburst)", () => {
  it("draws every snippet from its nodes table, accessibly", async () => {
    const host = sized(sunburst);
    start();
    const [first, half] = [...host.querySelectorAll<HTMLElement>("[data-ok-chart]")] as [
      HTMLElement,
      HTMLElement,
    ];
    expect(arcs(first)).toHaveLength(14);
    // Drill controls: the Back button hidden while not drilled, an empty status.
    const drill = first.querySelector(":scope > [data-ok-chart-drill]") as HTMLElement;
    expect(drill.nextElementSibling?.hasAttribute("data-ok-chart-plot")).toBe(true);
    expect((drill.firstElementChild as HTMLButtonElement).hidden).toBe(true);
    expect(drill.textContent).toBe("Back");
    // No zoom on click: no drill controls.
    expect(half.querySelector("[data-ok-chart-drill]")).toBeNull();
    await expectNoAxeViolations(host);
  });

  it("drills with Enter and back with Escape and the Back button", async () => {
    const host = sized(sunburst);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const events: unknown[] = [];
    root.addEventListener("ok:chart:drill", (event) => {
      events.push((event as CustomEvent).detail);
    });
    key(plot, "Home");
    key(plot, "ArrowDown");
    expect(title(root)).toBe("Storage");
    key(plot, "Enter");
    expect(events).toEqual([{ id: "Storage", path: ["Storage"] }]);
    expect(root.getAttribute("data-ok-drill-node")).toBe("Storage");
    expect(arcs(root)).toHaveLength(6);
    expect(title(root)).toBe("Storage");
    const back = root.querySelector("[data-ok-chart-drill-up]") as HTMLButtonElement;
    expect(back.hidden).toBe(false);
    expect(root.querySelector("[data-ok-chart-drill-path]")?.textContent).toBe("Storage");
    await expectNoAxeViolations(host);
    // Into Backups, then up with Escape, then Back to the top (the plot takes focus).
    key(plot, "ArrowRight");
    key(plot, "ArrowDown");
    key(plot, "ArrowDown");
    expect(title(root)).toBe("Storage › Backups");
    key(plot, " ");
    expect(root.querySelector("[data-ok-chart-drill-path]")?.textContent).toBe("Storage › Backups");
    key(plot, "Escape");
    expect(root.getAttribute("data-ok-drill-node")).toBe("Storage");
    expect(title(root)).toBe("Storage › Backups");
    back.focus();
    back.click();
    expect(root.hasAttribute("data-ok-drill-node")).toBe(false);
    expect(back.hidden).toBe(true);
    expect(document.activeElement).toBe(plot);
    expect(events).toHaveLength(4);
    // Escape at the top hides the tooltip.
    key(plot, "Home");
    key(plot, "Escape");
    expect(title(root)).toBeNull();
  });

  it("drills on click, refuses when prevented, and follows the instance and the attribute", async () => {
    const host = sized(sunburst);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    const compute = arcs(root)[0] as SVGPathElement;
    const box = compute.getBoundingClientRect();
    // A point inside the Compute arc, toward the middle of its bounding box (the drill row keeps
    // its height, so the plot stays in place when the chart drills).
    const svg = root.querySelector("svg") as SVGSVGElement;
    const frame = svg.getBoundingClientRect();
    const cx = frame.x + frame.width / 2;
    const cy = frame.y + frame.height / 2;
    const angle = Math.atan2(box.x + box.width / 2 - cx, cy - (box.y + box.height / 2));
    const at = {
      bubbles: true,
      clientX: cx + Math.sin(angle) * 60,
      clientY: cy - Math.cos(angle) * 60,
    };
    plot.dispatchEvent(new PointerEvent("pointermove", at));
    expect(title(root)).toBe("Compute");
    root.addEventListener("ok:chart:drill", (event) => event.preventDefault(), { once: true });
    plot.dispatchEvent(new MouseEvent("click", at));
    expect(root.hasAttribute("data-ok-drill-node")).toBe(false);
    plot.dispatchEvent(new MouseEvent("click", at));
    expect(root.getAttribute("data-ok-drill-node")).toBe("Compute");
    // The center disc goes up.
    plot.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: cx, clientY: cy }));
    expect(root.hasAttribute("data-ok-drill-node")).toBe(false);
    instance(root).setDrillNode("Network");
    expect(instance(root).drillNode).toBe("Network");
    expect(arcs(root)).toHaveLength(3);
    instance(root).setDrillNode(null);
    expect(arcs(root)).toHaveLength(14);
    root.setAttribute("data-ok-drill-node", "Compute");
    await settle();
    expect(arcs(root)).toHaveLength(4);
    instance(root).setLocaleText({ drillUp: "Zurück" });
    expect(root.querySelector("[data-ok-chart-drill-up]")?.textContent).toBe("Zurück");
    // Turning zoom on click off removes the controls; Enter does nothing.
    root.setAttribute("data-ok-disable-zoom-on-click", "");
    await settle();
    expect(root.querySelector("[data-ok-chart-drill]")).toBeNull();
    key(plot, "Home");
    key(plot, "Enter");
    key(plot, "Escape");
    expect(root.getAttribute("data-ok-drill-node")).toBe("Compute");
  });
});
