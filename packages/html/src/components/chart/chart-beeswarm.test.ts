import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import beeswarm from "./examples/beeswarm-group.html?raw";

/* Beeswarm charts (4.18.21) in the HTML runtime. */

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

describe("beeswarm", () => {
  it("reads observations from the table", async () => {
    const host = mount(beeswarm);
    start();
    const [first, second] = [...host.querySelectorAll("[data-ok-chart]")] as HTMLElement[];
    expect((first as Element).querySelectorAll("[data-ok-chart-bee]")).toHaveLength(29);
    expect((second as Element).querySelectorAll("[data-ok-chart-bee]")).toHaveLength(24);
    await expectNoAxeViolations(host);
  });

  it("redraws on options and reads observations with the keyboard", async () => {
    const host = mount(beeswarm);
    start();
    const root = host.querySelector("[data-ok-chart]") as HTMLElement;
    root.setAttribute("data-ok-beeswarm-spread", "jitter");
    root.setAttribute("data-ok-orientation", "vertical");
    await settle();
    const plot = root.querySelector("[data-ok-chart-plot]") as HTMLElement;
    plot.focus();
    plot.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await settle();
    expect(root.querySelector("[data-ok-chart-tooltip-row]")?.textContent).toMatch(/\d+k$/);
  });
});
