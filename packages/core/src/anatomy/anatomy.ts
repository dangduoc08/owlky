import { type ColorName, componentColorNames, paletteColorNames } from "@owlky/tokens";
import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import { type Placement, placements } from "../popover/position.js";
import { type ToastPosition, toastPositions } from "../toast/toast-store.js";

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

// --- Accordion --------------------------------------------------------------------------------

export const accordionVariants = ["default", "outlined", "soft"] as const;
export type AccordionVariant = (typeof accordionVariants)[number];

export const accordionOptions = defineOptions("accordion", "data-ok-accordion", {
  variant: style(
    "data-ok-variant",
    accordionVariants,
    "default",
    "`default`: the open item becomes a card; `outlined`: bordered list; `soft`: filled items.",
  ),
  disableGutters: flag("data-ok-disable-gutters", "No margin around the open item."),
  disabled: flag(
    "data-ok-disabled",
    "Can't be toggled (summary `aria-disabled`, out of the tab order).",
  ),
  expanded: state("open", "Open state (`expanded` / `defaultExpanded`).", "toggle"),
});

export interface AccordionAnatomyOptions {
  variant?: AccordionVariant | undefined;
  disableGutters?: boolean | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of an accordion `<details>`. */
export const accordionAttributes = (options: AccordionAnatomyOptions = {}): DataAttributes =>
  optionAttributes(accordionOptions, { ...options });

// --- Alert ------------------------------------------------------------------------------------

export const alertSeverities = ["success", "info", "warning", "error"] as const;
export const alertVariants = ["standard", "filled", "outlined"] as const;
export type AlertSeverity = (typeof alertSeverities)[number];
export type AlertVariant = (typeof alertVariants)[number];

export const alertOptions = defineOptions("alert", "data-ok-alert", {
  severity: style("data-ok-severity", alertSeverities, "success", "Meaning and default icon."),
  variant: style("data-ok-variant", alertVariants, "standard", "Tinted, filled or outlined."),
  color: style("data-ok-color", alertSeverities, "success", "Colors (default: the severity's)."),
  open: state("hidden", "Removed from view when its close button is pressed (HTML).", "close"),
});

export interface AlertAnatomyOptions {
  severity?: AlertSeverity | undefined;
  variant?: AlertVariant | undefined;
  color?: AlertSeverity | undefined;
}

/** `data-ok-*` attributes of an alert; the color defaults to the severity's. */
export const alertAttributes = (options: AlertAnatomyOptions = {}): DataAttributes => {
  const known = (value: unknown): value is AlertSeverity =>
    alertSeverities.includes(value as AlertSeverity);
  const severity = known(options.severity)
    ? options.severity
    : alertOptions.options.severity.default;
  return optionAttributes(alertOptions, {
    ...options,
    severity,
    color: known(options.color) ? options.color : severity,
  });
};

// --- Table ------------------------------------------------------------------------------------

export const tableSizes = ["medium", "small"] as const;
export const tablePaddings = ["normal", "checkbox", "none"] as const;
export const tableAligns = ["inherit", "left", "center", "right", "justify"] as const;
export const tableSortDirections = ["asc", "desc"] as const;
export type TableSize = (typeof tableSizes)[number];
export type TablePadding = (typeof tablePaddings)[number];
export type TableAlign = (typeof tableAligns)[number];
export type TableSortDirection = (typeof tableSortDirections)[number];

export const tableOptions = defineOptions("table", "data-ok-table", {
  size: style("data-ok-size", tableSizes, "medium", "Cell height (`small` = dense)."),
  padding: style(
    "data-ok-padding",
    tablePaddings,
    "normal",
    "Cell padding (`checkbox` for a selection column).",
  ),
  stickyHeader: flag(
    "data-ok-sticky-header",
    "Header stays visible while a height-limited container scrolls.",
  ),
  sort: state(
    "aria-sort",
    "Sorted column (`TableSortLabel` + app state; HTML sorts rows).",
    "sort",
  ),
  selected: state("data-ok-selected", "Selected rows (app state; HTML: row checkboxes).", "select"),
  expanded: state("aria-expanded", "Open detail rows (`TableExpandButton`).", "expand"),
});

export interface TableAnatomyOptions {
  size?: TableSize | undefined;
  padding?: TablePadding | undefined;
  stickyHeader?: boolean | undefined;
}

/** `data-ok-*` attributes of a `<table>`. */
export const tableAttributes = (options: TableAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tableOptions, { ...options });

export interface TableCellAnatomyOptions {
  align?: TableAlign | undefined;
  padding?: TablePadding | undefined;
  size?: TableSize | undefined;
}

const allowed = <V extends string>(values: readonly V[], value: unknown): value is V =>
  values.includes(value as V);

/** Per-cell overrides (only the given, valid ones; a cell inherits the table's otherwise). */
export const tableCellAttributes = (options: TableCellAnatomyOptions = {}): DataAttributes => {
  const attributes: DataAttributes = {};
  if (allowed(tableAligns, options.align) && options.align !== "inherit")
    attributes["data-ok-align"] = options.align;
  if (allowed(tablePaddings, options.padding)) attributes["data-ok-padding"] = options.padding;
  if (allowed(tableSizes, options.size)) attributes["data-ok-size"] = options.size;
  return attributes;
};

export const tableSortLabelOptions = defineOptions("table-sort-label", "data-ok-table-sort-label", {
  active: flag("data-ok-active", "The table is sorted by this column."),
  direction: style("data-ok-direction", tableSortDirections, "asc", "Arrow direction."),
  hideSortIcon: flag("data-ok-hide-sort-icon", "No arrow while inactive (shown on hover / focus)."),
});

export interface TableSortLabelAnatomyOptions {
  active?: boolean | undefined;
  direction?: TableSortDirection | undefined;
  hideSortIcon?: boolean | undefined;
}

/** `data-ok-*` attributes of a sort button in a header cell. */
export const tableSortLabelAttributes = (
  options: TableSortLabelAnatomyOptions = {},
): DataAttributes => optionAttributes(tableSortLabelOptions, { ...options });

/** `aria-sort` of a header cell for a sort direction (`false` = not sorted). */
export const ariaSort = (direction: TableSortDirection | false | undefined) =>
  direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined;

// --- Scrollbar --------------------------------------------------------------------------------

export const scrollbarOptions = defineOptions("scrollbar", "data-ok-scrollbar", {
  autoHide: behavior(
    "data-ok-auto-hide",
    true,
    "The thumb shows on hover and focus only; `false` keeps it visible.",
  ),
});

/** `data-ok-*` attributes of a scroll area (`autoHide` is written only when turned off). */
export const scrollbarAttributes = (
  options: { autoHide?: boolean | undefined } = {},
): DataAttributes => ({
  ...optionAttributes(scrollbarOptions),
  ...(options.autoHide === false ? { [scrollbarOptions.options.autoHide.attr]: "false" } : {}),
});

// --- Pagination -------------------------------------------------------------------------------

export const paginationVariants = ["text", "outlined", "soft"] as const;
export const paginationColors = ["standard", ...paletteColorNames] as const;
export const paginationShapes = ["circular", "rounded"] as const;
export const paginationSizes = ["sm", "md", "lg"] as const;
export type PaginationVariant = (typeof paginationVariants)[number];
export type PaginationColor = (typeof paginationColors)[number];
export type PaginationShape = (typeof paginationShapes)[number];
export type PaginationSize = (typeof paginationSizes)[number];

export const paginationOptions = defineOptions("pagination", "data-ok-pagination", {
  variant: style("data-ok-variant", paginationVariants, "text", "Look of the current page."),
  color: style(
    "data-ok-color",
    paginationColors,
    "standard",
    "Color of the current page (`standard` = neutral).",
  ),
  shape: style("data-ok-shape", paginationShapes, "circular", "Round or 8px corners."),
  size: style("data-ok-size", paginationSizes, "md", "Item size: 26 / 32 / 40px."),
  disabled: flag("data-ok-disabled", "Every item is disabled."),
  page: state(
    "data-ok-page",
    "Current page, 1-based (`page` / `defaultPage` + `onChange(page)`).",
    "change",
  ),
});

export interface PaginationAnatomyOptions {
  variant?: PaginationVariant | undefined;
  color?: PaginationColor | undefined;
  shape?: PaginationShape | undefined;
  size?: PaginationSize | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a pagination `<nav>`. */
export const paginationAttributes = (options: PaginationAnatomyOptions = {}): DataAttributes =>
  optionAttributes(paginationOptions, { ...options });

// --- Progress ---------------------------------------------------------------------------------

export const progressColors = ["inherit", ...paletteColorNames] as const;
export const circularProgressVariants = ["indeterminate", "determinate"] as const;
export const linearProgressVariants = ["indeterminate", "determinate", "buffer", "query"] as const;
export type ProgressColor = (typeof progressColors)[number];
export type CircularProgressVariant = (typeof circularProgressVariants)[number];
export type LinearProgressVariant = (typeof linearProgressVariants)[number];

const progressValueOptions = {
  value: number(
    "aria-valuenow",
    undefined,
    "Progress between `min` and `max` (determinate and buffer variants; default `min`).",
  ),
  min: number("aria-valuemin", 0, "Lowest value."),
  max: number("aria-valuemax", 100, "Highest value (above `min`, otherwise `min` + 100)."),
};

export const circularProgressOptions = defineOptions(
  "circular-progress",
  "data-ok-circular-progress",
  {
    variant: style(
      "data-ok-variant",
      circularProgressVariants,
      "indeterminate",
      "`indeterminate` spins while the duration is unknown; `determinate` shows `value`.",
    ),
    color: style(
      "data-ok-color",
      progressColors,
      "primary",
      "Palette color, or `inherit` (text color).",
    ),
    ...progressValueOptions,
    size: number("data-ok-size", 40, "Width and height: a number in px, or a CSS length.", {
      min: 0,
      units: ["px", "rem", "em"],
    }),
    thickness: number("data-ok-thickness", 3.6, "Stroke width, in 1/44 of the size.", { min: 0 }),
    disableShrink: flag(
      "data-ok-disable-shrink",
      "Indeterminate: a fixed arc that only spins (lighter under heavy load).",
    ),
    enableTrackSlot: flag("data-ok-track-slot", "Shows the faint full circle behind the arc."),
  },
);

export interface CircularProgressAnatomyOptions {
  variant?: CircularProgressVariant | undefined;
  color?: ProgressColor | undefined;
  size?: number | string | undefined;
  thickness?: number | undefined;
  disableShrink?: boolean | undefined;
  enableTrackSlot?: boolean | undefined;
}

/** `data-ok-*` attributes of a circular progress (`size` / `thickness` only when given). */
export const circularProgressAttributes = (
  options: CircularProgressAnatomyOptions = {},
): DataAttributes => optionAttributes(circularProgressOptions, { ...options });

export const linearProgressOptions = defineOptions("linear-progress", "data-ok-linear-progress", {
  variant: style(
    "data-ok-variant",
    linearProgressVariants,
    "indeterminate",
    "`indeterminate` / `query` while the duration is unknown; `determinate` / `buffer` show `value`.",
  ),
  color: style(
    "data-ok-color",
    progressColors,
    "primary",
    "Palette color, or `inherit` (text color).",
  ),
  ...progressValueOptions,
  valueBuffer: number(
    "data-ok-value-buffer",
    undefined,
    "Buffer variant: how far loading has got, between `value` and `max`.",
  ),
});

export interface LinearProgressAnatomyOptions {
  variant?: LinearProgressVariant | undefined;
  color?: ProgressColor | undefined;
}

/** `data-ok-*` attributes of a linear progress (the buffer value is written by the component). */
export const linearProgressAttributes = (
  options: LinearProgressAnatomyOptions = {},
): DataAttributes => optionAttributes(linearProgressOptions, { ...options });

// --- Checkbox, Switch, FormControlLabel -------------------------------------------------------

export const selectionControlColors = ["default", ...paletteColorNames] as const;
export const selectionControlSizes = ["medium", "small"] as const;
export const switchEdges = ["start", "end"] as const;
export const labelPlacements = ["end", "start", "top", "bottom"] as const;
export type SelectionControlColor = (typeof selectionControlColors)[number];
export type SelectionControlSize = (typeof selectionControlSizes)[number];
export type SwitchEdge = (typeof switchEdges)[number];
export type LabelPlacement = (typeof labelPlacements)[number];

const CONTROL_INPUT = ":scope > input";

export const checkboxOptions = defineOptions("checkbox", "data-ok-checkbox", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "primary",
    "Color when checked or indeterminate (`default` = text color).",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Target 40 / 36px, icon 24 / 20px."),
  indeterminate: flag(
    "data-ok-indeterminate",
    "Mixed state: shows a dash and sets the input's `indeterminate` (`aria-checked=mixed`).",
  ),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state(
    "checked",
    "Native `checked` (`checked` / `defaultChecked` + `onChange(checked)`).",
    "change",
  ),
});

export interface CheckboxAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  indeterminate?: boolean | undefined;
}

