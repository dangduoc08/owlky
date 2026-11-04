import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { layerStack } from "../overlay/layer-stack.js";
import { isScrollLocked } from "../overlay/scroll-lock.js";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createDialogController as create,
  type DialogController,
  type DialogControllerOptions,
} from "./dialog-controller.js";

const controllers: DialogController[] = [];
const createDialogController = (element: HTMLElement, options?: DialogControllerOptions) => {
  const controller = create(element, options);
  controllers.push(controller);
  return controller;
};

const markup = `
  <button id="trigger">Open</button>
  <dialog id="dlg" data-mt-dialog>
    <div data-mt-dialog-content>
      <h2>Title</h2>
      <input id="first" aria-label="First" />
      <input id="last" aria-label="Last" />
    </div>
  </dialog>
  <button id="outside">Outside</button>`;

function setup(options: DialogControllerOptions = {}) {
  mount(markup);
  const dialog = document.getElementById("dlg") as HTMLDialogElement;
  const trigger = document.getElementById("trigger") as HTMLButtonElement;
  const onDismiss = vi.fn();
  const controller = createDialogController(dialog, { onDismiss, ...options });
  return { dialog, trigger, controller, onDismiss };
}

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

describe.each([
  ["native", false],
  ["fallback", true],
])("createDialogController (%s)", (_, forceFallback) => {
  it("opens modally, focuses the first tabbable and locks scroll", () => {
    const { dialog, trigger, controller } = setup({ forceFallback });
    trigger.focus();
    controller.open();

    expect(controller.isOpen).toBe(true);
    expect(controller.isFallback).toBe(forceFallback);
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.hasAttribute("data-mt-fallback")).toBe(forceFallback);
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
      `<dialog data-mt-dialog><div data-mt-dialog-content><button>Inner</button></div></dialog>`,
    );
    const innerDismiss = vi.fn();
    const inner = createDialogController(host.querySelector("dialog") as HTMLElement, {
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

describe("createDialogController (native only)", () => {
  it("syncs when the browser closes the dialog itself (form method=dialog)", async () => {
    mount(`
      <dialog id="f" data-mt-dialog><div data-mt-dialog-content>
        <form method="dialog"><button id="submit">OK</button></form>
      </div></dialog>`);
    const onExternalClose = vi.fn();
    const controller = createDialogController(document.getElementById("f") as HTMLElement, {
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
