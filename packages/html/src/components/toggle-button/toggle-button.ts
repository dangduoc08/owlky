import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import type { ToggleGroupInstance } from "../toggle-group/toggle-group.js";

export interface ToggleButtonInstance extends ComponentInstance {
  readonly pressed: boolean;
  /** Sets the pressed state without emitting events. */
  setPressed(pressed: boolean): void;
  /** Flips the state. Returns `false` if disabled or `mt:toggle-button:change` was prevented. */
  toggle(): boolean;
}

const isDisabled = (element: Element) => (element as HTMLButtonElement).disabled === true;

/**
 * Toggle button — spec: specs/components/toggle-button.md
 *
 * Markup:  <button type="button" data-mt-toggle-button aria-pressed="false">…</button>
 *          (inside [data-mt-toggle-group] the group owns the selection)
 * Events:  mt:toggle-button:change (cancelable, detail.pressed) — standalone buttons only
 */
export const toggleButton = defineComponent<ToggleButtonInstance>({
  name: "toggle-button",
  selector: "[data-mt-toggle-button]",

  setup(element, { emit }) {
    if (element.getAttribute("aria-pressed") !== "true")
      element.setAttribute("aria-pressed", "false");
    const instance: ToggleButtonInstance = {
      get pressed() {
        return element.getAttribute("aria-pressed") === "true";
      },
      setPressed(pressed) {
        element.setAttribute("aria-pressed", String(pressed));
      },
      toggle() {
        if (isDisabled(element)) return false;
        const pressed = !instance.pressed;
        if (!emit("change", { pressed }, { cancelable: true })) return false;
        instance.setPressed(pressed);
        return true;
      },
    };
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-mt-toggle-button]",
      // Disabled buttons never fire click; toggle() re-checks for programmatic calls.
      handle(button, _event, runtime) {
        const group = button.closest("[data-mt-toggle-group]");
        if (group) runtime.getOrCreate<ToggleGroupInstance>(group, "toggle-group")?.toggle(button);
        else runtime.getOrCreate<ToggleButtonInstance>(button, "toggle-button")?.toggle();
      },
    },
  ],
});
