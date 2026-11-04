import { createModalController, drawerOptions, readStyle } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export type DrawerCloseReason = "escape" | "backdrop" | "trigger" | "api" | "native";

export interface DrawerInstance extends ComponentInstance {
  readonly isOpen: boolean;
  /** Opens the drawer. Returns `false` if `ok:drawer:beforeopen` was prevented. */
  open(trigger?: HTMLElement | null): boolean;
  /** Closes the drawer. Returns `false` if `ok:drawer:beforeclose` was prevented or it is permanent. */
  close(reason?: DrawerCloseReason): boolean;
  toggle(trigger?: HTMLElement | null): boolean;
}

/** `id` lookup that also works inside shadow roots (delegated targets are always connected). */
const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

const { variant, disableEscapeKeyDown } = drawerOptions.options;

/**
 * Drawer — spec: specs/components/drawer.md
 *
 * Markup:   temporary: <dialog id="x" data-ok-drawer data-ok-anchor="left" aria-label="…">
 *           docked:    <aside id="x" data-ok-drawer data-ok-variant="persistent|permanent" … hidden?>
 *             <div data-ok-drawer-content>…</div>
 * Triggers: [data-ok-drawer-open="x"] (opens; toggles a persistent drawer, kept in aria-expanded),
 *           [data-ok-drawer-close] (inside) or [data-ok-drawer-close="x"]
 * Options:  data-ok-variant (read at mount), data-ok-disable-escape-key-down, data-ok-hide-backdrop
 *           (CSS), data-ok-open (open on load)
 * Events:   ok:drawer:beforeopen (cancelable), ok:drawer:open,
 *           ok:drawer:beforeclose (cancelable, detail.reason), ok:drawer:close (detail.reason)
 */
export const drawer = defineComponent<DrawerInstance>({
  name: "drawer",
  selector: "[data-ok-drawer]",

  setup(element, { emit }) {
    const kind = readStyle(element, variant);
    // Options are re-read on every open, so data-ok-* changes made while closed take effect.
    const options = () => ({
      contentSelector: "[data-ok-drawer-content]",
      closeOnEscape: !element.hasAttribute(disableEscapeKeyDown.attr),
      onDismiss: (reason: DrawerCloseReason) => instance.close(reason),
      onExternalClose: () => emit("close", { reason: "native" }),
    });
    const controller = kind === "temporary" ? createModalController(element, options()) : null;

    /** Docked drawers: triggers report the state (`aria-expanded`). */
    const syncTriggers = () => {
      if (controller || !element.id) return;
      const root = element.getRootNode() as Document | ShadowRoot;
      for (const trigger of root.querySelectorAll(
        `[data-ok-drawer-open="${CSS.escape(element.id)}"]`,
      )) {
        trigger.setAttribute("aria-expanded", String(instance.isOpen));
        trigger.setAttribute("aria-controls", element.id);
      }
    };

    const instance: DrawerInstance = {
      get isOpen() {
        return controller ? controller.isOpen : !element.hidden;
      },
      open(trigger = null) {
        if (instance.isOpen) return true;
        if (!emit("beforeopen", { trigger }, { cancelable: true })) return false;
        if (controller) {
          controller.setOptions(options());
          controller.open(trigger);
        } else {
          element.hidden = false;
          syncTriggers();
        }
        emit("open", { trigger });
        return true;
      },
      close(reason = "api") {
        if (!instance.isOpen) return true;
        if (kind === "permanent") return false;
        if (!emit("beforeclose", { reason }, { cancelable: true })) return false;
        if (controller) controller.close();
        else {
          element.hidden = true;
          syncTriggers();
        }
        emit("close", { reason });
        return true;
      },
      toggle(trigger = null) {
        return instance.isOpen ? instance.close("trigger") : instance.open(trigger);
      },
      destroy() {
        controller?.destroy();
      },
    };

    if (kind === "permanent") element.hidden = false;
    if (element.hasAttribute("data-ok-open")) instance.open();
    syncTriggers();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-drawer-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-drawer-open") as string;
        const target = byId(trigger, id);
        const instance = runtime.getOrCreate<DrawerInstance>(target, "drawer");
        if (!instance) {
          console.warn(`[owlky] No drawer with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        // A docked (persistent) drawer toggles; a temporary one opens (it covers the trigger).
        const docked = readStyle(target as Element, variant) !== "temporary";
        if (docked && instance.isOpen) instance.close("trigger");
        else instance.open(trigger as HTMLElement);
      },
    },
    {
      event: "click",
      selector: "[data-ok-drawer-close]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-drawer-close");
        const target = id ? byId(trigger, id) : trigger.closest("[data-ok-drawer]");
        const instance = runtime.get<DrawerInstance>(target, "drawer");
        if (!instance) return;
        event.preventDefault();
        instance.close("trigger");
      },
    },
  ],
});
