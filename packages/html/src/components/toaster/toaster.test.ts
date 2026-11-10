import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ToasterInstance } from "./toaster.js";

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
  vi.useRealTimers();
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const markup = (attrs = "") => `
  <section data-ok-toaster data-ok-position="top-right" aria-label="Notifications" ${attrs}>
    <ol data-ok-toaster-list aria-live="polite"></ol>
  </section>
  <template id="t1"><li data-ok-toast data-ok-type="default"><div data-ok-toast-content><div data-ok-toast-title>Saved</div></div><button type="button" data-ok-toast-close aria-label="Close">x</button></li></template>
  <template id="t2"><li data-ok-toast data-ok-type="loading" data-ok-duration="60" data-ok-then="t3"><div data-ok-toast-content><div data-ok-toast-title>Loading</div></div></li></template>
  <template id="t3"><li data-ok-toast data-ok-type="success"><div data-ok-toast-content><div data-ok-toast-title>Done</div></div></li></template>
  <template id="t4"><li data-ok-toast data-ok-type="default"><div data-ok-toast-content><div data-ok-toast-title>Deleted</div></div><button type="button" data-ok-toast-action>Undo</button><div data-ok-toast-actions><button type="button" data-ok-toast-dismiss>Dismiss</button></div></li></template>
  <template id="empty"></template>
  <button type="button" id="b1" data-ok-toast-open="t1">One</button>
  <button type="button" id="b2" data-ok-toast-open="t2" data-ok-toaster-position="bottom-left">Two</button>
  <button type="button" id="b4" data-ok-toast-open="t4" data-ok-toaster-position="nowhere">Four</button>
  <button type="button" id="bad" data-ok-toast-open="missing">Bad</button>`;

const list = (host: HTMLElement) => host.querySelector("[data-ok-toaster-list]") as HTMLElement;
const titles = (host: HTMLElement) =>
  [...list(host).querySelectorAll("[data-ok-toast-title]")].map((t) => t.textContent);