/** `data-ok-*` attributes of a checkbox's root span. */
export const checkboxAttributes = (options: CheckboxAnatomyOptions = {}): DataAttributes =>
  optionAttributes(checkboxOptions, { ...options });

export const switchOptions = defineOptions("switch", "data-ok-switch", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "primary",
    "Track color when on (`default` = text color).",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Track 34 × 20 / 26 × 16px."),
  edge: style(
    "data-ok-edge",
    switchEdges,
    "start",
    "Negative margin on that side, to align the track with content.",
    { optional: true },
  ),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state(
    "checked",
    "Native `checked` (`checked` / `defaultChecked` + `onChange(checked)`).",
    "change",
  ),
});

export interface SwitchAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  edge?: SwitchEdge | false | undefined;
}

/** `data-ok-*` attributes of a switch's root span (`edge` only when set). */
export const switchAttributes = (options: SwitchAnatomyOptions = {}): DataAttributes =>
  optionAttributes(switchOptions, { ...options });

export const formControlLabelOptions = defineOptions(
  "form-control-label",
  "data-ok-form-control-label",
  {
    labelPlacement: style(
      "data-ok-label-placement",
      labelPlacements,
      "end",
      "Where the text sits around the control.",
    ),
    required: flag("data-ok-required", "Shows an asterisk; the control gets `required`."),
  },
);

