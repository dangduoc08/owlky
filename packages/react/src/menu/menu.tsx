"use client";

import {
  altArrowRightLinear,
  createSubmenuHover,
  createTypeahead,
  initialMenuItem,
  isSubmenuTrigger,
  MENU_SUBMENU,
  type MenuVariant,
  menuAttributes,
  menuItemAttributes,
  menuKeyTarget,
  openSubmenuTriggers,
  type Placement,
  type PopoverAnchorPosition,
  type PopoverAnchorReference,
  type PopoverDismissReason,
  parentMenuTrigger,
  type SubmenuHover,
  submenuKeyAction,
  submenuPlacement,
} from "@owlky/core";
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type KeyboardEvent,
  type LiHTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Popover, type PopoverAnchor } from "../popover/popover.js";
import { Icon } from "../utils/icon.js";
import { useMergedRefs } from "../utils/refs.js";

/** Why a menu asks to close: Escape, a press outside, an item was chosen, or Tab left it. */
export type MenuCloseReason = PopoverDismissReason | "select" | "tab";

const ITEM = '[role="menuitem"]';

/** Opens or closes one submenu (registered by its trigger). */
interface SubmenuHandle {
  open(focus: boolean): void;
  close(): void;
}

/** Shared by a menu list and the submenus inside it. */
interface MenuTree {
  submenus: Map<Element, SubmenuHandle>;
  hover: SubmenuHover;
}

const MenuTreeContext = createContext<MenuTree | null>(null);

/** Provided by `Menu`: whether it is open, and how to ask it to close. */
const MenuOwnerContext = createContext<{
  open: boolean;
  close(reason: MenuCloseReason): void;
} | null>(null);

export interface MenuListProps extends HTMLAttributes<HTMLUListElement> {
  /** Compact items. */
  dense?: boolean | undefined;
  /**
   * `"selectedMenu"` (default): the selected item gets focus first, else the first item. `"menu"`:
   * always the first item.
   */
  variant?: MenuVariant | undefined;
  /** The keyboard stops on disabled items too (they still can't be chosen). */
  disabledItemsFocusable?: boolean | undefined;
  /** The arrow keys stop at the first and last items instead of wrapping. */
  disableListWrap?: boolean | undefined;
  /** Standalone list: focuses the list when it mounts (it then joins the tab order). */
  autoFocus?: boolean | undefined;
  /** Standalone list: focuses the first focus item (see `variant`) when it mounts. */
  autoFocusItem?: boolean | undefined;
  children?: ReactNode;
}

/** The child that takes the tab stop in a standalone list (MUI MenuList's active item). */
function activeIndex(
  children: ReactNode,
  variant: MenuVariant | undefined,
  disabledItemsFocusable: boolean | undefined,
): number {
  let first = -1;
  let selected = -1;
  Children.toArray(children).forEach((child, index) => {
    if (!isValidElement<MenuItemProps>(child)) return;
    if (child.props.disabled && !disabledItemsFocusable) return;
    if (first === -1) first = index;
    if (selected === -1 && child.props.selected && variant !== "menu") selected = index;
  });
  return selected === -1 ? first : selected;
}

/**
 * MenuList — spec: specs/components/menu.md. The `ul[role=menu]` with the menu's keyboard: arrows,
 * Home, End and typeahead move between items, Enter and Space choose, ArrowRight (ArrowLeft right to
 * left) opens a submenu and ArrowLeft closes it. A `Menu` renders one inside its Popover; used
 * alone (a menu always on screen), the first focus item takes the tab stop.
 */
