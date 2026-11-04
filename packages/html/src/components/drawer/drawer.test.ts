import { isScrollLocked } from "@minimal-tailwind/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import { type DrawerInstance, drawer } from "./drawer.js";
import anchors from "./examples/anchor-group.html?raw";

let runtime: Runtime;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;

beforeEach(() => {
  runtime = createRuntime().register(drawer).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

function record(element: Element) {
  const events: string[] = [];
  for (const type of ["beforeopen", "open", "beforeclose", "close"]) {
    element.addEventListener(`mt:drawer:${type}`, (event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      events.push(reason ? `${type}:${reason}` : type);
    });
  }
  return events;
}

const SIMPLE = (attrs = "") => `
  <button type="button" id="trigger" data-mt-drawer-open="d" aria-haspopup="dialog">Open</button>
  <dialog id="d" data-mt-drawer data-mt-anchor="left" aria-label="Menu" ${attrs}>
    <div data-mt-drawer-content>
      <button type="button" id="inside">Inside</button>
      <button type="button" id="close" data-mt-drawer-close>Close</button>
    </div>
  </dialog>
  <button type="button" id="outside-close" data-mt-drawer-close="d">Close from outside</button>`;

describe("drawer snippet", () => {
  it("has a named trigger and a named drawer per anchor, CSP-safe", () => {
    const host = mount(anchors);
    expectNamedButtons(host);
    expectCspSafe(host, anchors);
    const drawers = host.querySelectorAll<HTMLElement>("[data-mt-drawer]");
    expect([...drawers].map((d) => d.dataset["mtAnchor"])).toEqual([
      "left",
      "right",
      "top",
      "bottom",
    ]);
    for (const d of drawers) {
      expect(d.getAttribute("aria-label")).toBeTruthy();
      expect(
        host.querySelector(`[data-mt-drawer-open="${d.id}"]`)?.getAttribute("aria-haspopup"),
      ).toBe("dialog");
    }
  });

  it.each(["left", "right", "top", "bottom"])(
    "opens the %s drawer at its edge, without axe violations",
    async (anchor) => {
      mount(anchors);
      await settle();
      await userEvent.click($(`[data-mt-drawer-open="drawer-${anchor}"]`));
      const content = $(`#drawer-${anchor} [data-mt-drawer-content]`);
      await vi.waitFor(() => expect(getComputedStyle(content).transform).toBe("none"));
      const box = content.getBoundingClientRect();
      const { innerWidth: w, innerHeight: h } = window;
      if (anchor === "left") expect([box.left, box.height]).toEqual([0, h]);
      if (anchor === "right") expect([Math.round(box.right), box.height]).toEqual([w, h]);
      if (anchor === "top") expect([box.top, Math.round(box.width)]).toEqual([0, w]);
      if (anchor === "bottom")
        expect([Math.round(box.bottom), Math.round(box.width)]).toEqual([h, w]);
      await expectNoAxeViolations(document.body);
    },
  );
});

describe("drawer runtime", () => {
  it("opens from its trigger, moves focus inside and locks scroll", async () => {
    mount(SIMPLE());
    await settle();
    await userEvent.click($("#trigger"));
    const element = $<HTMLDialogElement>("#d");
    expect(element.open).toBe(true);
    expect(getComputedStyle(element).position).toBe("fixed");
    expect(document.activeElement?.id).toBe("inside");
    expect(isScrollLocked()).toBe(true);
  });

  it("closes on Escape, returns focus to the trigger and emits events in order", async () => {
    mount(SIMPLE());
    await settle();
    const events = record($("#d"));
    $("#trigger").focus();
    await userEvent.click($("#trigger"));
    await userEvent.keyboard("{Escape}");
    expect($<HTMLDialogElement>("#d").open).toBe(false);
    expect(document.activeElement?.id).toBe("trigger");
    expect(isScrollLocked()).toBe(false);
    expect(events).toEqual(["beforeopen", "open", "beforeclose:escape", "close:escape"]);
  });

  it("closes on a backdrop click but not on a click inside the paper", async () => {
    mount(SIMPLE());
    await settle();
    const events = record($("#d"));
    await userEvent.click($("#trigger"));
    await userEvent.click($("#inside"));
    expect($<HTMLDialogElement>("#d").open).toBe(true);
    await userEvent.click($("#d"), { position: { x: window.innerWidth - 10, y: 10 } });
    expect($<HTMLDialogElement>("#d").open).toBe(false);
    expect(events).toContain("close:backdrop");
  });

  it("close triggers inside and outside the drawer", async () => {
    mount(SIMPLE());
    await settle();
    const instance = runtime.get<DrawerInstance>($("#d"), "drawer") as DrawerInstance;
    await userEvent.click($("#trigger"));
    await userEvent.click($("#close"));
    expect(instance.isOpen).toBe(false);
    instance.open();
    $("#outside-close").click();
    expect(instance.isOpen).toBe(false);
  });

  it("honors data-mt-disable-escape-key-down; data-mt-hide-backdrop keeps it modal", async () => {
    mount(SIMPLE("data-mt-disable-escape-key-down data-mt-hide-backdrop"));
    await settle();
    await userEvent.click($("#trigger"));
    await userEvent.keyboard("{Escape}");
    expect($<HTMLDialogElement>("#d").open).toBe(true);
    expect(getComputedStyle($("#d"), "::backdrop").backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.click($("#d"), { position: { x: window.innerWidth - 10, y: 10 } });
    expect($<HTMLDialogElement>("#d").open).toBe(false);
  });

  it("persistent drawers toggle from their trigger and keep aria-expanded in sync", async () => {
    mount(`<button type="button" id="t" data-mt-drawer-open="p">Menu</button>
      <aside id="p" data-mt-drawer data-mt-variant="persistent" aria-label="Nav" hidden><div data-mt-drawer-content><button type="button" data-mt-drawer-close>Close</button></div></aside>`);
    await settle();
    const aside = $("#p");
    const events = record(aside);
    expect($("#t").getAttribute("aria-expanded")).toBe("false");
    expect($("#t").getAttribute("aria-controls")).toBe("p");
    await userEvent.click($("#t"));
    expect(aside.hidden).toBe(false);
    expect($("#t").getAttribute("aria-expanded")).toBe("true");
    expect(isScrollLocked()).toBe(false);
    await userEvent.click($("#t"));
    expect(aside.hidden).toBe(true);
    const instance = runtime.get<DrawerInstance>(aside, "drawer") as DrawerInstance;
    instance.open();
    await userEvent.click(aside.querySelector("[data-mt-drawer-close]") as HTMLElement);
    expect(aside.hidden).toBe(true);
    expect(events).toEqual([
      "beforeopen",
      "open",
      "beforeclose:trigger",
      "close:trigger",
      "beforeopen",
      "open",
      "beforeclose:trigger",
      "close:trigger",
    ]);
  });

  it("permanent drawers are always shown and can't be closed; ids are optional", async () => {
    mount(`<aside id="perm" data-mt-drawer data-mt-variant="permanent" aria-label="Side" hidden><div data-mt-drawer-content>x</div></aside>
      <aside data-mt-drawer data-mt-variant="persistent" aria-label="No id" data-mt-open hidden><div data-mt-drawer-content>y</div></aside>`);
    await settle();
    const perm = $("#perm");
    expect(perm.hidden).toBe(false);
    expect(runtime.get<DrawerInstance>(perm, "drawer")?.close()).toBe(false);
    expect(perm.hidden).toBe(false);
    expect((document.querySelector('[aria-label="No id"]') as HTMLElement).hidden).toBe(false);
  });

  it("cancelable events keep the drawer as it is; the API toggles and reports results", async () => {
    mount(SIMPLE());
    await settle();
    const element = $("#d");
    const instance = runtime.get<DrawerInstance>(element, "drawer") as DrawerInstance;
    const block = (event: Event) => event.preventDefault();
    element.addEventListener("mt:drawer:beforeopen", block);
    expect(instance.open()).toBe(false);
    element.removeEventListener("mt:drawer:beforeopen", block);
    expect(instance.toggle()).toBe(true);
    expect(instance.open()).toBe(true);
    element.addEventListener("mt:drawer:beforeclose", block);
    expect(instance.close()).toBe(false);
    element.removeEventListener("mt:drawer:beforeclose", block);
    expect(instance.toggle()).toBe(true);
    expect(instance.isOpen).toBe(false);
    expect(instance.close()).toBe(true);
  });

  it("opens on load with data-mt-open and cleans up when removed while open", async () => {
    mount(SIMPLE("data-mt-open"));
    await settle();
    expect($<HTMLDialogElement>("#d").open).toBe(true);
    expect(isScrollLocked()).toBe(true);
    $("#d").remove();
    await settle();
    expect(isScrollLocked()).toBe(false);
  });

  it("warns about triggers without a drawer and ignores React-owned drawers", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(
      `<button type="button" id="orphan" data-mt-drawer-open="missing">x</button>
       <div data-mt-runtime="off">${SIMPLE().replaceAll('id="', 'id="r-').replace('data-mt-drawer-open="d"', 'data-mt-drawer-open="r-d"')}</div>`,
    );
    await settle();
    $("#orphan").click();
    expect(warn).toHaveBeenCalledOnce();
    $("#r-trigger").click();
    expect($<HTMLDialogElement>("#r-d").open).toBe(false);
  });

  it("close triggers for unknown drawers do nothing; drawers work inside a shadow root", async () => {
    const host = mount(
      `<button type="button" id="stray" data-mt-drawer-close="nope">x</button><div id="shadow-host"></div>`,
    );
    $("#stray").click();
    const shadow = (host.querySelector("#shadow-host") as HTMLElement).attachShadow({
      mode: "open",
    });
    const wrapper = document.createElement("div");
    wrapper.innerHTML = SIMPLE();
    shadow.append(...wrapper.childNodes);
    runtime.connect(shadow);
    (shadow.getElementById("trigger") as HTMLElement).click();
    expect((shadow.getElementById("d") as HTMLDialogElement).open).toBe(true);
  });

  it("syncs when the browser closes it (form method=dialog)", async () => {
    mount(
      SIMPLE().replace(
        '<button type="button" id="inside">Inside</button>',
        '<form method="dialog"><button id="inside">Done</button></form>',
      ),
    );
    await settle();
    const events = record($("#d"));
    await userEvent.click($("#trigger"));
    await userEvent.click($("#inside"));
    expect(runtime.get<DrawerInstance>($("#d"), "drawer")?.isOpen).toBe(false);
    expect(events.at(-1)).toBe("close:native");
  });
});