export interface FormControlLabelAnatomyOptions {
  labelPlacement?: LabelPlacement | undefined;
  required?: boolean | undefined;
}

/** `data-ok-*` attributes of a control's `<label>`. */
export const formControlLabelAttributes = (
  options: FormControlLabelAnatomyOptions = {},
): DataAttributes => optionAttributes(formControlLabelOptions, { ...options });

// --- Radio, RadioGroup -----------------------------------------------------------------------

export const radioOptions = defineOptions("radio", "data-ok-radio", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "primary",
    "Color when selected (`default` = text color).",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Target 40 / 36px, icon 24 / 20px."),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state("checked", "Native `checked` (in a group: the group's `value`).", "change"),
});

export interface RadioAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
}

/** `data-ok-*` attributes of a radio's root span. */
export const radioAttributes = (options: RadioAnatomyOptions = {}): DataAttributes =>
  optionAttributes(radioOptions, { ...options });

export const radioGroupOptions = defineOptions("radio-group", "data-ok-radio-group", {
  row: flag("data-ok-row", "Radios side by side instead of a column."),
  value: state(
    "checked",
    "Selected radio (`value` / `defaultValue` + `onChange(value)`; HTML: the checked input).",
    "change",
  ),
});

/** `data-ok-*` attributes of a radio group. */
export const radioGroupAttributes = (options: { row?: boolean | undefined } = {}): DataAttributes =>
  optionAttributes(radioGroupOptions, { ...options });

