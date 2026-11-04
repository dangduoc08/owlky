import { createDialogController } from "@minimal-tailwind/core";
import { defineComponent, readBooleanOption } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export type DialogCloseReason = "escape" | "backdrop" | "trigger" | "api" | "native";

export interface DialogInstance extends ComponentInstance {
  readonly isOpen: boolean;
  /** Opens the dialog. Returns `false` if `mt:dialog:beforeopen` was prevented. */
  open(trigger?: HTMLElement | null): boolean;
  /** Closes the dialog. Returns `false` if `mt:dialog:beforeclose` was prevented. */
  close(reason?: DialogCloseReason): boolean;
  toggle(trigger?: HTMLElement | null): boolean;
}

/** `id` lookup that also works inside shadow roots. */
function byId(from: Element, id: string): Element | null {
  const root = from.getRootNode();
  return root instanceof Document || root instanceof ShadowRoot ? root.getElementById(id) : null;
}

/**
 * Dialog — spec: specs/components/dialog.md
 *
 * Markup:   <dialog id="x" data-mt-dialog> … </dialog>
 * Triggers: [data-mt-dialog-open="x"], [data-mt-dialog-close] (inside) or [data-mt-dialog-close="x"]
 * Options:  data-mt-escape-close="false", data-mt-backdrop-close="false", data-mt-open (open on load)
 * Events:   mt:dialog:beforeopen (cancelable), mt:dialog:open,
 *           mt:dialog:beforeclose (cancelable, detail.reason), mt:dialog:close (detail.reason)
 */
export const dialog = defineComponent<DialogInstance>({
  name: "dialog",
  selector: "[data-mt-dialog]",

  setup(element, { emit }) {
    // Options are re-read on every open, so data-mt-* changes made while closed take effect.
    const options = () => ({
      closeOnEscape: readBooleanOption(element, "data-mt-escape-close", true),
      closeOnBackdrop: readBooleanOption(element, "data-mt-backdrop-close", true),
      onDismiss: (reason: DialogCloseReason) => instance.close(reason),
      onExternalClose: () => emit("close", { reason: "native" }),
    });
    const controller = createDialogController(element, options());

    const instance: DialogInstance = {
      get isOpen() {
        return controller.isOpen;
      },
      open(trigger = null) {
        if (controller.isOpen) return true;
        if (!emit("beforeopen", { trigger }, { cancelable: true })) return false;
        controller.setOptions(options());
        controller.open(trigger);
        emit("open", { trigger });
        return true;
      },
      close(reason = "api") {
        if (!controller.isOpen) return true;
        if (!emit("beforeclose", { reason }, { cancelable: true })) return false;
        controller.close();
        emit("close", { reason });
        return true;
      },
      toggle(trigger = null) {
        return controller.isOpen ? instance.close("trigger") : instance.open(trigger);
      },
      destroy() {
        controller.destroy();
      },
    };

    if (element.hasAttribute("data-mt-open")) instance.open();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-mt-dialog-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-mt-dialog-open") ?? "";
        const target = id ? byId(trigger, id) : null;
        const instance = runtime.getOrCreate<DialogInstance>(target, "dialog");
        if (!instance) {
          console.warn(`[minimal-tailwind] No dialog with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.open(trigger instanceof HTMLElement ? trigger : null);
      },
    },
    {
      event: "click",
      selector: "[data-mt-dialog-close]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-mt-dialog-close");
        const target = id ? byId(trigger, id) : trigger.closest("[data-mt-dialog]");
        const instance = runtime.get<DialogInstance>(target, "dialog");
        if (!instance) return;
        event.preventDefault();
        instance.close("trigger");
      },
    },
  ],
});
