import { backdropStyle } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

export type BackdropCloseReason = "trigger" | "api";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface BackdropEvents {
  /** Before the backdrop opens. Call `preventDefault()` to keep it closed. */
  beforeopen: EventSpec<{ trigger: HTMLElement | null }, true>;
  /** After the backdrop opened. */
  open: EventSpec<{ trigger: HTMLElement | null }>;
  /** Before the backdrop closes. Call `preventDefault()` to keep it open. */
  beforeclose: EventSpec<{ reason: BackdropCloseReason }, true>;
  /** After the backdrop closed. */
  close: EventSpec<{ reason: BackdropCloseReason }>;
}

export interface BackdropInstance extends ComponentInstance {
  /** Whether the backdrop is open. */
  readonly isOpen: boolean;
  /** Shows the backdrop. Returns `false` if `ok:backdrop:beforeopen` was prevented. */
  open(trigger?: HTMLElement | null): boolean;
  /** Hides it. Returns `false` if `ok:backdrop:beforeclose` was prevented. */
  close(reason?: BackdropCloseReason): boolean;
}

const OPEN = "data-ok-open";
const DURATION = "data-ok-transition-duration";

const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

/**
 * Backdrop — spec: specs/components/backdrop.md
 *
 * Markup:   <button data-ok-backdrop-open="b1">Show backdrop</button>
 *           <div id="b1" data-ok-backdrop data-ok-backdrop-close>…</div>
 * Triggers: [data-ok-backdrop-open="id"]; [data-ok-backdrop-close="id"], or a valueless
 *           [data-ok-backdrop-close] inside the backdrop or on it (any click on it closes it).
 * State:    data-ok-open (shown; also opens it on load). Display is CSS only.
 * Events:   ok:backdrop:beforeopen (cancelable, detail.trigger), ok:backdrop:open,
 *           ok:backdrop:beforeclose (cancelable, detail.reason), ok:backdrop:close
 */
export const backdrop = defineComponent<BackdropInstance, BackdropEvents>({
  name: "backdrop",
  selector: "[data-ok-backdrop]",

  setup(element, { emit }) {
    const isOpen = () => element.hasAttribute(OPEN);
    // The fade's length (data-ok-transition-duration) through CSSOM.
    let written: string[] = [];
    const timing = () => {
      written = syncCustomProperties(
        element,
        backdropStyle({ transitionDuration: element.getAttribute(DURATION) ?? undefined }),
        written,
      );
    };
    timing();
    const observer = new MutationObserver(timing);
    observer.observe(element, { attributes: true, attributeFilter: [DURATION] });
    return {
      destroy() {
        observer.disconnect();
      },
      get isOpen() {
        return isOpen();
      },
      open(trigger = null) {
        if (isOpen()) return true;
        if (!emit("beforeopen", { trigger }, { cancelable: true })) return false;
        element.setAttribute(OPEN, "");
        emit("open", { trigger });
        return true;
      },
      close(reason = "api") {
        if (!isOpen()) return true;
        if (!emit("beforeclose", { reason }, { cancelable: true })) return false;
        element.removeAttribute(OPEN);
        emit("close", { reason });
        return true;
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-backdrop-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-backdrop-open") as string;
        const instance = runtime.getOrCreate<BackdropInstance>(byId(trigger, id), "backdrop");
        if (!instance) {
          console.warn(`[owlky] No backdrop with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.open(trigger as HTMLElement);
      },
    },
    {
      event: "click",
      selector: "[data-ok-backdrop-close]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-backdrop-close");
        const target = id ? byId(trigger, id) : trigger.closest("[data-ok-backdrop]");
        const instance = runtime.get<BackdropInstance>(target, "backdrop");
        if (!instance) return;
        event.preventDefault();
        instance.close("trigger");
      },
    },
  ],
});
