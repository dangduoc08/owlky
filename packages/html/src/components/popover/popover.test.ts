import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { PopoverInstance } from "./popover.js";

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

describe("popover snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(2));

  it.each(snippets)("%s: valid anatomy; every trigger names a popover", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const popover of host.querySelectorAll("[data-ok-popover]")) {
      expect(popover.getAttribute("popover")).toBe("manual");
      expect(popover.id).not.toBe("");
      if (popover.hasAttribute("data-ok-arrow"))
        expect(
          popover.querySelector(":scope > [data-ok-popover-arrow][aria-hidden]"),
        ).not.toBeNull();
    }
    for (const trigger of host.querySelectorAll(
      "[data-ok-popover-open], [data-ok-popover-hover]",
    )) {
      const id =
        trigger.getAttribute("data-ok-popover-open") ??
        trigger.getAttribute("data-ok-popover-hover");
      expect(host.querySelector(`#${id}`)?.hasAttribute("data-ok-popover")).toBe(true);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations, closed and open", async (_, html) => {
    const host = mount(html);
    start();
    await expectNoAxeViolations(host);
    (host.querySelector("[data-ok-popover-open]") as HTMLElement).click();
    await settle();
    await expectNoAxeViolations(host);
  });
});

const markup = `
  <button type="button" id="t" aria-haspopup="dialog" data-ok-popover-open="p">Open</button>
  <button type="button" id="h" data-ok-popover-hover="p2">Hover</button>
  <div id="p" popover="manual" data-ok-popover data-ok-placement="bottom" data-ok-arrow role="dialog" aria-label="P">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <button type="button" id="inside">Inside</button>
  </div>
  <div id="p2" popover="manual" data-ok-popover data-ok-placement="top">Hint</div>
  <button type="button" id="outside">Outside</button>`;

describe("popover runtime", () => {
  it("a trigger toggles it, syncs aria-expanded, moves focus in and back, emits events", async () => {
    const host = mount(markup);
    start();
    const trigger = host.querySelector("#t") as HTMLElement;
    const popover = host.querySelector("#p") as HTMLElement;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe("p");
    const events: string[] = [];
    for (const type of ["beforeopen", "open", "beforeclose", "close"])
      popover.addEventListener(`ok:popover:${type}`, (e) =>
        events.push(`${type}:${(e as CustomEvent).detail?.reason ?? ""}`),
      );
    await userEvent.click(trigger);
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
    expect(popover.matches(":popover-open")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.id).toBe("inside");
    expect(popover.getAttribute("data-ok-current-placement")).toBe("bottom");
    expect(popover.style.getPropertyValue("--_ok-popover-arrow")).not.toBe("");
    await userEvent.keyboard("{Escape}");
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.click(host.querySelector("#outside") as HTMLElement);
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(events).toEqual([
      "beforeopen:",
      "open:",
      "beforeclose:escape",
      "close:escape",
      "beforeopen:",
      "open:",
      "beforeclose:backdrop",
      "close:backdrop",
      "beforeopen:",
      "open:",
      "beforeclose:trigger",
      "close:trigger",
    ]);
  });

  it("cancelable events; the instance API; Escape disabled", async () => {
    const host = mount(markup);
    const rt = start();
    const popover = host.querySelector("#p") as HTMLElement;
    const trigger = host.querySelector("#t") as HTMLElement;
    const instance = rt.get<PopoverInstance>(popover, "popover") as PopoverInstance;
    popover.addEventListener("ok:popover:beforeopen", (e) => e.preventDefault(), { once: true });
    expect(instance.open(trigger)).toBe(false);
    expect(instance.open(trigger)).toBe(true);
    expect(instance.open(trigger)).toBe(true);
    popover.addEventListener("ok:popover:beforeclose", (e) => e.preventDefault(), { once: true });
    expect(instance.close()).toBe(false);
    expect(instance.isOpen).toBe(true);
    expect(instance.close()).toBe(true);
    expect(instance.close()).toBe(true);
    popover.setAttribute("data-ok-disable-escape-key-down", "");
    instance.toggle(trigger);
    await userEvent.keyboard("{Escape}");
    expect(instance.isOpen).toBe(true);
    instance.toggle(trigger);
    expect(instance.isOpen).toBe(false);
  });

  it("hover triggers open without moving focus and close on leave or blur", async () => {
    const host = mount(markup);
    start();
    const hover = host.querySelector("#h") as HTMLElement;
    const popover = host.querySelector("#p2") as HTMLElement;
    await userEvent.hover(hover);
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
    expect(hover.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).not.toBe(popover);
    await userEvent.unhover(hover);
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    hover.focus();
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
    hover.blur();
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
  });

  it("hover edge cases: already open, a prevented open, leaving after a click open, moving inside", async () => {
    const host = mount(`
      <button type="button" id="c" data-ok-popover-open="p">Click</button>
      <button type="button" id="h" data-ok-popover-hover="p"><span id="inner">Hover</span></button>
      <div id="p" popover="manual" data-ok-popover data-ok-placement="bottom">P</div>
      <div popover="manual" data-ok-popover>No id</div>`);
    const rt = start();
    const popover = host.querySelector("#p") as HTMLElement;
    const hover = host.querySelector("#h") as HTMLElement;
    await userEvent.click(host.querySelector("#c") as HTMLElement);
    await userEvent.hover(hover);
    await userEvent.unhover(hover);
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
    rt.get<PopoverInstance>(popover, "popover")?.close();
    popover.addEventListener("ok:popover:beforeopen", (e) => e.preventDefault(), { once: true });
    await userEvent.hover(hover);
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    await userEvent.unhover(hover);
    await userEvent.hover(hover);
    await userEvent.hover(host.querySelector("#inner") as HTMLElement);
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
  });

  it("warns for a trigger without a popover; ignores React-owned popovers", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount(`
      <button type="button" data-ok-popover-open="missing">A</button>
      <button type="button" data-ok-popover-hover="missing">B</button>
      <button type="button" data-ok-popover-open="r">R</button>
      <div id="r" popover="manual" data-ok-popover data-ok-runtime="off">R</div>`);
    start();
    for (const button of host.querySelectorAll<HTMLElement>("button"))
      await userEvent.click(button);
    expect(warn).toHaveBeenCalledTimes(2);
    expect((host.querySelector("#r") as HTMLElement).hasAttribute("data-ok-open")).toBe(false);
    warn.mockRestore();
  });
});
