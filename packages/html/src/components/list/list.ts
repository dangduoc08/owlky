import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface ListInstance extends ComponentInstance {
  /**
   * Opens or closes the nested list a button names in `aria-controls` (toggles without `open`).
   * Returns `false` if `ok:list:toggle` was prevented or the button controls no list.
   */
  toggle(button: Element, open?: boolean): boolean;
}

const TOGGLE = "[data-ok-list-item-button][aria-controls][aria-expanded]";

/** The nested list a button controls, resolved in the button's own root. */
function controlled(button: Element): HTMLElement | null {
  const id = button.getAttribute("aria-controls") ?? "";
  const root = button.getRootNode() as Document | ShadowRoot;
  const target = id === "" ? null : root.getElementById(id);
  return target?.hasAttribute("data-ok-list") ? target : null;
}

/**
 * List — spec: specs/components/list.md
 *
 * Markup:  <ul data-ok-list>
 *            <li data-ok-list-item data-ok-disable-padding>
 *              <button type="button" data-ok-list-item-button aria-expanded="true" aria-controls="x">
 *                <span data-ok-list-item-text><span data-ok-list-item-text-primary>Inbox</span></span>
 *                <span data-ok-list-item-expand-icon aria-hidden="true"><svg …></span>
 *              </button>
 *              <ul data-ok-list data-ok-disable-padding id="x">…</ul>
 *            </li>
 *          </ul>
 * The runtime only opens and closes nested lists: a click on an item button with
 * `aria-controls` + `aria-expanded` flips `aria-expanded` and the named list's `hidden`.
 * Events:  ok:list:toggle (cancelable, detail `{ open, list }`) on the button's list.
 */
export const list = defineComponent<ListInstance>({
  name: "list",
  selector: "[data-ok-list]",

  setup(element, { emit }) {
    return {
      toggle(button, open) {
        const target = controlled(button);
        if (!target || !element.contains(button)) return false;
        const next = open ?? button.getAttribute("aria-expanded") !== "true";
        if (!emit("toggle", { open: next, list: target }, { cancelable: true })) return false;
        button.setAttribute("aria-expanded", String(next));
        target.hidden = !next;
        return true;
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: TOGGLE,
      handle(button, _event, runtime) {
        runtime.getOrCreate<ListInstance>(button.closest("[data-ok-list]"), "list")?.toggle(button);
      },
    },
  ],
});
