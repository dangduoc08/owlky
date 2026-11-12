import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import {
  type Placement,
  type PopoverAnchorReference,
  placements,
  popoverAnchorReferences,
} from "../popover/position.js";
import { paperElevations } from "./drawer.js";

// --- Popover, Tooltip, Menu -------------------------------------------------------------------

export const popoverPlacements = placements;
export type PopoverPlacement = Placement;

export const popoverOptions = defineOptions("popover", "data-ok-popover", {
  placement: style(
    "data-ok-placement",
    placements,
    "bottom",
    "Side of the anchor and alignment; flips to the other side when there is no room.",
  ),
  arrow: flag("data-ok-arrow", "Draws an arrow pointing at the anchor."),
  disableEscapeKeyDown: flag("data-ok-disable-escape-key-down", "Escape doesn't request close."),
  disableAutoFocus: flag(
    "data-ok-disable-auto-focus",
    "Focus stays on the anchor when it opens (hover popovers).",
  ),
  disableRestoreFocus: flag(
    "data-ok-disable-restore-focus",
    "Focus isn't moved back to the anchor on close.",
  ),
  anchorReference: style(
    "data-ok-anchor-reference",
    popoverAnchorReferences,
    "anchorEl",
    "What positions it: `anchorEl` (the anchor), `anchorPosition` (a point, `anchorPosition` / `data-ok-anchor-position`) or `none` (your CSS).",
    { optional: true },
  ),
  marginThreshold: number(
    "data-ok-margin-threshold",
    16,
    "Minimum distance to the viewport edges (px).",
    { min: 0 },
  ),
  transitionDuration: number(
    "data-ok-transition-duration",
    undefined,
    "Length of the opening animation (ms). Default: the theme's shorter duration.",
    { min: 0 },
  ),
  elevation: style(
    "data-ok-elevation",
    paperElevations,
    "8",
    "Shadow depth of the paper, `0`–`24` (`--ok-elevation-<n>`). Without it, the theme's dropdown shadow.",
    { optional: true },
  ),
  open: state(
    "data-ok-open",
    "Open state (`open` + `anchorEl` / `onOpenChange`; HTML: a trigger or `open()`).",
    "close",
  ),
});

export interface PopoverAnatomyOptions {
  anchorReference?: PopoverAnchorReference | undefined;
  marginThreshold?: number | undefined;
  transitionDuration?: number | undefined;
  placement?: Placement | undefined;
  arrow?: boolean | undefined;
  disableEscapeKeyDown?: boolean | undefined;
  disableAutoFocus?: boolean | undefined;
  disableRestoreFocus?: boolean | undefined;
  /** 0–24 (a number or its string); without it, the dropdown shadow. */
  elevation?: number | string | undefined;
}

/**
 * The marker of a library surface built on Paper (ADR-0066): `data-ok-paper` and, when given, a
 * valid `data-ok-elevation` (0–24). The surface's own CSS keeps its look; an elevation wins over
 * its default shadow.
 */
export const surfacePaperAttributes = (elevation?: number | string | undefined): DataAttributes => {
  const level = elevation === undefined ? undefined : String(elevation);
  return paperElevations.includes(level as (typeof paperElevations)[number])
    ? { "data-ok-paper": "", "data-ok-elevation": level as string }
    : { "data-ok-paper": "" };
};

/**
 * `data-ok-*` attributes of a popover (`div[popover]`): a Paper (ADR-0066), `data-ok-paper` right
 * after the root marker.
 */
export const popoverAttributes = ({
  elevation,
  ...options
}: PopoverAnatomyOptions = {}): DataAttributes => {
  const { "data-ok-popover": root, ...rest } = optionAttributes(popoverOptions, { ...options });
  return { "data-ok-popover": root as string, ...surfacePaperAttributes(elevation), ...rest };
};

export const tooltipTransitions = ["grow", "fade", "zoom"] as const;
export type TooltipTransition = (typeof tooltipTransitions)[number];

