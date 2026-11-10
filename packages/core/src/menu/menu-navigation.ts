/*
 * Menu keyboard navigation (WAI-ARIA menu pattern, MUI MenuList), shared by React and the HTML
 * runtime. Pure lookups over the menu's items: the owner moves focus. The menu's options are read
 * from its attributes (`data-ok-variant`, `data-ok-disabled-items-focusable`,
 * `data-ok-disable-list-wrap`, `data-ok-disable-auto-focus-item`), which both owners write.
 */

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** The submenu item's wrapper: `li[role=none][data-ok-menu-submenu]` › trigger + popover. */
export const MENU_SUBMENU = "data-ok-menu-submenu";

const disabled = (item: Element) =>
  item.getAttribute("aria-disabled") === "true" || (item as HTMLButtonElement).disabled === true;

/**
 * The menu's focusable items, in order. Disabled ones are skipped (like MUI), unless the menu has
 * `data-ok-disabled-items-focusable`.
 */
export function menuItems(menu: Element): HTMLElement[] {
  const focusable = menu.hasAttribute("data-ok-disabled-items-focusable");
  return [...menu.querySelectorAll<HTMLElement>(ITEM)].filter(
    (item) => item.closest('[role="menu"]') === menu && (focusable || !disabled(item)),
  );
}

/**
 * Where focus goes when the menu opens: the selected item, else the first (`variant="menu"`: always
 * the first); the list itself with `data-ok-disable-auto-focus-item`.
 */
export function initialMenuItem(menu: Element): HTMLElement | null {
  if (menu.hasAttribute("data-ok-disable-auto-focus-item")) return menu as HTMLElement;
  const items = menuItems(menu);
  const selected =
    menu.getAttribute("data-ok-variant") === "menu"
      ? undefined
      : items.find((item) => item.hasAttribute("data-ok-selected"));
  return selected ?? items[0] ?? null;
}

const label = (item: HTMLElement) => String(item.textContent).trim().toLowerCase();

export interface Typeahead {
  /** Adds a typed character and returns the matching item after `from`, if any. */
  match(items: HTMLElement[], from: HTMLElement | null, char: string): HTMLElement | null;
}

/** Typeahead: characters typed within 500 ms build a prefix; a repeated letter cycles. */
export function createTypeahead(timeout = 500, now: () => number = Date.now): Typeahead {
  let buffer = "";
  let last = 0;
  return {
    match(items, from, char) {
      const time = now();
      buffer = time - last > timeout ? char.toLowerCase() : buffer + char.toLowerCase();
      last = time;
      const cycling = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
      const prefix = cycling ? (buffer[0] as string) : buffer;
      const start = from ? items.indexOf(from) : -1;
      const ordered = [...items.slice(start + 1), ...items.slice(0, start + 1)];
      // A longer prefix may match the current item itself; a single letter moves on.
      const pool = prefix.length > 1 && from ? [from, ...ordered] : ordered;
      return pool.find((item) => label(item).startsWith(prefix)) ?? null;
    },
  };
}

/**
 * The item a key moves to: ArrowDown / ArrowUp (wrapping, unless the menu has
 * `data-ok-disable-list-wrap`: the ends then keep focus), Home, End, or a printable character
 * (typeahead). `null` = the key isn't a navigation key.
 */
export function menuKeyTarget(
  menu: Element,
  current: Element | null,
  key: string,
  typeahead?: Typeahead,
): HTMLElement | null {
  const items = menuItems(menu);
  if (items.length === 0) return null;
  const index = current ? items.indexOf(current as HTMLElement) : -1;
  const wrap = !menu.hasAttribute("data-ok-disable-list-wrap");
  const last = items.length - 1;
  switch (key) {
    case "ArrowDown":
      return items[index >= last ? (wrap ? 0 : last) : index + 1] as HTMLElement;
    case "ArrowUp":
      return items[
        index === -1 ? last : index === 0 ? (wrap ? last : 0) : index - 1
      ] as HTMLElement;
    case "Home":
      return items[0] as HTMLElement;
    case "End":
      return items[last] as HTMLElement;
    default:
      if (typeahead && key.length === 1 && key !== " ")
        return typeahead.match(items, (current as HTMLElement | null) ?? null, key);
      return null;
  }
}