// --- TextField --------------------------------------------------------------------------------

export const textFieldVariants = ["outlined", "filled", "standard"] as const;
export const textFieldMargins = ["none", "dense", "normal"] as const;
export type TextFieldVariant = (typeof textFieldVariants)[number];
export type TextFieldMargin = (typeof textFieldMargins)[number];

const FIELD_INPUT = ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]";

export const textFieldOptions = defineOptions("text-field", "data-ok-text-field", {
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "Outline, tinted fill or underline.",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Height 56 / 40px (outlined)."),
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Focus color (`default` = text color, as on the reference; MUI's default is `primary`).",
  ),
  error: flag("data-ok-error", "Error colors; the input gets `aria-invalid`."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  margin: style(
    "data-ok-margin",
    textFieldMargins,
    "none",
    "Vertical margin: 0, 8 / 4px or 16 / 8px.",
  ),
  shrink: flag("data-ok-shrink", "Keep the label above the value even when empty."),
  minRows: number("data-ok-min-rows", undefined, "Multiline: rows shown at least.", { min: 1 }),
  maxRows: number("data-ok-max-rows", undefined, "Multiline: rows before it scrolls.", { min: 1 }),
  disabled: native("disabled", "Native `disabled` on the input.", { children: FIELD_INPUT }),
  required: native("required", "Native `required`; the label gets an asterisk.", {
    children: FIELD_INPUT,
  }),
  value: state(
    "value",
    "The input's value (`value` / `defaultValue` + `onChange(value)`).",
    "input",
  ),
});

export interface TextFieldAnatomyOptions {
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  color?: SelectionControlColor | undefined;
  error?: boolean | undefined;
  fullWidth?: boolean | undefined;
  margin?: TextFieldMargin | undefined;
  shrink?: boolean | undefined;
  minRows?: number | undefined;
  maxRows?: number | undefined;
}

/** `data-ok-*` attributes of a text field's root. */
export const textFieldAttributes = (options: TextFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(textFieldOptions, { ...options });

// --- Avatar, AvatarGroup -----------------------------------------------------------------------

export const avatarVariants = ["circular", "rounded", "square"] as const;
export const avatarColors = ["default", ...paletteColorNames] as const;
export const avatarGroupSpacings = ["medium", "small"] as const;
export type AvatarVariant = (typeof avatarVariants)[number];
export type AvatarColor = (typeof avatarColors)[number];
export type AvatarGroupSpacing = (typeof avatarGroupSpacings)[number];

export const avatarOptions = defineOptions("avatar", "data-ok-avatar", {
  variant: style("data-ok-variant", avatarVariants, "circular", "Circle, 12px corners or square."),
  color: style("data-ok-color", avatarColors, "default", "Background for letters and icons."),
  size: number("data-ok-size", 40, "Width and height: a number in px, or a CSS length.", {
    min: 0,
    units: ["px", "rem", "em"],
  }),
});

export interface AvatarAnatomyOptions {
  variant?: AvatarVariant | undefined;
  color?: AvatarColor | undefined;
  size?: number | string | undefined;
}

/** `data-ok-*` attributes of an avatar (`size` only when given). */
export const avatarAttributes = (options: AvatarAnatomyOptions = {}): DataAttributes =>
  optionAttributes(avatarOptions, { ...options });

export const avatarGroupOptions = defineOptions("avatar-group", "data-ok-avatar-group", {
  spacing: style("data-ok-spacing", avatarGroupSpacings, "medium", "Overlap: 8 / 16px."),
});

/** `data-ok-*` attributes of an avatar group. */
export const avatarGroupAttributes = (
  options: { spacing?: AvatarGroupSpacing | undefined } = {},
): DataAttributes => optionAttributes(avatarGroupOptions, { ...options });

// --- Badge ------------------------------------------------------------------------------------

export const badgeVariants = [
  "standard",
  "dot",
  "online",
  "always",
  "busy",
  "offline",
  "invisible",
] as const;
export const badgeOverlaps = ["rectangular", "circular"] as const;
export const badgeVerticals = ["top", "bottom"] as const;
export const badgeHorizontals = ["right", "left"] as const;
export type BadgeVariant = (typeof badgeVariants)[number];
export type BadgeColor = (typeof avatarColors)[number];
export type BadgeOverlap = (typeof badgeOverlaps)[number];
export interface BadgeAnchorOrigin {
  vertical: (typeof badgeVerticals)[number];
  horizontal: (typeof badgeHorizontals)[number];
}

export const badgeOptions = defineOptions("badge", "data-ok-badge", {
  variant: style(
    "data-ok-variant",
    badgeVariants,
    "standard",
    "A count, a dot, or a presence status (`online` `always` `busy` `offline` `invisible`).",
  ),
  color: style("data-ok-color", avatarColors, "default", "Badge color (standard and dot)."),
  overlap: style(
    "data-ok-overlap",
    badgeOverlaps,
    "rectangular",
    "Shape it sits on: `circular` moves it in, onto the circle's edge.",
  ),
  vertical: style("data-ok-vertical", badgeVerticals, "top", "React: `anchorOrigin.vertical`."),
  horizontal: style(
    "data-ok-horizontal",
    badgeHorizontals,
    "right",
    "React: `anchorOrigin.horizontal`.",
  ),
  invisible: flag("data-ok-invisible", "Hides the badge (it shrinks away)."),
});

export interface BadgeAnatomyOptions {
  variant?: BadgeVariant | undefined;
  color?: BadgeColor | undefined;
  overlap?: BadgeOverlap | undefined;
  anchorOrigin?: Partial<BadgeAnchorOrigin> | undefined;
  invisible?: boolean | undefined;
}

/** `data-ok-*` attributes of a badge's wrapper. */
export const badgeAttributes = (options: BadgeAnatomyOptions = {}): DataAttributes =>
  optionAttributes(badgeOptions, {
    ...options,
    vertical: options.anchorOrigin?.vertical,
    horizontal: options.anchorOrigin?.horizontal,
  });

/** What a standard badge shows: hidden for 0 (unless `showZero`), capped at `max` ("99+"). */
export function badgeContent(
  content: unknown,
  options: { max?: number | undefined; showZero?: boolean | undefined } = {},
): { content: unknown; invisible: boolean } {
  const max = typeof options.max === "number" && Number.isFinite(options.max) ? options.max : 99;
  if (typeof content === "number") {
    if (content === 0 && options.showZero !== true) return { content, invisible: true };
    return { content: content > max ? `${max}+` : content, invisible: false };
  }
  return { content, invisible: content === undefined || content === null || content === "" };
}

// --- Chip -------------------------------------------------------------------------------------

export const chipVariants = ["filled", "outlined", "soft"] as const;
export const chipColors = ["default", ...componentColorNames] as const;
export type ChipVariant = (typeof chipVariants)[number];
export type ChipColor = (typeof chipColors)[number];

export const chipOptions = defineOptions("chip", "data-ok-chip", {
  variant: style("data-ok-variant", chipVariants, "filled", "Fill, outline or tint."),
  color: style(
    "data-ok-color",
    chipColors,
    "default",
    "`default` (neutral), palette, `black` / `white`.",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Height 32 / 24px."),
  disabled: native("disabled", "Native `disabled` on the chip's buttons.", {
    children: ":scope > button",
  }),
});

export interface ChipAnatomyOptions {
  variant?: ChipVariant | undefined;
  color?: ChipColor | undefined;
  size?: SelectionControlSize | undefined;
}

/** `data-ok-*` attributes of a chip's root. */
export const chipAttributes = (options: ChipAnatomyOptions = {}): DataAttributes =>
  optionAttributes(chipOptions, { ...options });

// --- Label ------------------------------------------------------------------------------------

export const labelVariants = ["filled", "outlined", "soft", "inverted"] as const;
export type LabelVariant = (typeof labelVariants)[number];

export const labelOptions = defineOptions("label", "data-ok-label", {
  variant: style("data-ok-variant", labelVariants, "soft", "Fill, outline, tint or inverted tint."),
  color: style(
    "data-ok-color",
    chipColors,
    "default",
    "`default` (neutral), palette, `black` / `white`.",
  ),
});

export interface LabelAnatomyOptions {
  variant?: LabelVariant | undefined;
  color?: ChipColor | undefined;
}

/** `data-ok-*` attributes of a label. */
export const labelAttributes = (options: LabelAnatomyOptions = {}): DataAttributes =>
  optionAttributes(labelOptions, { ...options });

// --- Divider ----------------------------------------------------------------------------------

export const dividerVariants = ["fullWidth", "inset", "middle"] as const;
export const dividerTextAligns = ["center", "left", "right"] as const;
export type DividerVariant = (typeof dividerVariants)[number];
export type DividerTextAlign = (typeof dividerTextAligns)[number];

export const dividerOptions = defineOptions("divider", "data-ok-divider", {
  variant: style(
    "data-ok-variant",
    dividerVariants,
    "fullWidth",
    "`inset` starts 72px in (after an avatar or icon); `middle` leaves 16px on both sides.",
  ),
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A line across, or a line up and down (also `aria-orientation`).",
  ),
  textAlign: style(
    "data-ok-text-align",
    dividerTextAligns,
    "center",
    "With text: where the text sits on the line.",
    { optional: true },
  ),
  flexItem: flag("data-ok-flex-item", "Vertical, in a flex row: stretch to the row's height."),
  absolute: flag("data-ok-absolute", "Pinned to the bottom of the positioned parent."),
});

export interface DividerAnatomyOptions {
  variant?: DividerVariant | undefined;
  orientation?: Orientation | undefined;
  textAlign?: DividerTextAlign | undefined;
  flexItem?: boolean | undefined;
  absolute?: boolean | undefined;
}

/** `data-ok-*` attributes of a divider (`textAlign` only when given). */
export const dividerAttributes = (options: DividerAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dividerOptions, { ...options });

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
  open: state(
    "data-ok-open",
    "Open state (`open` + `anchorEl` / `onOpenChange`; HTML: a trigger or `open()`).",
    "close",
  ),
});