describe("toaster runtime", () => {
  it("a trigger shows a copy of its template, newest first; close removes it", async () => {
    // At the bottom: at the top-right, the first toast covers the next trigger in the 414px
    // viewport and Firefox waits until it times out before clicking.
    const host = mount(markup('data-ok-duration="5000"').replace("top-right", "bottom-right"));
    start();
    const shown: string[] = [];
    const dismissed: string[] = [];
    host.addEventListener("ok:toaster:show", () => shown.push("show"));
    host.addEventListener("ok:toaster:dismiss", (e) =>
      dismissed.push((e as CustomEvent).detail.reason),
    );
    await userEvent.click(host.querySelector("#b1") as HTMLElement);
    await userEvent.click(host.querySelector("#b4") as HTMLElement);
    expect(titles(host)).toEqual(["Deleted", "Saved"]);
    expect(host.querySelector("[data-ok-toaster]")?.getAttribute("data-ok-position")).toBe(
      "bottom-right",
    );
    await userEvent.click(list(host).querySelector("[data-ok-toast-close]") as HTMLElement);
    expect(titles(host)).toEqual(["Deleted"]);
    await userEvent.click(list(host).querySelector("[data-ok-toast-dismiss]") as HTMLElement);
    expect(titles(host)).toEqual([]);
    expect(shown).toHaveLength(2);
    expect(dismissed).toEqual(["close", "dismiss"]);
    await expectNoAxeViolations(host);
  });

  it("times out; data-ok-then replaces a toast; the trigger can move the toaster", async () => {
    const host = mount(markup('data-ok-duration="80"'));
    start();
    await userEvent.click(host.querySelector("#b2") as HTMLElement);
    expect(host.querySelector("[data-ok-toaster]")?.getAttribute("data-ok-position")).toBe(
      "bottom-left",
    );
    expect(titles(host)).toEqual(["Loading"]);
    await wait(100);
    expect(titles(host)).toEqual(["Done"]);
    await wait(150);
    expect(titles(host)).toEqual([]);
  });

  it("hover and focus pause the time; actions are cancelable; Escape closes a focused toast", async () => {
    // Long enough that a loaded CI runner's click-to-hover delay can't use it up.
    const host = mount(markup('data-ok-duration="1500"'));
    start();
    const toaster = host.querySelector("[data-ok-toaster]") as HTMLElement;
    await userEvent.click(host.querySelector("#b4") as HTMLElement);
    await userEvent.hover(toaster, { force: true });
    await wait(2000);
    expect(titles(host)).toEqual(["Deleted"]);
    host.addEventListener("ok:toaster:action", (e) => e.preventDefault(), { once: true });
    await userEvent.click(toaster.querySelector("[data-ok-toast-action]") as HTMLElement);
    expect(titles(host)).toEqual(["Deleted"]);
    (toaster.querySelector("[data-ok-toast-action]") as HTMLElement).focus();
    await userEvent.keyboard("{Escape}");
    expect(titles(host)).toEqual([]);
    await userEvent.unhover(toaster);
  });

  it("show(): text only, types, ids replace in place, actions call back, overflow", async () => {
    const host = mount(markup('data-ok-close-button data-ok-visible-toasts="2"'));
    const rt = start();
    const instance = rt.get<ToasterInstance>(
      host.querySelector("[data-ok-toaster]"),
      "toaster",
    ) as ToasterInstance;
    const onClick = vi.fn((event: Event) => event.preventDefault());
    const id = instance.show({
      title: "<img src=x onerror=alert(1)>",
      description: "d",
      duration: Number.POSITIVE_INFINITY,
    });
    expect(list(host).querySelector("img")).toBeNull();
    expect(titles(host)).toEqual(["<img src=x onerror=alert(1)>"]);
    expect(list(host).querySelector("[data-ok-toast-close]")).not.toBeNull();
    instance.show({ id, type: "info", title: "Updated" });
    expect(titles(host)).toEqual(["Updated"]);
    expect(
      list(host).querySelector("[data-ok-type='info'] [data-ok-toast-icon] svg"),
    ).not.toBeNull();
    instance.show({
      type: "warning",
      title: "W",
      action: { label: "Undo", onClick },
      cancel: { label: "No" },
    });
    await userEvent.click(list(host).querySelector("[data-ok-toast-action]") as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(titles(host)).toEqual(["W", "Updated"]);
    instance.show({ type: "nope" as never, title: "Third", dismissible: false, duration: 5000 });
    expect(titles(host)).toEqual(["Third", "W"]);
    expect(list(host).firstElementChild?.getAttribute("data-ok-type")).toBe("default");
    expect(list(host).firstElementChild?.querySelector("[data-ok-toast-close]")).toBeNull();
    await userEvent.click(list(host).querySelector("[data-ok-toast-cancel]") as HTMLElement);
    expect(titles(host)).toEqual(["Third"]);
    (list(host).firstElementChild as HTMLElement).focus();
    instance.dismiss("missing");
    instance.dismiss();
    expect(titles(host)).toEqual([]);
  });

  it("promise() and loading toasts; showTemplate of an empty template; missing trigger targets", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const host = mount(markup());
    const rt = start();
    const instance = rt.get<ToasterInstance>(
      host.querySelector("[data-ok-toaster]"),
      "toaster",
    ) as ToasterInstance;
    instance.promise(Promise.resolve(1), { loading: "Saving", success: "Saved", error: "Failed" });
    expect(list(host).querySelector("[data-ok-circular-progress]")).not.toBeNull();
    await wait(0);
    expect(titles(host)).toEqual(["Saved"]);
    instance.promise(Promise.reject(new Error("x")), {
      loading: "Saving",
      success: "Saved",
      error: "Failed",
    });
    await wait(0);
    expect(titles(host)[0]).toBe("Failed");
    expect(instance.showTemplate(host.querySelector("#empty") as HTMLTemplateElement)).toBeNull();
    await userEvent.click(host.querySelector("#bad") as HTMLElement);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("edge cases: detached toasts, empty then-templates, clicks and keys outside toasts, persistent", async () => {
    // At the bottom, away from the pointer on the trigger (hovering would pause the time).
    const host = mount(`${markup('data-ok-duration="60"').replace("top-right", "bottom-right")}
      <template id="t5"><li data-ok-toast data-ok-type="loading" data-ok-duration="40" data-ok-then="empty"><div data-ok-toast-content><div data-ok-toast-title>L</div></div></li></template>
      <button type="button" id="b5" data-ok-toast-open="t5">Five</button>`);
    const rt = start();
    const toaster = host.querySelector("[data-ok-toaster]") as HTMLElement;
    const instance = rt.get<ToasterInstance>(toaster, "toaster") as ToasterInstance;
    await userEvent.click(host.querySelector("#b5") as HTMLElement);
    await wait(80);
    expect(titles(host)).toEqual([]);
    instance.show({ title: "Gone" });
    list(host).firstElementChild?.remove();
    await wait(100);
    toaster.click();
    instance.show({ title: "Keep", dismissible: false, duration: 5000 });
    const keep = list(host).firstElementChild as HTMLElement;
    keep.tabIndex = 0;
    keep.focus();
    await userEvent.keyboard("a{Escape}");
    expect(titles(host)).toEqual(["Keep"]);
  });

  it("creates its list when missing and times toasts already in the markup", async () => {
    const host = mount(`<section data-ok-toaster aria-label="N" data-ok-duration="50">
      </section>`);
    start();
    expect(host.querySelector("[data-ok-toaster-list]")).not.toBeNull();
    resetPage();
    const host2 = mount(
      `<section data-ok-toaster data-ok-position="bottom-left" aria-label="N" data-ok-duration="50"><ol data-ok-toaster-list aria-live="polite"><li data-ok-toast data-ok-type="default" data-ok-toast-id="own"><div data-ok-toast-content><div data-ok-toast-title>Own</div></div></li><li data-ok-toast data-ok-type="default"><div data-ok-toast-content><div data-ok-toast-title>Hi</div></div></li></ol></section>`,
    );
    runtime?.stop();
    start();
    expect(titles(host2)).toEqual(["Own", "Hi"]);
    await wait(100);
    expect(titles(host2)).toEqual([]);
  });

  it("per-toast position, invert, rich colors, close button; history; promise finally", async () => {
    const host = mount(markup('data-ok-rich-colors data-ok-duration="10000"'));
    const rt = start();
    const toaster = host.querySelector("[data-ok-toaster]") as HTMLElement;
    const instance = rt.get<ToasterInstance>(toaster, "toaster") as ToasterInstance;
    instance.show({ type: "success", title: "Rich", closeButton: true });
    const moved = instance.show({ title: "Away", position: "bottom-left", invert: true });
    instance.show({ title: "Here too", position: "top-right" });
    instance.show({ type: "info", title: "Plain", richColors: false });
    const other = toaster.querySelector<HTMLElement>(
      '[data-ok-toaster-list][data-ok-position="bottom-left"]',
    );
    expect(other?.getAttribute("aria-live")).toBe("polite");
    expect(getComputedStyle(other as Element).position).toBe("fixed");
    expect(other?.textContent).toContain("Away");
    expect(titles(host)).toEqual(["Plain", "Here too", "Rich"]);
    const rich = list(host).lastElementChild as HTMLElement;
    expect(getComputedStyle(rich).backgroundColor).toBe("rgb(211, 252, 210)");
    expect(rich.querySelector("[data-ok-toast-close]")).not.toBeNull();
    expect((list(host).firstElementChild as HTMLElement).dataset["okRichColors"]).toBe("false");
    expect(((other as HTMLElement).firstElementChild as HTMLElement).dataset["okInvert"]).toBe("");
    expect(instance.getToasts()).toHaveLength(4);
    instance.dismiss(moved);
    expect(instance.getToasts()).toHaveLength(3);
    expect(instance.getHistory()).toHaveLength(4);
    const after = vi.fn();
    instance.promise(Promise.resolve(), {
      loading: "L",
      success: "S",
      error: "E",
      description: "d",
      finally: after,
    });
    expect(list(host).querySelector("[data-ok-toast-description]")?.textContent).toBe("d");
    await wait(0);
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("offset / gap attributes, stacking, hotkey, swipe, named toasters", async () => {
    const host =
      mount(`${markup('id="main" data-ok-expand="false" data-ok-gap="20" data-ok-offset="40" data-ok-hotkey="ctrlKey+KeyM" data-ok-duration="10000"')}
      <section id="side" data-ok-toaster data-ok-position="top-left" data-ok-swipe-directions="top" aria-label="Side"><ol data-ok-toaster-list aria-live="polite"></ol></section>
      <button type="button" id="bs" data-ok-toast-open="t1" data-ok-toast-toaster="side">Side</button>`);
    const rt = start();
    const toaster = host.querySelector("#main") as HTMLElement;
    const instance = rt.get<ToasterInstance>(toaster, "toaster") as ToasterInstance;
    expect(toaster.style.getPropertyValue("--_ok-toast-gap")).toBe("20px");
    expect(toaster.style.getPropertyValue("--_ok-toaster-top")).toBe("40px");
    toaster.setAttribute("data-ok-gap", "4");
    await wait(0);
    expect(toaster.style.getPropertyValue("--_ok-toast-gap")).toBe("4px");
    instance.show({ title: "A" });
    instance.show({ title: "B" });
    const second = list(host).children[1] as HTMLElement;
    expect(getComputedStyle(second).position).toBe("absolute");
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }));
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, code: "KeyM" }));
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(true);
    expect(document.activeElement).toBe(list(host));
    // Swipe the newest toast to the right (top-right: up or right).
    const front = list(host).firstElementChild as HTMLElement;
    const at = (type: string, x: number) =>
      new PointerEvent(type, { bubbles: true, clientX: x, clientY: 0, pointerId: 1 });
    front.dispatchEvent(at("pointerdown", 0));
    front.dispatchEvent(at("pointermove", 30));
    front.dispatchEvent(at("pointerup", 80));
    expect(titles(host)).toEqual(["A"]);
    (host.querySelector("#bs") as HTMLElement).click();
    expect(host.querySelector("#side")?.textContent).toContain("Saved");
    const sideToast = host.querySelector("#side [data-ok-toast]") as HTMLElement;
    sideToast.dispatchEvent(at("pointerdown", 0));
    sideToast.dispatchEvent(at("pointermove", -30));
    sideToast.dispatchEvent(at("pointerup", -80));
    // Only upward swipes there.
    expect(host.querySelector("#side [data-ok-toast]")).not.toBeNull();
    rt.destroy(toaster);
    expect(toaster.style.length).toBe(0);
  });
});
