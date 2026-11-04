import { isScrollLocked } from "@minimal-tailwind/core";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage, settle } from "../../test-utils.js";
import { type DialogInstance, dialog } from "./dialog.js";
import basic from "./examples/basic.html?raw";
import form from "./examples/form.html?raw";
import notDismissible from "./examples/not-dismissible.html?raw";

let runtime: Runtime;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;

beforeEach(() => {
  runtime = createRuntime().register(dialog).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

function record(element: Element) {
  const events: string[] = [];
  for (const type of ["beforeopen", "open", "beforeclose", "close"]) {
    element.addEventListener(`mt:dialog:${type}`, (event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      events.push(reason ? `${type}:${reason}` : type);
    });
  }
  return events;
}

describe("dialog (HTML)", () => {
  it("opens from its trigger, moves focus inside and locks scroll", async () => {
    mount(basic);
    await settle();
    const trigger = $("[data-mt-dialog-open]");
    await userEvent.click(trigger);

    // Shipped CSS is applied: the dialog is a full-viewport layout container.
    expect(getComputedStyle($("#confirm-dialog")).position).toBe("fixed");
    expect(getComputedStyle($("#confirm-dialog")).display).toBe("flex");

    expect($<HTMLDialogElement>("#confirm-dialog").open).toBe(true);
    expect($("#confirm-dialog").contains(document.activeElement)).toBe(true);
    expect(isScrollLocked()).toBe(true);
  });

  it("closes on Escape, returns focus to the trigger and emits events in order", async () => {
    mount(basic);
    await settle();
    const events = record($("#confirm-dialog"));
    const trigger = $("[data-mt-dialog-open]");
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect($<HTMLDialogElement>("#confirm-dialog").open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(isScrollLocked()).toBe(false);
    expect(events).toEqual(["beforeopen", "open", "beforeclose:escape", "close:escape"]);
  });

  it("closes from a [data-mt-dialog-close] button and on backdrop click", async () => {
    mount(basic);
    await settle();
    const element = $<HTMLDialogElement>("#confirm-dialog");
    const events = record(element);

    await userEvent.click($("[data-mt-dialog-open]"));
    await userEvent.click(element.querySelector("[data-mt-dialog-close]") as HTMLElement);
    expect(element.open).toBe(false);

    await userEvent.click($("[data-mt-dialog-open]"));
    await userEvent.click(element, { position: { x: 5, y: 5 } });
    expect(element.open).toBe(false);
    expect(events.filter((e) => e.startsWith("close"))).toEqual([
      "close:trigger",
      "close:backdrop",
    ]);
  });

  it("can be prevented through cancelable events", async () => {
    mount(basic);
    await settle();
    const element = $<HTMLDialogElement>("#confirm-dialog");
    element.addEventListener("mt:dialog:beforeopen", (e) => e.preventDefault(), { once: true });
    await userEvent.click($("[data-mt-dialog-open]"));
    expect(element.open).toBe(false);

    await userEvent.click($("[data-mt-dialog-open]"));
    element.addEventListener("mt:dialog:beforeclose", (e) => e.preventDefault(), { once: true });
    await userEvent.keyboard("{Escape}");
    expect(element.open).toBe(true);
  });

  it("honors data-mt-escape-close / data-mt-backdrop-close = false", async () => {
    mount(notDismissible);
    await settle();
    const element = $<HTMLDialogElement>("#terms-dialog");
    await userEvent.click($("[data-mt-dialog-open]"));
    await userEvent.keyboard("{Escape}");
    await userEvent.click(element, { position: { x: 5, y: 5 } });
    expect(element.open).toBe(true);
    await userEvent.click(element.querySelector("[data-mt-dialog-close]") as HTMLElement);
    expect(element.open).toBe(false);
  });

  it("syncs when a form[method=dialog] closes it natively", async () => {
    mount(form);
    await settle();
    const element = $<HTMLDialogElement>("#subscribe-dialog");
    const events = record(element);
    await userEvent.click($("[data-mt-dialog-open]"));
    expect(document.activeElement).toBe(element.querySelector("input[autofocus]"));
    await userEvent.click(element.querySelector('[type="submit"]') as HTMLElement);
    await vi.waitFor(() => expect(events).toContain("close:native"));
    expect(element.open).toBe(false);
    expect(isScrollLocked()).toBe(false);
  });

  it("exposes an instance API", async () => {
    mount(basic);
    await settle();
    const instance = runtime.get<DialogInstance>($("#confirm-dialog"), "dialog");
    expect(instance?.open()).toBe(true);
    expect(instance?.isOpen).toBe(true);
    expect(instance?.close()).toBe(true);
    expect(instance?.isOpen).toBe(false);
  });

  it("opens on mount with data-mt-open", async () => {
    mount(basic.replace("data-mt-dialog data-mt-size", "data-mt-dialog data-mt-open data-mt-size"));
    await settle();
    expect($<HTMLDialogElement>("#confirm-dialog").open).toBe(true);
  });

  it("releases scroll lock when an open dialog is removed from the page", async () => {
    const host = mount(basic);
    await settle();
    await userEvent.click($("[data-mt-dialog-open]"));
    host.remove();
    await settle();
    expect(isScrollLocked()).toBe(false);
  });

  it("works for dialogs inserted after start (no init call needed)", async () => {
    await settle();
    mount(basic);
    await settle();
    await userEvent.click($("[data-mt-dialog-open]"));
    expect($<HTMLDialogElement>("#confirm-dialog").open).toBe(true);
  });

  it("warns about a trigger without a target", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(`<button data-mt-dialog-open="missing">Open</button>`);
    await userEvent.click($("button"));
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"missing"'),
      expect.anything(),
    );
  });

  it("has no axe violations when open", async () => {
    mount(basic);
    await settle();
    await userEvent.click($("[data-mt-dialog-open]"));
    // Mid-animation opacity lowers measured contrast; scan the settled UI.
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
    const result = await axe.run(document.body);
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