export interface PopoverAnatomyOptions {
  placement?: Placement | undefined;
  arrow?: boolean | undefined;
  disableEscapeKeyDown?: boolean | undefined;
  disableAutoFocus?: boolean | undefined;
  disableRestoreFocus?: boolean | undefined;
}

/** `data-ok-*` attributes of a popover (`div[popover]`). */
export const popoverAttributes = (options: PopoverAnatomyOptions = {}): DataAttributes =>
  optionAttributes(popoverOptions, { ...options });

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
}

/** `data-ok-*` attributes of a tooltip (`div[role=tooltip][popover]`). */
export const tooltipAttributes = (options: TooltipAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tooltipOptions, { ...options });

export const menuOptions = defineOptions("menu", "data-ok-menu", {
  dense: flag("data-ok-dense", "Compact items."),
  selected: state("data-ok-selected", "The selected item (`MenuItem selected`).", "select"),
});

/** `data-ok-*` attributes of a menu list (`ul[role=menu]`). */
export const menuAttributes = (options: { dense?: boolean | undefined } = {}): DataAttributes =>
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

// --- Dialog -----------------------------------------------------------------------------------

export const dialogMaxWidths = ["xs", "sm", "md", "lg", "xl", "none"] as const;
export const dialogScrolls = ["paper", "body"] as const;
export type DialogMaxWidth = (typeof dialogMaxWidths)[number];
export type DialogScroll = (typeof dialogScrolls)[number];
/** Why a dialog asks to close: Escape, a backdrop click, or a close trigger / the API. */
export type DialogCloseReason = "escape" | "backdrop" | "close";

