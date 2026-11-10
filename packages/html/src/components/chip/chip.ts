import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface ChipEvents {
  /** Before the chip is removed (its delete icon, Backspace or Delete). Call `preventDefault()` to keep it. */
  delete: EventSpec<undefined, true>;
}

export interface ChipInstance extends ComponentInstance {
  /** Removes the chip from view. Returns `false` if `ok:chip:delete` was prevented. */
  delete(): boolean;
}

/**
 * Chip — spec: specs/components/chip.md
 *
 * Markup:  <span data-ok-chip data-ok-variant="filled" data-ok-color="default" data-ok-size="medium">
 *            <button type="button" data-ok-chip-action><span data-ok-chip-label>Clickable</span></button>
 *            <button type="button" data-ok-chip-delete aria-label="Remove">…</button>
 *          </span>
 * Events:  ok:chip:delete (cancelable) — from the delete button, or Backspace / Delete on the
 *          chip's action button or link; then the chip gets `hidden`. Link chips: an
 *          `<a data-ok-chip-action href>` (disabled: no `href`, `role="link"`, `aria-disabled`).
 */
export const chip = defineComponent<ChipInstance, ChipEvents>({
  name: "chip",
  selector: "[data-ok-chip]",

  setup(element, { emit }) {
    return {
      delete() {
        if (!emit("delete", undefined, { cancelable: true })) return false;
        element.hidden = true;
        return true;
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-chip] > [data-ok-chip-delete]",
      handle(button, _event, runtime) {
        runtime.getOrCreate<ChipInstance>(button.closest("[data-ok-chip]"), "chip")?.delete();
      },
    },
    {
      event: "keydown",
      selector: "[data-ok-chip] > :is(button, a)[data-ok-chip-action]",
      handle(button, event, runtime) {
        const key = (event as KeyboardEvent).key;
        const root = button.closest("[data-ok-chip]");
        if (
          (key !== "Backspace" && key !== "Delete") ||
          !root?.querySelector(":scope > [data-ok-chip-delete]")
        )
          return;
        event.preventDefault();
        runtime.getOrCreate<ChipInstance>(root, "chip")?.delete();
      },
    },
  ],
});
