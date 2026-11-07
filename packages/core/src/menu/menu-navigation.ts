/*
 * Menu keyboard navigation (WAI-ARIA menu pattern, MUI MenuList), shared by React and the HTML
 * runtime. Pure lookups over the menu's items: the owner moves focus.
 */

const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** The menu's focusable items, in order (disabled ones are skipped, like MUI). */
export function menuItems(menu: Element): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>(ITEM)].filter(
    (item) =>
      item.closest('[role="menu"]') === menu &&
      item.getAttribute("aria-disabled") !== "true" &&
      !(item as HTMLButtonElement).disabled,
  );
}

/** The item to focus when the menu opens: the selected one, else the first. */
export function initialMenuItem(menu: Element): HTMLElement | null {
  const items = menuItems(menu);
  return items.find((item) => item.hasAttribute("data-ok-selected")) ?? items[0] ?? null;
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
 * The item a key moves to: ArrowDown / ArrowUp (wrapping), Home, End, or a printable character
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
  switch (key) {
    case "ArrowDown":
      return items[(index + 1) % items.length] as HTMLElement;
    case "ArrowUp":
      return items[index <= 0 ? items.length - 1 : index - 1] as HTMLElement;
    case "Home":
      return items[0] as HTMLElement;
    case "End":
      return items[items.length - 1] as HTMLElement;
    default:
      if (typeahead && key.length === 1 && key !== " ")
        return typeahead.match(items, (current as HTMLElement | null) ?? null, key);
      return null;
  }
}
