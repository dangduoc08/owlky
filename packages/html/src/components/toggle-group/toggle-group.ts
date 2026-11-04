import {
  fromSelection,
  nextToggleSelection,
  type ToggleGroupValue,
  toggleGroupOptions,
  toSelection,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface ToggleGroupInstance extends ComponentInstance {
  /** `string | null` with `data-ok-exclusive`, `string[]` otherwise. */
  readonly value: ToggleGroupValue;
  /** Presses exactly the buttons whose `value` is in `value`, without emitting events. */
  setValue(value: ToggleGroupValue): void;
  /** Applies a press on `button`. Returns `false` if disabled or the change event was prevented. */
  toggle(button: Element): boolean;
}

/**
 * Toggle group — spec: specs/components/toggle-button.md
 *
 * Markup:  <div role="group" data-ok-toggle-group [data-ok-exclusive]>
 *            <button type="button" data-ok-toggle-button value="left" aria-pressed="true">…
 * Events:  ok:toggle-group:change (cancelable, detail: { value, previous, button })
 * Selection rules come from core (`nextToggleSelection`), shared with React.
 */
export const toggleGroup = defineComponent<ToggleGroupInstance>({
  name: "toggle-group",
  selector: "[data-ok-toggle-group]",

  setup(element, { emit }) {
    const exclusive = () => element.hasAttribute(toggleGroupOptions.options.exclusive.attr);
    /** Own buttons only: a nested group keeps its own buttons. */
    const buttons = () =>
      [...element.querySelectorAll<HTMLElement>("[data-ok-toggle-button]")].filter(
        (button) => button.closest("[data-ok-toggle-group]") === element,
      );
    const buttonValue = (button: Element) => button.getAttribute("value") ?? "";
    const selection = () =>
      buttons()
        .filter((button) => button.getAttribute("aria-pressed") === "true")
        .map(buttonValue);
    const apply = (selected: readonly string[]) => {
      for (const button of buttons()) {
        button.setAttribute("aria-pressed", String(selected.includes(buttonValue(button))));
      }
    };

    const instance: ToggleGroupInstance = {
      get value() {
        return fromSelection(selection(), exclusive());
      },
      setValue(value) {
        apply(toSelection(value));
      },
      toggle(button) {
        if (!buttons().includes(button as HTMLElement)) return false;
        if ((button as HTMLButtonElement).disabled) return false;
        const previous = instance.value;
        const next = nextToggleSelection(selection(), buttonValue(button), exclusive());
        const value = fromSelection(next, exclusive());
        if (!emit("change", { value, previous, button }, { cancelable: true })) return false;
        apply(next);
        return true;
      },
    };
    return instance;
  },
});
