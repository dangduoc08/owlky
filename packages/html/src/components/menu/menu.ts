import {
  createSubmenuHover,
  createTypeahead,
  initialMenuItem,
  isSubmenuTrigger,
  MENU_SUBMENU,
  menuKeyTarget,
  openSubmenuTriggers,
  parentMenuTrigger,
  submenuKeyAction,
  submenuPlacement,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec, Runtime } from "../../runtime/types.js";
import type { PopoverCloseReason, PopoverInstance } from "../popover/popover.js";

const ITEM = '[role="menuitem"]';
const typeahead = createTypeahead();

type HoverPopover = PopoverInstance & { hover?(anchor: Element, on: boolean): void };

/** The popover of a submenu trigger (next to it in its `[data-ok-menu-submenu]` wrapper). */
const submenuOf = (trigger: Element, runtime: Runtime) =>
  runtime.getOrCreate<HoverPopover>(
    trigger.parentElement
      ?.closest(`[${MENU_SUBMENU}]`)
      ?.querySelector(":scope > [data-ok-popover]") ?? null,
    "popover",
  );

/** Opens a trigger's submenu after it (in the reading direction); `focus` moves into it. */
function openSubmenu(trigger: HTMLElement, focus: boolean, runtime: Runtime) {
  const popover = submenuOf(trigger, runtime);
  if (!popover) return;
  const element = trigger.parentElement?.querySelector<HTMLElement>(":scope > [data-ok-popover]");
  if (!popover.isOpen) {
    element?.setAttribute("data-ok-placement", submenuPlacement(trigger));
    if (focus) popover.open(trigger);
    else popover.hover?.(trigger, true);
  } else if (focus) {
    const list = element?.querySelector('[role="menu"]');
    if (list) initialMenuItem(list)?.focus();
  }
  trigger.setAttribute("aria-expanded", String(popover.isOpen));
}

function closeSubmenu(trigger: Element, runtime: Runtime, reason: PopoverCloseReason = "trigger") {
  const popover = submenuOf(trigger, runtime);
  if (popover?.isOpen) popover.close(reason);
  trigger.setAttribute("aria-expanded", String(popover?.isOpen === true));
}

/** Closes the popover of `menu` and every popover around it (a choice inside a submenu). */
function closeAll(menu: Element, runtime: Runtime, reason: PopoverCloseReason) {
  let popover = menu.closest("[data-ok-popover]");
  while (popover) {
    runtime.get<PopoverInstance>(popover, "popover")?.close(reason);
    popover = popover.parentElement?.closest("[data-ok-popover]") ?? null;
  }
}

const hover = (runtime: Runtime) =>
  createSubmenuHover({
    onOpen: (trigger) => openSubmenu(trigger, false, runtime),
    onClose: (trigger) => closeSubmenu(trigger, runtime),
  });
const hovers = new WeakMap<Runtime, ReturnType<typeof hover>>();

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface MenuEvents {
  /** Before an item is chosen (then the popover closes). Call `preventDefault()` to keep the menu open. */
  select: EventSpec<{ item: Element }, true>;
}

/**
 * Menu — spec: specs/components/menu.md
 *
 * Markup:  <button data-ok-popover-open="m1" aria-haspopup="menu" aria-expanded="false" id="b1">
 *          <div id="m1" popover="manual" data-ok-popover data-ok-paper data-ok-placement="bottom-start">
 *            <ul data-ok-menu role="menu" aria-labelledby="b1">
 *              <li data-ok-menu-item role="menuitem" tabindex="-1">Profile</li>
 *              <li role="none" data-ok-menu-submenu>
 *                <div data-ok-menu-item role="menuitem" tabindex="-1" aria-haspopup="menu"
 *                     aria-expanded="false" aria-controls="m2" id="t2">More</div>
 *                <div id="m2" popover="manual" data-ok-popover data-ok-paper data-ok-placement="right-start">
 *                  <ul data-ok-menu role="menu" aria-labelledby="t2">…</ul>
 *                </div>
 *              </li>
 *            </ul>
 *          </div>
 * The popover opens it and focuses the selected (or first) item. Keys: ArrowDown / ArrowUp
 * (wrapping), Home, End, typeahead, Enter / Space (choose), Escape (close), Tab (close);
 * ArrowRight / Enter / Space open a submenu, ArrowLeft closes it (mirrored right to left); the
 * mouse resting on a trigger opens its submenu. A standalone `ul[data-ok-menu]` (no popover) works
 * the same; give its first focus item `tabindex="0"`.
 * Events:  ok:menu:select (cancelable, detail.item) on the menu; then the popover closes
 *          (reason "select"), with every popover around it.
 */