export const MenuList = forwardRef<HTMLUListElement, MenuListProps>(function MenuList(
  {
    dense,
    variant,
    disabledItemsFocusable,
    disableListWrap,
    autoFocus,
    autoFocusItem,
    onKeyDown,
    onPointerOver,
    children,
    ...props
  },
  forwardedRef,
) {
  const parent = useContext(MenuTreeContext);
  const owner = useContext(MenuOwnerContext);
  const listRef = useRef<HTMLUListElement>(null);
  const ref = useMergedRefs(listRef, forwardedRef);
  const typeahead = useRef(createTypeahead()).current;
  const own = useRef<MenuTree | null>(null);
  if (!parent && !own.current) {
    const submenus = new Map<Element, SubmenuHandle>();
    own.current = {
      submenus,
      hover: createSubmenuHover({
        onOpen: (trigger) => submenus.get(trigger)?.open(false),
        onClose: (trigger) => submenus.get(trigger)?.close(),
      }),
    };
  }
  const tree = (parent ?? own.current) as MenuTree;
  const standalone = !owner && !parent;

  useEffect(() => () => own.current?.hover.cancel(), []);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (autoFocusItem) initialMenuItem(list)?.focus();
    else if (autoFocus) list.focus();
  }, [autoFocus, autoFocusItem]);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    const menu = event.currentTarget;
    const target = event.target as Element;
    // Keys inside a submenu are its own list's.
    if (event.defaultPrevented || target.closest('[role="menu"]') !== menu) return;
    if (event.key === "Tab") {
      owner?.close("tab");
      return;
    }
    const item = target.closest<HTMLElement>(ITEM);
    const action = submenuKeyAction(menu, item, event.key);
    if (action === "open") {
      event.preventDefault();
      tree.submenus.get(item as HTMLElement)?.open(true);
      return;
    }
    if (action === "close") {
      event.preventDefault();
      const trigger = parentMenuTrigger(menu) as HTMLElement;
      tree.submenus.get(trigger)?.close();
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
        if (trigger !== next) tree.submenus.get(trigger)?.close();
      next.focus();
    }
  };

  const handlePointerOver = (event: PointerEvent<HTMLUListElement>) => {
    onPointerOver?.(event);
    if (!parent && event.pointerType === "mouse") tree.hover.over(event.target as Element);
  };

  const active = standalone ? activeIndex(children, variant, disabledItemsFocusable) : -1;
  const items = standalone
    ? Children.map(children, (child, index) =>
        index === active && isValidElement<{ tabIndex?: number }>(child)
          ? cloneElement(child as ReactElement<{ tabIndex?: number }>, {
              tabIndex: child.props.tabIndex ?? 0,
            })
          : child,
      )
    : children;

  return (
    <MenuTreeContext.Provider value={tree}>
      <ul
        ref={ref}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: role=menu on a list is the WAI-ARIA menu pattern (MUI).
        role="menu"
        {...menuAttributes({ dense, variant, disabledItemsFocusable, disableListWrap })}
        tabIndex={autoFocus ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onPointerOver={handlePointerOver}
        {...props}
      >
        {items}
      </ul>
    </MenuTreeContext.Provider>
  );
});

export interface MenuProps extends Omit<MenuListProps, "autoFocus" | "autoFocusItem"> {
  /** Shows the menu. */
  open: boolean;
  /** The element (or virtual anchor) the menu opens next to. */
  anchorEl: PopoverAnchor;
  /** Called when the menu asks to close, with the reason. */
  onOpenChange?: ((open: boolean, reason?: MenuCloseReason) => void) | undefined;
  /** Where the menu opens around its anchor. Default `"bottom-start"`. */
  placement?: Placement | undefined;
  /** What positions the menu: the anchor (default), `anchorPosition` (a point) or `none` (your CSS). */
  anchorReference?: PopoverAnchorReference | undefined;
  /** The point used with `anchorReference="anchorPosition"`, in px from the viewport's top left corner. */
  anchorPosition?: PopoverAnchorPosition | undefined;
  /** Minimum distance to the viewport edges, in px. Default 16. */
  marginThreshold?: number | undefined;
  /** Length of the opening animation, in ms. Default: the theme's shorter duration. */
  transitionDuration?: number | undefined;
  /** On open, focus goes to the list instead of an item; the arrow keys then enter it. */
  disableAutoFocusItem?: boolean | undefined;
  /** `id` of the menu's popover (point the trigger's `aria-controls` at it). */
  id?: string | undefined;
  /** Props of the popover paper (`className`, `style`, …). */
  paperProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** Shadow depth of the paper, 0–24. Default: the theme's dropdown shadow. */
  elevation?: number | undefined;
}

/**
 * Menu — spec: specs/components/menu.md. A Popover holding a `MenuList`. Opening focuses the
 * selected item (or the first, see `variant`); choosing an item, also in a submenu, closes the menu
 * (reason `"select"`) unless its `onClick` calls `preventDefault()`.
 */
export const Menu = forwardRef<HTMLUListElement, MenuProps>(function Menu(
  {
    open,
    anchorEl,
    onOpenChange,
    placement = "bottom-start",
    anchorReference,
    anchorPosition,
    marginThreshold,
    transitionDuration,
    disableAutoFocusItem,
    id,
    paperProps,
    elevation,
    onClick,
    children,
    ...props
  },
  ref,
) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const setRefs = useMergedRefs(listRef, ref);
  const owner = {
    open,
    close: (reason: MenuCloseReason) => onOpenChange?.(false, reason),
  };

  const handleClick = (event: MouseEvent<HTMLUListElement>) => {
    onClick?.(event);
    const item = (event.target as Element).closest(ITEM);
    if (!item || item.getAttribute("aria-disabled") === "true" || event.defaultPrevented) return;
    if (isSubmenuTrigger(item)) return;
    onOpenChange?.(false, "select");
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onOpenChange={onOpenChange}
      placement={placement}
      anchorReference={anchorReference}
      anchorPosition={anchorPosition}
      marginThreshold={marginThreshold}
      transitionDuration={transitionDuration}
      elevation={elevation}
      id={id}
      initialFocus={() => initialMenuItem(listRef.current as HTMLUListElement)}
      {...paperProps}
    >
      <MenuOwnerContext.Provider value={owner}>
        <MenuList
          ref={setRefs}
          data-ok-disable-auto-focus-item={disableAutoFocusItem ? "" : undefined}
          tabIndex={disableAutoFocusItem ? -1 : undefined}
          onClick={handleClick}
          {...props}
        >
          {children}
        </MenuList>
      </MenuOwnerContext.Provider>
    </Popover>
  );
});