export const tooltipOptions = defineOptions("tooltip", "data-ok-tooltip", {
  placement: style("data-ok-placement", placements, "bottom", "Side of the trigger and alignment."),
  arrow: flag("data-ok-arrow", "Draws an arrow pointing at the trigger."),
  transition: style(
    "data-ok-transition",
    tooltipTransitions,
    "grow",
    "Opening animation: grows, fades or zooms in.",
    { optional: true },
  ),
  enterDelay: number("data-ok-enter-delay", 100, "Milliseconds before it opens on hover.", {
    min: 0,
  }),
  leaveDelay: number("data-ok-leave-delay", 0, "Milliseconds before it closes on leave.", {
    min: 0,
  }),
  enterNextDelay: number(
    "data-ok-enter-next-delay",
    undefined,
    "Milliseconds before it opens while another tooltip shows or closed less than 800 ms ago. Default: `enterDelay`.",
    { min: 0 },
  ),
  followCursor: flag("data-ok-follow-cursor", "The tooltip follows the pointer over the trigger."),
  open: state(
    "data-ok-open",
    "Open state (`open` / `onOpenChange`; HTML: hover and focus).",
    "open",
  ),
});

export interface TooltipAnatomyOptions {
  placement?: Placement | undefined;
  arrow?: boolean | undefined;
  transition?: TooltipTransition | undefined;
  enterDelay?: number | undefined;
  leaveDelay?: number | undefined;
  enterNextDelay?: number | undefined;
  followCursor?: boolean | undefined;
}

/** `data-ok-*` attributes of a tooltip (`div[role=tooltip][popover]`). */
export const tooltipAttributes = (options: TooltipAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tooltipOptions, { ...options });

export const menuVariants = ["selectedMenu", "menu"] as const;
export type MenuVariant = (typeof menuVariants)[number];

export const menuOptions = defineOptions("menu", "data-ok-menu", {
  dense: flag("data-ok-dense", "Compact items."),
  variant: style(
    "data-ok-variant",
    menuVariants,
    "selectedMenu",
    "Which item gets focus on open: the selected one, else the first (`selectedMenu`), or always the first (`menu`).",
    { optional: true },
  ),
  disableAutoFocusItem: flag(
    "data-ok-disable-auto-focus-item",
    'On open, focus goes to the list (`tabindex="-1"`), not to an item; the arrow keys then enter it.',
  ),
  disabledItemsFocusable: flag(
    "data-ok-disabled-items-focusable",
    "The keyboard stops on disabled items too (they still can't be chosen).",
  ),
  disableListWrap: flag(
    "data-ok-disable-list-wrap",
    "The arrow keys stop at the first and last items instead of wrapping.",
  ),
  selected: state("data-ok-selected", "The selected item (`MenuItem selected`).", "select"),
});

export interface MenuAnatomyOptions {
  dense?: boolean | undefined;
  variant?: MenuVariant | undefined;
  disableAutoFocusItem?: boolean | undefined;
  disabledItemsFocusable?: boolean | undefined;
  disableListWrap?: boolean | undefined;
}

/** `data-ok-*` attributes of a menu list (`ul[role=menu]`). */
export const menuAttributes = (options: MenuAnatomyOptions = {}): DataAttributes =>
  optionAttributes(menuOptions, { ...options });

export const menuItemOptions = defineOptions("menu-item", "data-ok-menu-item", {
  selected: flag("data-ok-selected", "The current choice (bold, tinted; `aria-current`)."),
  dense: flag("data-ok-dense", "Compact: 4px less padding above and below."),
  divider: flag("data-ok-show-divider", "A 1px line below the item."),
  disableGutters: flag("data-ok-disable-gutters", "No 8px padding on the sides."),
  disabled: native(
    "aria-disabled",
    '`aria-disabled="true"`: skipped by the keyboard, not clickable.',
  ),
});

export interface MenuItemAnatomyOptions {
  selected?: boolean | undefined;
  dense?: boolean | undefined;
  divider?: boolean | undefined;
  disableGutters?: boolean | undefined;
}

/** `data-ok-*` attributes of a menu item (`li[role=menuitem]`). */
export const menuItemAttributes = (options: MenuItemAnatomyOptions = {}): DataAttributes =>
  optionAttributes(menuItemOptions, { ...options });