export const dialogOptions = defineOptions("dialog", "data-ok-dialog", {
  maxWidth: style(
    "data-ok-max-width",
    dialogMaxWidths,
    "sm",
    "Largest width: 444 / 600 / 900 / 1200 / 1536px, or `none`.",
  ),
  fullWidth: flag("data-ok-full-width", "Takes the whole `maxWidth`, even with little content."),
  fullScreen: flag("data-ok-full-screen", "Covers the viewport, without corners or margins."),
  scroll: style(
    "data-ok-scroll",
    dialogScrolls,
    "paper",
    "`paper`: the content scrolls inside the dialog; `body`: the whole dialog scrolls.",
  ),
  hideBackdrop: flag("data-ok-hide-backdrop", "Transparent backdrop (still modal)."),
  disableEscapeKeyDown: flag("data-ok-disable-escape-key-down", "Escape doesn't request close."),
  open: state(
    "open",
    "Open state (`open` / `onOpenChange`; HTML: a trigger or `open()`).",
    "close",
  ),
});

export interface DialogAnatomyOptions {
  maxWidth?: DialogMaxWidth | undefined;
  fullWidth?: boolean | undefined;
  fullScreen?: boolean | undefined;
  scroll?: DialogScroll | undefined;
  hideBackdrop?: boolean | undefined;
  disableEscapeKeyDown?: boolean | undefined;
}

