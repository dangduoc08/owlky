import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface AlertEvents {
  /** Before the alert closes. Call `preventDefault()` to keep it. */
  close: EventSpec<undefined, true>;
}

export interface AlertInstance extends ComponentInstance {
  /** Hides the alert. Returns `false` if `ok:alert:close` was prevented. */
  close(): boolean;
}

/**
 * Alert — spec: specs/components/alert.md
 *
 * Markup:  <div role="alert" data-ok-alert data-ok-severity="info" data-ok-variant="standard" data-ok-color="info">
 *            <div data-ok-alert-icon>…</div><div data-ok-alert-message>…</div>
 *            <div data-ok-alert-action><button data-ok-icon-button data-ok-alert-close aria-label="Close">…</button></div>
 *          </div>
 * Events:  ok:alert:close (cancelable) — then the alert gets `hidden`
 */
export const alert = defineComponent<AlertInstance, AlertEvents>({
  name: "alert",
  selector: "[data-ok-alert]",

  setup(element, { emit }) {
    return {
      close() {
        if (!emit("close", undefined, { cancelable: true })) return false;
        element.hidden = true;
        return true;
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-alert-close]",
      handle(button, _event, runtime) {
        runtime.getOrCreate<AlertInstance>(button.closest("[data-ok-alert]"), "alert")?.close();
      },
    },
  ],
});
