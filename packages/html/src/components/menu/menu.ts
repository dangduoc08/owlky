import { createTypeahead, menuKeyTarget } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, Runtime } from "../../runtime/types.js";
import type { PopoverInstance } from "../popover/popover.js";

const ITEM = '[role="menuitem"]';
const typeahead = createTypeahead();

/** The popover a menu sits in. */
const popoverOf = (menu: Element, runtime: Runtime) =>
  runtime.get<PopoverInstance>(menu.closest("[data-ok-popover]"), "popover");

/**
 * Menu — spec: specs/components/menu.md
 *
 * Markup:  <button data-ok-popover-open="m1" aria-haspopup="menu" aria-expanded="false" id="b1">
 *          <div id="m1" popover="manual" data-ok-popover data-ok-placement="bottom-start">
 *            <ul data-ok-menu role="menu" aria-labelledby="b1">
 *              <li data-ok-menu-item role="menuitem" tabindex="-1">Profile</li>
 *            </ul>
 *          </div>
 * The popover opens it and focuses the selected (or first) item. Keys: ArrowDown / ArrowUp
 * (wrapping), Home, End, typeahead, Enter / Space (choose), Escape (close), Tab (close).
 * Events:  ok:menu:select (cancelable, detail.item) on the menu; then the popover closes
 *          (reason "select").
 */
export interface MenuInstance extends ComponentInstance {
  /** Chooses an item: `ok:menu:select`, then the popover closes. `false` if prevented. */
  select(item: Element): boolean;
}

export const menu = defineComponent<MenuInstance>({
  name: "menu",
  selector: "[data-ok-menu]",

  setup(element, { emit, runtime }) {
    return {
      select(item) {
        if (!emit("select", { item }, { cancelable: true })) return false;
        popoverOf(element, runtime)?.close("select");
        return true;
      },
    };
  },

  delegate: [
    {
      event: "keydown",
      selector: "[data-ok-menu]",
      handle(menu, e, runtime) {
        const event = e as KeyboardEvent;
        const item = (event.target as Element).closest<HTMLElement>(ITEM);
        if (event.key === "Tab") {
          popoverOf(menu, runtime)?.close("tab");
          return;
        }
        if ((event.key === "Enter" || event.key === " ") && item) {
          event.preventDefault();
          item.click();
          return;
        }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const next = menuKeyTarget(menu, item, event.key, typeahead);
        if (next) {
          event.preventDefault();
          next.focus();
        }
      },
    },
    {
      event: "click",
      selector: `[data-ok-menu] ${ITEM}`,
      handle(item, _event, runtime) {
        if (item.getAttribute("aria-disabled") === "true") return;
        runtime.getOrCreate<MenuInstance>(item.closest("[data-ok-menu]"), "menu")?.select(item);
      },
    },
  ],
});
