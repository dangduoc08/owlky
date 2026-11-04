import { type ColorName, componentColorNames, paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

/*
 * Anatomy: each component's option schema (ADR-0015) and the `<name>Attributes(options)` helper
 * built from it. React spreads these objects; HTML snippets carry the same attributes (verified by
 * the e2e parity tests, per option). Defaults are emitted explicitly so rendered markup is
 * self-describing; values outside the allowed lists fall back to the default (untrusted input
 * never reaches the DOM).
 */

export type { DataAttributes } from "../options/define.js";

// --- Button -----------------------------------------------------------------------------------

export const buttonVariants = ["text", "contained", "outlined", "soft"] as const;
export const buttonSizes = ["sm", "md", "lg", "xl"] as const;
export const buttonLoadingPositions = ["center", "start", "end"] as const;
export const buttonColors = [
  "inherit",
  ...componentColorNames,
] as const satisfies readonly ColorName[];

export type ButtonVariant = (typeof buttonVariants)[number];
export type ButtonSize = (typeof buttonSizes)[number];
export type ButtonLoadingPosition = (typeof buttonLoadingPositions)[number];

export const buttonOptions = defineOptions("button", "data-ok-button", {
  variant: style("data-ok-variant", buttonVariants, "text", "Visual style."),
  color: style(
    "data-ok-color",
    buttonColors,
    "inherit",
    "`inherit` (neutral), palette, `black` / `white`.",
  ),
  size: style("data-ok-size", buttonSizes, "md", "Height: 30 / 36 / 48 / 56px."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  disableElevation: flag("data-ok-disable-elevation", "No shadow on contained buttons."),
  loading: flag("data-ok-loading", "Loader + `disabled` + `aria-busy` (adds the loader part)."),
  loadingPosition: style(
    "data-ok-loading-position",
    buttonLoadingPositions,
    "center",
    "Where the loader goes while loading.",
    { when: "loading" },
  ),
  disabled: native("disabled", "Native `disabled` (links: `aria-disabled`, no `href`)."),
});

export interface ButtonAnatomyOptions {
  variant?: ButtonVariant | undefined;
  color?: ColorName | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
  disableElevation?: boolean | undefined;
  loading?: boolean | undefined;
  loadingPosition?: ButtonLoadingPosition | undefined;
}

/** `data-ok-*` attributes of a button root (also used on `<a>` for link buttons). */
export const buttonAttributes = (options: ButtonAnatomyOptions = {}): DataAttributes =>
  optionAttributes(buttonOptions, { ...options });

// --- Icon button & Fab ------------------------------------------------------------------------

/** `default` is the neutral grey of icon buttons and fabs; `inherit` uses the text color. */
export const iconButtonColors = [
  "default",
  "inherit",
  ...componentColorNames,
] as const satisfies readonly (ColorName | "default")[];
export const iconButtonSizes = ["sm", "md", "lg"] as const;
export const iconButtonEdges = ["start", "end"] as const;

export type IconButtonColor = (typeof iconButtonColors)[number];
export type IconButtonSize = (typeof iconButtonSizes)[number];
export type IconButtonEdge = (typeof iconButtonEdges)[number];

export const iconButtonOptions = defineOptions("icon-button", "data-ok-icon-button", {
  color: style(
    "data-ok-color",
    iconButtonColors,
    "default",
    "`default` (secondary text), `inherit`, palette.",
  ),
  size: style("data-ok-size", iconButtonSizes, "md", "28 / 36 / 48px (icon 18 / 20 / 24)."),
  edge: style(
    "data-ok-edge",
    iconButtonEdges,
    "start",
    "Negative margin to align the icon with that edge (absent by default).",
    { optional: true },
  ),
  animate: flag("data-ok-animate", "Scale up on hover, down while pressed."),
  loading: flag("data-ok-loading", "Loader instead of the icon + `disabled` + `aria-busy`."),
  disabled: native("disabled", "Native `disabled`."),
});

export interface IconButtonAnatomyOptions {
  color?: IconButtonColor | undefined;
  size?: IconButtonSize | undefined;
  edge?: IconButtonEdge | undefined;
  animate?: boolean | undefined;
  loading?: boolean | undefined;
}

/** `data-ok-*` attributes of an icon button root. */
export const iconButtonAttributes = (options: IconButtonAnatomyOptions = {}): DataAttributes =>
  optionAttributes(iconButtonOptions, { ...options });

export const fabVariants = ["contained", "outlined", "soft"] as const;
export const fabColors = iconButtonColors;
export const fabSizes = iconButtonSizes;

export type FabVariant = (typeof fabVariants)[number];
export type FabColor = IconButtonColor;
export type FabSize = IconButtonSize;

export const fabOptions = defineOptions("fab", "data-ok-fab", {
  variant: style("data-ok-variant", fabVariants, "contained", "Visual style."),
  color: style(
    "data-ok-color",
    fabColors,
    "default",
    "`default` (grey), `inherit` (dark), palette.",
  ),
  size: style("data-ok-size", fabSizes, "md", "Round 40 / 48 / 56px; extended 36 / 40 / 48px."),
  extended: flag("data-ok-extended", "Pill with an icon and a label."),
  animate: flag("data-ok-animate", "Scale up on hover, down while pressed."),
  disabled: native("disabled", "Native `disabled`."),
});

export interface FabAnatomyOptions {
  variant?: FabVariant | undefined;
  color?: FabColor | undefined;
  size?: FabSize | undefined;
  extended?: boolean | undefined;
  animate?: boolean | undefined;
}

/** `data-ok-*` attributes of a fab root. */
export const fabAttributes = (options: FabAnatomyOptions = {}): DataAttributes =>
  optionAttributes(fabOptions, { ...options });

// --- Groups -----------------------------------------------------------------------------------

export const orientations = ["horizontal", "vertical"] as const;
export type Orientation = (typeof orientations)[number];

const BUTTON_CHILD = ":scope > [data-ok-button]";

export const buttonGroupOptions = defineOptions("button-group", "data-ok-button-group", {
  orientation: style("data-ok-orientation", orientations, "horizontal", "Row or column."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width; buttons share it."),
  variant: style("data-ok-variant", buttonVariants, "outlined", "Passed to every button.", {
    children: BUTTON_CHILD,
  }),
  color: style("data-ok-color", buttonColors, "inherit", "Passed to every button.", {
    children: BUTTON_CHILD,
  }),
  size: style("data-ok-size", buttonSizes, "md", "Passed to every button.", {
    children: BUTTON_CHILD,
  }),
  disableElevation: flag(
    "data-ok-disable-elevation",
    "Passed to every button (on by default in a group, as in the reference).",
    { children: BUTTON_CHILD },
  ),
  disabled: native("disabled", "Passed to every button.", { children: BUTTON_CHILD }),
});

/** `data-ok-*` attributes of a button group root (`role="group"` is set by the markup). */
export const buttonGroupAttributes = (
  options: { orientation?: Orientation | undefined; fullWidth?: boolean | undefined } = {},
): DataAttributes => optionAttributes(buttonGroupOptions, { ...options });

// --- Toggle button ----------------------------------------------------------------------------

export const toggleButtonColors = ["standard", ...paletteColorNames] as const;
export const toggleButtonSizes = ["sm", "md", "lg"] as const;

export type ToggleButtonColor = (typeof toggleButtonColors)[number];
export type ToggleButtonSize = (typeof toggleButtonSizes)[number];

export const toggleButtonOptions = defineOptions("toggle-button", "data-ok-toggle-button", {
  color: style("data-ok-color", toggleButtonColors, "standard", "Color of the pressed state."),
  size: style(
    "data-ok-size",
    toggleButtonSizes,
    "md",
    "Standalone 40 / 48 / 56px; in a group 30 / 38 / 46px.",
  ),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  disabled: native("disabled", "Native `disabled`: never toggles."),
  selected: state("aria-pressed", "Pressed state (`selected` / `defaultSelected`).", "change"),
});

export interface ToggleButtonAnatomyOptions {
  color?: ToggleButtonColor | undefined;
  size?: ToggleButtonSize | undefined;
  fullWidth?: boolean | undefined;
}

/** `data-ok-*` attributes of a toggle button (`aria-pressed` is set by the owner). */
export const toggleButtonAttributes = (options: ToggleButtonAnatomyOptions = {}): DataAttributes =>
  optionAttributes(toggleButtonOptions, { ...options });

const TOGGLE_CHILD = "[data-ok-toggle-button]";

export const toggleGroupOptions = defineOptions("toggle-group", "data-ok-toggle-group", {
  orientation: style("data-ok-orientation", orientations, "horizontal", "Row or column."),
  exclusive: flag("data-ok-exclusive", "At most one pressed button."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width; buttons share it."),
  color: style("data-ok-color", toggleButtonColors, "standard", "Passed to every button.", {
    children: TOGGLE_CHILD,
  }),
  size: style("data-ok-size", toggleButtonSizes, "md", "Passed to every button.", {
    children: TOGGLE_CHILD,
  }),
  disabled: native("disabled", "Passed to every button.", { children: TOGGLE_CHILD }),
  value: state("aria-pressed", "Pressed buttons (`value` / `defaultValue`).", "change"),
});

export interface ToggleGroupAnatomyOptions {
  orientation?: Orientation | undefined;
  exclusive?: boolean | undefined;
  fullWidth?: boolean | undefined;
}

/** `data-ok-*` attributes of a toggle group root (`role="group"` is set by the markup). */
export const toggleGroupAttributes = (options: ToggleGroupAnatomyOptions = {}): DataAttributes =>
  optionAttributes(toggleGroupOptions, { ...options });

// --- Drawer -----------------------------------------------------------------------------------

export const drawerAnchors = ["left", "right", "top", "bottom"] as const;
export const drawerVariants = ["temporary", "persistent", "permanent"] as const;
export type DrawerAnchor = (typeof drawerAnchors)[number];
export type DrawerVariant = (typeof drawerVariants)[number];
/** Why the drawer asks to close: Escape, a backdrop click, or a close trigger / the API. */
export type DrawerCloseReason = "escape" | "backdrop" | "close";

export const drawerOptions = defineOptions("drawer", "data-ok-drawer", {
  anchor: style("data-ok-anchor", drawerAnchors, "left", "Edge the drawer is attached to."),
  variant: style(
    "data-ok-variant",
    drawerVariants,
    "temporary",
    "`temporary`: modal `<dialog>`; `persistent`: docked `<aside>` that opens and closes; `permanent`: docked, always shown.",
  ),
  hideBackdrop: flag(
    "data-ok-hide-backdrop",
    "Temporary only: transparent backdrop (still modal).",
  ),
  disableEscapeKeyDown: flag(
    "data-ok-disable-escape-key-down",
    "Temporary only: Escape doesn't request close.",
  ),
  open: state(
    "open | hidden",
    "Open state (`open` / `defaultOpen`; HTML initial: `data-ok-open`).",
    "close",
  ),
});

/** `data-ok-*` attributes of a drawer root (`<dialog>` when temporary, `<aside>` when docked). */
export const drawerAttributes = (
  options: {
    anchor?: DrawerAnchor | undefined;
    variant?: DrawerVariant | undefined;
    hideBackdrop?: boolean | undefined;
    disableEscapeKeyDown?: boolean | undefined;
  } = {},
): DataAttributes => optionAttributes(drawerOptions, { ...options });

// --- Sortable ---------------------------------------------------------------------------------

export const sortableLayouts = ["grid", "vertical", "horizontal"] as const;
export type SortableLayout = (typeof sortableLayouts)[number];

export const sortableOptions = defineOptions("sortable", "data-ok-sortable", {
  layout: style(
    "data-ok-layout",
    sortableLayouts,
    "grid",
    "Grid, one column or one scrolling row.",
  ),
  items: state("data-ok-sortable-item", "Item order (`items` + `onReorder`).", "move"),
});

/** `data-ok-*` attributes of a sortable list. */
export const sortableAttributes = (
  options: { layout?: SortableLayout | undefined } = {},
): DataAttributes => optionAttributes(sortableOptions, { ...options });

/** Every component's option schema, for tooling (Storybook Controls, parity tests, docs). */
export const optionSchemas = {
  button: buttonOptions,
  "icon-button": iconButtonOptions,
  fab: fabOptions,
  "button-group": buttonGroupOptions,
  "toggle-button": toggleButtonOptions,
  "toggle-group": toggleGroupOptions,
  drawer: drawerOptions,
  sortable: sortableOptions,
} as const;
