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
  "table-sort-label": tableSortLabelOptions,
} as const;