export interface MenuInstance extends ComponentInstance {
  /** Chooses an item: `ok:menu:select`, then the popover closes. `false` if prevented. */
  select(item: Element): boolean;
}

export const menu = defineComponent<MenuInstance, MenuEvents>({
  name: "menu",
  selector: "[data-ok-menu]",

  setup(element, { emit, runtime }) {
    // Closing the menu closes the submenus open in it.
    const popover = element.closest("[data-ok-popover]");
    const onClose = (event: Event) => {
      if (event.target !== popover) return;
      // A pending hover open must not reopen a submenu once its menu has closed (the menu may be
      // reopened by the same press before the hover delay ends).
      hovers.get(runtime)?.cancel();
      for (const trigger of openSubmenuTriggers(element)) closeSubmenu(trigger, runtime, "api");
      // A submenu closed by Escape or a press outside: its trigger's state; a press outside closes
      // the whole menu.
      const trigger = parentMenuTrigger(element);
      if (!trigger) return;
      trigger.setAttribute("aria-expanded", "false");
      const reason = (event as CustomEvent<{ reason: PopoverCloseReason }>).detail.reason;
      const owner = trigger.closest("[data-ok-menu]");
      if (reason === "backdrop" && owner) closeAll(owner, runtime, "backdrop");
    };
    popover?.addEventListener("ok:popover:close", onClose);
    return {
      select(item) {
        if (!emit("select", { item }, { cancelable: true })) return false;
        closeAll(element, runtime, "select");
        return true;
      },
      destroy() {
        popover?.removeEventListener("ok:popover:close", onClose);
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
          closeAll(menu, runtime, "tab");
          return;
        }
        const action = submenuKeyAction(menu, item, event.key);
        if (action === "open") {
          event.preventDefault();
          openSubmenu(item as HTMLElement, true, runtime);
          return;
        }
        if (action === "close") {
          event.preventDefault();
          const trigger = parentMenuTrigger(menu) as HTMLElement;
          closeSubmenu(trigger, runtime, "api");
          trigger.focus();
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
          for (const trigger of openSubmenuTriggers(menu))
            if (trigger !== next) closeSubmenu(trigger, runtime);
          next.focus();
        }
      },
    },
    {
      event: "click",
      selector: `[data-ok-menu] ${ITEM}`,
      handle(item, _event, runtime) {
        if (item.getAttribute("aria-disabled") === "true") return;
        if (isSubmenuTrigger(item)) {
          // A click decides: drop the hover intent it started on the way in.
          hovers.get(runtime)?.cancel();
          openSubmenu(item, true, runtime);
          return;
        }
        runtime.getOrCreate<MenuInstance>(item.closest("[data-ok-menu]"), "menu")?.select(item);
      },
    },
    {
      event: "pointerover",
      selector: "[data-ok-menu]",
      handle(_menu, e, runtime) {
        if ((e as PointerEvent).pointerType !== "mouse") return;
        let intent = hovers.get(runtime);
        if (!intent) {
          intent = hover(runtime);
          hovers.set(runtime, intent);
        }
        intent.over(e.target as Element);
      },
    },
  ],
});
