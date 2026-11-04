import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { layerStack } from "../overlay/layer-stack.js";
import { isScrollLocked } from "../overlay/scroll-lock.js";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createModalController as create,
  type ModalController,
  type ModalControllerOptions,
} from "./modal-controller.js";

const controllers: ModalController[] = [];
const createModalController = (element: HTMLElement, options?: ModalControllerOptions) => {
  const controller = create(element, options);
  controllers.push(controller);
  return controller;
};

const markup = `
  <button id="trigger">Open</button>
  <dialog id="dlg" data-ok-dialog>
    <div data-ok-dialog-content>
      <h2>Title</h2>
      <input id="first" aria-label="First" />
      <input id="last" aria-label="Last" />
    </div>
  </dialog>
  <button id="outside">Outside</button>`;

function setup(options: ModalControllerOptions = {}) {
  mount(markup);
  const dialog = document.getElementById("dlg") as HTMLDialogElement;
  const trigger = document.getElementById("trigger") as HTMLButtonElement;
  const onDismiss = vi.fn();
  const controller = createModalController(dialog, {
    onDismiss,
    contentSelector: "[data-ok-dialog-content]",
    ...options,
  });
  return { dialog, trigger, controller, onDismiss };
}

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

describe.each([
  ["native", false],
  ["fallback", true],
])("createModalController (%s)", (_, forceFallback) => {
  it("opens modally, focuses the first tabbable and locks scroll", () => {
    const { dialog, trigger, controller } = setup({ forceFallback });
    trigger.focus();
    controller.open();

    expect(controller.isOpen).toBe(true);
    expect(controller.isFallback).toBe(forceFallback);
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.hasAttribute("data-ok-fallback")).toBe(forceFallback);
    expect(document.activeElement?.id).toBe("first");
    expect(isScrollLocked()).toBe(true);
    expect(layerStack.isTop(dialog)).toBe(true);
    controller.destroy();
  });

  it("restores focus to the trigger and releases everything on close", () => {
    const { dialog, trigger, controller } = setup({ forceFallback });
    trigger.focus();
    controller.open();
    controller.close();

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(isScrollLocked()).toBe(false);
    expect(layerStack.size).toBe(0);
    controller.destroy();
  });

  it("reports Escape as a dismiss request without closing by itself", async () => {
    const { controller, onDismiss } = setup({ forceFallback });
    controller.open();
    await userEvent.keyboard("{Escape}");

    expect(onDismiss).toHaveBeenCalledExactlyOnceWith("escape");
    expect(controller.isOpen).toBe(true);
    controller.destroy();
  });

  it("respects closeOnEscape: false", async () => {
    const { controller, onDismiss } = setup({ forceFallback, closeOnEscape: false });
    controller.open();
    await userEvent.keyboard("{Escape}");

    expect(onDismiss).not.toHaveBeenCalled();
    expect(controller.isOpen).toBe(true);
    controller.destroy();
  });

  it("reports a backdrop click but not a click inside the content", async () => {
    const { dialog, controller, onDismiss } = setup({ forceFallback });
    controller.open();

    await userEvent.click(document.getElementById("first") as HTMLElement);
    expect(onDismiss).not.toHaveBeenCalled();

    await userEvent.click(dialog, { position: { x: 4, y: 4 } });
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith("backdrop");
    controller.destroy();
  });

  it("never lets Tab reach the page behind the dialog", async () => {
    const { controller } = setup({ forceFallback });
    controller.open();
    await userEvent.tab();
    expect(document.activeElement?.id).toBe("last");
    // Native modals may hand focus to the browser UI (allowed by HTML); the fallback cycles.
    // Either way, nothing behind the dialog may receive focus.
    for (let i = 0; i < 3; i++) {
      await userEvent.tab();
      expect(["trigger", "outside"]).not.toContain(document.activeElement?.id);
    }
    if (forceFallback) expect(document.activeElement?.id).toBe("first");
  });

  it("only the topmost of two stacked dialogs handles Escape", async () => {
    const first = setup({ forceFallback });
    const host = mount(
      `<dialog data-ok-dialog><div data-ok-dialog-content><button>Inner</button></div></dialog>`,
    );
    const innerDismiss = vi.fn();
    const inner = createModalController(host.querySelector("dialog") as HTMLElement, {
      forceFallback,
      onDismiss: innerDismiss,
    });
    first.controller.open();
    inner.open();
    await userEvent.keyboard("{Escape}");

    expect(innerDismiss).toHaveBeenCalledOnce();
    expect(first.onDismiss).not.toHaveBeenCalled();
    inner.destroy();
    first.controller.destroy();
    expect(isScrollLocked()).toBe(false);
  });

  it("destroy() closes, releases shared state and is idempotent", () => {
    const { dialog, controller } = setup({ forceFallback });
    controller.open();
    controller.destroy();
    controller.destroy();
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(isScrollLocked()).toBe(false);
    expect(layerStack.size).toBe(0);
    controller.open();
    expect(controller.isOpen).toBe(false);
  });
});