export interface MenuItemProps extends LiHTMLAttributes<HTMLLIElement> {
  /** The current choice: bold and tinted; the menu focuses it when it opens. */
  selected?: boolean | undefined;
  /** Can't be chosen and is skipped by the keyboard (`aria-disabled`). */
  disabled?: boolean | undefined;
  /** Compact: 4px less padding above and below. */
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

export interface MenuSubmenuProps extends Omit<MenuListProps, "autoFocus" | "autoFocusItem"> {
  /** The trigger item's content (text, an icon). A chevron follows it. */
  label: ReactNode;
  /** The trigger can't open the submenu and is skipped by the keyboard. */
  disabled?: boolean | undefined;
  /** `id` of the submenu's popover (default: a generated one). */
  id?: string | undefined;
  /** Props of the trigger item (`div[role=menuitem]`). */
  triggerProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** Props of the submenu's popover paper. */
  paperProps?: HTMLAttributes<HTMLDivElement> | undefined;
}

/**
 * A submenu inside a Menu or MenuList: a `li[role=none]` holding a trigger item
 * (`aria-haspopup="menu"`) and a Popover with its own `MenuList`, opened after the trigger in the
 * reading direction. ArrowRight, Enter, Space or a click open it and focus its first item; resting
 * the mouse on the trigger opens it without moving focus; ArrowLeft and Escape close it.
 */
export const MenuSubmenu = forwardRef<HTMLUListElement, MenuSubmenuProps>(function MenuSubmenu(
  { label, disabled, id, triggerProps, paperProps, dense, children, ...listProps },
  ref,
) {
  const tree = useContext(MenuTreeContext);
  const owner = useContext(MenuOwnerContext);
  const generated = useId();
  const popoverId = id ?? `${generated}menu`;
  const triggerId = `${popoverId}-trigger`;
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const setList = useMergedRefs(listRef, ref);
  // `null` closed; how it opened decides whether focus moves into it.
  const [opened, setOpened] = useState<"keyboard" | "pointer" | null>(null);
  const [placement, setPlacement] = useState<Placement>("right-start");
  const rootOpen = owner?.open ?? true;

  useEffect(() => {
    if (!rootOpen) setOpened(null);
  }, [rootOpen]);

  const openedRef = useRef(opened);
  openedRef.current = opened;
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !tree) return;
    tree.submenus.set(trigger, {
      open(focus) {
        setPlacement(submenuPlacement(trigger));
        if (openedRef.current && focus) initialMenuItem(listRef.current as Element)?.focus();
        else if (!openedRef.current) setOpened(focus ? "keyboard" : "pointer");
      },
      close: () => setOpened(null),
    });
    return () => {
      tree.submenus.delete(trigger);
    };
  }, [tree]);

  return (
    <li role="none" {...{ [MENU_SUBMENU]: "" }}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the menu list handles Enter, Space and the arrows. */}
      <div
        ref={triggerRef}
        id={triggerId}
        role="menuitem"
        tabIndex={-1}
        {...menuItemAttributes({ dense })}
        aria-haspopup="menu"
        aria-expanded={opened !== null && rootOpen}
        aria-controls={popoverId}
        aria-disabled={disabled ? true : undefined}
        onClick={
          disabled ? undefined : () => tree?.submenus.get(triggerRef.current as Element)?.open(true)
        }
        {...triggerProps}
      >
        {label}
        <Icon icon={altArrowRightLinear} data-ok-menu-submenu-icon="" />
      </div>
      <Popover
        id={popoverId}
        open={opened !== null && rootOpen}
        anchorEl={() => triggerRef.current}
        placement={placement}
        disableAutoFocus={opened === "pointer"}
        initialFocus={() => initialMenuItem(listRef.current as Element)}
        onOpenChange={(_, reason) => {
          setOpened(null);
          if (reason === "backdrop") owner?.close("backdrop");
        }}
        {...paperProps}
      >
        <MenuList ref={setList} aria-labelledby={triggerId} dense={dense} {...listProps}>
          {children}
        </MenuList>
      </Popover>
    </li>
  );
});