/** `data-ok-*` attributes of a dialog (`<dialog>`). */
export const dialogAttributes = (options: DialogAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dialogOptions, { ...options });

// --- Snackbar (toaster) -----------------------------------------------------------------------

export const toasterOptions = defineOptions("toaster", "data-ok-toaster", {
  position: style(
    "data-ok-position",
    toastPositions,
    "top-right",
    "Corner or edge of the viewport.",
  ),
  duration: number(
    "data-ok-duration",
    4000,
    "Milliseconds a toast stays (paused on hover / focus).",
    {
      min: 0,
    },
  ),
  visibleToasts: number(
    "data-ok-visible-toasts",
    3,
    "Toasts shown at once; newer ones push out older.",
    {
      min: 1,
    },
  ),
  closeButton: flag("data-ok-close-button", "Every toast shows a close button."),
});

export interface ToasterAnatomyOptions {
  position?: ToastPosition | undefined;
  duration?: number | undefined;
  visibleToasts?: number | undefined;
  closeButton?: boolean | undefined;
}

/** `data-ok-*` attributes of a toaster (`section`). */
export const toasterAttributes = (options: ToasterAnatomyOptions = {}): DataAttributes =>
  optionAttributes(toasterOptions, { ...options });

/** Every component's option schema, for tooling (Storybook Controls, parity tests, docs). */
export const optionSchemas = {
  accordion: accordionOptions,
  alert: alertOptions,
  button: buttonOptions,
  "icon-button": iconButtonOptions,
  fab: fabOptions,
  "button-group": buttonGroupOptions,
  "toggle-button": toggleButtonOptions,
  "toggle-group": toggleGroupOptions,
  drawer: drawerOptions,
  sortable: sortableOptions,
  table: tableOptions,
  pagination: paginationOptions,
  scrollbar: scrollbarOptions,
  "circular-progress": circularProgressOptions,
  "linear-progress": linearProgressOptions,
  checkbox: checkboxOptions,
  switch: switchOptions,
  "form-control-label": formControlLabelOptions,
  radio: radioOptions,
  "radio-group": radioGroupOptions,
  "text-field": textFieldOptions,
  avatar: avatarOptions,
  "avatar-group": avatarGroupOptions,
  badge: badgeOptions,
  chip: chipOptions,
  label: labelOptions,
  divider: dividerOptions,
  list: listOptions,
  "list-item": listItemOptions,
  "list-item-button": listItemButtonOptions,
  "list-item-text": listItemTextOptions,
  "list-subheader": listSubheaderOptions,
  popover: popoverOptions,
  tooltip: tooltipOptions,
  menu: menuOptions,
  "menu-item": menuItemOptions,
  dialog: dialogOptions,
  toaster: toasterOptions,
  "table-sort-label": tableSortLabelOptions,
} as const;