describe("createModalController (native only)", () => {
  it("syncs when the browser closes the dialog itself (form method=dialog)", async () => {
    mount(`
      <dialog id="f" data-ok-dialog><div data-ok-dialog-content>
        <form method="dialog"><button id="submit">OK</button></form>
      </div></dialog>`);
    const onExternalClose = vi.fn();
    const controller = createModalController(document.getElementById("f") as HTMLElement, {
      onExternalClose,
    });
    controller.open();
    await userEvent.click(document.getElementById("submit") as HTMLElement);
    await vi.waitFor(() => expect(onExternalClose).toHaveBeenCalledOnce());
    expect(controller.isOpen).toBe(false);
    expect(isScrollLocked()).toBe(false);
    controller.destroy();
  });
});

describe("fallback inert handling", () => {
  it("makes the rest of the page inert while open and restores it", () => {
    const { controller } = setup({ forceFallback: true });
    const outside = document.getElementById("outside") as HTMLElement;
    outside.setAttribute("inert", "");
    const sibling = document.getElementById("trigger") as HTMLElement;

    controller.open();
    expect(sibling.hasAttribute("inert")).toBe(true);
    controller.close();
    expect(sibling.hasAttribute("inert")).toBe(false);
    expect(outside.hasAttribute("inert")).toBe(true);
    controller.destroy();
  });
});

describe("createModalController options and edge cases", () => {
  it("setOptions replaces the callbacks but keeps the forced path", async () => {
    const { dialog, controller, onDismiss } = setup({ forceFallback: true });
    const next = vi.fn();
    controller.setOptions({ onDismiss: next, forceFallback: false, closeOnEscape: true });
    controller.open();
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith("escape");
    expect(controller.isFallback).toBe(true);
    expect(dialog.hasAttribute("data-ok-fallback")).toBe(true);
  });

  it("without a content selector the dialog itself is the content", () => {
    mount('<dialog id="bare"><p>No tabbables</p></dialog>');
    const dialog = document.getElementById("bare") as HTMLDialogElement;
    const controller = createModalController(dialog);
    controller.open();
    expect(document.activeElement).toBe(dialog);
    controller.open(); // already open: no-op
    expect(controller.isOpen).toBe(true);
  });

  it("closes a non-modal open dialog before opening it modally", () => {
    const { dialog, controller } = setup();
    dialog.show();
    controller.open();
    expect(dialog.matches(":modal")).toBe(true);
  });

  it("refuses detached elements and does nothing after destroy", () => {
    const detached = document.createElement("dialog");
    const controller = createModalController(detached);
    expect(() => controller.open()).toThrow(/detached/);
    const { controller: destroyed } = setup();
    destroyed.destroy();
    destroyed.open();
    destroyed.close();
    expect(destroyed.isOpen).toBe(false);
  });

  it("ignores cancel/close events from nested dialogs", () => {
    const { dialog, controller, onDismiss } = setup();
    const inner = document.createElement("dialog");
    dialog.querySelector("[data-ok-dialog-content]")?.append(inner);
    controller.open();
    inner.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
    inner.dispatchEvent(new Event("close", { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(controller.isOpen).toBe(true);
  });

  it("a cancel while closed and a backdrop click with closeOnBackdrop: false are ignored", async () => {
    const { dialog, controller, onDismiss } = setup({ closeOnBackdrop: false });
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    controller.open();
    await userEvent.click(dialog, { position: { x: 2, y: 2 } });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
