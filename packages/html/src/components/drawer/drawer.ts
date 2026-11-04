import { createModalController } from "@minimal-tailwind/core";
import { defineComponent, readBooleanOption } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export type DrawerCloseReason = "escape" | "backdrop" | "trigger" | "api" | "native";

export interface DrawerInstance extends ComponentInstance {
  readonly isOpen: boolean;
  /** Opens the drawer. Returns `false` if `mt:drawer:beforeopen` was prevented. */
  open(trigger?: HTMLElement | null): boolean;
  /** Closes the drawer. Returns `false` if `mt:drawer:beforeclose` was prevented. */
  close(reason?: DrawerCloseReason): boolean;
  toggle(trigger?: HTMLElement | null): boolean;
}

/** `id` lookup that also works inside shadow roots (delegated targets are always connected). */
const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

/**
 * Drawer — spec: specs/components/drawer.md
 *
 * Markup:   <dialog id="x" data-mt-drawer data-mt-anchor="left" aria-label="…">
 *             <div data-mt-drawer-content>…</div>
 *           </dialog>
 * Triggers: [data-mt-drawer-open="x"], [data-mt-drawer-close] (inside) or [data-mt-drawer-close="x"]
 * Options:  data-mt-escape-close="false", data-mt-backdrop-close="false", data-mt-open (open on load)
 * Events:   mt:drawer:beforeopen (cancelable), mt:drawer:open,
 *           mt:drawer:beforeclose (cancelable, detail.reason), mt:drawer:close (detail.reason)
 */
export const drawer = defineComponent<DrawerInstance>({
  name: "drawer",
  selector: "[data-mt-drawer]",

  setup(element, { emit }) {
    // Options are re-read on every open, so data-mt-* changes made while closed take effect.
    const options = () => ({
      contentSelector: "[data-mt-drawer-content]",
      closeOnEscape: readBooleanOption(element, "data-mt-escape-close", true),
      closeOnBackdrop: readBooleanOption(element, "data-mt-backdrop-close", true),
      onDismiss: (reason: DrawerCloseReason) => instance.close(reason),
      onExternalClose: () => emit("close", { reason: "native" }),
    });
    const controller = createModalController(element, options());

    const instance: DrawerInstance = {
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
      selector: "[data-mt-drawer-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-mt-drawer-open") as string;
        const target = byId(trigger, id);
        const instance = runtime.getOrCreate<DrawerInstance>(target, "drawer");
        if (!instance) {
          console.warn(`[minimal-tailwind] No drawer with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.open(trigger as HTMLElement);
      },
    },
    {
      event: "click",
      selector: "[data-mt-drawer-close]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-mt-drawer-close");
        const target = id ? byId(trigger, id) : trigger.closest("[data-mt-drawer]");
        const instance = runtime.get<DrawerInstance>(target, "drawer");
        if (!instance) return;
        event.preventDefault();
        instance.close("trigger");
      },
    },
  ],
});
