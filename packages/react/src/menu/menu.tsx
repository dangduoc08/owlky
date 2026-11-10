"use client";

import {
  createTypeahead,
  initialMenuItem,
  menuAttributes,
  menuItemAttributes,
  menuKeyTarget,
  type Placement,
  type PopoverDismissReason,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useRef,
} from "react";
import { Popover, type PopoverAnchor } from "../popover/popover.js";

/** Why a menu asks to close: Escape, a press outside, an item was chosen, or Tab left it. */
export type MenuCloseReason = PopoverDismissReason | "select" | "tab";

export interface MenuProps extends Omit<HTMLAttributes<HTMLUListElement>, "onKeyDown"> {
  /** Shows the menu. */
  open: boolean;
  /** The element the menu opens next to. */
  anchorEl: PopoverAnchor;
  /** Called when the menu asks to close, with the reason. */
  onOpenChange?: ((open: boolean, reason?: MenuCloseReason) => void) | undefined;
  /** Where the menu opens around its anchor. Default `"bottom-start"`. */
  placement?: Placement | undefined;
  /** Compact items. */
  dense?: boolean | undefined;
  /** `id` of the menu's popover (point the trigger's `aria-controls` at it). */
  id?: string | undefined;
  /** Props of the popover paper (`className`, `style`, …). */
  paperProps?: HTMLAttributes<HTMLDivElement> | undefined;
  children?: ReactNode;
}

/**
 * Menu — spec: specs/components/menu.md. A Popover holding a `ul[role=menu]`. Opening focuses the
 * selected item (or the first); arrows, Home, End and typeahead move between items; Enter and
 * Space choose; choosing an item closes the menu (reason `"select"`) unless its `onClick` calls
 * `preventDefault()`.
 */
export const Menu = forwardRef<HTMLUListElement, MenuProps>(function Menu(
  {
    open,
    anchorEl,
    onOpenChange,
    placement = "bottom-start",
    dense,
    id,
    paperProps,
    children,
    ...props
  },
  ref,
) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const typeahead = useRef(createTypeahead()).current;
  const setRefs = (node: HTMLUListElement | null) => {
    listRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const menu = event.currentTarget;
    if (event.key === "Tab") {
      onOpenChange?.(false, "tab");
      return;
    }
    const item = (event.target as Element).closest<HTMLElement>('[role="menuitem"]');
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
  };

  const onClick = (event: MouseEvent<HTMLUListElement>) => {
    const item = (event.target as Element).closest('[role="menuitem"]');
    if (!item || item.getAttribute("aria-disabled") === "true" || event.defaultPrevented) return;
    onOpenChange?.(false, "select");
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onOpenChange={onOpenChange}
      placement={placement}
      id={id}
      initialFocus={() => initialMenuItem(listRef.current as HTMLUListElement)}
      {...paperProps}
    >
      <ul
        ref={setRefs}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: role=menu on a list is the WAI-ARIA menu pattern (MUI).
        role="menu"
        {...menuAttributes({ dense })}
        onKeyDown={onKeyDown}
        onClick={onClick}
        {...props}
      >
        {children}
      </ul>
    </Popover>
  );
});

export interface MenuItemProps extends LiHTMLAttributes<HTMLLIElement> {
  /** The current choice: bold and tinted; the menu focuses it when it opens. */
  selected?: boolean | undefined;
  /** Can't be chosen and is skipped by the keyboard (`aria-disabled`). */
  disabled?: boolean | undefined;
  dense?: boolean | undefined;
  /** A 1px line below the item. */
  divider?: boolean | undefined;
  /** No 8px padding on the sides. */
  disableGutters?: boolean | undefined;
}

/** An item of a Menu (`li[role=menuitem]`). */
export const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(function MenuItem(
  { selected, disabled, dense, divider, disableGutters, onClick, ...props },
  ref,
) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Enter and Space are handled by the Menu (it clicks the focused item).
    <li
      ref={ref}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: menu items are list items (WAI-ARIA menu pattern, MUI).
      role="menuitem"
      tabIndex={-1}
      {...menuItemAttributes({ selected, dense, divider, disableGutters })}
      aria-disabled={disabled ? true : undefined}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  );
});
