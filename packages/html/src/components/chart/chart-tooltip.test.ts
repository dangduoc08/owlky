import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import custom from "./examples/tooltip-custom-group.html?raw";
import options from "./examples/tooltip-group.html?raw";

/* Tooltips (4.18.63) in the HTML runtime: modes, a fixed corner and template content. */

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
const key = (root: Element, name: string) =>
  root
    .querySelector("[data-ok-chart-plot]")
    ?.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
const tipOf = (root: Element) =>
  root.querySelector("[data-ok-chart-plot] > [data-ok-chart-tooltip]") as HTMLElement;

describe("tooltip", () => {
  it("point mode, a fixed corner and none", async () => {
    const host = mount(options);
    host.style.width = "600px";
    start();
    const [point, fixed, none] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    key(point as HTMLElement, "Home");
    expect(
      tipOf(point as HTMLElement).querySelectorAll("[data-ok-chart-tooltip-row]"),
    ).toHaveLength(1);
    key(fixed as HTMLElement, "End");
    const left = Number.parseFloat(
      tipOf(fixed as HTMLElement).style.getPropertyValue("--_ok-chart-tip-x"),
    );
    expect(left).toBeLessThan(100);
    key(none as HTMLElement, "Home");
    expect(tipOf(none as HTMLElement).hidden).toBe(false);
    expect(tipOf(none as HTMLElement).getBoundingClientRect().width).toBeLessThanOrEqual(1);
    await expectNoAxeViolations(host);
    (point as HTMLElement).setAttribute("data-ok-tooltip-mode", "shared");
    await settle();
    key(point as HTMLElement, "Home");
    expect(
      tipOf(point as HTMLElement).querySelectorAll("[data-ok-chart-tooltip-row]"),
    ).toHaveLength(2);
  });

  it("fills the template's slots as text", () => {
    const host = mount(custom);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    key(root, "Home");
    const tip = tipOf(root);
    expect(tip.querySelector("[data-ok-chart-tooltip-title]")?.textContent).toBe("Orders on Mon");
    expect(tip.querySelector("[data-ok-chart-tooltip-state]")).toBeNull();
    const rows = [...tip.querySelectorAll("[data-ok-chart-tooltip-row]")];
    expect(rows.map((row) => row.textContent?.replace(/\s+/g, ""))).toEqual([
      "Online23",
      "Instore10",
    ]);
    expect(
      rows[0]?.querySelector("[data-ok-chart-tooltip-marker]")?.getAttribute("data-ok-color"),
    ).toBe("primary-dark");
    // Selected: the state slot stays.
    key(root, "Enter");
    expect(tip.querySelector("[data-ok-chart-tooltip-state]")?.textContent).toBe("Selected");
    // The template itself is never shown or changed.
    const template = root.querySelector("template") as HTMLTemplateElement;
    expect(template.content.querySelectorAll("[data-ok-chart-tooltip-row]")).toHaveLength(1);
  });
});