/** Is this item the trigger of a submenu (`aria-haspopup="menu"`)? */
export const isSubmenuTrigger = (item: Element | null | undefined): item is HTMLElement =>
  item?.getAttribute("aria-haspopup") === "menu" && item.getAttribute("role") === "menuitem";

/** The trigger of the submenu this menu is (its `[data-ok-menu-submenu]` wrapper's item), if any. */
export function parentMenuTrigger(menu: Element): HTMLElement | null {
  const wrapper = menu.parentElement?.closest(`[${MENU_SUBMENU}]`);
  const trigger = wrapper?.querySelector(`:scope > ${ITEM}`);
  return isSubmenuTrigger(trigger) ? trigger : null;
}

/** The submenu triggers of this menu that are open (`aria-expanded="true"`). */
export const openSubmenuTriggers = (menu: Element): HTMLElement[] =>
  menuItems(menu).filter(
    (item) => isSubmenuTrigger(item) && item.getAttribute("aria-expanded") === "true",
  );

const rtlOf = (element: Element) => getComputedStyle(element).direction === "rtl";

/**
 * What a key does to submenus: `"open"` on a submenu trigger (ArrowRight, or ArrowLeft right to
 * left; Enter and Space), `"close"` inside a submenu (ArrowLeft, or ArrowRight right to left: back
 * to its trigger); otherwise `null`. Disabled triggers don't open.
 */
export function submenuKeyAction(
  menu: Element,
  item: Element | null,
  key: string,
): "open" | "close" | null {
  const rtl = rtlOf(menu);
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const back = rtl ? "ArrowRight" : "ArrowLeft";
  if (isSubmenuTrigger(item) && (key === forward || key === "Enter" || key === " "))
    return disabled(item) ? null : "open";
  if (key === back && parentMenuTrigger(menu)) return "close";
  return null;
}

/** The side a submenu opens on: after its trigger in the reading direction. */
export const submenuPlacement = (trigger: Element) =>
  rtlOf(trigger) ? ("left-start" as const) : ("right-start" as const);

export interface SubmenuHoverOptions {
  /** Milliseconds the pointer rests before submenus open or close. Default 100. */
  delay?: number | undefined;
  /** Open this trigger's submenu (without moving focus). */
  onOpen(trigger: HTMLElement): void;
  /** Close this trigger's submenu. */
  onClose(trigger: HTMLElement): void;
}

export interface SubmenuHover {
  /** The mouse moved over `target` (`pointerover`). */
  over(target: Element): void;
  /** Cancels what is pending. */
  cancel(): void;
}

/**
 * Hover intent for submenus: resting on a submenu trigger opens its submenu, resting on another
 * item of the same menu closes the submenus open there. Moving on before the delay ends cancels
 * it, so crossing items on the way into a submenu keeps it open.
 */
export function createSubmenuHover(options: SubmenuHoverOptions): SubmenuHover {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    over(target) {
      cancel();
      const menu = target.closest('[role="menu"]');
      if (!menu) return;
      const found = target.closest<HTMLElement>(ITEM);
      const item = found && found.closest('[role="menu"]') === menu ? found : null;
      const close = openSubmenuTriggers(menu).filter((trigger) => trigger !== item);
      const open =
        isSubmenuTrigger(item) && !disabled(item) && item.getAttribute("aria-expanded") !== "true"
          ? item
          : null;
      if (close.length === 0 && !open) return;
      timer = setTimeout(() => {
        timer = undefined;
        for (const trigger of close) options.onClose(trigger);
        if (open?.isConnected) options.onOpen(open);
      }, options.delay ?? 100);
    },
    cancel,
  };
}
