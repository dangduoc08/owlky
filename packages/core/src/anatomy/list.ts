import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- List -------------------------------------------------------------------------------------

export const listItemAlignments = ["center", "flex-start"] as const;
export const listSubheaderColors = ["default", "primary", "inherit"] as const;
export type ListItemAlignment = (typeof listItemAlignments)[number];
export type ListSubheaderColor = (typeof listSubheaderColors)[number];

export const listOptions = defineOptions("list", "data-ok-list", {
  dense: flag("data-ok-dense", "Compact rows: 4px less padding above and below every item."),
  disablePadding: flag("data-ok-disable-padding", "No 8px padding above and below the list."),
  expanded: state(
    "aria-expanded",
    "Nested lists: an item button with `aria-controls` opens or closes the list it names.",
    "toggle",
  ),
});

export interface ListAnatomyOptions {
  dense?: boolean | undefined;
  disablePadding?: boolean | undefined;
}

/** `data-ok-*` attributes of a list (`ul`). */
export const listAttributes = (options: ListAnatomyOptions = {}): DataAttributes =>
  optionAttributes(listOptions, { ...options });

const ALIGN_ITEMS = style(
  "data-ok-align-items",
  listItemAlignments,
  "center",
  "`flex-start` aligns the icon or avatar with the first line (multi-line text).",
  { optional: true },
);
const ITEM_DENSE = flag("data-ok-dense", "Compact: 4px padding above and below.");
const DISABLE_GUTTERS = flag("data-ok-disable-gutters", "No 16px padding on the sides.");
const ITEM_DIVIDER = flag("data-ok-show-divider", "A 1px line below the item.");

export const listItemOptions = defineOptions("list-item", "data-ok-list-item", {
  alignItems: ALIGN_ITEMS,
  dense: ITEM_DENSE,
  disableGutters: DISABLE_GUTTERS,
  disablePadding: flag(
    "data-ok-disable-padding",
    "No padding: for an item that holds a list item button.",
  ),
  divider: ITEM_DIVIDER,
});

export interface ListItemAnatomyOptions {
  alignItems?: ListItemAlignment | undefined;
  dense?: boolean | undefined;
  disableGutters?: boolean | undefined;
  disablePadding?: boolean | undefined;
  divider?: boolean | undefined;
}

/** `data-ok-*` attributes of a list item (`li`). */
export const listItemAttributes = (options: ListItemAnatomyOptions = {}): DataAttributes =>
  optionAttributes(listItemOptions, { ...options });

export const listItemButtonOptions = defineOptions("list-item-button", "data-ok-list-item-button", {
  alignItems: ALIGN_ITEMS,
  dense: ITEM_DENSE,
  disableGutters: DISABLE_GUTTERS,
  divider: ITEM_DIVIDER,
  selected: flag(
    "data-ok-selected",
    "Highlighted as the current choice (add `aria-current` for navigation).",
  ),
  disabled: native("disabled", "Native `disabled` (links: `aria-disabled`, no `href`)."),
});

export interface ListItemButtonAnatomyOptions {
  alignItems?: ListItemAlignment | undefined;
  dense?: boolean | undefined;
  disableGutters?: boolean | undefined;
  divider?: boolean | undefined;
  selected?: boolean | undefined;
}

/** `data-ok-*` attributes of a list item button (`button` or `a`). */
export const listItemButtonAttributes = (
  options: ListItemButtonAnatomyOptions = {},
): DataAttributes => optionAttributes(listItemButtonOptions, { ...options });

export const listItemTextOptions = defineOptions("list-item-text", "data-ok-list-item-text", {
  inset: flag("data-ok-inset", "Starts 40px in, lined up with items that have an icon."),
});

/** `data-ok-*` attributes of a list item's text. */
export const listItemTextAttributes = (
  options: { inset?: boolean | undefined } = {},
): DataAttributes => optionAttributes(listItemTextOptions, { ...options });

export const listSubheaderOptions = defineOptions("list-subheader", "data-ok-list-subheader", {
  color: style(
    "data-ok-color",
    listSubheaderColors,
    "default",
    "`default` (secondary text), `primary` or `inherit`.",
  ),
  disableGutters: DISABLE_GUTTERS,
  disableSticky: flag("data-ok-disable-sticky", "Scrolls away with the list instead of sticking."),
  inset: flag("data-ok-inset", "Starts 56px in, lined up with item text after an icon."),
});

export interface ListSubheaderAnatomyOptions {
  color?: ListSubheaderColor | undefined;
  disableGutters?: boolean | undefined;
  disableSticky?: boolean | undefined;
  inset?: boolean | undefined;
}

/** `data-ok-*` attributes of a list's subheader (`li`). */
export const listSubheaderAttributes = (
  options: ListSubheaderAnatomyOptions = {},
): DataAttributes => optionAttributes(listSubheaderOptions, { ...options });
