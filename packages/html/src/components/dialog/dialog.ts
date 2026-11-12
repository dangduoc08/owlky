import {
  createModalController,
  dialogOptions,
  dialogStyle,
  readDialogTransitionDuration,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

export type DialogCloseReason = "escape" | "backdrop" | "trigger" | "api" | "native";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface DialogEvents {
  /** Before the dialog opens. Call `preventDefault()` to keep it closed. */
  beforeopen: EventSpec<{ trigger: HTMLElement | null }, true>;
  /** After the dialog opened. `trigger` is the element that opened it, if any. */
  open: EventSpec<{ trigger: HTMLElement | null }>;
  /** Before the dialog closes. Call `preventDefault()` to keep it open. */
  beforeclose: EventSpec<{ reason: DialogCloseReason }, true>;
  /**
   * After the dialog closed (once its exit animation ended and the focus is back), with what
   * closed it (`native`: a form with `method="dialog"`).
   */
  close: EventSpec<{ reason: DialogCloseReason }>;
}

export interface DialogInstance extends ComponentInstance {
  /** Whether the dialog is open. */
  readonly isOpen: boolean;
  /** Opens the dialog. Returns `false` if `ok:dialog:beforeopen` was prevented. */
  open(trigger?: HTMLElement | null): boolean;
  /**
   * Closes it after its exit animation (`ok:dialog:close` fires then). Returns `false` if
   * `ok:dialog:beforeclose` was prevented.
   */
  close(reason?: DialogCloseReason): boolean;
}

const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

const { disableEscapeKeyDown, disableRestoreFocus, disableScrollLock } = dialogOptions.options;
const DURATIONS = ["data-ok-transition-duration", "data-ok-transition-duration-exit"];

/**
 * Dialog — spec: specs/components/dialog.md
 *
 * Markup:   <button data-ok-dialog-open="d1" aria-haspopup="dialog">Open</button>
 *           <dialog id="d1" data-ok-dialog data-ok-max-width="sm" data-ok-scroll="paper" aria-labelledby="d1-title">
 *             <div data-ok-dialog-paper data-ok-paper>
 *               <h2 data-ok-dialog-title id="d1-title">…</h2>
 *               <div data-ok-dialog-content>…</div>
 *               <div data-ok-dialog-actions><button data-ok-dialog-close>Cancel</button></div>
 *             </div>
 *           </dialog>
 * Triggers: [data-ok-dialog-open="id"], [data-ok-dialog-close] (inside) or [data-ok-dialog-close="id"];
 *           a `form[method=dialog]` closes it natively (reason "native").
 * Options:  data-ok-disable-escape-key-down (re-read on every open), data-ok-open (open on load),
 *           data-ok-transition-duration [+ -exit] (ms, through CSSOM)
 * Events:   ok:dialog:beforeopen (cancelable), ok:dialog:open,
 *           ok:dialog:beforeclose (cancelable, detail.reason), ok:dialog:close (detail.reason,
 *           after the exit animation)
 */
export const dialog = defineComponent<DialogInstance, DialogEvents>({
  name: "dialog",
  selector: "[data-ok-dialog]",

  setup(element, { emit }) {
    const options = () => ({
      contentSelector: "[data-ok-dialog-paper]",
      closeOnEscape: !element.hasAttribute(disableEscapeKeyDown.attr),
      restoreFocus: !element.hasAttribute(disableRestoreFocus.attr),
      lockScroll: !element.hasAttribute(disableScrollLock.attr),
      onDismiss: (reason: DialogCloseReason) => instance.close(reason),
      onExternalClose: () => emit("close", { reason: "native" }),
    });
    const controller = createModalController(element, options());
    // Entrance and exit lengths through CSSOM (strict CSP: no style attribute in the markup).
    let written: string[] = [];
    const timing = () => {
      written = syncCustomProperties(
        element,
        dialogStyle(readDialogTransitionDuration(element)),
        written,
      );
    };
    timing();
    const observer = new MutationObserver(timing);
    observer.observe(element, { attributes: true, attributeFilter: DURATIONS });

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
        // An `open()` during the exit keeps it open: no close event then.
        const closing = controller.close();
        // Nothing to play (reduced motion): closed already.
        if (!controller.isClosing) emit("close", { reason });
        else
          closing.then((closed) => {
            if (closed) emit("close", { reason });
          });
        return true;
      },
      destroy() {
        controller.destroy();
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
    if (element.hasAttribute("data-ok-open")) instance.open();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-dialog-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-dialog-open") as string;
        const instance = runtime.getOrCreate<DialogInstance>(byId(trigger, id), "dialog");
        if (!instance) {
          console.warn(`[owlky] No dialog with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.open(trigger as HTMLElement);
      },
    },
    {
      event: "click",
      selector: "[data-ok-dialog-close]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-dialog-close");
        const target = id ? byId(trigger, id) : trigger.closest("[data-ok-dialog]");
        const instance = runtime.get<DialogInstance>(target, "dialog");
        if (!instance) return;
        event.preventDefault();
        instance.close("trigger");
      },
    },
  ],
});
