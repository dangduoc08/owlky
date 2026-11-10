import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { TooltipInstance } from "./tooltip.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("tooltip snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: every tooltip follows its trigger and is named by it", (_, html) => {
    const host = mount(html);
    for (const tooltip of host.querySelectorAll("[data-ok-tooltip]")) {
      expect(tooltip.getAttribute("role")).toBe("tooltip");
      expect(tooltip.getAttribute("popover")).toBe("manual");
      const trigger = tooltip.previousElementSibling as Element;
      const ref =
        trigger.getAttribute("aria-labelledby") ?? trigger.getAttribute("aria-describedby");
      expect(ref).toBe(tooltip.id);
    }
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

const markup = `
  <button type="button" id="b" aria-labelledby="t">+</button>
  <div id="t" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="top" data-ok-arrow data-ok-enter-delay="400"><span data-ok-tooltip-arrow aria-hidden="true"></span>Add</div>
  <button type="button" id="c" aria-describedby="other t2">Save</button>
  <div id="t2" role="tooltip" popover="manual" data-ok-tooltip>Saves</div>
  <button type="button" id="plain" aria-describedby="nothing">Plain</button>
  <span id="other">Other</span>`;

describe("tooltip runtime", () => {
  it("hover opens after the delay, leaving closes; the tooltip is hoverable", async () => {
    const host = mount(markup);
    start();
    const button = host.querySelector("#b") as HTMLElement;
    const tooltip = host.querySelector("#t") as HTMLElement;
    const events: string[] = [];
    tooltip.addEventListener("ok:tooltip:open", () => events.push("open"));
    tooltip.addEventListener("ok:tooltip:close", () => events.push("close"));
    await userEvent.hover(button);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
    await wait(450);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    expect(tooltip.matches(":popover-open")).toBe(true);
    // No room above a trigger at the top of the page: it flips below.
    expect(tooltip.getAttribute("data-ok-current-placement")).toBe("bottom");
    await userEvent.hover(tooltip);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.unhover(tooltip);
    await wait(150);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
    expect(events).toEqual(["open", "close"]);
  });

  it("data-ok-follow-cursor moves it with the pointer; data-ok-enter-next-delay", async () => {
    const host = mount(`
      <button type="button" id="area" aria-describedby="ft" style="width: 200px; height: 100px">Area</button>
      <div id="ft" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom-start"
        data-ok-enter-delay="300" data-ok-enter-next-delay="0" data-ok-follow-cursor>Here</div>
      <button type="button" id="other" aria-describedby="ot">Other</button>
      <div id="ot" role="tooltip" popover="manual" data-ok-tooltip data-ok-enter-delay="0">Other tip</div>`);
    start();
    const button = host.querySelector("#area") as HTMLElement;
    const tooltip = host.querySelector("#ft") as HTMLElement;
    // Another tooltip shows: the next one opens after enterNextDelay, not enterDelay.
    await userEvent.hover(host.querySelector("#other") as HTMLElement);
    await wait(30);
    const box = button.getBoundingClientRect();
    await userEvent.hover(button, { position: { x: 20, y: 30 } });
    await wait(30);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    const y = () => Number.parseFloat(tooltip.style.getPropertyValue("--_ok-popover-y"));
    const first = y();
    expect(first).toBeGreaterThan(box.y + 30);
    await userEvent.hover(button, { position: { x: 60, y: 70 } });
    expect(y() - first).toBeCloseTo(40, 0);
    // Without the flag, moving doesn't reposition it.
    tooltip.removeAttribute("data-ok-follow-cursor");
    await userEvent.hover(button, { position: { x: 60, y: 10 } });
    expect(y() - first).toBeCloseTo(40, 0);
  });

  it("keyboard focus opens it at once; Escape and blur close it; focus stays", async () => {
    const host = mount(markup);
    start();
    const save = host.querySelector("#c") as HTMLElement;
    const tooltip = host.querySelector("#t2") as HTMLElement;
    (host.querySelector("#b") as HTMLElement).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(save);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(save);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await userEvent.keyboard("{Tab}");
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    save.blur();
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
  });

  it("instance show / hide; mouse focus doesn't open it; plain describedby is ignored", async () => {
    const host = mount(markup);
    const rt = start();
    const tooltip = host.querySelector("#t") as HTMLElement;
    const instance = rt.get<TooltipInstance>(tooltip, "tooltip") as TooltipInstance;
    instance.show();
    expect(instance.isOpen).toBe(true);
    instance.hide();
    expect(instance.isOpen).toBe(false);
    instance.show(host.querySelector("#b") as Element);
    expect(instance.isOpen).toBe(true);
    instance.hide();
    await userEvent.click(host.querySelector("#plain") as HTMLElement);
    await userEvent.hover(host.querySelector("#plain") as HTMLElement);
    expect(host.querySelectorAll("[data-ok-open]")).toHaveLength(0);
  });

  it("touch: a long press opens it, it closes after release", async () => {
    const host = mount(markup);
    start();
    const button = host.querySelector("#b") as HTMLElement;
    const tooltip = host.querySelector("#t") as HTMLElement;
    const touch = (type: string) =>
      button.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "touch" }));
    touch("pointerover");
    touch("pointerdown");
    await wait(750);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    touch("pointerup");
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    touch("pointerdown");
    touch("pointercancel");
  });

  it("a tooltip without a trigger can't open; touch on a plain trigger is ignored", () => {
    const host = mount(
      `${markup}<div id="lone" role="tooltip" popover="manual" data-ok-tooltip>Lone</div>`,
    );
    const rt = start();
    const lone = rt.get<TooltipInstance>(host.querySelector("#lone"), "tooltip") as TooltipInstance;
    lone.show();
    expect(lone.isOpen).toBe(false);
    lone.hide();
    (host.querySelector("#plain") as HTMLElement).dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
    );
    expect(host.querySelectorAll("[data-ok-open]")).toHaveLength(0);
  });

  it("ignores React-owned tooltips", async () => {
    const host = mount(`
      <button type="button" aria-labelledby="r">+</button>
      <div id="r" role="tooltip" popover="manual" data-ok-tooltip data-ok-runtime="off">Add</div>`);
    start();
    await userEvent.hover(host.querySelector("button") as HTMLElement);
    await wait(150);
    expect((host.querySelector("#r") as HTMLElement).hasAttribute("data-ok-open")).toBe(false);
  });
});
