import {
  type ColorName,
  componentColorNames,
  type PaletteColorName,
  paletteColorNames,
  typographyVariants,
} from "@owlky/tokens";
import {
  type CarouselArrowsVariant,
  type CarouselAutoScrollDirection,
  type CarouselAxis,
  type CarouselBreakpoint,
  type CarouselBreakpointOptions,
  type CarouselContainScroll,
  type CarouselDotsVariant,
  type CarouselEffect,
  type CarouselHeightEvent,
  type CarouselPlacement,
  type CarouselProgressVariant,
  type CarouselResponsive,
  type CarouselSlidesToShow,
  carouselAligns,
  carouselArrowsVariants,
  carouselAutoScrollDirections,
  carouselAxes,
  carouselBreakpoints,
  carouselContainScrolls,
  carouselDotsVariants,
  carouselEffects,
  carouselHeightEvents,
  carouselPlacements,
  carouselProgressVariants,
  parseAlign,
  parseSlidesToScroll,
  parseSlidesToShow,
  responsiveValues,
  slidesToShowAttr,
} from "../carousel/carousel-model.js";
import { type ChartBeeswarmSpread, chartBeeswarmSpreads } from "../chart/chart-beeswarm.js";
import {
  type ChartGeoLayout,
  type ChartPixelShape,
  type ChartProjection,
  type ChartScaleMethod,
  chartGeoLayouts,
  chartPixelShapes,
  chartProjections,
  chartScaleMethods,
} from "../chart/chart-geo.js";
import {
  type ChartDirection,
  type ChartEdgeStyle,
  type ChartLayoutType,
  type ChartLeaf,
  type ChartZoomType,
  chartDirections,
  chartEdgeStyles,
  chartLayoutTypes,
  chartLeaves,
  chartZoomTypes,
} from "../chart/chart-hierarchy.js";
import { type ChartMeasureMode, chartMeasureModes } from "../chart/chart-measure.js";
import {
  type ChartColor,
  type ChartCrossfilter,
  type ChartCurve,
  type ChartDataLabelPosition,
  type ChartFill,
  type ChartGrid,
  type ChartLegend,
  type ChartLegendAlign,
  type ChartMarkerShape,
  type ChartNoDataAlign,
  type ChartNoDataVerticalAlign,
  type ChartPattern,
  type ChartStackType,
  type ChartTooltipCorner,
  type ChartTooltipMode,
  type ChartType,
  type ChartXType,
  chartColors,
  chartCrossfilters,
  chartCurves,
  chartDataLabelPositions,
  chartFills,
  chartGrids,
  chartLegendAligns,
  chartLegends,
  chartMarkerShapes,
  chartNoDataAligns,
  chartNoDataVerticalAligns,
  chartPatterns,
  chartStackTypes,
  chartTooltipCorners,
  chartTooltipModes,
  chartTypes,
  chartXTypes,
} from "../chart/chart-model.js";
import { type ChartOrientation, chartOrientations } from "../chart/chart-sankey.js";
import {
  type ChartStreamOffset,
  type ChartStreamOrder,
  chartStreamOffsets,
  chartStreamOrders,
} from "../chart/chart-stream.js";
import { type ChartFillFrom, chartFillFroms } from "../chart/chart-unit.js";
import { type ChartUnitLayout, chartUnitLayouts } from "../chart/chart-unit-layouts.js";
import {
  type ChartViolinNormalize,
  type ChartViolinSide,
  type ChartViolinWhiskers,
  chartViolinNormalize,
  chartViolinSides,
  chartViolinWhiskers,
} from "../chart/chart-violin.js";
import { type GridDensity, gridDensities } from "../data-grid/data-grid.js";
import { type GanttBarLabel, ganttBarLabels } from "../gantt/gantt-render.js";
import { type GanttView, ganttViews } from "../gantt/gantt-scale.js";
import {
  type LightboxImageFit,
  type LightboxRotateButtons,
  type LightboxTextAlign,
  type LightboxThumbnailsPosition,
  lightboxImageFits,
  lightboxRotateButtons,
  lightboxTextAligns,
  lightboxThumbnailsPositions,
} from "../lightbox/lightbox-model.js";
import type { SpringOptions } from "../motion/animate.js";
import { type CountdownUnit, countdownUnits } from "../motion/countdown.js";
import type { ScrollOffset } from "../motion/scroll.js";
import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  parseNumber,
  pick,
  state,
  style,
} from "../options/define.js";
import {
  type Placement,
  type PopoverAnchorReference,
  placements,
  popoverAnchorReferences,
} from "../popover/position.js";
import { type ToastPosition, toastPositions } from "../toast/toast-store.js";
import {
  type WalktourBeaconTrigger,
  type WalktourCloseButtonAction,
  type WalktourPlacement,
  walktourBeaconTriggers,
  walktourCloseButtonActions,
  walktourPlacements,
} from "../walktour/walktour-model.js";

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
/**
 * Why the drawer asks to close (or, `swipe`, to open): Escape, a backdrop click, a close trigger /
 * the API, or a swipe.
 */
export type DrawerCloseReason = "escape" | "backdrop" | "close" | "swipe";

/** MUI's elevation levels, as attribute values (`--ok-elevation-<n>`; 0 = no shadow). */
export const paperElevations = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
] as const;

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
  disableRestoreFocus: flag(
    "data-ok-disable-restore-focus",
    "Temporary only: focus isn't moved back to the trigger on close.",
  ),
  disableScrollLock: flag(
    "data-ok-disable-scroll-lock",
    "Temporary only: the page behind can still scroll while it is open.",
  ),
  elevation: style(
    "data-ok-elevation",
    paperElevations,
    "16",
    "Shadow depth of the panel, `0`–`24` (`--ok-elevation-<n>`). Without it, each edge has its own shadow and docked drawers none.",
    { optional: true },
  ),
  transitionDuration: number(
    "data-ok-transition-duration",
    undefined,
    "Length of the slide in and out (ms). Default: the theme's short duration.",
    { min: 0 },
  ),
  swipeable: flag(
    "data-ok-swipeable",
    "Temporary only: a touch or pen swipe towards the edge closes the drawer, and one from the edge of the screen opens it. Keep a button that opens and closes it too.",
  ),
  swipeAreaWidth: number(
    "data-ok-swipe-area-width",
    20,
    "Swipeable: width of the strip along the edge of the screen where a swipe opens the drawer (px).",
    { min: 0 },
  ),
  hysteresis: number(
    "data-ok-hysteresis",
    0.52,
    "Swipeable: how far the panel must be pulled to open or close, as a share of its size (0 to 1).",
    { min: 0 },
  ),
  minFlingVelocity: number(
    "data-ok-min-fling-velocity",
    450,
    "Swipeable: speed from which a shorter swipe still opens or closes the drawer (px per second).",
    { min: 0 },
  ),
  disableSwipeToOpen: flag(
    "data-ok-disable-swipe-to-open",
    "Swipeable: no strip at the edge of the screen, so a swipe only closes the drawer.",
  ),
  disableDiscovery: flag(
    "data-ok-disable-discovery",
    "Swipeable: touching the edge strip doesn't slide a sliver of the panel in.",
  ),
  disableBackdropTransition: flag(
    "data-ok-disable-backdrop-transition",
    "Swipeable: the backdrop doesn't fade with the panel while it is swiped (less work on slow devices).",
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
    disableRestoreFocus?: boolean | undefined;
    disableScrollLock?: boolean | undefined;
    /** 0–24 (a number or its string). */
    elevation?: number | string | undefined;
    transitionDuration?: number | undefined;
    swipeable?: boolean | undefined;
    swipeAreaWidth?: number | undefined;
    hysteresis?: number | undefined;
    minFlingVelocity?: number | undefined;
    disableSwipeToOpen?: boolean | undefined;
    disableDiscovery?: boolean | undefined;
    disableBackdropTransition?: boolean | undefined;
  } = {},
): DataAttributes =>
  optionAttributes(drawerOptions, {
    ...options,
    elevation: options.elevation === undefined ? undefined : String(options.elevation),
  });

/** A transition length in ms → a CSS time; invalid → `undefined`. */
const msValue = (ms: unknown) => {
  const value = parseNumber(drawerOptions.options.transitionDuration, ms);
  return typeof value === "number" ? `${value}ms` : undefined;
};

/**
 * Private properties of a drawer (React `style`, HTML CSSOM): its panel's shadow for an explicit
 * `elevation`, and the slide's `transitionDuration`.
 */
export function drawerStyle(options: {
  elevation?: number | string | undefined;
  transitionDuration?: number | string | undefined;
}): Record<`--_ok-${string}`, string> {
  const style: Record<`--_ok-${string}`, string> = {};
  const level = pick(paperElevations, String(options.elevation), "16");
  if (options.elevation !== undefined && String(options.elevation) === level)
    style["--_ok-drawer-shadow"] = level === "0" ? "none" : `var(--ok-elevation-${level})`;
  const duration = msValue(options.transitionDuration);
  if (duration) style["--_ok-drawer-duration"] = duration;
  return style;
}

/** Private properties of a backdrop (React `style`, HTML CSSOM): the fade's `transitionDuration`. */
export function backdropStyle(options: {
  transitionDuration?: number | string | undefined;
}): Record<`--_ok-${string}`, string> {
  const duration = msValue(options.transitionDuration);
  return duration ? { "--_ok-backdrop-duration": duration } : {};
}

// --- Sortable ---------------------------------------------------------------------------------

export const sortableLayouts = ["grid", "vertical", "horizontal"] as const;
export type SortableLayout = (typeof sortableLayouts)[number];
export const sortableStrategies = ["sort", "swap"] as const;
export type SortableStrategy = (typeof sortableStrategies)[number];
export const sortableActivators = ["handle", "item"] as const;
export type SortableActivator = (typeof sortableActivators)[number];

export const sortableOptions = defineOptions("sortable", "data-ok-sortable", {
  layout: style(
    "data-ok-layout",
    sortableLayouts,
    "grid",
    "Grid, one column or one scrolling row.",
  ),
  items: state("data-ok-sortable-item", "Item order (`items` + `onReorder`).", "move"),
  autoScroll: behavior(
    "data-ok-auto-scroll",
    true,
    "While dragging near the edge of a scroll area or the window, it scrolls; `false` turns it off.",
  ),
  strategy: style(
    "data-ok-strategy",
    sortableStrategies,
    "sort",
    "`sort` shifts the items between the old and the new position; `swap` trades the places of two items.",
    { optional: true },
  ),
  activator: style(
    "data-ok-activator",
    sortableActivators,
    "handle",
    "Where a pointer drag starts: the `handle`, or anywhere on the `item` (the handle stays for keys and taps).",
    { optional: true },
  ),
});

/** `data-ok-*` attributes of a sortable list (`autoScroll` is written only when turned off). */
export const sortableAttributes = (
  options: {
    layout?: SortableLayout | undefined;
    autoScroll?: boolean | undefined;
    strategy?: SortableStrategy | undefined;
    activator?: SortableActivator | undefined;
  } = {},
): DataAttributes => ({
  ...optionAttributes(sortableOptions, {
    layout: options.layout,
    strategy: options.strategy,
    activator: options.activator,
  }),
  ...(options.autoScroll === false ? { [sortableOptions.options.autoScroll.attr]: "false" } : {}),
});

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

export const accordionActionsOptions = defineOptions(
  "accordion-actions",
  "data-ok-accordion-actions",
  {
    disableSpacing: flag("data-ok-disable-spacing", "No space between the actions."),
  },
);

/** `data-ok-*` attributes of an accordion's actions row. */
export const accordionActionsAttributes = (
  options: { disableSpacing?: boolean | undefined } = {},
): DataAttributes => optionAttributes(accordionActionsOptions, { ...options });

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

/** Shapes of a color swatch (Radio, Checkbox with `swatch`). */
export const swatchShapes = ["circular", "rounded"] as const;
export type SwatchShape = (typeof swatchShapes)[number];
const swatchShape = (fallback: SwatchShape) =>
  style(
    "data-ok-shape",
    swatchShapes,
    fallback,
    "Color swatches only (`swatch`): a circle or a square with rounded corners.",
    { optional: true },
  );

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
  shape: swatchShape("rounded"),
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
  shape?: SwatchShape | undefined;
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
  shape: swatchShape("circular"),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state("checked", "Native `checked` (in a group: the group's `value`).", "change"),
});

export interface RadioAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  shape?: SwatchShape | undefined;
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

// --- FormControl, FormLabel, FormGroup, FormHelperText ----------------------------------------

/** States a FormControl shares with its label and helper text (spec: form-control.md). */
const formStates = (owner: string) => ({
  disabled: flag("data-ok-disabled", `Disabled colors for ${owner}.`),
  error: flag("data-ok-error", `Error colors for ${owner}.`),
  required: flag("data-ok-required", `Marks ${owner} as required.`),
  focused: flag("data-ok-focused", `Focused colors for ${owner}.`),
});

export const formControlOptions = defineOptions("form-control", "data-ok-form-control", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Color of a focused label (`default` = text color, as on the reference; MUI's default is `primary`).",
    { optional: true },
  ),
  size: style(
    "data-ok-size",
    selectionControlSizes,
    "medium",
    "Size shared with the composed input.",
    { optional: true },
  ),
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "Variant shared with the composed input; `outlined` and `filled` indent the helper text.",
    { optional: true },
  ),
  margin: style(
    "data-ok-margin",
    textFieldMargins,
    "none",
    "Vertical margin: 0, 8 / 4px or 16 / 8px.",
    { optional: true },
  ),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  ...formStates("the label and the helper text"),
  hiddenLabel: flag(
    "data-ok-hidden-label",
    "A filled Select without a label: less padding above the value.",
  ),
});

export interface FormControlAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  variant?: TextFieldVariant | undefined;
  margin?: TextFieldMargin | undefined;
  fullWidth?: boolean | undefined;
  hiddenLabel?: boolean | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  required?: boolean | undefined;
  focused?: boolean | undefined;
}

/** `data-ok-*` attributes of a form control's root (style options only when given). */
export const formControlAttributes = (options: FormControlAnatomyOptions = {}): DataAttributes =>
  optionAttributes(formControlOptions, { ...options });

export const formLabelOptions = defineOptions("form-label", "data-ok-form-label", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Color when focused; default: the form control's.",
    { optional: true },
  ),
  ...formStates("the label"),
  filled: flag("data-ok-filled", "Marks the label of an input that has a value (no style)."),
});

export interface FormLabelAnatomyOptions {
  color?: SelectionControlColor | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  required?: boolean | undefined;
  focused?: boolean | undefined;
  filled?: boolean | undefined;
}

/** `data-ok-*` attributes of a form label (its own states; the form control's come from CSS). */
export const formLabelAttributes = (options: FormLabelAnatomyOptions = {}): DataAttributes =>
  optionAttributes(formLabelOptions, { ...options });

export const formGroupOptions = defineOptions("form-group", "data-ok-form-group", {
  row: flag("data-ok-row", "Controls side by side instead of a column."),
});

/** `data-ok-*` attributes of a form group. */
export const formGroupAttributes = (options: { row?: boolean | undefined } = {}): DataAttributes =>
  optionAttributes(formGroupOptions, { ...options });

export const formHelperTextMargins = ["dense"] as const;
export type FormHelperTextMargin = (typeof formHelperTextMargins)[number];

export const formHelperTextOptions = defineOptions("form-helper-text", "data-ok-form-helper-text", {
  margin: style(
    "data-ok-margin",
    formHelperTextMargins,
    "dense",
    "`dense`: 4px above instead of 6px; default: the form control's.",
    { optional: true },
  ),
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "`outlined` and `filled` indent the text; default: the form control's.",
    { optional: true },
  ),
  ...formStates("the helper text"),
  filled: flag("data-ok-filled", "Marks the helper text of an input that has a value (no style)."),
});

export interface FormHelperTextAnatomyOptions {
  margin?: FormHelperTextMargin | undefined;
  variant?: TextFieldVariant | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  required?: boolean | undefined;
  focused?: boolean | undefined;
  filled?: boolean | undefined;
}

/** `data-ok-*` attributes of a form helper text (its own states). */
export const formHelperTextAttributes = (
  options: FormHelperTextAnatomyOptions = {},
): DataAttributes => optionAttributes(formHelperTextOptions, { ...options });

// A listbox Select's trigger is a `div`: its native states live on the hidden input (the `select`
// runtime mirrors `disabled` onto the trigger's `aria-disabled`).
const FIELD_INPUT =
  ":scope > [data-ok-text-field-control] > :is([data-ok-text-field-input]:not([data-ok-select-display]), [data-ok-select-input])";

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
  hiddenLabel: flag(
    "data-ok-hidden-label",
    "Hide the label visually (it still names the input); the field gets the padding of a field without a label.",
  ),
  focused: flag("data-ok-focused", "Show the focus colors even when the field doesn't have focus."),
  notched: flag(
    "data-ok-notched",
    "Outlined: keep the notch in the outline open (OutlinedInput: room for its `label`).",
  ),
  disableUnderline: flag(
    "data-ok-disable-underline",
    "Standard: no underline (give the field another focus style).",
  ),
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
  hiddenLabel?: boolean | undefined;
  focused?: boolean | undefined;
  notched?: boolean | undefined;
  disableUnderline?: boolean | undefined;
  minRows?: number | undefined;
  maxRows?: number | undefined;
}

/** `data-ok-*` attributes of a text field's root. */
export const textFieldAttributes = (options: TextFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(textFieldOptions, { ...options });

// --- Number field (a text field with a spin button, roadmap 4.24) -------------------------------

const NUMBER_INPUT = ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]";

// `data-ok-step` is the Stepper's step root (stepper.css loads after text-field.css): the step
// options are `data-ok-step-size`, `data-ok-small-step` and `data-ok-large-step`.
export const numberFieldOptions = defineOptions("number-field", "data-ok-number-field", {
  min: number("data-ok-min", undefined, "Lowest value (none by default)."),
  max: number("data-ok-max", undefined, "Highest value (none by default)."),
  step: number(
    "data-ok-step-size",
    1,
    "How much the buttons and Arrow Up / Arrow Down change the value.",
    { min: 0 },
  ),
  smallStep: number("data-ok-small-step", 0.1, "Step with Alt + Arrow Up / Arrow Down.", {
    min: 0,
  }),
  largeStep: number(
    "data-ok-large-step",
    10,
    "Step of Page Up / Page Down and Shift + Arrow Up / Arrow Down.",
    { min: 0 },
  ),
  snapOnStep: flag(
    "data-ok-snap-on-step",
    "A step lands on a multiple of the step (counted from `min`), such as 1.5 → 2.",
  ),
  allowOutOfRange: flag(
    "data-ok-allow-out-of-range",
    "Typed values outside `min` / `max` stay as typed (steps still stop at the bounds).",
  ),
  disabled: native("disabled", "Native `disabled` on the input; the buttons are disabled too.", {
    children: NUMBER_INPUT,
  }),
  readOnly: native(
    "readonly",
    "Native `readonly` on the input: it can be focused and copied, not changed.",
    { children: NUMBER_INPUT },
  ),
  value: state(
    "value",
    "The number (`value` / `defaultValue` + `onValueChange(value, details)`).",
    "change",
  ),
});

export interface NumberFieldAnatomyOptions {
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  smallStep?: number | undefined;
  largeStep?: number | undefined;
  snapOnStep?: boolean | undefined;
  allowOutOfRange?: boolean | undefined;
}

/** `data-ok-*` attributes a number field adds to its text field root. */
export const numberFieldAttributes = (options: NumberFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(numberFieldOptions, { ...options });

// --- Phone input (a text field with a country select, roadmap 4.25, ADR-0061) ------------------

/** A two-letter country code as written in markup (checked against the phone metadata later). */
const COUNTRY_CODE = /^[A-Za-z]{2}$/;
/** A list of country codes (`"AU,NZ"` or `["AU", "NZ"]`), as written in markup. */
const countryCodes = (list: unknown) =>
  (typeof list === "string" ? list.split(/[\s,]+/) : Array.isArray(list) ? list : [])
    .filter((code): code is string => typeof code === "string" && COUNTRY_CODE.test(code))
    .map((code) => code.toUpperCase());

export const phoneInputOptions = defineOptions("phone-input", "data-ok-phone-input", {
  country: state(
    "data-ok-country",
    "A fixed country, such as `AU`: the country select is turned off and numbers are read as this country's.",
  ),
  defaultCountry: state(
    "data-ok-default-country",
    "The country selected at first, such as `DE` (none: the number is typed in international form).",
  ),
  international: flag(
    "data-ok-international",
    "Show numbers in international form (`+61 2 9876 5432`) instead of national (`(02) 9876 5432`).",
  ),
  countryCallingCodeEditable: behavior(
    "data-ok-country-calling-code-editable",
    true,
    "International form with a selected country: the calling code can be changed (`false` keeps it).",
  ),
  hideSelect: flag("data-ok-hide-select", "No country select (the markup leaves it out)."),
  countries: state("data-ok-countries", "The countries offered, such as `AU,NZ` (all by default)."),
  countryOptionsOrder: state(
    "data-ok-country-options-order",
    "Countries listed first, such as `US,CA,...` (`...` places the others).",
  ),
  addInternationalOption: behavior(
    "data-ok-add-international-option",
    true,
    "An International option at the top of the country list (`false` leaves it out).",
  ),
  limitMaxLength: flag(
    "data-ok-limit-max-length",
    "Digits past the longest number of the country are refused.",
  ),
  focusInputOnCountrySelection: behavior(
    "data-ok-focus-input-on-country-selection",
    true,
    "Picking a country moves the focus to the input (`false` keeps it on the select).",
  ),
  locale: state("data-ok-locale", "Language of the country names, such as `fr` (default `en`)."),
  validate: flag(
    "data-ok-validate",
    "After the person leaves the field, an invalid number shows the error state and `invalidText`.",
  ),
  invalidText: state(
    "data-ok-invalid-text",
    "The helper text shown while the number is invalid (with `validate`).",
  ),
  disabled: native(
    "disabled",
    "Native `disabled` on the input; the country select is disabled too.",
    {
      children: ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]",
    },
  ),
  value: state(
    "value",
    "The number as E.164 (`value` / `defaultValue` + `onChange(value, details)`); HTML: the input's text.",
    "change",
  ),
});

export interface PhoneInputAnatomyOptions {
  country?: string | undefined;
  defaultCountry?: string | undefined;
  international?: boolean | undefined;
  countryCallingCodeEditable?: boolean | undefined;
  hideSelect?: boolean | undefined;
  countries?: readonly string[] | undefined;
  countryOptionsOrder?: readonly string[] | undefined;
  addInternationalOption?: boolean | undefined;
  limitMaxLength?: boolean | undefined;
  focusInputOnCountrySelection?: boolean | undefined;
  locale?: string | undefined;
  validate?: boolean | undefined;
  invalidText?: string | undefined;
}

/**
 * `data-ok-*` attributes a phone input adds to its text field root: flags, behaviors turned off
 * (`"false"`), and the text options as written (codes are checked by the runtime).
 */
export function phoneInputAttributes(options: PhoneInputAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(phoneInputOptions, { ...options });
  const o = phoneInputOptions.options;
  const text = (attr: `data-ok-${string}`, value: string | undefined) => {
    if (value) attributes[attr] = value;
  };
  const code = (value: string | undefined) =>
    value && COUNTRY_CODE.test(value) ? value.toUpperCase() : undefined;
  text(o.country.attr as `data-ok-${string}`, code(options.country));
  text(o.defaultCountry.attr as `data-ok-${string}`, code(options.defaultCountry));
  text(
    o.countries.attr as `data-ok-${string}`,
    countryCodes(options.countries).join(",") || undefined,
  );
  text(
    o.countryOptionsOrder.attr as `data-ok-${string}`,
    (options.countryOptionsOrder ?? [])
      .filter((entry) => entry === "..." || COUNTRY_CODE.test(entry))
      .map((entry) => entry.toUpperCase())
      .join(",") || undefined,
  );
  for (const key of [
    "countryCallingCodeEditable",
    "addInternationalOption",
    "focusInputOnCountrySelection",
  ] as const)
    if (options[key] === false) attributes[o[key].attr] = "false";
  text(o.locale.attr as `data-ok-${string}`, options.locale);
  text(
    o.invalidText.attr as `data-ok-${string}`,
    options.validate ? options.invalidText : undefined,
  );
  return attributes;
}

// --- Select, InputLabel -----------------------------------------------------------------------

const SELECT_DISPLAY = ":scope > [data-ok-select-display]";

export const selectOptions = defineOptions("select", "data-ok-select", {
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "Outline, tinted fill or underline (default: the form control's).",
  ),
  size: style(
    "data-ok-size",
    selectionControlSizes,
    "medium",
    "Height 56 / 40px (outlined; default: the form control's).",
  ),
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Focus color (`default` = text color; default: the form control's).",
  ),
  error: flag("data-ok-error", "Error colors; the trigger gets `aria-invalid`."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  multiple: flag("data-ok-multiple", "Several values: options toggle and the list stays open."),
  autoWidth: flag(
    "data-ok-auto-width",
    "The list takes its options' width instead of at least the field's.",
  ),
  displayEmpty: flag(
    "data-ok-display-empty",
    "Show the empty value (its option, or the placeholder template) instead of nothing.",
  ),
  disabled: native(
    "aria-disabled",
    '`aria-disabled="true"` on the trigger and `disabled` on the hidden input: it doesn\'t open.',
    { children: SELECT_DISPLAY },
  ),
  readOnly: native("aria-readonly", '`aria-readonly="true"` on the trigger: it doesn\'t open.', {
    children: SELECT_DISPLAY,
  }),
  value: state(
    "aria-selected",
    "Chosen option(s) (`value` / `defaultValue` + `onChange(value)`).",
    "change",
  ),
  open: state(
    "aria-expanded",
    "Open state (`open` / `defaultOpen` + `onOpenChange(open, reason)`).",
    "open",
  ),
});

export interface SelectAnatomyOptions {
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  color?: SelectionControlColor | undefined;
  error?: boolean | undefined;
  fullWidth?: boolean | undefined;
  multiple?: boolean | undefined;
  autoWidth?: boolean | undefined;
  displayEmpty?: boolean | undefined;
}

/** `data-ok-*` attributes of a select's root (the field box). */
export const selectAttributes = (options: SelectAnatomyOptions = {}): DataAttributes =>
  optionAttributes(selectOptions, { ...options });

/**
 * Behavior attributes only (`data-ok-select` + flags), for a select composed inside another
 * field's box, such as TextField's control (which styles the box itself).
 */
export const selectBehaviorAttributes = (
  options: Pick<SelectAnatomyOptions, "multiple" | "autoWidth" | "displayEmpty"> = {},
): DataAttributes => {
  const all = selectAttributes(options);
  const kept: DataAttributes = { "data-ok-select": "" };
  for (const key of ["multiple", "autoWidth", "displayEmpty"] as const) {
    const attr = selectOptions.options[key].attr;
    if (all[attr] !== undefined) kept[attr] = all[attr];
  }
  return kept;
};

export const inputLabelOptions = defineOptions("input-label", "data-ok-input-label", {
  shrink: flag("data-ok-shrink", "Keep the label above the field even when it is empty."),
  disableAnimation: flag("data-ok-disable-animation", "The label moves without a transition."),
});

/** `data-ok-*` attributes of an input label (a form label that floats in a Select's field). */
export const inputLabelAttributes = (
  options: { shrink?: boolean | undefined; disableAnimation?: boolean | undefined } = {},
): DataAttributes => optionAttributes(inputLabelOptions, { ...options });

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
  spacing: number(
    "data-ok-spacing",
    undefined,
    "Overlap between avatars: `medium` (8px, the default), `small` (16px) or a number in px.",
    { min: 0 },
  ),
});

/**
 * The group's overlap: a keyword (`medium` · `small`), or a number of px (MUI's numeric
 * `spacing`). Anything else → `medium`.
 */
export const parseAvatarGroupSpacing = (value: unknown): AvatarGroupSpacing | number => {
  if ((avatarGroupSpacings as readonly unknown[]).includes(value))
    return value as AvatarGroupSpacing;
  const amount = parseNumber(avatarGroupOptions.options.spacing, value);
  return typeof amount === "number" ? amount : "medium";
};

/** The overlap a numeric spacing sets (`--_ok-overlap`, a negative length), else none. */
export const avatarGroupStyle = (value: unknown): Partial<Record<"--_ok-overlap", string>> => {
  const spacing = parseAvatarGroupSpacing(value);
  return typeof spacing === "number" ? { "--_ok-overlap": `${-spacing}px` } : {};
};

/** `data-ok-*` attributes of an avatar group: the spacing is always written (keyword or px). */
export const avatarGroupAttributes = (
  options: { spacing?: AvatarGroupSpacing | number | undefined } = {},
): DataAttributes => ({
  "data-ok-avatar-group": "",
  "data-ok-spacing": String(parseAvatarGroupSpacing(options.spacing)),
});

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
  disabled: flag("data-ok-disabled", "Dimmed and ignores the pointer, for an inactive status."),
});

export interface LabelAnatomyOptions {
  variant?: LabelVariant | undefined;
  color?: ChipColor | undefined;
  disabled?: boolean | undefined;
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

// --- Paper ------------------------------------------------------------------------------------

export const paperVariants = ["elevation", "outlined"] as const;
export type PaperVariant = (typeof paperVariants)[number];

/** Paper (spec: paper.md). Card and other surfaces spread these options into their own schema. */
export const paperOptions = defineOptions("paper", "data-ok-paper", {
  variant: style(
    "data-ok-variant",
    paperVariants,
    "elevation",
    "`elevation`: a shadow; `outlined`: a 1px outline and no shadow.",
  ),
  elevation: style(
    "data-ok-elevation",
    paperElevations,
    "1",
    "Shadow depth from 0 (none) to 24 (`--ok-elevation-<n>`). Ignored by `outlined`.",
  ),
  square: flag("data-ok-square", "Square corners (no radius)."),
});

export interface PaperAnatomyOptions {
  variant?: PaperVariant | undefined;
  /** 0–24 (a number or its string). */
  elevation?: number | string | undefined;
  square?: boolean | undefined;
}

/** `data-ok-*` attributes of a paper (and of the surfaces built on it, such as Card). */
export const paperAttributes = ({
  elevation,
  ...options
}: PaperAnatomyOptions = {}): DataAttributes =>
  optionAttributes(paperOptions, {
    ...options,
    elevation: elevation === undefined ? undefined : String(elevation),
  });

// --- Card -------------------------------------------------------------------------------------

/** Card (spec: card.md): a Paper root (`data-ok-paper` + `data-ok-card`) with Paper's options. */
export const cardOptions = defineOptions("card", "data-ok-card", {
  ...paperOptions.options,
  raised: flag(
    "data-ok-raised",
    "A raised card: the shadow of elevation 8, whatever `elevation` says. Ignored by `outlined`.",
  ),
});

export interface CardAnatomyOptions extends PaperAnatomyOptions {
  raised?: boolean | undefined;
}

/** `data-ok-*` attributes of a card: Paper's marker first, then the card's own options. */
export const cardAttributes = ({
  elevation,
  ...options
}: CardAnatomyOptions = {}): DataAttributes => ({
  "data-ok-paper": "",
  ...optionAttributes(cardOptions, {
    ...options,
    elevation: elevation === undefined ? undefined : String(elevation),
  }),
});

export const cardActionsOptions = defineOptions("card-actions", "data-ok-card-actions", {
  disableSpacing: flag("data-ok-disable-spacing", "No space between the actions."),
});

export const cardActionsAttributes = (
  options: { disableSpacing?: boolean | undefined } = {},
): DataAttributes => optionAttributes(cardActionsOptions, { ...options });

/** Elements that show media themselves: CardMedia gives them `src` (MUI's media components). */
export const cardMediaElements = ["video", "audio", "picture", "iframe", "img"] as const;

/** Whether CardMedia's element shows the media itself (`src`) or holds a cover `img`. */
export const isCardMediaElement = (element: unknown): boolean =>
  typeof element === "string" && (cardMediaElements as readonly string[]).includes(element);

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

// --- Dialog -----------------------------------------------------------------------------------

export const dialogMaxWidths = ["xs", "sm", "md", "lg", "xl", "none"] as const;
export const dialogScrolls = ["paper", "body"] as const;
export type DialogMaxWidth = (typeof dialogMaxWidths)[number];
export type DialogScroll = (typeof dialogScrolls)[number];
/** Why a dialog asks to close: Escape, a backdrop click, or a close trigger / the API. */
export type DialogCloseReason = "escape" | "backdrop" | "close";

/** Motion entrances a Dialog paper can play (the `transition` option). */
const dialogTransitions = [
  "slideInUp",
  "slideInDown",
  "slideInLeft",
  "slideInRight",
  "fadeIn",
  "fadeInUp",
  "fadeInDown",
  "fadeInLeft",
  "fadeInRight",
  "zoomIn",
  "zoomInUp",
  "zoomInDown",
  "zoomInLeft",
  "zoomInRight",
  "bounceIn",
  "bounceInUp",
  "bounceInDown",
  "bounceInLeft",
  "bounceInRight",
  "flipInX",
  "flipInY",
  "scaleInX",
  "scaleInY",
  "rotateIn",
] as const;
export type DialogTransition = (typeof dialogTransitions)[number];

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
  disableRestoreFocus: flag(
    "data-ok-disable-restore-focus",
    "Focus isn't moved back to the element focused before it opened.",
  ),
  disableScrollLock: flag(
    "data-ok-disable-scroll-lock",
    "The page behind can still scroll while it is open.",
  ),
  transition: style(
    "data-ok-variant",
    dialogTransitions,
    "fadeIn",
    "Entrance of the paper: a Motion entrance (`slideInUp`, `zoomIn`…); without it, a short fade and scale.",
    { optional: true, children: "[data-ok-dialog-paper]" },
  ),
  transitionDuration: number(
    "data-ok-transition-duration",
    undefined,
    "Length of the entrance in ms (React also `{ enter, exit }`; HTML exit: `data-ok-transition-duration-exit`). Default: the theme's short durations.",
    { min: 0 },
  ),
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
  disableRestoreFocus?: boolean | undefined;
  disableScrollLock?: boolean | undefined;
  /** Entrance and exit length in ms, or each on its own (MUI `transitionDuration`). */
  transitionDuration?: DialogTransitionDuration | undefined;
}

/** A length in ms for both directions, or separate `enter` / `exit` lengths. */
export type DialogTransitionDuration =
  | number
  | { enter?: number | undefined; exit?: number | undefined };

const dialogMs = (value: unknown): number | undefined => {
  const parsed = parseNumber(dialogOptions.options.transitionDuration, value);
  return typeof parsed === "number" ? parsed : undefined;
};

/** The enter and exit lengths (ms) of a `transitionDuration`; invalid parts → `undefined`. */
export function dialogDurations(value: DialogTransitionDuration | undefined): {
  enter: number | undefined;
  exit: number | undefined;
} {
  if (value !== null && typeof value === "object")
    return { enter: dialogMs(value.enter), exit: dialogMs(value.exit) };
  const both = dialogMs(value);
  return { enter: both, exit: both };
}

/**
 * `data-ok-*` attributes of a dialog (`<dialog>`). A `transitionDuration` writes its entrance to
 * `data-ok-transition-duration` and an exit that differs to `data-ok-transition-duration-exit`.
 */
export function dialogAttributes(options: DialogAnatomyOptions = {}): DataAttributes {
  const { transitionDuration, ...rest } = options;
  const attributes = optionAttributes(dialogOptions, rest);
  const { enter, exit } = dialogDurations(transitionDuration);
  if (enter !== undefined) attributes["data-ok-transition-duration"] = String(enter);
  if (exit !== undefined && exit !== enter)
    attributes["data-ok-transition-duration-exit"] = String(exit);
  return attributes;
}

/** HTML: the `transitionDuration` a dialog carries (`data-ok-transition-duration` [+ `-exit`]). */
export function readDialogTransitionDuration(element: Element): {
  enter: number | undefined;
  exit: number | undefined;
} {
  const enter = dialogMs(element.getAttribute("data-ok-transition-duration") ?? undefined);
  const exit = dialogMs(element.getAttribute("data-ok-transition-duration-exit") ?? undefined);
  return { enter, exit: exit ?? enter };
}

/** Private properties of a dialog (React `style`, HTML CSSOM): its entrance and exit lengths. */
export function dialogStyle(
  value:
    | DialogTransitionDuration
    | { enter: number | undefined; exit: number | undefined }
    | undefined,
): Record<`--_ok-${string}`, string> {
  const { enter, exit } = dialogDurations(value as DialogTransitionDuration | undefined);
  const style: Record<`--_ok-${string}`, string> = {};
  if (enter !== undefined) style["--_ok-dialog-enter"] = `${enter}ms`;
  if (exit !== undefined) style["--_ok-dialog-exit"] = `${exit}ms`;
  return style;
}

// --- Backdrop ---------------------------------------------------------------------------------

export const backdropOptions = defineOptions("backdrop", "data-ok-backdrop", {
  invisible: flag(
    "data-ok-invisible",
    "Transparent: blocks clicks without dimming the page (for example, behind a custom menu).",
  ),
  transitionDuration: number(
    "data-ok-transition-duration",
    undefined,
    "Length of the fade in and out (ms). Default: the theme's durations.",
    { min: 0 },
  ),
  open: state(
    "data-ok-open",
    "Open state (`open`; HTML: `data-ok-open`, a trigger or `open()`).",
    "close",
  ),
});

export interface BackdropAnatomyOptions {
  invisible?: boolean | undefined;
  transitionDuration?: number | undefined;
}

/** `data-ok-*` attributes of a backdrop (`data-ok-open` is the state, written by the caller). */
export const backdropAttributes = (options: BackdropAnatomyOptions = {}): DataAttributes =>
  optionAttributes(backdropOptions, { ...options });

// --- Collapse ---------------------------------------------------------------------------------

export const collapseOptions = defineOptions("collapse", "data-ok-collapse", {
  orientation: style(
    "data-ok-orientation",
    ["vertical", "horizontal"],
    "vertical",
    "`vertical` animates the height, `horizontal` the width.",
    { optional: true },
  ),
  collapsedSize: number(
    "data-ok-collapsed-size",
    0,
    "Size kept while closed (height, or width when horizontal): a number in px, or a CSS length.",
    { min: 0, units: ["px", "rem", "em", "%"] },
  ),
  timeout: number(
    "data-ok-timeout",
    undefined,
    "Duration in ms (default `--ok-duration-standard`), or `auto`: from the distance travelled.",
    { min: 0 },
  ),
  disablePrefersReducedMotion: flag(
    "data-ok-disable-prefers-reduced-motion",
    "Animates even when the user prefers reduced motion.",
  ),
  in: state(
    "hidden",
    "Open while the element has no `hidden` (React `in`; HTML: `hidden`, a trigger or `show()` / `hide()`).",
    "entered",
  ),
});

export type CollapseOrientation = "vertical" | "horizontal";
/** A duration in ms, `"auto"` (from the distance), or separate enter / exit durations. */
export type CollapseTimeout = number | "auto" | { appear?: number; enter?: number; exit?: number };
/** A CSS easing (`var(--ok-easing-*)` included), or separate enter / exit easings. */
export type CollapseEasing = string | { enter?: string; exit?: string };

export interface CollapseAnatomyOptions {
  orientation?: CollapseOrientation | undefined;
  collapsedSize?: number | string | undefined;
  timeout?: CollapseTimeout | undefined;
  easing?: CollapseEasing | undefined;
  disablePrefersReducedMotion?: boolean | undefined;
}

/** Keywords and functions such as `cubic-bezier(…)`, `steps(…)`, `linear(…)`, `var(--ok-…)`. */
const EASING = /^[a-z-]+(?:\([0-9a-z.,%\s-]*\))?$/i;

/** A CSS easing that is safe to write, or `undefined` (untrusted input never reaches the DOM). */
export const parseCollapseEasing = (value: unknown): string | undefined =>
  typeof value === "string" && value.length <= 160 && EASING.test(value.trim())
    ? value.trim()
    : undefined;

const timeoutValue = (value: unknown): string | undefined => {
  if (value === "auto") return "auto";
  const parsed = parseNumber(collapseOptions.options.timeout, value);
  return parsed === undefined ? undefined : String(parsed);
};

/**
 * `data-ok-*` attributes of a collapse (`hidden` is the state, written by the owner). A collapsed
 * size of 0 is the default and isn't written; `timeout` / `easing` objects write their exit value
 * to `data-ok-timeout-exit` / `data-ok-easing-exit`.
 */
export function collapseAttributes(options: CollapseAnatomyOptions = {}): DataAttributes {
  const { timeout, easing, collapsedSize, ...rest } = options;
  const size = parseNumber(collapseOptions.options.collapsedSize, collapsedSize);
  const attributes = optionAttributes(collapseOptions, {
    ...rest,
    collapsedSize:
      size === 0 || (typeof size === "string" && parseFloat(size) === 0) ? undefined : size,
  });
  const enter = typeof timeout === "object" ? timeout.enter : timeout;
  const exit = typeof timeout === "object" ? timeout.exit : undefined;
  const enterValue = timeoutValue(enter);
  const exitValue = timeoutValue(exit);
  if (enterValue !== undefined) attributes["data-ok-timeout"] = enterValue;
  if (exitValue !== undefined) attributes["data-ok-timeout-exit"] = exitValue;
  const easeIn = parseCollapseEasing(typeof easing === "object" ? easing.enter : easing);
  const easeOut = parseCollapseEasing(typeof easing === "object" ? easing.exit : undefined);
  if (easeIn !== undefined) attributes["data-ok-easing"] = easeIn;
  if (easeOut !== undefined) attributes["data-ok-easing-exit"] = easeOut;
  return attributes;
}

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
  expand: behavior(
    "data-ok-expand",
    true,
    "Toasts are listed one under another; `false` stacks them and expands the stack on hover, focus or the hotkey.",
  ),
  richColors: flag("data-ok-rich-colors", "Typed toasts take their status color."),
  invert: flag("data-ok-invert", "Reverses the toasts' colors (dark on light pages)."),
  offset: number("data-ok-offset", 16, "Distance from the viewport's edges: px or a CSS length.", {
    min: 0,
    units: ["px", "rem", "em", "vh", "vw", "%"],
  }),
  mobileOffset: number(
    "data-ok-mobile-offset",
    16,
    "Distance from the edges on screens under 600px wide: px or a CSS length.",
    { min: 0, units: ["px", "rem", "em", "vh", "vw", "%"] },
  ),
  gap: number("data-ok-gap", 12, "Space between expanded toasts, in px.", { min: 0 }),
});

export interface ToasterAnatomyOptions {
  position?: ToastPosition | undefined;
  duration?: number | undefined;
  visibleToasts?: number | undefined;
  closeButton?: boolean | undefined;
  expand?: boolean | undefined;
  richColors?: boolean | undefined;
  invert?: boolean | undefined;
  offset?: number | string | undefined;
  mobileOffset?: number | string | undefined;
  gap?: number | undefined;
}

/** `data-ok-*` attributes of a toaster (`section`): `expand` is written only when off. */
export const toasterAttributes = ({
  expand,
  ...options
}: ToasterAnatomyOptions = {}): DataAttributes => ({
  ...optionAttributes(toasterOptions, { ...options }),
  ...(expand === false ? { "data-ok-expand": "false" } : {}),
});

// --- Tabs ---------------------------------------------------------------------------------------

export const tabsVariants = ["standard", "scrollable", "fullWidth"] as const;
export const tabsColors = ["inherit", "primary", "secondary"] as const;
export const tabsScrollButtons = ["auto", "true", "false"] as const;
export const tabIconPositions = ["top", "bottom", "start", "end"] as const;

export type TabsVariant = (typeof tabsVariants)[number];
export type TabsColor = (typeof tabsColors)[number];
export type TabsScrollButtons = (typeof tabsScrollButtons)[number];
export type TabIconPosition = (typeof tabIconPositions)[number];

export const tabsOptions = defineOptions("tabs", "data-ok-tabs", {
  variant: style(
    "data-ok-variant",
    tabsVariants,
    "standard",
    "`scrollable` scrolls the tabs (with scroll buttons); `fullWidth` shares the width.",
  ),
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A row of tabs, or a column (also `aria-orientation`).",
  ),
  textColor: style(
    "data-ok-text-color",
    tabsColors,
    "inherit",
    "Text color of the selected tab (`inherit`: the text color).",
  ),
  indicatorColor: style(
    "data-ok-indicator-color",
    tabsColors,
    "inherit",
    "Color of the selection line (`inherit`: the text color).",
  ),
  scrollButtons: style(
    "data-ok-scroll-buttons",
    tabsScrollButtons,
    "auto",
    "Scrollable: `auto` shows them on overflow from 600px; `true` always; `false` never.",
  ),
  centered: flag("data-ok-centered", "Center the tabs (standard variant)."),
  allowScrollButtonsMobile: flag(
    "data-ok-allow-scroll-buttons-mobile",
    "Scrollable: show the scroll buttons below 600px too.",
  ),
  visibleScrollbar: flag("data-ok-visible-scrollbar", "Scrollable: show the scrollbar."),
  segmented: flag(
    "data-ok-segmented",
    "A filled bar where the selected tab is a raised pill (instead of a line).",
  ),
  selectionFollowsFocus: flag(
    "data-ok-selection-follows-focus",
    "Arrow keys select the tab they move to (otherwise Enter / Space selects).",
  ),
  value: state("aria-selected", "Selected tab (`value` / `defaultValue`).", "change"),
});

export interface TabsAnatomyOptions {
  variant?: TabsVariant | undefined;
  orientation?: Orientation | undefined;
  textColor?: TabsColor | undefined;
  indicatorColor?: TabsColor | undefined;
  scrollButtons?: TabsScrollButtons | undefined;
  centered?: boolean | undefined;
  allowScrollButtonsMobile?: boolean | undefined;
  visibleScrollbar?: boolean | undefined;
  segmented?: boolean | undefined;
  selectionFollowsFocus?: boolean | undefined;
}

/** `data-ok-*` attributes of a tabs root (the tab list carries `role="tablist"`). */
export const tabsAttributes = (options: TabsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tabsOptions, { ...options });

export const tabOptions = defineOptions("tab", "data-ok-tab", {
  iconPosition: style(
    "data-ok-icon-position",
    tabIconPositions,
    "top",
    "With an icon and a label: where the icon goes.",
    { optional: true },
  ),
  wrapped: flag("data-ok-wrapped", "Long labels wrap onto two lines."),
  disabled: native("disabled", "Native `disabled`: can't be selected or focused."),
});

export interface TabAnatomyOptions {
  iconPosition?: TabIconPosition | undefined;
  wrapped?: boolean | undefined;
}

/** `data-ok-*` attributes of a tab (`role="tab"`, `aria-selected` and `tabindex` by the owner). */
export const tabAttributes = (options: TabAnatomyOptions = {}): DataAttributes =>
  optionAttributes(tabOptions, { ...options });

// --- Breadcrumbs --------------------------------------------------------------------------------

export const breadcrumbsOptions = defineOptions("breadcrumbs", "data-ok-breadcrumbs", {
  maxItems: number("data-ok-max-items", 8, "More items than this collapse into an expand button.", {
    min: 1,
  }),
  itemsBeforeCollapse: number(
    "data-ok-items-before-collapse",
    1,
    "Collapsed: items shown before the expand button.",
    { min: 0 },
  ),
  itemsAfterCollapse: number(
    "data-ok-items-after-collapse",
    1,
    "Collapsed: items shown after the expand button.",
    { min: 0 },
  ),
});

export interface BreadcrumbsAnatomyOptions {
  maxItems?: number | undefined;
  itemsBeforeCollapse?: number | undefined;
  itemsAfterCollapse?: number | undefined;
}

/** `data-ok-*` attributes of a breadcrumbs `nav`. */
export const breadcrumbsAttributes = (options: BreadcrumbsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(breadcrumbsOptions, { ...options });

// --- Stepper ------------------------------------------------------------------------------------

export const stepperVariants = ["standard", "dot", "circle"] as const;
export const mobileStepperVariants = ["text", "dots", "progress"] as const;
export const mobileStepperPositions = ["bottom", "top", "static"] as const;

export type StepperVariant = (typeof stepperVariants)[number];
export type MobileStepperVariant = (typeof mobileStepperVariants)[number];
export type MobileStepperPosition = (typeof mobileStepperPositions)[number];

export const stepperOptions = defineOptions("stepper", "data-ok-stepper", {
  orientation: style("data-ok-orientation", orientations, "horizontal", "Row or column of steps."),
  alternativeLabel: flag(
    "data-ok-alternative-label",
    "Horizontal: labels below the icons, steps share the width.",
  ),
  variant: style(
    "data-ok-variant",
    stepperVariants,
    "standard",
    "`standard` numbered icons; `dot` small dots; `circle` large icon circles. Thicker lines with `dot` / `circle`.",
  ),
  activeStep: number(
    "data-ok-active-step",
    0,
    "Index of the current step; earlier steps are completed.",
    { min: 0 },
  ),
  nonLinear: flag(
    "data-ok-non-linear",
    "Steps can be visited in any order: only the active step is derived, completed and disabled steps are yours to set.",
  ),
});

export interface StepperAnatomyOptions {
  orientation?: Orientation | undefined;
  alternativeLabel?: boolean | undefined;
  variant?: StepperVariant | undefined;
  activeStep?: number | undefined;
  nonLinear?: boolean | undefined;
}

/** `data-ok-*` attributes of a stepper (`ol`). */
export const stepperAttributes = (options: StepperAnatomyOptions = {}): DataAttributes =>
  optionAttributes(stepperOptions, { ...options });

export const stepOptions = defineOptions("step", "data-ok-step", {
  active: flag("data-ok-active", 'The current step (`aria-current="step"` on its label).'),
  completed: flag("data-ok-completed", "Done: the icon shows a check."),
  disabled: flag("data-ok-disabled", "Not reached yet (dimmed)."),
  expanded: flag(
    "data-ok-expanded",
    "Vertical steppers: the step's content stays shown, also when it isn't active.",
  ),
  last: flag(
    "data-ok-last",
    "The last step (no line below its content), when it isn't the list's last element.",
  ),
});

export interface StepAnatomyOptions {
  active?: boolean | undefined;
  completed?: boolean | undefined;
  disabled?: boolean | undefined;
  expanded?: boolean | undefined;
  last?: boolean | undefined;
}

/** `data-ok-*` attributes of a step (`li`); written by the stepper (React) or the runtime (HTML). */
export const stepAttributes = (options: StepAnatomyOptions = {}): DataAttributes =>
  optionAttributes(stepOptions, { ...options });

export const stepLabelOptions = defineOptions("step-label", "data-ok-step-label", {
  error: flag("data-ok-error", "The step failed: error color and icon."),
});

/** `data-ok-*` attributes of a step label. */
export const stepLabelAttributes = (
  options: { error?: boolean | undefined } = {},
): DataAttributes => optionAttributes(stepLabelOptions, { ...options });

export const mobileStepperOptions = defineOptions("mobile-stepper", "data-ok-mobile-stepper", {
  variant: style(
    "data-ok-variant",
    mobileStepperVariants,
    "dots",
    "How progress shows: `text` (2 / 3), `dots`, or a `progress` bar.",
  ),
  position: style(
    "data-ok-position",
    mobileStepperPositions,
    "bottom",
    "`bottom` / `top`: fixed to the viewport edge; `static`: in the flow.",
  ),
  steps: number("data-ok-steps", undefined, "Number of steps.", { min: 1 }),
  activeStep: number("data-ok-active-step", 0, "Index of the current step.", { min: 0 }),
});

export interface MobileStepperAnatomyOptions {
  variant?: MobileStepperVariant | undefined;
  position?: MobileStepperPosition | undefined;
  steps?: number | undefined;
  activeStep?: number | undefined;
}

/** `data-ok-*` attributes of a mobile stepper. */
export const mobileStepperAttributes = (
  options: MobileStepperAnatomyOptions = {},
): DataAttributes => optionAttributes(mobileStepperOptions, { ...options });

// --- Timeline -----------------------------------------------------------------------------------

export const timelinePositions = ["right", "left", "alternate", "alternate-reverse"] as const;
export const timelineDotVariants = ["filled", "outlined"] as const;
export const timelineDotColors = ["grey", "inherit", ...paletteColorNames] as const;

export type TimelinePosition = (typeof timelinePositions)[number];
export type TimelineDotVariant = (typeof timelineDotVariants)[number];
export type TimelineDotColor = (typeof timelineDotColors)[number];

export const timelineOptions = defineOptions("timeline", "data-ok-timeline", {
  position: style(
    "data-ok-position",
    timelinePositions,
    "right",
    "Side of the content: `right`, `left`, or alternating from item to item.",
  ),
});

export interface TimelineAnatomyOptions {
  position?: TimelinePosition | undefined;
}

/** `data-ok-*` attributes of a timeline (`ul`). */
export const timelineAttributes = (options: TimelineAnatomyOptions = {}): DataAttributes =>
  optionAttributes(timelineOptions, { ...options });

export const timelineItemOptions = defineOptions("timeline-item", "data-ok-timeline-item", {
  position: style(
    "data-ok-position",
    ["right", "left"] as const,
    "right",
    "Overrides the timeline's side for this item.",
    { optional: true },
  ),
});

/** `data-ok-*` attributes of a timeline item (`li`). */
export const timelineItemAttributes = (
  options: { position?: "right" | "left" | undefined } = {},
): DataAttributes => optionAttributes(timelineItemOptions, { ...options });

export const timelineDotOptions = defineOptions("timeline-dot", "data-ok-timeline-dot", {
  variant: style("data-ok-variant", timelineDotVariants, "filled", "A filled dot, or a ring."),
  color: style(
    "data-ok-color",
    timelineDotColors,
    "grey",
    "`grey` (default), `inherit` (text color) or a palette color.",
  ),
});

export interface TimelineDotAnatomyOptions {
  variant?: TimelineDotVariant | undefined;
  color?: TimelineDotColor | undefined;
}

/** `data-ok-*` attributes of a timeline dot. */
export const timelineDotAttributes = (options: TimelineDotAnatomyOptions = {}): DataAttributes =>
  optionAttributes(timelineDotOptions, { ...options });

// --- Organization chart -------------------------------------------------------------------------

export const organizationChartLineColors = ["divider", "inherit", ...paletteColorNames] as const;
export const organizationChartLineStyles = ["solid", "dashed", "dotted"] as const;
export const organizationChartDirections = ["top", "bottom", "left", "right"] as const;
export const organizationChartEdgeColorModes = ["default", "node"] as const;
export const organizationChartSelectionModes = ["single", "multi"] as const;

export type OrganizationChartLineColor = (typeof organizationChartLineColors)[number];
export type OrganizationChartLineStyle = (typeof organizationChartLineStyles)[number];
export type OrganizationChartDirection = (typeof organizationChartDirections)[number];
export type OrganizationChartEdgeColorMode = (typeof organizationChartEdgeColorModes)[number];

const CHART_LENGTH = { min: 0, units: ["px", "rem", "em"] } as const;

export const organizationChartOptions = defineOptions(
  "organization-chart",
  "data-ok-organization-chart",
  {
    direction: style(
      "data-ok-direction",
      organizationChartDirections,
      "top",
      "Where the root sits: `top` (default, children below), `bottom`, `left` (at the inline start) or `right`.",
      { optional: true },
    ),
    lineHeight: number(
      "data-ok-line-height",
      40,
      "Height of the connectors between two levels: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    lineWidth: number(
      "data-ok-line-width",
      1,
      "Thickness of the connectors: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    lineColor: style(
      "data-ok-line-color",
      organizationChartLineColors,
      "divider",
      "`divider` (default), `inherit` (the text color) or a palette color (its light tone).",
    ),
    lineStyle: style(
      "data-ok-line-style",
      organizationChartLineStyles,
      "solid",
      "Line style of the connectors.",
    ),
    edgeColorMode: style(
      "data-ok-edge-color-mode",
      organizationChartEdgeColorModes,
      "default",
      "`default`: a node's own `lineColor` and `lineStyle` style the lines to its children only. `node`: they style its whole branch, down to the nodes that set their own.",
      { optional: true },
    ),
    lineBorderRadius: number(
      "data-ok-line-border-radius",
      24,
      "Corner radius where a connector turns: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    nodePadding: number(
      "data-ok-node-padding",
      4,
      "Space on each side of every node: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    groupLeafNodes: flag(
      "data-ok-group-leaf-nodes",
      "Two or more children without children of their own stack in one column, joined to their parent by a line along their side.",
    ),
    groupLeafNodesSpacing: number(
      "data-ok-group-leaf-nodes-spacing",
      8,
      "Space between grouped leaf nodes: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    enableExpandCollapse: flag(
      "data-ok-enable-expand-collapse",
      "Nodes with children can be collapsed and expanded with their toggle button.",
    ),
    expandCollapseOnNodeClick: flag(
      "data-ok-expand-collapse-on-node-click",
      "A click on a node's label (outside its buttons and links) also toggles its children.",
    ),
    collapseBadgeThreshold: number(
      "data-ok-collapse-badge-threshold",
      1,
      "Smallest number of hidden descendants that a collapsed node's badge shows.",
      { min: 1 },
    ),
    highlightOnHover: flag(
      "data-ok-highlight-on-hover",
      "Hovering or focusing a node highlights its path to the root and dims the other nodes.",
    ),
    dimOpacity: number(
      "data-ok-dim-opacity",
      0.7,
      "How much nodes outside a highlighted path fade, from 0 (not at all) to 1 (hidden).",
      { min: 0 },
    ),
    enableZoomPan: flag(
      "data-ok-enable-zoom-pan",
      "Ctrl or Command with the mouse wheel, a trackpad pinch, the + / − / 0 keys and the toolbar zoom the chart; a mouse drag pans it.",
    ),
    zoom: number(
      "data-ok-zoom",
      1,
      "The zoom level, from `minZoom` to `maxZoom` (1 is 100%). Changed by the user with zoom and pan on.",
      { min: 0.01 },
    ),
    minZoom: number("data-ok-min-zoom", 0.25, "The smallest zoom level.", { min: 0.01 }),
    maxZoom: number("data-ok-max-zoom", 2, "The largest zoom level.", { min: 0.01 }),
    enableKeyboardNavigation: flag(
      "data-ok-enable-keyboard-navigation",
      "The chart becomes a tree with one tab stop: the arrow keys move between visible nodes, expand and collapse them, Home and End go to the first and last node, letters jump to a node.",
    ),
    enableSelection: style(
      "data-ok-enable-selection",
      organizationChartSelectionModes,
      "single",
      "Nodes with an id can be selected with a click or Space: `single` (one node) or `multi` (several). Turns on keyboard navigation.",
      { optional: true },
    ),
  },
);

export interface OrganizationChartAnatomyOptions {
  direction?: OrganizationChartDirection | undefined;
  lineHeight?: number | string | undefined;
  lineWidth?: number | string | undefined;
  lineColor?: OrganizationChartLineColor | undefined;
  lineStyle?: OrganizationChartLineStyle | undefined;
  edgeColorMode?: OrganizationChartEdgeColorMode | undefined;
  lineBorderRadius?: number | string | undefined;
  nodePadding?: number | string | undefined;
  groupLeafNodes?: boolean | undefined;
  groupLeafNodesSpacing?: number | string | undefined;
  enableExpandCollapse?: boolean | undefined;
  expandCollapseOnNodeClick?: boolean | undefined;
  collapseBadgeThreshold?: number | undefined;
  highlightOnHover?: boolean | undefined;
  dimOpacity?: number | undefined;
  enableZoomPan?: boolean | undefined;
  zoom?: number | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  enableKeyboardNavigation?: boolean | undefined;
  enableSelection?: (typeof organizationChartSelectionModes)[number] | false | undefined;
}

/** `data-ok-*` attributes of an organization chart (the outer `ul`). */
export const organizationChartAttributes = (
  options: OrganizationChartAnatomyOptions = {},
): DataAttributes => optionAttributes(organizationChartOptions, { ...options });

/** Per-node line options (ApexTree `edgeColorMode: "node"`): the lines from a node to its children. */
export const organizationChartNodeOptions = defineOptions(
  "organization-chart-node",
  "data-ok-organization-chart-node",
  {
    lineColor: style(
      "data-ok-line-color",
      organizationChartLineColors,
      "divider",
      "Color of the lines from this node to its children (its whole branch with `edgeColorMode` `node`); none: the chart's.",
      { optional: true },
    ),
    lineStyle: style(
      "data-ok-line-style",
      organizationChartLineStyles,
      "solid",
      "Line style of the lines from this node to its children (its whole branch with `edgeColorMode` `node`); none: the chart's.",
      { optional: true },
    ),
  },
);

export interface OrganizationChartNodeAnatomyOptions {
  lineColor?: OrganizationChartLineColor | undefined;
  lineStyle?: OrganizationChartLineStyle | undefined;
}

/** `data-ok-*` attributes of an organization chart node (an `li`). */
export const organizationChartNodeAttributes = (
  options: OrganizationChartNodeAnatomyOptions = {},
): DataAttributes => optionAttributes(organizationChartNodeOptions, { ...options });

// --- Image --------------------------------------------------------------------------------------

export const imageRatios = [
  "1/1",
  "2/3",
  "3/2",
  "3/4",
  "4/3",
  "4/6",
  "6/4",
  "9/16",
  "16/9",
  "9/21",
  "21/9",
] as const;
export const imageFits = ["cover", "contain", "fill", "none", "scale-down"] as const;
export const imagePositions = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export const imageEffects = ["blur", "opacity", "black-and-white", "none"] as const;
export const imageOverlays = ["dark", ...paletteColorNames] as const;
export const imageStates = ["loading", "loaded", "error"] as const;

export type ImageRatio = (typeof imageRatios)[number];
export type ImageFit = (typeof imageFits)[number];
export type ImagePosition = (typeof imagePositions)[number];
export type ImageEffect = (typeof imageEffects)[number];
export type ImageOverlay = (typeof imageOverlays)[number];
export type ImageState = (typeof imageStates)[number];

export const imageOptions = defineOptions("image", "data-ok-image", {
  ratio: style(
    "data-ok-ratio",
    imageRatios,
    "1/1",
    "Aspect ratio (width/height) the picture is cropped to. None: the picture's own ratio.",
    { optional: true },
  ),
  fit: style("data-ok-fit", imageFits, "cover", "How the picture fills its box (`object-fit`)."),
  position: style(
    "data-ok-position",
    imagePositions,
    "center",
    "Which part of the picture stays in view when it is cropped (`object-position`).",
  ),
  effect: style(
    "data-ok-effect",
    imageEffects,
    "blur",
    "How the picture appears once loaded: blurred, faded, from grayscale, or at once.",
  ),
  overlay: style(
    "data-ok-overlay",
    imageOverlays,
    "dark",
    "A layer over the picture: `dark` (48% grey 900) or a palette color (a gradient to 80%).",
    { optional: true },
  ),
  overlayFrom: style(
    "data-ok-overlay-from",
    paletteColorNames,
    "primary",
    "With a color `overlay`: the gradient starts from this color (24%) at the bottom.",
    { optional: true },
  ),
  disablePlaceholder: flag(
    "data-ok-disable-placeholder",
    "No placeholder while the picture loads or after an error.",
  ),
  visibleByDefault: flag(
    "data-ok-visible-by-default",
    'Loads at once (`loading="eager"`), with no placeholder and no effect.',
  ),
  state: state(
    "data-ok-state",
    "`loading`, `loaded` or `error`, written by the component (never in snippets).",
    "load",
  ),
});

export interface ImageAnatomyOptions {
  ratio?: ImageRatio | undefined;
  fit?: ImageFit | undefined;
  position?: ImagePosition | undefined;
  effect?: ImageEffect | undefined;
  overlay?: ImageOverlay | undefined;
  overlayFrom?: PaletteColorName | undefined;
  disablePlaceholder?: boolean | undefined;
  visibleByDefault?: boolean | undefined;
}

/** `data-ok-*` attributes of an image root (`ratio`, `overlay`, `overlayFrom` only when given). */
export const imageAttributes = (options: ImageAnatomyOptions = {}): DataAttributes =>
  optionAttributes(imageOptions, {
    ...options,
    overlayFrom: options.overlay && options.overlay !== "dark" ? options.overlayFrom : undefined,
  });

/** The load state of a settled `<img>`: `loaded`, `error`, or `loading` while it isn't. */
export function imageLoadState(
  img: Pick<HTMLImageElement, "complete" | "naturalWidth">,
): ImageState {
  if (!img.complete) return "loading";
  return img.naturalWidth > 0 ? "loaded" : "error";
}

// --- Rating -------------------------------------------------------------------------------------

export const ratingSizes = ["xxSmall", "xSmall", "small", "medium", "large"] as const;
export type RatingSize = (typeof ratingSizes)[number];

export const ratingOptions = defineOptions("rating", "data-ok-rating", {
  size: style("data-ok-size", ratingSizes, "medium", "Icon size: 12 / 16 / 20 / 24 / 28px."),
  color: style("data-ok-color", paletteColorNames, "warning", "Color of the filled icons."),
  highlightSelectedOnly: flag(
    "data-ok-highlight-selected-only",
    "Only the selected icon is filled (icons that differ per value).",
  ),
  readOnly: flag("data-ok-read-only", 'Shows the value without inputs (`role="img"`).'),
  disabled: flag("data-ok-disabled", "Can't be changed (inputs disabled, dimmed)."),
  value: state("checked", "Selected value (`value` / `defaultValue`).", "change"),
});

export interface RatingAnatomyOptions {
  size?: RatingSize | undefined;
  color?: PaletteColorName | undefined;
  highlightSelectedOnly?: boolean | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a rating. */
export const ratingAttributes = (options: RatingAnatomyOptions = {}): DataAttributes =>
  optionAttributes(ratingOptions, { ...options });

// --- Slider -------------------------------------------------------------------------------------

export const sliderColors = ["inherit", ...paletteColorNames] as const;
export const sliderSizes = ["medium", "small"] as const;
export const sliderTracks = ["normal", "inverted", "false"] as const;
export const sliderValueLabelDisplays = ["off", "auto", "on"] as const;

export type SliderColor = (typeof sliderColors)[number];
export type SliderSize = (typeof sliderSizes)[number];
export type SliderTrack = (typeof sliderTracks)[number];
export type SliderValueLabelDisplay = (typeof sliderValueLabelDisplays)[number];

export const sliderOptions = defineOptions("slider", "data-ok-slider", {
  color: style("data-ok-color", sliderColors, "primary", "Palette color, or `inherit` (text)."),
  size: style("data-ok-size", sliderSizes, "medium", "Rail 10 / 6px, thumb 20 / 16px."),
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A horizontal or a vertical slider (vertical fills its container's height).",
  ),
  track: style(
    "data-ok-track",
    sliderTracks,
    "normal",
    "`normal` fills up to the value, `inverted` from the value, `false` draws no track.",
  ),
  valueLabelDisplay: style(
    "data-ok-value-label-display",
    sliderValueLabelDisplays,
    "off",
    "Value bubble above the thumb: never, on hover / focus / drag (`auto`), or always.",
  ),
  disabled: flag("data-ok-disabled", "Can't be changed (inputs disabled, grey)."),
  disableSwap: flag("data-ok-disable-swap", "Range: thumbs can't cross each other."),
  min: number("data-ok-min", 0, "Lowest value."),
  max: number("data-ok-max", 100, "Highest value."),
  step: number("data-ok-step", 1, "Step between values (HTML `marks`: only the marks).", {
    min: 0,
  }),
  shiftStep: number(
    "data-ok-shift-step",
    10,
    "How far Page Up / Page Down and Shift + arrow keys move the thumb.",
    { min: 0 },
  ),
  value: state("value", "Value of each thumb (`value` / `defaultValue`).", "change"),
});

export interface SliderAnatomyOptions {
  color?: SliderColor | undefined;
  size?: SliderSize | undefined;
  orientation?: Orientation | undefined;
  track?: SliderTrack | undefined;
  valueLabelDisplay?: SliderValueLabelDisplay | undefined;
  disabled?: boolean | undefined;
  disableSwap?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  shiftStep?: number | undefined;
}

/** `data-ok-*` attributes of a slider root. */
export const sliderAttributes = (options: SliderAnatomyOptions = {}): DataAttributes =>
  optionAttributes(sliderOptions, { ...options });

// --- Transfer list ------------------------------------------------------------------------------

export const transferListVariants = ["simple", "enhanced"] as const;
export type TransferListVariant = (typeof transferListVariants)[number];

export const transferListOptions = defineOptions("transfer-list", "data-ok-transfer-list", {
  variant: style(
    "data-ok-variant",
    transferListVariants,
    "simple",
    "`simple`: four move buttons; `enhanced`: titled lists with select-all and counts.",
  ),
  disabled: flag("data-ok-disabled", "Nothing can be selected or moved."),
  value: state("checked", "Items on each side (`left` / `right`).", "change"),
});

export interface TransferListAnatomyOptions {
  variant?: TransferListVariant | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a transfer list. */
export const transferListAttributes = (options: TransferListAnatomyOptions = {}): DataAttributes =>
  optionAttributes(transferListOptions, { ...options });

// --- Tree view ----------------------------------------------------------------------------------

export const treeViewVariants = ["standard", "lines"] as const;
export const treeViewExpansionTriggers = ["content", "iconContainer"] as const;
export type TreeViewVariant = (typeof treeViewVariants)[number];
export type TreeViewExpansionTrigger = (typeof treeViewExpansionTriggers)[number];

export const treeViewOptions = defineOptions("tree-view", "data-ok-tree-view", {
  variant: style(
    "data-ok-variant",
    treeViewVariants,
    "standard",
    "`lines` draws dashed guides beside children and round expand icons.",
  ),
  expansionTrigger: style(
    "data-ok-expansion-trigger",
    treeViewExpansionTriggers,
    "content",
    "What expands an item on click: the whole row, or only its icon.",
  ),
  multiSelect: flag(
    "data-ok-multi-select",
    "Several items can be selected (`aria-multiselectable`).",
  ),
  checkboxSelection: flag(
    "data-ok-checkbox-selection",
    "Each item shows a checkbox for its selection.",
  ),
  disableSelection: flag("data-ok-disable-selection", "Items can't be selected (only expanded)."),
  disabledItemsFocusable: flag(
    "data-ok-disabled-items-focusable",
    "Disabled items stay in the arrow-key focus order.",
  ),
  itemsReordering: flag(
    "data-ok-items-reordering",
    "Items can be dragged to a new position (or moved with Ctrl / ⌘ + Shift + arrows).",
  ),
  itemChildrenIndentation: number(
    "data-ok-item-children-indentation",
    12,
    "Indentation of each level of children: px or a CSS length.",
    { min: 0, units: ["px", "rem", "em"] },
  ),
  expanded: state("aria-expanded", "Expanded items (`expandedItems`).", "expand"),
  selected: state("aria-selected", "Selected items (`selectedItems`).", "select"),
});

export interface TreeViewAnatomyOptions {
  variant?: TreeViewVariant | undefined;
  expansionTrigger?: TreeViewExpansionTrigger | undefined;
  multiSelect?: boolean | undefined;
  checkboxSelection?: boolean | undefined;
  disableSelection?: boolean | undefined;
  disabledItemsFocusable?: boolean | undefined;
  itemsReordering?: boolean | undefined;
  itemChildrenIndentation?: number | string | undefined;
}

/** `data-ok-*` attributes of a tree view (`ul[role=tree]`). */
export const treeViewAttributes = (options: TreeViewAnatomyOptions = {}): DataAttributes =>
  optionAttributes(treeViewOptions, { ...options });

/** The indentation as `--_ok-tree-indent` (a number is px), or nothing when invalid. */
export const treeViewStyle = (
  indentation: unknown,
): Partial<Record<"--_ok-tree-indent", string>> => {
  const value = parseNumber(treeViewOptions.options.itemChildrenIndentation, indentation);
  return value === undefined
    ? {}
    : { "--_ok-tree-indent": typeof value === "number" ? `${value}px` : value };
};

// --- Autocomplete -------------------------------------------------------------------------------

export const autocompleteOptions = defineOptions("autocomplete", "data-ok-autocomplete", {
  multiple: flag("data-ok-multiple", "Several values, shown as chips in the field."),
  freeSolo: flag("data-ok-free-solo", "Any text is a value (Enter commits it)."),
  disableCloseOnSelect: flag(
    "data-ok-disable-close-on-select",
    "The list stays open after a pick (multiple select with checkboxes).",
  ),
  disableClearable: flag("data-ok-disable-clearable", "No clear button."),
  openOnFocus: flag("data-ok-open-on-focus", "The list opens when the field gets focus."),
  autoHighlight: flag("data-ok-auto-highlight", "The first option is highlighted while typing."),
  limitTags: number(
    "data-ok-limit-tags",
    undefined,
    'Multiple: chips shown when the field isn\'t focused (the rest as "+3").',
    { min: 0 },
  ),
  autoComplete: flag(
    "data-ok-auto-complete",
    "Inline completion: the input shows the highlighted option, the rest of its label selected.",
  ),
  autoSelect: flag(
    "data-ok-auto-select",
    "Leaving the field picks the option highlighted by the keys or `autoHighlight` (free solo: the text).",
  ),
  blurOnSelect: style(
    "data-ok-blur-on-select",
    ["true", "mouse", "touch"],
    "true",
    "The input loses focus after a pick: always (`true`), or only after a mouse or touch pick.",
    { optional: true },
  ),
  clearOnBlur: style(
    "data-ok-clear-on-blur",
    ["true", "false"],
    "true",
    "Leaving the field puts back the chosen label (or empties the text). Default: on, off in free solo.",
    { optional: true },
  ),
  clearOnEscape: flag(
    "data-ok-clear-on-escape",
    "Escape on a closed list clears the value and the text.",
  ),
  disabledItemsFocusable: flag(
    "data-ok-disabled-items-focusable",
    "Disabled options can be highlighted (not picked).",
  ),
  disableListWrap: flag(
    "data-ok-disable-list-wrap",
    "The arrows stop at the first and last options instead of wrapping.",
  ),
  filterSelectedOptions: flag(
    "data-ok-filter-selected-options",
    "Chosen options are left out of the list.",
  ),
  handleHomeEndKeys: style(
    "data-ok-handle-home-end-keys",
    ["true", "false"],
    "true",
    "Home and End highlight the first and last options. Default: on, off in free solo.",
    { optional: true },
  ),
  includeInputInList: flag(
    "data-ok-include-input-in-list",
    "The arrows move from the last or first option back to the input.",
  ),
  loading: flag(
    "data-ok-loading",
    "Options are loading: the list shows the loading text while it has no options.",
  ),
  readOnly: flag(
    "data-ok-read-only",
    "The value can't change: the list doesn't open and chips have no remove button.",
  ),
  resetHighlightOnMouseLeave: flag(
    "data-ok-reset-highlight-on-mouse-leave",
    "The pointer leaving the list removes the highlight it made.",
  ),
  selectOnFocus: style(
    "data-ok-select-on-focus",
    ["true", "false"],
    "true",
    "The first click in the field selects its text. Default: on, off in free solo.",
    { optional: true },
  ),
  virtualize: flag(
    "data-ok-virtualize",
    "Long lists draw only the options in view (groups aren't shown).",
  ),
  value: state("aria-selected", "Chosen option(s) (`value` / `defaultValue`).", "change"),
});

export interface AutocompleteAnatomyOptions {
  multiple?: boolean | undefined;
  freeSolo?: boolean | undefined;
  disableCloseOnSelect?: boolean | undefined;
  disableClearable?: boolean | undefined;
  openOnFocus?: boolean | undefined;
  autoHighlight?: boolean | undefined;
  limitTags?: number | undefined;
  autoComplete?: boolean | undefined;
  autoSelect?: boolean | undefined;
  blurOnSelect?: boolean | "mouse" | "touch" | undefined;
  clearOnBlur?: boolean | undefined;
  clearOnEscape?: boolean | undefined;
  disabledItemsFocusable?: boolean | undefined;
  disableListWrap?: boolean | undefined;
  filterSelectedOptions?: boolean | undefined;
  handleHomeEndKeys?: boolean | undefined;
  includeInputInList?: boolean | undefined;
  loading?: boolean | undefined;
  readOnly?: boolean | undefined;
  resetHighlightOnMouseLeave?: boolean | undefined;
  selectOnFocus?: boolean | undefined;
  virtualize?: boolean | undefined;
}

const trueFalse = (value: boolean | undefined) =>
  value === undefined ? undefined : value ? "true" : "false";

/** `data-ok-*` attributes of an autocomplete root. */
export const autocompleteAttributes = (options: AutocompleteAnatomyOptions = {}): DataAttributes =>
  optionAttributes(autocompleteOptions, {
    ...options,
    blurOnSelect: options.blurOnSelect === true ? "true" : options.blurOnSelect || undefined,
    clearOnBlur: trueFalse(options.clearOnBlur),
    handleHomeEndKeys: trueFalse(options.handleHomeEndKeys),
    selectOnFocus: trueFalse(options.selectOnFocus),
  });

// --- Motion (Animate) -------------------------------------------------------------------------

/** Entrance / exit animations: `<family><In|Out>[<direction>]` (the reference's 48). */
export const motionEntranceVariants = [
  "slideInUp",
  "slideInDown",
  "slideInLeft",
  "slideInRight",
  "slideOutUp",
  "slideOutDown",
  "slideOutLeft",
  "slideOutRight",
  "fadeIn",
  "fadeInUp",
  "fadeInDown",
  "fadeInLeft",
  "fadeInRight",
  "fadeOut",
  "fadeOutUp",
  "fadeOutDown",
  "fadeOutLeft",
  "fadeOutRight",
  "zoomIn",
  "zoomInUp",
  "zoomInDown",
  "zoomInLeft",
  "zoomInRight",
  "zoomOut",
  "zoomOutUp",
  "zoomOutDown",
  "zoomOutLeft",
  "zoomOutRight",
  "bounceIn",
  "bounceInUp",
  "bounceInDown",
  "bounceInLeft",
  "bounceInRight",
  "bounceOut",
  "bounceOutUp",
  "bounceOutDown",
  "bounceOutLeft",
  "bounceOutRight",
  "flipInX",
  "flipInY",
  "flipOutX",
  "flipOutY",
  "scaleInX",
  "scaleInY",
  "scaleOutX",
  "scaleOutY",
  "rotateIn",
  "rotateOut",
] as const;

/** Looping background animations: Ken Burns (images), pan and color change (gradients). */
export const motionBackgroundVariants = [
  "kenburnsTop",
  "kenburnsBottom",
  "kenburnsLeft",
  "kenburnsRight",
  "panTop",
  "panBottom",
  "panLeft",
  "panRight",
  "color2x",
  "color3x",
  "color4x",
  "color5x",
] as const;

/**
 * Effects: `draw` traces the strokes of an SVG (paths with `pathLength="1"`) then fills it;
 * `interactive` scales up on hover and down while pressed (the reference's "Tap & hover").
 */
export const motionEffectVariants = ["draw", "interactive"] as const;

export const motionVariants = [
  ...motionEntranceVariants,
  ...motionBackgroundVariants,
  ...motionEffectVariants,
] as const;
export type MotionVariant = (typeof motionVariants)[number];
export const motionTriggers = ["inView", "mount", "manual"] as const;
export type MotionTrigger = (typeof motionTriggers)[number];

const motionTriggerOptions = {
  trigger: style(
    "data-ok-trigger",
    motionTriggers,
    "inView",
    "`inView`: plays when the element scrolls into view; `mount`: right away; `manual`: follows `in`.",
  ),
  once: behavior(
    "data-ok-once",
    true,
    "In view: plays only the first time; `false` also plays the exit when it leaves the view.",
  ),
  amount: number(
    "data-ok-amount",
    0.3,
    "In view: the visible fraction (0 to 1) that starts the animation.",
    { min: 0 },
  ),
  in: state(
    "data-ok-in",
    "Manual trigger: shown (`in`; HTML: the `data-ok-in` attribute). Turning it off plays the exit.",
  ),
  delay: number("data-ok-delay", undefined, "Wait before the entrance, in milliseconds.", {
    min: 0,
  }),
};

const motionLookOptions = {
  variant: style(
    "data-ok-variant",
    motionVariants,
    "fadeIn",
    "Animation: entrances and exits (`fadeInUp`, `zoomOut`…) or looping backgrounds (`kenburnsTop`, `panLeft`, `color3x`…).",
  ),
  duration: number(
    "data-ok-duration",
    undefined,
    "Entrance length in milliseconds (default 640; loops have their own).",
    { min: 0 },
  ),
  distance: number(
    "data-ok-distance",
    undefined,
    "How far directional variants travel, in pixels (default 160 for slides, 120 for fades).",
    { min: 0 },
  ),
};

export const motionOptions = defineOptions("motion", "data-ok-motion", {
  ...motionLookOptions,
  ...motionTriggerOptions,
  paused: flag(
    "data-ok-paused",
    "Pauses the animation (looping variants need a pause control: WCAG 2.2.2).",
  ),
  initial: behavior(
    "data-ok-initial",
    true,
    "`false` skips the entrance: the content shows as it is; later exits and entrances play (a shared `layoutId` element).",
  ),
});

export const motionGroupOptions = defineOptions("motion-group", "data-ok-motion-group", {
  ...motionTriggerOptions,
  stagger: number(
    "data-ok-stagger",
    50,
    "Milliseconds between the entrances of the direct child Motions.",
    { min: 0 },
  ),
});

export const motionTextOptions = defineOptions("motion-text", "data-ok-motion-text", {
  ...motionLookOptions,
  ...motionTriggerOptions,
  stagger: number("data-ok-stagger", 25, "Milliseconds between the entrances of the letters.", {
    min: 0,
  }),
});

export interface MotionTriggerAnatomyOptions {
  trigger?: MotionTrigger | undefined;
  once?: boolean | undefined;
  amount?: number | undefined;
  delay?: number | undefined;
}

export interface MotionAnatomyOptions extends MotionTriggerAnatomyOptions {
  variant?: MotionVariant | undefined;
  duration?: number | undefined;
  distance?: number | undefined;
  paused?: boolean | undefined;
  initial?: boolean | undefined;
}

const onceAttribute = (once: boolean | undefined, attr: string): DataAttributes =>
  once === false ? { [attr]: "false" } : {};

/** `data-ok-*` attributes of a Motion (the state, `data-ok-state`, is written by its owner). */
export const motionAttributes = (options: MotionAnatomyOptions = {}): DataAttributes => ({
  ...optionAttributes(motionOptions, { ...options }),
  ...onceAttribute(options.once, motionOptions.options.once.attr),
  ...onceAttribute(options.initial, motionOptions.options.initial.attr),
});

/** `data-ok-*` attributes of a MotionGroup. */
export const motionGroupAttributes = (
  options: MotionTriggerAnatomyOptions & { stagger?: number | undefined } = {},
): DataAttributes => ({
  ...optionAttributes(motionGroupOptions, { ...options }),
  ...onceAttribute(options.once, motionGroupOptions.options.once.attr),
});

/** `data-ok-*` attributes of a MotionText. */
export const motionTextAttributes = (
  options: Omit<MotionAnatomyOptions, "paused"> & { stagger?: number | undefined } = {},
): DataAttributes => ({
  ...optionAttributes(motionTextOptions, { ...options }),
  ...onceAttribute(options.once, motionTextOptions.options.once.attr),
});

// --- CountUp and MotionBorder (Animate "Other") ----------------------------------------------

export const countUpOptions = defineOptions("count-up", "data-ok-count-up", {
  start: number("data-ok-start", 0, "First value shown.", {}),
  end: number("data-ok-end", 0, "Value reached at the end (also what screen readers read)."),
  decimals: number("data-ok-decimals", 0, "Digits after the decimal point.", { min: 0 }),
  duration: number("data-ok-duration", 2000, "Length of the count, in milliseconds.", { min: 0 }),
  trigger: motionTriggerOptions.trigger,
  once: motionTriggerOptions.once,
  amount: motionTriggerOptions.amount,
  in: motionTriggerOptions.in,
});

export interface CountUpAnatomyOptions {
  start?: number | undefined;
  end?: number | undefined;
  decimals?: number | undefined;
  duration?: number | undefined;
  trigger?: MotionTrigger | undefined;
  once?: boolean | undefined;
  amount?: number | undefined;
}

/** `data-ok-*` attributes of a CountUp. */
export const countUpAttributes = (options: CountUpAnatomyOptions = {}): DataAttributes => ({
  ...optionAttributes(countUpOptions, { ...options }),
  ...onceAttribute(options.once, countUpOptions.options.once.attr),
});

export const countdownOptions = defineOptions("countdown", "data-ok-countdown", {
  seconds: number(
    "data-ok-seconds",
    undefined,
    "Counts down from this many seconds (when there is no `date`).",
    { min: 0 },
  ),
  largestUnit: style(
    "data-ok-largest-unit",
    countdownUnits,
    "days",
    "The largest unit shown: larger ones fold into it (`minutes`: 90 minutes, not 1 hour 30).",
  ),
  paused: flag(
    "data-ok-paused",
    "Stops the countdown (WCAG 2.2.2). Seconds keep their time left; a date shows the real time left when it resumes.",
  ),
});

export interface CountdownAnatomyOptions {
  seconds?: number | undefined;
  largestUnit?: CountdownUnit | undefined;
  paused?: boolean | undefined;
}

/** `data-ok-*` attributes of a Countdown (`date`, `now` and the labels are written by the owner). */
export const countdownAttributes = (options: CountdownAnatomyOptions = {}): DataAttributes =>
  optionAttributes(countdownOptions, { ...options });

export const motionBorderShapes = ["rounded", "circle"] as const;
export type MotionBorderShape = (typeof motionBorderShapes)[number];
export const motionBorderColors = ["multi", "inherit", ...paletteColorNames] as const;
export type MotionBorderColor = (typeof motionBorderColors)[number];
export const motionBorderSecondaryColors = ["inherit", ...paletteColorNames] as const;
export type MotionBorderSecondaryColor = (typeof motionBorderSecondaryColors)[number];

export const motionBorderOptions = defineOptions("motion-border", "data-ok-motion-border", {
  shape: style("data-ok-shape", motionBorderShapes, "rounded", "`rounded` corners or a `circle`."),
  color: style(
    "data-ok-color",
    motionBorderColors,
    "multi",
    "`multi`: several brand colors all around; `inherit` (the text color) or a palette color: a light running along the border.",
  ),
  secondaryColor: style(
    "data-ok-secondary-color",
    motionBorderSecondaryColors,
    "inherit",
    "A second light in this color, starting on the opposite side (not with `multi`; absent by default).",
    { optional: true },
  ),
  width: number("data-ok-width", 2, "Border width in pixels.", { min: 0 }),
  duration: number(
    "data-ok-duration",
    undefined,
    "One turn, in milliseconds (default about 5 s).",
    {
      min: 0,
    },
  ),
  paused: flag(
    "data-ok-paused",
    "Stops the turning border (a looping animation needs a pause control: WCAG 2.2.2).",
  ),
});

export interface MotionBorderAnatomyOptions {
  shape?: MotionBorderShape | undefined;
  color?: MotionBorderColor | undefined;
  secondaryColor?: MotionBorderSecondaryColor | undefined;
  width?: number | undefined;
  duration?: number | undefined;
  paused?: boolean | undefined;
}

/** `data-ok-*` attributes of a MotionBorder (width and duration also go to private properties). */
export const motionBorderAttributes = (options: MotionBorderAnatomyOptions = {}): DataAttributes =>
  optionAttributes(motionBorderOptions, { ...options });

// --- Scroll progress (ADR-0062, 5.2) ---------------------------------------------------------

export const scrollAxes = ["y", "x"] as const;

export const scrollProgressOptions = defineOptions("scroll-progress", "data-ok-scroll-progress", {
  axis: style(
    "data-ok-scroll-axis",
    scrollAxes,
    "y",
    "Scroll direction followed: `y` (vertical) or `x` (horizontal).",
    { optional: true },
  ),
});

export interface ScrollProgressAnatomyOptions {
  axis?: (typeof scrollAxes)[number] | undefined;
  /** Id of the scroll container (absent: the page). */
  container?: string | undefined;
  /** Id of the element whose way through the container is measured. */
  target?: string | undefined;
  /** Two intersections, such as `["start end", "end start"]` or `"start end, end start"`. */
  offset?: ScrollOffset | string | undefined;
  /** Follows the scroll with a spring: `true` (empty attribute) or spring options (JSON). */
  smooth?: boolean | SpringOptions | undefined;
}

/**
 * `data-ok-*` attributes of a progress that follows a scroll position (Linear or Circular
 * progress): the axis, and the container, target, offset and smoothing as written.
 */
export const scrollProgressAttributes = (
  options: ScrollProgressAnatomyOptions = {},
): DataAttributes => {
  const attributes = optionAttributes(scrollProgressOptions, { ...options });
  if (options.container) attributes["data-ok-scroll-container"] = options.container;
  if (options.target) attributes["data-ok-scroll-target"] = options.target;
  if (options.offset !== undefined) {
    attributes["data-ok-scroll-offset"] =
      typeof options.offset === "string"
        ? options.offset
        : options.offset
            .map((entry) => (typeof entry === "object" ? entry.join(" ") : String(entry)))
            .join(", ");
  }
  if (options.smooth === true) attributes["data-ok-scroll-smooth"] = "";
  else if (options.smooth && typeof options.smooth === "object")
    attributes["data-ok-scroll-smooth"] = JSON.stringify(options.smooth);
  return attributes;
};

// --- Data grid (ADR-0020) ---------------------------------------------------------------------

export const dataGridOptions = defineOptions("data-grid", "data-ok-data-grid", {
  density: style(
    "data-ok-density",
    gridDensities,
    "standard",
    "Row height: `compact` 36px, `standard` 52px, `comfortable` 67px.",
  ),
  checkboxSelection: flag(
    "data-ok-checkbox-selection",
    "A first column of checkboxes selects rows.",
  ),
  disableRowSelectionOnClick: flag(
    "data-ok-disable-row-selection-on-click",
    "Clicking a row doesn't select it (only its checkbox does).",
  ),
  disableColumnMenu: flag("data-ok-disable-column-menu", "No column menu in the headers."),
  disableMultipleColumnsSorting: flag(
    "data-ok-disable-multiple-columns-sorting",
    "Shift doesn't add columns to the sort.",
  ),
  disableMultipleColumnsFiltering: flag(
    "data-ok-disable-multiple-columns-filtering",
    "The filter panel keeps one filter (no Add filter).",
  ),
  disableColumnResize: flag("data-ok-disable-column-resize", "Columns can't be resized."),
  disableColumnReorder: flag("data-ok-disable-column-reorder", "Columns can't be moved."),
  disableColumnPinning: flag("data-ok-disable-column-pinning", "Columns can't be pinned."),
  editMode: style(
    "data-ok-edit-mode",
    ["cell", "row"],
    "cell",
    "Editable columns: edit one `cell` at a time, or every editable cell of a `row` together.",
  ),
  disableVirtualization: flag(
    "data-ok-disable-virtualization",
    "Render every row of the page, not only the visible ones.",
  ),
  sortingMode: style(
    "data-ok-sorting-mode",
    ["client", "server"],
    "client",
    "`server`: the grid reports the sort model and shows the rows as given.",
  ),
  filterMode: style(
    "data-ok-filter-mode",
    ["client", "server"],
    "client",
    "`server`: the grid reports the filter model and shows the rows as given.",
  ),
  paginationMode: style(
    "data-ok-pagination-mode",
    ["client", "server"],
    "client",
    "`server`: the rows are the current page; `rowCount` is the total.",
  ),
  rowCount: number(
    "data-ok-row-count",
    undefined,
    "Total rows on the server (`-1`: not known yet).",
    { min: -1 },
  ),
  estimatedRowCount: number(
    "data-ok-estimated-row-count",
    undefined,
    'With an unknown row count: the pagination shows "around" this number while the page is before it.',
    { min: 0 },
  ),
  loading: flag("data-ok-loading", "Data is loading: an overlay shows progress."),
  loadingVariant: style(
    "data-ok-loading-variant",
    ["linear-progress", "circular-progress", "skeleton"],
    "linear-progress",
    "How loading shows: a bar, a spinner or placeholder rows.",
  ),
  scrollEndThreshold: number(
    "data-ok-scroll-end-threshold",
    80,
    "Distance from the end of the rows (px) that reports the scroll end.",
    { min: 0 },
  ),
  disableMultipleRowSelection: flag(
    "data-ok-disable-multiple-row-selection",
    "One row at a time: selecting a row clears the others (no select all).",
  ),
  keepNonExistentRowsSelected: flag(
    "data-ok-keep-non-existent-rows-selected",
    "Selected ids stay selected when their rows go away (server pages, new data).",
  ),
  checkboxSelectionVisibleOnly: flag(
    "data-ok-checkbox-selection-visible-only",
    "Select all selects the rows of the current page only.",
  ),
  autosizeOnMount: flag(
    "data-ok-autosize-on-mount",
    "Columns fit their content once the grid shows (resizable, non-flex columns).",
  ),
  rowSpanning: flag(
    "data-ok-row-spanning",
    "Neighbouring cells of a column with the same value merge into one tall cell.",
  ),
  rowHeight: number("data-ok-row-height", undefined, "Row height (px) before density.", {
    min: 1,
  }),
  toolbarVariant: style(
    "data-ok-toolbar-variant",
    ["labeled", "icon"],
    "labeled",
    "Toolbar buttons with text, or icons with tooltips.",
  ),
  quickFilterLogicOperator: style(
    "data-ok-quick-filter-logic-operator",
    ["and", "or"],
    "and",
    "Search words: every one must match (`and`), or any one (`or`).",
  ),
  quickFilterExcludeHiddenColumns: flag(
    "data-ok-quick-filter-exclude-hidden-columns",
    "The search skips hidden columns.",
  ),
  ignoreDiacritics: flag(
    "data-ok-ignore-diacritics",
    'Searches and filters ignore accents: "ha noi" finds "Hà Nội".',
  ),
  treeData: flag(
    "data-ok-tree-data",
    "Rows form a tree: a group column opens and closes their children.",
  ),
  defaultGroupingExpansionDepth: number(
    "data-ok-default-grouping-expansion-depth",
    0,
    "Tree levels open at first (`-1`: all).",
  ),
  rowReordering: flag(
    "data-ok-row-reordering",
    "Rows move by dragging their handle, or Alt + Up / Down on it.",
  ),
  listView: flag("data-ok-list-view", "Each row shows as one cell (a card) instead of columns."),
  rowBufferPx: number(
    "data-ok-row-buffer-px",
    150,
    "Rows rendered above and below the visible ones, px.",
    { min: 0 },
  ),
  columnBufferPx: number(
    "data-ok-column-buffer-px",
    150,
    "Columns rendered left and right of the visible ones, px.",
    { min: 0 },
  ),
  lazyLoading: flag(
    "data-ok-lazy-loading",
    "With a data source and a row count: rows load in chunks as they scroll into view.",
  ),
  lazyLoadingRequestThrottleMs: number(
    "data-ok-lazy-loading-request-throttle-ms",
    500,
    "Least time between two lazy loading requests, ms.",
    { min: 0 },
  ),
  disableRowGrouping: flag(
    "data-ok-disable-row-grouping",
    "Columns can't be grouped by (no Group by in the column menu).",
  ),
  rowGroupingColumnMode: style(
    "data-ok-row-grouping-column-mode",
    ["single", "multiple"] as const,
    "single",
    "Grouped rows show in one grouping column (`single`), or in one column per grouped field (`multiple`).",
  ),
  disableAggregation: flag(
    "data-ok-disable-aggregation",
    "No aggregation (no Aggregation items in the column menu).",
  ),
  aggregationRowsScope: style(
    "data-ok-aggregation-rows-scope",
    ["filtered", "all"] as const,
    "filtered",
    "Rows aggregated: the `filtered` ones, or `all` of them.",
  ),
  disablePivoting: flag("data-ok-disable-pivoting", "No pivot button in the toolbar."),
  pivotActive: flag(
    "data-ok-pivot-active",
    "The grid shows the pivot of its rows (`pivotModel`) instead of the rows.",
  ),
  cellSelection: flag(
    "data-ok-cell-selection",
    "Cells are selected in ranges: press, drag, Shift + click or Shift + arrows.",
  ),
  disableClipboardPaste: flag(
    "data-ok-disable-clipboard-paste",
    "Ctrl / Cmd + V doesn't paste into editable cells (copying still works).",
  ),
  headerFilters: flag("data-ok-header-filters", "A row of filter fields under the column headers."),
  chartsIntegration: flag(
    "data-ok-charts-integration",
    "A chart of the grid's rows (or top-level groups) follows its filters, sorting and grouping.",
  ),
  multipleColumnsSortingMode: style(
    "data-ok-multiple-columns-sorting-mode",
    ["withModifierKey", "always"] as const,
    "withModifierKey",
    "Sorting a column keeps the others with Shift, Ctrl or Cmd (`withModifierKey`), or `always`.",
    { optional: true },
  ),
  disableAutosize: flag(
    "data-ok-disable-autosize",
    "A double click on a column's edge doesn't fit it to its content.",
  ),
  keepColumnPositionIfDraggedOutside: flag(
    "data-ok-keep-column-position-if-dragged-outside",
    "A column dropped outside the grid takes the place of the last header it passed.",
  ),
  pinnedColumnsSectionSeparator: style(
    "data-ok-pinned-columns-section-separator",
    ["border", "shadow", "border-and-shadow"] as const,
    "border",
    "The edge between pinned and scrolling columns: a line, a shadow or both.",
    { optional: true },
  ),
  pinnedRowsSectionSeparator: style(
    "data-ok-pinned-rows-section-separator",
    ["border", "border-and-shadow"] as const,
    "border",
    "The edge between pinned and scrolling rows: a line, or a line and a shadow.",
    { optional: true },
  ),
  pivotPanelOpen: flag("data-ok-pivot-panel-open", "The pivot panel is open."),
  virtualizeColumnsWithAutoRowHeight: flag(
    "data-ok-virtualize-columns-with-auto-row-height",
    'Columns virtualize with `"auto"` row heights too (rows may change height while scrolling sideways).',
  ),
  dataSourceKeepPreviousData: flag(
    "data-ok-data-source-keep-previous-data",
    "With a data source: the rows stay until the new ones arrive (flat rows; tree and grouped rows reset).",
  ),
  dataSourceRevalidateMs: number(
    "data-ok-data-source-revalidate-ms",
    0,
    "With a data source: how often (ms) rows whose cache entry expired load again (`0`: never).",
    { min: 0 },
  ),
  filterDebounceMs: number(
    "data-ok-filter-debounce-ms",
    0,
    "Wait (ms) after a keystroke in the quick filter or the filter panel before filtering.",
    { min: 0 },
  ),
  columnFilterDebounceMs: number(
    "data-ok-column-filter-debounce-ms",
    0,
    "Wait (ms) after a keystroke in a header filter before filtering.",
    { min: 0 },
  ),
  disableChildrenFiltering: flag(
    "data-ok-disable-children-filtering",
    "Tree data: filters apply to top-level rows only; a row's children show with it.",
  ),
  disableChildrenSorting: flag(
    "data-ok-disable-children-sorting",
    "Tree data: sorting orders top-level rows only.",
  ),
  cellSelectionFillHandle: flag(
    "data-ok-cell-selection-fill-handle",
    "With cell selection: a handle at the selection's corner repeats its cells where it is dragged (Ctrl / Cmd + D or R from the keyboard).",
  ),
  statusBar: flag(
    "data-ok-status-bar",
    "With cell selection: a bar under the rows counts the selected cells and sums their numbers.",
  ),
  historyStackSize: number(
    "data-ok-history-stack-size",
    30,
    "Edits and pastes that Ctrl / Cmd + Z can undo (`0` turns undo and redo off).",
    { min: 0 },
  ),
  hideFooterPagination: flag(
    "data-ok-hide-footer-pagination",
    "No pagination in the footer: every row shows, with the row count.",
  ),
  hideFooterRowCount: flag(
    "data-ok-hide-footer-row-count",
    "No row count in the footer (it shows only without pagination).",
  ),
  hideFooterSelectedRowCount: flag(
    "data-ok-hide-footer-selected-row-count",
    'No "n rows selected" in the footer.',
  ),
  tabNavigation: style(
    "data-ok-tab-navigation",
    ["none", "content", "header", "all"] as const,
    "none",
    "Tab moves between body cells (`content`), headers (`header`) or both (`all`); `none` leaves the grid.",
    { optional: true },
  ),
  columnHeaderHeight: number(
    "data-ok-column-header-height",
    undefined,
    "Column header height (px) before density. Default 56.",
    { min: 1 },
  ),
  columnGroupHeaderHeight: number(
    "data-ok-column-group-header-height",
    undefined,
    "Column group header height (px) before density (default: the column headers').",
    { min: 1 },
  ),
  headerFilterHeight: number(
    "data-ok-header-filter-height",
    undefined,
    "Header filter row height (px) before density (default: the column headers', else 56).",
    { min: 1 },
  ),
  showCellVerticalBorder: flag(
    "data-ok-show-cell-vertical-border",
    "Vertical lines between the cells.",
  ),
  showColumnVerticalBorder: flag(
    "data-ok-show-column-vertical-border",
    "Full-height vertical lines between the column headers.",
  ),
  rowSpacingType: style(
    "data-ok-row-spacing-type",
    ["margin", "border"] as const,
    "margin",
    "`getRowSpacing` space outside each row (`margin`) or inside it, under its background (`border`).",
    { optional: true },
  ),
  autoHeight: flag(
    "data-ok-auto-height",
    "The grid grows with its rows: no scroll area, so no virtualization.",
  ),
  autoPageSize: flag(
    "data-ok-auto-page-size",
    "The page size fits the grid's height (no rows per page choice). The grid needs a height.",
  ),
  rowSelection: behavior(
    "data-ok-row-selection",
    true,
    'Rows can be selected (`"false"`: no selection, no checkboxes, no `aria-selected`).',
  ),
  contextMenu: flag(
    "data-ok-context-menu",
    "A right click, Shift + F10 or the Menu key on a cell opens a menu: copy, paste, export, chart, pin.",
  ),
  filterGroups: flag(
    "data-ok-filter-groups",
    "The filter panel nests groups of filters, each with its own And / Or (Add group).",
  ),
  autoGenerate: flag(
    "data-ok-auto-generate",
    "Columns from the data when none are given: one per field, typed from the values (HTML: from `table[data-ok-data-grid-data]`).",
  ),
});

export interface DataGridAnatomyOptions {
  contextMenu?: boolean | undefined;
  filterGroups?: boolean | undefined;
  autoGenerate?: boolean | undefined;
  columnHeaderHeight?: number | undefined;
  columnGroupHeaderHeight?: number | undefined;
  headerFilterHeight?: number | undefined;
  showCellVerticalBorder?: boolean | undefined;
  showColumnVerticalBorder?: boolean | undefined;
  rowSpacingType?: "margin" | "border" | undefined;
  autoHeight?: boolean | undefined;
  autoPageSize?: boolean | undefined;
  rowSelection?: boolean | undefined;
  hideFooterPagination?: boolean | undefined;
  hideFooterRowCount?: boolean | undefined;
  hideFooterSelectedRowCount?: boolean | undefined;
  tabNavigation?: "none" | "content" | "header" | "all" | undefined;
  historyStackSize?: number | undefined;
  multipleColumnsSortingMode?: "withModifierKey" | "always" | undefined;
  statusBar?: boolean | undefined;
  disableRowGrouping?: boolean | undefined;
  rowGroupingColumnMode?: "single" | "multiple" | undefined;
  disableAggregation?: boolean | undefined;
  aggregationRowsScope?: "filtered" | "all" | undefined;
  disablePivoting?: boolean | undefined;
  pivotActive?: boolean | undefined;
  cellSelection?: boolean | undefined;
  disableClipboardPaste?: boolean | undefined;
  headerFilters?: boolean | undefined;
  chartsIntegration?: boolean | undefined;
  treeData?: boolean | undefined;
  defaultGroupingExpansionDepth?: number | undefined;
  rowReordering?: boolean | undefined;
  listView?: boolean | undefined;
  rowBufferPx?: number | undefined;
  columnBufferPx?: number | undefined;
  lazyLoading?: boolean | undefined;
  lazyLoadingRequestThrottleMs?: number | undefined;
  disableMultipleRowSelection?: boolean | undefined;
  keepNonExistentRowsSelected?: boolean | undefined;
  checkboxSelectionVisibleOnly?: boolean | undefined;
  autosizeOnMount?: boolean | undefined;
  rowSpanning?: boolean | undefined;
  rowHeight?: number | undefined;
  toolbarVariant?: "labeled" | "icon" | undefined;
  quickFilterLogicOperator?: "and" | "or" | undefined;
  quickFilterExcludeHiddenColumns?: boolean | undefined;
  ignoreDiacritics?: boolean | undefined;
  density?: GridDensity | undefined;
  checkboxSelection?: boolean | undefined;
  disableRowSelectionOnClick?: boolean | undefined;
  disableColumnMenu?: boolean | undefined;
  disableMultipleColumnsSorting?: boolean | undefined;
  disableMultipleColumnsFiltering?: boolean | undefined;
  disableColumnResize?: boolean | undefined;
  disableColumnReorder?: boolean | undefined;
  disableColumnPinning?: boolean | undefined;
  editMode?: "cell" | "row" | undefined;
  disableVirtualization?: boolean | undefined;
  sortingMode?: "client" | "server" | undefined;
  filterMode?: "client" | "server" | undefined;
  paginationMode?: "client" | "server" | undefined;
  rowCount?: number | undefined;
  estimatedRowCount?: number | undefined;
  cellSelectionFillHandle?: boolean | undefined;
  disableAutosize?: boolean | undefined;
  keepColumnPositionIfDraggedOutside?: boolean | undefined;
  pinnedColumnsSectionSeparator?: "border" | "shadow" | "border-and-shadow" | undefined;
  pinnedRowsSectionSeparator?: "border" | "border-and-shadow" | undefined;
  pivotPanelOpen?: boolean | undefined;
  virtualizeColumnsWithAutoRowHeight?: boolean | undefined;
  dataSourceKeepPreviousData?: boolean | undefined;
  dataSourceRevalidateMs?: number | undefined;
  filterDebounceMs?: number | undefined;
  columnFilterDebounceMs?: number | undefined;
  disableChildrenFiltering?: boolean | undefined;
  disableChildrenSorting?: boolean | undefined;
  loading?: boolean | undefined;
  loadingVariant?: "linear-progress" | "circular-progress" | "skeleton" | undefined;
  scrollEndThreshold?: number | undefined;
}

/** `data-ok-*` attributes of a data grid root. */
export const dataGridAttributes = (options: DataGridAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dataGridOptions, { ...options });

// --- Date pickers (ADR-0022) -------------------------------------------------------------------

export const pickerVariantValues = ["responsive", "desktop", "mobile", "static"] as const;
export const pickerOrientationValues = ["portrait", "landscape"] as const;
export const pickerFormatDensities = ["dense", "spacious"] as const;
export const pickerYearsOrders = ["asc", "desc"] as const;
export const pickerPerRow = ["3", "4"] as const;
export const pickerOpenToViews = ["year", "month", "day"] as const;
export const pickerValueTypes = ["date", "time", "date-time"] as const;

const valueTypeOption = style(
  "data-ok-value-type",
  pickerValueTypes,
  "date",
  "What the value holds (ADR-0026): `time` (TimeField, TimePicker family: ISO `HH:mm:ss`), `date-time` (DateTimeField, DateTimePicker family: ISO `YYYY-MM-DDTHH:mm:ss`); absent = a date. React: the component.",
  { optional: true },
);

/** Side of a field's clear or open button (MUI `clearButtonPosition`, `openPickerButtonPosition`). */
export const pickerButtonPositions = ["start", "end"] as const;
export type PickerButtonPosition = (typeof pickerButtonPositions)[number];

export const dateFieldOptions = defineOptions("date-field", "data-ok-date-field", {
  formatDensity: style(
    "data-ok-format-density",
    pickerFormatDensities,
    "dense",
    "`spacious` puts spaces around the separators (`05 / 25 / 2025`).",
  ),
  clearable: flag("data-ok-clearable", "A clear button at the end of the field."),
  clearButtonPosition: style(
    "data-ok-clear-button-position",
    pickerButtonPositions,
    "end",
    "Side of the clear button. HTML: put the button in the adornment on that side.",
    { optional: true },
  ),
  openPickerButtonPosition: style(
    "data-ok-open-picker-button-position",
    pickerButtonPositions,
    "end",
    "Pickers: side of the open button. HTML: put the button in the adornment on that side.",
    { optional: true },
  ),
  shouldRespectLeadingZeros: flag(
    "data-ok-should-respect-leading-zeros",
    "Digit sections keep the format's padding (`D` shows `5`); by default they show two digits (`05`).",
  ),
  readOnly: flag(
    "data-ok-read-only",
    "The value can't be changed (it can still be focused and copied).",
  ),
  valueType: valueTypeOption,
  range: flag(
    "data-ok-range",
    "Single input range field (ADR-0028): the start and the end in one field, the value an ISO 8601 interval `start/end`. React: the component (`SingleInputDateRangeField`, `SingleInputTimeRangeField`, `SingleInputDateTimeRangeField`).",
  ),
  value: state("data-ok-value", "Value as ISO 8601 (`value` / `defaultValue`).", "change"),
});

export interface DateFieldAnatomyOptions {
  formatDensity?: (typeof pickerFormatDensities)[number] | undefined;
  clearable?: boolean | undefined;
  clearButtonPosition?: PickerButtonPosition | undefined;
  openPickerButtonPosition?: PickerButtonPosition | undefined;
  shouldRespectLeadingZeros?: boolean | undefined;
  readOnly?: boolean | undefined;
  valueType?: (typeof pickerValueTypes)[number] | undefined;
  range?: boolean | undefined;
}

/** `data-ok-*` attributes of a date field (on the TextField root). */
export const dateFieldAttributes = (options: DateFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dateFieldOptions, { ...options });

export const dateCalendarOptions = defineOptions("date-calendar", "data-ok-date-calendar", {
  openTo: style(
    "data-ok-open-to",
    pickerOpenToViews,
    "day",
    "The view shown first (one of `views`).",
    {
      optional: true,
    },
  ),
  disablePast: flag("data-ok-disable-past", "Days before today can't be picked."),
  disableFuture: flag("data-ok-disable-future", "Days after today can't be picked."),
  displayWeekNumber: flag("data-ok-display-week-number", "A week number column."),
  fixedWeekNumber: number(
    "data-ok-fixed-week-number",
    undefined,
    "Always show this many weeks (6 keeps the height the same every month).",
    { min: 1 },
  ),
  showDaysOutsideCurrentMonth: flag(
    "data-ok-show-days-outside-current-month",
    "Days of the previous and next months fill the first and last weeks.",
  ),
  disableHighlightToday: flag("data-ok-disable-highlight-today", "No ring around today."),
  monthsPerRow: style(
    "data-ok-months-per-row",
    pickerPerRow,
    "3",
    "Months per row in the month view.",
  ),
  yearsPerRow: style("data-ok-years-per-row", pickerPerRow, "4", "Years per row in the year view."),
  yearsOrder: style("data-ok-years-order", pickerYearsOrders, "asc", "Order of the year view."),
  readOnly: flag("data-ok-read-only", "Days can be browsed but not picked."),
  loading: flag("data-ok-loading", "Shows the loading text instead of the days (data on its way)."),
  reduceAnimations: flag("data-ok-reduce-animations", "No month or view transitions."),
  value: state(
    "aria-selected",
    "Selected day (`value` / `defaultValue`; HTML `data-ok-value`).",
    "change",
  ),
});

export interface DateCalendarAnatomyOptions {
  openTo?: (typeof pickerOpenToViews)[number] | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  monthsPerRow?: 3 | 4 | (typeof pickerPerRow)[number] | undefined;
  yearsPerRow?: 3 | 4 | (typeof pickerPerRow)[number] | undefined;
  yearsOrder?: (typeof pickerYearsOrders)[number] | undefined;
  readOnly?: boolean | undefined;
  loading?: boolean | undefined;
  reduceAnimations?: boolean | undefined;
}

/** `data-ok-*` attributes of a date calendar root. */
export const dateCalendarAttributes = (options: DateCalendarAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dateCalendarOptions, {
    ...options,
    monthsPerRow: options.monthsPerRow === undefined ? undefined : String(options.monthsPerRow),
    yearsPerRow: options.yearsPerRow === undefined ? undefined : String(options.yearsPerRow),
  });

/** The form a static picker shows (MUI X `displayStaticWrapperAs`). */
export const pickerStaticWrapperValues = ["mobile", "desktop"] as const;
export type PickerStaticWrapper = (typeof pickerStaticWrapperValues)[number];

export const datePickerOptions = defineOptions("date-picker", "data-ok-date-picker", {
  pickerVariant: style(
    "data-ok-picker-variant",
    pickerVariantValues,
    "responsive",
    "`responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DatePicker`, `DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker`).",
  ),
  orientation: style(
    "data-ok-orientation",
    pickerOrientationValues,
    "portrait",
    "`landscape` puts the toolbar beside the calendar (mobile and static).",
  ),
  displayStaticWrapperAs: style(
    "data-ok-display-static-wrapper-as",
    pickerStaticWrapperValues,
    "mobile",
    "Static pickers: the form they show inline. `desktop`: no toolbar and no action bar by default, the desktop clocks (and two range calendars).",
    { optional: true },
  ),
  closeOnSelect: behavior(
    "data-ok-close-on-select",
    true,
    "Picking a day closes the picker. Default: on for desktop, off for mobile (absent attribute).",
  ),
  keepOpenDuringFieldFocus: flag(
    "data-ok-keep-open-during-field-focus",
    "Desktop: the popover stays open while the field has focus (typing doesn't close it).",
  ),
  valueType: valueTypeOption,
  open: state("data-ok-open", "Open state (`open` / `onOpenChange`).", "open"),
});

export interface DatePickerAnatomyOptions {
  pickerVariant?: (typeof pickerVariantValues)[number] | undefined;
  orientation?: (typeof pickerOrientationValues)[number] | undefined;
  displayStaticWrapperAs?: PickerStaticWrapper | undefined;
  keepOpenDuringFieldFocus?: boolean | undefined;
  valueType?: (typeof pickerValueTypes)[number] | undefined;
}

/** `data-ok-*` attributes of a date picker root. */
export const datePickerAttributes = (options: DatePickerAnatomyOptions = {}): DataAttributes =>
  optionAttributes(datePickerOptions, { ...options });

// Time views (ADR-0022 phase 2, ADR-0026). `data-ok-ampm` is always written by React (its
// default comes from the locale); HTML without it follows the locale too.
const ampmOption = behavior(
  "data-ok-ampm",
  true,
  "12-hour clock with AM / PM. Default: from the locale (en-US: on, vi-VN: off).",
);
const minutesStepOption = number("data-ok-minutes-step", 1, "Minutes must be a multiple of this.", {
  min: 1,
});
const timeRuleFlags = {
  disablePast: flag("data-ok-disable-past", "Times before now can't be picked."),
  disableFuture: flag("data-ok-disable-future", "Times after now can't be picked."),
  readOnly: flag("data-ok-read-only", "Times can be browsed but not picked."),
};

export const timeClockOptions = defineOptions("time-clock", "data-ok-time-clock", {
  ampm: ampmOption,
  ampmInClock: flag("data-ok-ampm-in-clock", "AM / PM buttons on the clock (12-hour clocks)."),
  showViewSwitcher: behavior(
    "data-ok-show-view-switcher",
    true,
    "Arrow buttons that switch between the views (MUI's default is off).",
  ),
  minutesStep: minutesStepOption,
  ...timeRuleFlags,
  value: state(
    "aria-selected",
    "Selected time (`value` / `defaultValue`; HTML `data-ok-value`).",
    "change",
  ),
});

export interface TimeClockAnatomyOptions {
  ampmInClock?: boolean | undefined;
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  readOnly?: boolean | undefined;
}

/** `data-ok-*` attributes of a time clock root (`data-ok-ampm` is written by the component). */
export const timeClockAttributes = (options: TimeClockAnatomyOptions = {}): DataAttributes =>
  optionAttributes(timeClockOptions, { ...options });

export const digitalClockOptions = defineOptions("digital-clock", "data-ok-digital-clock", {
  ampm: ampmOption,
  timeStep: number("data-ok-time-step", 30, "Minutes between two options.", { min: 1 }),
  skipDisabled: flag("data-ok-skip-disabled", "Options that can't be picked are left out."),
  minutesStep: minutesStepOption,
  ...timeRuleFlags,
  value: state(
    "aria-selected",
    "Selected time (`value` / `defaultValue`; HTML `data-ok-value`).",
    "change",
  ),
});

export interface DigitalClockAnatomyOptions {
  timeStep?: number | undefined;
  skipDisabled?: boolean | undefined;
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  readOnly?: boolean | undefined;
}

/** `data-ok-*` attributes of a digital clock root. */
export const digitalClockAttributes = (options: DigitalClockAnatomyOptions = {}): DataAttributes =>
  optionAttributes(digitalClockOptions, { ...options });

export const multiSectionDigitalClockOptions = defineOptions(
  "multi-section-digital-clock",
  "data-ok-multi-section-digital-clock",
  {
    ampm: ampmOption,
    skipDisabled: flag("data-ok-skip-disabled", "Options that can't be picked are left out."),
    minutesStep: minutesStepOption,
    ...timeRuleFlags,
    value: state(
      "aria-selected",
      "Selected time (`value` / `defaultValue`; HTML `data-ok-value`).",
      "change",
    ),
  },
);

export interface MultiSectionDigitalClockAnatomyOptions {
  skipDisabled?: boolean | undefined;
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  readOnly?: boolean | undefined;
}

/** `data-ok-*` attributes of a multi-section digital clock root. */
export const multiSectionDigitalClockAttributes = (
  options: MultiSectionDigitalClockAnatomyOptions = {},
): DataAttributes => optionAttributes(multiSectionDigitalClockOptions, { ...options });

// Range pickers (ADR-0022 phase 3, ADR-0028).
export const pickerCalendarCounts = ["1", "2", "3"] as const;

export const dateRangeCalendarOptions = defineOptions(
  "date-range-calendar",
  "data-ok-date-range-calendar",
  {
    calendars: style(
      "data-ok-calendars",
      pickerCalendarCounts,
      "2",
      "Months shown side by side (range pickers: 2 in the popover, 1 in the dialog and inline).",
    ),
    currentMonthCalendarPosition: style(
      "data-ok-current-month-calendar-position",
      pickerCalendarCounts,
      "1",
      "The calendar that shows the value's month (or this month) first.",
    ),
    disableDragEditing: flag(
      "data-ok-disable-drag-editing",
      "The range's start and end can't be dragged to other days.",
    ),
    disableAutoMonthSwitching: flag(
      "data-ok-disable-auto-month-switching",
      "Picking the start doesn't show the end's month.",
    ),
    disablePast: flag("data-ok-disable-past", "Days before today can't be picked."),
    disableFuture: flag("data-ok-disable-future", "Days after today can't be picked."),
    displayWeekNumber: flag("data-ok-display-week-number", "A week number column."),
    fixedWeekNumber: number(
      "data-ok-fixed-week-number",
      undefined,
      "Always show this many weeks (6 keeps the height the same every month).",
      { min: 1 },
    ),
    showDaysOutsideCurrentMonth: flag(
      "data-ok-show-days-outside-current-month",
      "Days of the previous and next months fill the first and last weeks (one calendar only).",
    ),
    disableHighlightToday: flag("data-ok-disable-highlight-today", "No ring around today."),
    readOnly: flag("data-ok-read-only", "Days can be browsed but not picked."),
    loading: flag("data-ok-loading", "Shows the loading text instead of the days."),
    reduceAnimations: flag("data-ok-reduce-animations", "No month transitions."),
    rangePosition: state(
      "data-ok-range-position",
      "The end the next pick edits, `start` or `end` (`rangePosition` / `onRangePositionChange`).",
      "rangepositionchange",
    ),
    value: state(
      "data-ok-value",
      "Selected range as an ISO 8601 interval `start/end` (`value` / `defaultValue`).",
      "change",
    ),
  },
);

export interface DateRangeCalendarAnatomyOptions {
  calendars?: 1 | 2 | 3 | (typeof pickerCalendarCounts)[number] | undefined;
  currentMonthCalendarPosition?: 1 | 2 | 3 | (typeof pickerCalendarCounts)[number] | undefined;
  disableDragEditing?: boolean | undefined;
  disableAutoMonthSwitching?: boolean | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  readOnly?: boolean | undefined;
  loading?: boolean | undefined;
  reduceAnimations?: boolean | undefined;
}

/** `data-ok-*` attributes of a date range calendar root. */
export const dateRangeCalendarAttributes = (
  options: DateRangeCalendarAnatomyOptions = {},
): DataAttributes =>
  optionAttributes(dateRangeCalendarOptions, {
    ...options,
    calendars: options.calendars === undefined ? undefined : String(options.calendars),
    currentMonthCalendarPosition:
      options.currentMonthCalendarPosition === undefined
        ? undefined
        : String(options.currentMonthCalendarPosition),
  });

export const dateRangePickerOptions = defineOptions(
  "date-range-picker",
  "data-ok-date-range-picker",
  {
    pickerVariant: style(
      "data-ok-picker-variant",
      pickerVariantValues,
      "responsive",
      "`responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DateRangePicker`, `DesktopDateRangePicker`, `MobileDateRangePicker`, `StaticDateRangePicker`, and the time and date time range families).",
    ),
    calendars: style(
      "data-ok-calendars",
      pickerCalendarCounts,
      "2",
      "Months shown in the desktop popover (the dialog and inline forms show one).",
      { optional: true },
    ),
    displayStaticWrapperAs: style(
      "data-ok-display-static-wrapper-as",
      pickerStaticWrapperValues,
      "mobile",
      "Static pickers: the form they show inline. `desktop`: no toolbar and no action bar by default, the desktop clocks (and two range calendars).",
      { optional: true },
    ),

    closeOnSelect: behavior(
      "data-ok-close-on-select",
      true,
      "Picking the end closes the picker. Default: on for desktop date ranges, off otherwise (absent attribute).",
    ),
    disableDragEditing: flag(
      "data-ok-disable-drag-editing",
      "The range's start and end can't be dragged to other days.",
    ),
    valueType: valueTypeOption,
    open: state("data-ok-open", "Open state (`open` / `onOpenChange`).", "open"),
  },
);

export interface DateRangePickerAnatomyOptions {
  pickerVariant?: (typeof pickerVariantValues)[number] | undefined;
  displayStaticWrapperAs?: PickerStaticWrapper | undefined;
  calendars?: 1 | 2 | 3 | (typeof pickerCalendarCounts)[number] | undefined;
  disableDragEditing?: boolean | undefined;
  valueType?: (typeof pickerValueTypes)[number] | undefined;
}

/** `data-ok-*` attributes of a date range picker root. */
export const dateRangePickerAttributes = (
  options: DateRangePickerAnatomyOptions = {},
): DataAttributes =>
  optionAttributes(dateRangePickerOptions, {
    ...options,
    calendars: options.calendars === undefined ? undefined : String(options.calendars),
  });

/** Every component's option schema, for tooling (Storybook Controls, parity tests, docs). */
// --- Editor (ADR-0023) --------------------------------------------------------------------------

/** Where `autofocus` puts the caret (HTML `data-ok-autofocus`). */
export const editorFocusPositions = ["start", "end", "all"] as const;
export type EditorFocusPosition = (typeof editorFocusPositions)[number];
/** Text directions of the content (`textDirection`). */
export const editorTextDirections = ["ltr", "rtl", "auto"] as const;

export const editorOptions = defineOptions("editor", "data-ok-editor", {
  fullItem: flag(
    "data-ok-full-item",
    "Every toolbar group: adds code, code block, blockquote, horizontal rule, undo and redo.",
  ),
  error: flag(
    "data-ok-error",
    "Error state: red border and helper text, `aria-invalid` on the textbox.",
  ),
  editable: behavior(
    "data-ok-editable",
    true,
    "The content can be changed (`false`: read only, toolbar disabled).",
  ),
  tables: flag(
    "data-ok-tables",
    "Tables: the table nodes and the toolbar's table menu (insert, rows, columns, headers, merge, split, delete).",
  ),
  autofocus: style(
    "data-ok-autofocus",
    editorFocusPositions,
    "start",
    "Puts the caret in the editor once it is ready: at the `start`, the `end`, or selects `all`. React also takes `true` or a position.",
    { optional: true },
  ),
  textDirection: style(
    "data-ok-text-direction",
    editorTextDirections,
    "ltr",
    "Text direction of the content: `ltr`, `rtl` or `auto`. Default: inherited.",
    { optional: true },
  ),
  enableInputRules: behavior(
    "data-ok-enable-input-rules",
    true,
    "Markdown-like shortcuts while typing, such as `# ` for a heading (`false`: off).",
  ),
  enablePasteRules: behavior(
    "data-ok-enable-paste-rules",
    true,
    "The same shortcuts on pasted text (`false`: off).",
  ),
  enableContentCheck: flag(
    "data-ok-enable-content-check",
    "Checks content against what the editor supports: invalid content fires a content error event (initial content loads without the invalid parts; a new value is refused).",
  ),
  emitContentError: flag(
    "data-ok-emit-content-error",
    "Fires the content error event for invalid inserted content even without the check (the content is kept).",
  ),
  name: native(
    "name",
    "Form field name: a hidden input holds the HTML value, so the editor submits with its form.",
    { children: ":scope > input[data-ok-editor-input]" },
  ),
  fullscreen: state(
    "data-ok-fullscreen",
    "Fills the viewport (the toolbar's Fullscreen button, Escape leaves).",
    "fullscreen",
  ),
  value: state(
    "data-ok-editor-content",
    "The content: markup inside the content element.",
    "change",
  ),
});

export type EditorAnatomyOptions = {
  fullItem?: boolean | undefined;
  error?: boolean | undefined;
  tables?: boolean | undefined;
  autofocus?: EditorFocusPosition | undefined;
  textDirection?: (typeof editorTextDirections)[number] | undefined;
  enableContentCheck?: boolean | undefined;
  emitContentError?: boolean | undefined;
};

/** `data-ok-*` attributes of an editor root. */
export const editorAttributes = (options: EditorAnatomyOptions = {}): DataAttributes =>
  optionAttributes(editorOptions, { ...options });

// --- Markdown (ADR-0035) ------------------------------------------------------------------------

export const markdownImageModes = ["native", "image"] as const;
export type MarkdownImageMode = (typeof markdownImageModes)[number];

export const markdownOptions = defineOptions("markdown", "data-ok-markdown", {
  gfm: behavior(
    "data-ok-gfm",
    true,
    "GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks and footnotes (`false`: CommonMark only).",
  ),
  rawHtml: flag(
    "data-ok-raw-html",
    "HTML in the Markdown is rendered, limited to an allow list (sanitized). Off: it shows as text.",
  ),
  skipHtml: flag("data-ok-skip-html", "HTML in the Markdown is dropped."),
  unwrapDisallowed: flag(
    "data-ok-unwrap-disallowed",
    "Elements removed by the element filters leave their children in place.",
  ),
  externalLinks: flag(
    "data-ok-external-links",
    'Absolute `http(s)` links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).',
  ),
  images: style(
    "data-ok-images",
    markdownImageModes,
    "native",
    "`image`: pictures render as Image components (lazy, placeholder, effect). `native`: plain `img`.",
    { optional: true },
  ),
  imageRatio: style(
    "data-ok-images-ratio",
    imageRatios,
    "16/9",
    "With `images` `image`: the aspect ratio the pictures are cropped to (default: their own).",
    { optional: true },
  ),
  value: state(
    "data-ok-markdown-source",
    "The Markdown: React `children`; HTML the text of the source element.",
    "render",
  ),
});

export type MarkdownAnatomyOptions = {
  images?: MarkdownImageMode | undefined;
  imageRatio?: ImageRatio | undefined;
  rawHtml?: boolean | undefined;
  skipHtml?: boolean | undefined;
  unwrapDisallowed?: boolean | undefined;
  externalLinks?: boolean | undefined;
};

/** `data-ok-*` attributes of a Markdown root (`data-ok-gfm="false"` is written by the owner). */
export const markdownAttributes = (options: MarkdownAnatomyOptions = {}): DataAttributes =>
  optionAttributes(markdownOptions, { ...options });

// --- Code editor (ADR-0034) ---------------------------------------------------------------------

/** Monaco's built-in language ids (more can be registered in `beforeMount`). */
export const codeEditorLanguages = [
  "plaintext",
  "abap",
  "aes",
  "apex",
  "azcli",
  "bat",
  "bicep",
  "c",
  "cameligo",
  "clojure",
  "coffeescript",
  "cpp",
  "csharp",
  "csp",
  "css",
  "cypher",
  "dart",
  "dockerfile",
  "ecl",
  "elixir",
  "flow9",
  "freemarker2",
  "fsharp",
  "go",
  "graphql",
  "handlebars",
  "hcl",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "less",
  "lexon",
  "liquid",
  "lua",
  "m3",
  "markdown",
  "mdx",
  "mips",
  "msdax",
  "mysql",
  "objective-c",
  "pascal",
  "pascaligo",
  "perl",
  "pgsql",
  "php",
  "pla",
  "postiats",
  "powerquery",
  "powershell",
  "proto",
  "pug",
  "python",
  "qsharp",
  "r",
  "razor",
  "redis",
  "redshift",
  "restructuredtext",
  "ruby",
  "rust",
  "sb",
  "scala",
  "scheme",
  "scss",
  "shell",
  "sol",
  "sparql",
  "sql",
  "st",
  "swift",
  "systemverilog",
  "tcl",
  "twig",
  "typescript",
  "typespec",
  "vb",
  "verilog",
  "wgsl",
  "xml",
  "yaml",
] as const;
export type CodeEditorLanguage = (typeof codeEditorLanguages)[number];

/** Theme names: Owlky's (`auto` follows `data-ok-theme`) and Monaco's built-in ones. */
export const codeEditorThemes = [
  "auto",
  "owlky-light",
  "owlky-dark",
  "light",
  "vs",
  "vs-dark",
  "hc-black",
  "hc-light",
] as const;
export type CodeEditorThemeName = (typeof codeEditorThemes)[number];

// Both editors repeat theme, width and height inline: a shared object (or a spread of one)
// would keep these schemas in bundles that never use them.
const CODE_EDITOR_UNITS = ["px", "%", "rem", "em", "vh", "vw", "svh", "dvh", "lvh", "ch"] as const;

export const codeEditorOptions = defineOptions("code-editor", "data-ok-code-editor", {
  language: style(
    "data-ok-language",
    codeEditorLanguages,
    "plaintext",
    "Language of the current model (HTML: also the initial one). Without it, Monaco infers it from the path.",
    { optional: true },
  ),
  theme: style(
    "data-ok-monaco-theme",
    codeEditorThemes,
    "auto",
    "Monaco theme. `auto`: Owlky's light or dark theme after the scope's `data-ok-theme`; others are Monaco's (or one defined in `beforeMount`).",
    { optional: true },
  ),
  width: number(
    "data-ok-width",
    undefined,
    "Width (number = px, or a CSS length such as `50%`). Default `100%`.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  height: number(
    "data-ok-height",
    undefined,
    "Height (number = px, or a CSS length such as `90vh`). Default `100%`, at least 300px when not given.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  line: number("data-ok-line", undefined, "Scrolls to this line (1-based).", { min: 1 }),
  saveViewState: behavior(
    "data-ok-save-view-state",
    true,
    "Keeps each model's scroll, selection and folding when the path changes.",
  ),
  keepCurrentModel: flag(
    "data-ok-keep-current-model",
    "Keeps the current model (and its view state) when the editor is removed.",
  ),
  path: state(
    "data-ok-path",
    "Model path (`file:///index.ts`): each path is its own model, created on first use.",
  ),
  value: state(
    "data-ok-code-editor-value",
    "The value: the `<textarea>`'s text (the initial value, the form value and the fallback).",
    "change",
  ),
});

export type CodeEditorAnatomyOptions = {
  language?: string | undefined;
  theme?: string | undefined;
  width?: number | string | undefined;
  height?: number | string | undefined;
  line?: number | undefined;
  keepCurrentModel?: boolean | undefined;
};

/** `data-ok-*` attributes of a code editor root (known languages and themes only). */
export const codeEditorAttributes = (options: CodeEditorAnatomyOptions = {}): DataAttributes =>
  optionAttributes(codeEditorOptions, { ...options });

export const diffEditorOptions = defineOptions("diff-editor", "data-ok-diff-editor", {
  language: style(
    "data-ok-language",
    codeEditorLanguages,
    "plaintext",
    "Language of both models.",
    { optional: true },
  ),
  originalLanguage: style(
    "data-ok-original-language",
    codeEditorLanguages,
    "plaintext",
    "Language of the original model (default `language`).",
    { optional: true },
  ),
  modifiedLanguage: style(
    "data-ok-modified-language",
    codeEditorLanguages,
    "plaintext",
    "Language of the modified model (default `language`).",
    { optional: true },
  ),
  theme: style(
    "data-ok-monaco-theme",
    codeEditorThemes,
    "auto",
    "Monaco theme. `auto`: Owlky's light or dark theme after the scope's `data-ok-theme`; others are Monaco's (or one defined in `beforeMount`).",
    { optional: true },
  ),
  width: number(
    "data-ok-width",
    undefined,
    "Width (number = px, or a CSS length such as `50%`). Default `100%`.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  height: number(
    "data-ok-height",
    undefined,
    "Height (number = px, or a CSS length such as `90vh`). Default `100%`, at least 300px when not given.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  line: number(
    "data-ok-line",
    undefined,
    "Scrolls both sides to this line of the modified text (1-based).",
    { min: 1 },
  ),
  keepCurrentOriginalModel: flag(
    "data-ok-keep-current-original-model",
    "Keeps the original model when the editor is removed.",
  ),
  keepCurrentModifiedModel: flag(
    "data-ok-keep-current-modified-model",
    "Keeps the modified model when the editor is removed.",
  ),
  originalModelPath: state("data-ok-original-model-path", "Path of the original model."),
  modifiedModelPath: state("data-ok-modified-model-path", "Path of the modified model."),
  original: state("data-ok-diff-editor-original", "The original text: its `<textarea>`."),
  modified: state("data-ok-diff-editor-modified", "The modified text: its `<textarea>`."),
});

export type DiffEditorAnatomyOptions = {
  language?: string | undefined;
  originalLanguage?: string | undefined;
  modifiedLanguage?: string | undefined;
  theme?: string | undefined;
  width?: number | string | undefined;
  height?: number | string | undefined;
  line?: number | undefined;
  keepCurrentOriginalModel?: boolean | undefined;
  keepCurrentModifiedModel?: boolean | undefined;
};

/** `data-ok-*` attributes of a diff editor root. */
export const diffEditorAttributes = (options: DiffEditorAnatomyOptions = {}): DataAttributes =>
  optionAttributes(diffEditorOptions, { ...options });

// --- Chart (ADR-0024) ---------------------------------------------------------------------------

export const chartOptions = defineOptions("chart", "data-ok-chart", {
  type: style(
    "data-ok-type",
    chartTypes,
    "line",
    "Chart type: `line`, `area`, `bar` (columns; rows with `horizontal`), `scatter`, `pie`, `donut`, `radialBar`, `radar`, `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`, `funnel`, `slope`, `candlestick`, `rangeBar`, `timeline`, `polarArea`, `sankey` (links between nodes: `nodes` and `edges` in React, one table row per link in HTML), `waterfall` (each value a step from the running total; `isTotal` / `isSubtotal` points show the total), `dumbbell` (a start and an end value per category: two markers joined by a line), `tree` (a hierarchy: `hierarchy` in React, one table row per node with its parent in HTML), `sunburst` (the same hierarchy as rings, each node an arc sized by its value), `icicle` (the same hierarchy as bands, each node a cell sized by its value), `streamgraph` (stacked bands around a moving baseline, with a total per x value), `violin` (the distribution of observations per category as a mirrored density curve), `beeswarm` (each observation a dot in its series' lane, along the value axis), `waffle` (a grid of cells, each category filling a share), `unit` (each value as a number of marks, in blobs, columns or an arc) or `geo` (regions of GeoJSON geometry or hex tiles, colored by value classes, no map tiles: `geometry` and `regions` in React, a table of regions and `data-ok-geometry` or `setGeometry()` in HTML). Series may override it in line, area, bar, scatter, box plot, bubble, range area and candlestick charts (mixed charts).",
  ),
  xType: style(
    "data-ok-x-type",
    chartXTypes,
    "category",
    "X axis: `category` labels, `datetime` (ISO 8601 dates) or `numeric` values (scatter).",
  ),
  curve: style(
    "data-ok-curve",
    chartCurves,
    "smooth",
    "Line shape: `smooth`, `straight` or `stepline`.",
  ),
  legend: style(
    "data-ok-legend",
    chartLegends,
    "top",
    "Legend position: `top`, `right`, `bottom` or `none` (never shown for a single series).",
  ),
  fill: style(
    "data-ok-fill",
    chartFills,
    "gradient",
    "Area fill: a fading `gradient`, a `solid` tint or a `pattern` (bars, areas and slices too; a different pattern per series unless `fillPattern` is set).",
  ),
  stacked: flag("data-ok-stacked", "Stacks the series on each other (bars, lines, areas)."),
  horizontal: flag("data-ok-horizontal", "Bars run left to right, categories down the side."),
  height: number("data-ok-height", 320, "Height of the plot in px (at least 40, sparklines 8).", {
    min: 8,
  }),
  markerSize: number(
    "data-ok-marker-size",
    undefined,
    "Marker radius of line and area points in px (default none; scatter points 5).",
    { min: 0 },
  ),
  columnWidth: number("data-ok-column-width", 40, "Column width in % of a category.", { min: 1 }),
  barHeight: number(
    "data-ok-bar-height",
    undefined,
    "Horizontal bar thickness in % of a category (default 40; funnels 80).",
    { min: 1 },
  ),
  yMin: number(
    "data-ok-y-min",
    undefined,
    "Lowest value on the value axis (default from the data).",
  ),
  yMax: number(
    "data-ok-y-max",
    undefined,
    "Highest value on the value axis (default from the data); radial bars: the value of a full ring (default 100).",
  ),
  dataLabels: flag(
    "data-ok-data-labels",
    "Prints the values on the chart: percentages on pie and donut slices, values in bars and above points.",
  ),
  startAngle: number(
    "data-ok-start-angle",
    0,
    "Pie, donut and radial bar: where the slices or rings start, in degrees clockwise from 12 o'clock.",
  ),
  endAngle: number(
    "data-ok-end-angle",
    360,
    "Pie, donut and radial bar: where they end (at most one turn after `startAngle`).",
  ),
  dashArray: number(
    "data-ok-dash-array",
    undefined,
    "Dash length of lines and radial bars in px (default solid).",
    { min: 0 },
  ),
  trackWidth: number("data-ok-track-width", 50, "Radial bar track thickness in % of the bar.", {
    min: 0,
  }),
  total: number(
    "data-ok-total",
    undefined,
    "Donut and radial bar center: the total shown under `totalLabel` (default the sum; radial bars the average). Waffle charts: the cells shared out between the categories (`100` for a percentage waffle; default one cell per unit); split waffles: the cells of each tile (default 100).",
  ),
  sparkline: flag(
    "data-ok-sparkline",
    "No axes, grid or legend: the chart fills its container (cards, table cells). Its height is the container's, at least `height` (default 40px).",
  ),
  boxUpperColor: style(
    "data-ok-box-upper-color",
    chartColors,
    "primary",
    "Box plots: color of the box above the median (default the series color).",
    { optional: true },
  ),
  boxLowerColor: style(
    "data-ok-box-lower-color",
    chartColors,
    "primary",
    "Box plots: color of the box below the median (default a lighter tone of the series color).",
    { optional: true },
  ),
  candleUpColor: style(
    "data-ok-candle-up-color",
    chartColors,
    "success",
    "Candlesticks: color of rising candles (default `success`).",
    { optional: true },
  ),
  candleDownColor: style(
    "data-ok-candle-down-color",
    chartColors,
    "error",
    "Candlesticks: color of falling candles (default `error`).",
    { optional: true },
  ),
  donutSize: number(
    "data-ok-donut-size",
    undefined,
    "Donut hole in % of the radius (10 to 95; default 72).",
    {
      min: 10,
    },
  ),
  dataLabelBackground: flag(
    "data-ok-data-label-background",
    "Data labels above points sit on a badge (a paper box with a border).",
  ),
  legendValues: flag(
    "data-ok-legend-values",
    "Legend items show a value: the slice's or ring's, or the series' last one.",
  ),
  zoom: flag(
    "data-ok-zoom",
    "Zoom and pan the x axis: drag to select (mouse), pinch or drag (touch), Ctrl + wheel, keys `+` `-` `0` and Shift + arrows.",
  ),
  toolbar: flag(
    "data-ok-toolbar",
    "A toolbar with zoom buttons (with `zoom`) and downloads (SVG, PNG, CSV).",
  ),
  animations: flag(
    "data-ok-animations",
    "Series grow in when first drawn and move to new values on updates (never with reduced motion).",
  ),
  orientation: style(
    "data-ok-orientation",
    chartOrientations,
    "horizontal",
    "Sankey charts: the flow runs left to right (`horizontal`, the default) or top to bottom (`vertical`). Beeswarm charts: the value axis runs left to right (`horizontal`, the default) or upward (`vertical`).",
    { optional: true },
  ),
  nodeWidth: number(
    "data-ok-node-width",
    20,
    "Sankey charts: node thickness along the flow in px.",
    {
      min: 1,
    },
  ),
  whitespace: number(
    "data-ok-whitespace",
    0.18,
    "Sankey charts: share of the fullest rank left between its nodes (0 to 0.9).",
    { min: 0 },
  ),
  edgeOpacity: number("data-ok-edge-opacity", 0.4, "Sankey charts: link opacity (0 to 1).", {
    min: 0,
  }),
  navigator: flag(
    "data-ok-navigator",
    "Stock charts: a navigator under the chart, the whole price line with the zoom as a brush (zooms like `zoom`).",
  ),
  paneHeight: number(
    "data-ok-pane-height",
    120,
    "Stock charts: height in px of each indicator pane (volume, RSI, MACD…) under the price.",
    { min: 60 },
  ),
  allowMultipleDataPointsSelection: flag(
    "data-ok-allow-multiple-data-points-selection",
    "Clicks and Enter or Space add points to the selection instead of replacing it.",
  ),
  stackType: style(
    "data-ok-stack-type",
    chartStackTypes,
    "normal",
    "Stacked charts: `normal` stacks the values, `100%` stacks each category's values as shares of their total (the value axis runs to 100%).",
    { optional: true },
  ),
  stackOnlyBar: flag(
    "data-ok-stack-only-bar",
    "Stacked mixed charts: only the bar series stack; lines and areas keep their own values.",
  ),
  stackTotals: flag(
    "data-ok-stack-totals",
    "Stacked bars: prints the total of each stack past its end.",
  ),
  dataLabelPosition: style(
    "data-ok-data-label-position",
    chartDataLabelPositions,
    "center",
    "Bars: where data labels sit inside the bar: `center`, `top` (by the value end) or `bottom` (by the base).",
    { optional: true },
  ),
  backgroundBars: flag(
    "data-ok-background-bars",
    "Bars: a grey track the height of the plot behind each bar.",
  ),
  backgroundBarOpacity: number(
    "data-ok-background-bar-opacity",
    undefined,
    "Bars: opacity of the tracks behind the bars (0 to 1; default 1).",
    { min: 0 },
  ),
  backgroundBarRadius: number(
    "data-ok-background-bar-radius",
    undefined,
    "Bars: corner radius of the tracks in px (default 4).",
    { min: 0 },
  ),
  markerShape: style(
    "data-ok-marker-shape",
    chartMarkerShapes,
    "circle",
    "Shape of the markers of every series: `circle`, `square`, `triangle`, `diamond`, `cross`, `plus` or `star` (series may set their own).",
    { optional: true },
  ),
  fillPattern: style(
    "data-ok-fill-pattern",
    chartPatterns,
    "slantedLines",
    "Pattern of every bar, area and slice: `slantedLines`, `squares`, `circles`, `horizontalLines` or `verticalLines` (turns patterns on; series may set their own).",
    { optional: true },
  ),
  strokeWidth: number(
    "data-ok-stroke-width",
    undefined,
    "Line width of every series in px (default 2.5; series may set their own).",
    { min: 0 },
  ),
  colorBlindMode: flag(
    "data-ok-color-blind-mode",
    "Series differ by more than their color: a different marker shape (lines get markers), pattern and dash per series.",
  ),
  tooltip: style(
    "data-ok-tooltip-mode",
    chartTooltipModes,
    "shared",
    "Tooltip: `shared` lists every series of the category, `point` only the value under the pointer (or the keyboard), `none` shows none (the values are still announced).",
    { optional: true },
  ),
  tooltipFixed: style(
    "data-ok-tooltip-fixed",
    chartTooltipCorners,
    "topRight",
    "The tooltip stays in a corner of the plot: `topLeft`, `topRight`, `bottomLeft` or `bottomRight` (default beside the value).",
    { optional: true },
  ),
  legendAlign: style(
    "data-ok-legend-align",
    chartLegendAligns,
    "right",
    "Legend items line up `left`, `center` or `right` (default right above the plot, centered below it and around circular charts).",
    { optional: true },
  ),
  showForSingleSeries: flag(
    "data-ok-show-for-single-series",
    "Shows the legend for a single series too.",
  ),
  disableLegendToggle: flag(
    "data-ok-disable-legend-toggle",
    "Legend items are plain labels: clicks don't hide series.",
  ),
  grid: style(
    "data-ok-grid",
    chartGrids,
    "y",
    "Grid lines: `y` horizontal (along the value ticks, or between the bars of horizontal bar charts), `x` vertical, `both` or `none`.",
    { optional: true },
  ),
  gridRowOpacity: number(
    "data-ok-grid-row-opacity",
    undefined,
    "Opacity of the row stripes (0 to 1; default 0.5).",
    { min: 0 },
  ),
  gridColumnOpacity: number(
    "data-ok-grid-column-opacity",
    undefined,
    "Opacity of the column stripes (0 to 1; default 0.5).",
    { min: 0 },
  ),
  waterfallPositiveColor: style(
    "data-ok-waterfall-positive-color",
    chartColors,
    "success",
    "Waterfall charts: color of the steps that raise the total (default `success`).",
    { optional: true },
  ),
  waterfallNegativeColor: style(
    "data-ok-waterfall-negative-color",
    chartColors,
    "error",
    "Waterfall charts: color of the steps that lower the total (default `error`).",
    { optional: true },
  ),
  waterfallTotalColor: style(
    "data-ok-waterfall-total-color",
    chartColors,
    "primary",
    "Waterfall charts: color of the total bars (default the series color).",
    { optional: true },
  ),
  waterfallSubtotalColor: style(
    "data-ok-waterfall-subtotal-color",
    chartColors,
    "primary",
    "Waterfall charts: color of the subtotal bars (default the total color).",
    { optional: true },
  ),
  hideConnectors: flag(
    "data-ok-hide-connectors",
    "Waterfall charts: no dashed lines from the end of each bar to the next one.",
  ),
  streamOffset: style(
    "data-ok-stream-offset",
    chartStreamOffsets,
    "wiggle",
    "Streamgraphs: the baseline: `wiggle` (bands as flat as the data allows, the default), `silhouette` (centered on one line), `zero` (a stacked area) or `expand` (each x value fills the chart).",
    { optional: true },
  ),
  streamOrder: style(
    "data-ok-stream-order",
    chartStreamOrders,
    "inside-out",
    "Streamgraphs: the stacking order: `inside-out` (series that peak first in the middle, the default), `inverse` or `none` (the series order).",
    { optional: true },
  ),
  hideStreamLabels: flag(
    "data-ok-hide-stream-labels",
    "Streamgraphs: no series names on the bands.",
  ),
  streamLabelMinWidth: number(
    "data-ok-stream-label-min-width",
    undefined,
    "Streamgraphs: bands thinner than this many pixels get no name (default 24).",
    { min: 0 },
  ),
  unitLayout: style(
    "data-ok-unit-layout",
    chartUnitLayouts,
    "grouped",
    "Unit charts: where the marks go: `grouped` (a blob per category, the default), `packed` (one blob), `columns` (stacked dots), `grid` (the waffle lattice) or `arc` (rows of seats).",
    { optional: true },
  ),
  clusterLabels: flag(
    "data-ok-cluster-labels",
    "Unit charts: category names under each cluster or column (grouped and columns layouts).",
  ),
  disableSortByGroup: flag(
    "data-ok-disable-sort-by-group",
    "Packed unit charts: keep the given order instead of the smallest group in the middle.",
  ),
  arcRows: number(
    "data-ok-arc-rows",
    undefined,
    "Arc unit charts: the concentric rows (default the fewest that seat everyone). Use `innerSize` for the inner radius (default 40) and `startAngle` / `endAngle` for the sweep (default -90 to 90).",
    { min: 1 },
  ),
  columns: number("data-ok-columns", undefined, "Waffle charts: cells per row (default 10).", {
    min: 1,
  }),
  fillFrom: style(
    "data-ok-fill-from",
    chartFillFroms,
    "bottom",
    "Waffle charts: the row where the cells start filling: `bottom` (the default) or `top`.",
    { optional: true },
  ),
  split: flag("data-ok-split", "Waffle charts: one mini waffle per category, filled to its value."),
  tileColumns: number(
    "data-ok-tile-columns",
    undefined,
    "Split waffles: tiles per row (default about a square of tiles).",
    { min: 1 },
  ),
  splitMax: number(
    "data-ok-split-max",
    undefined,
    "Split waffles: the value a full tile stands for (default the largest value).",
    { min: 0 },
  ),
  trackColor: style(
    "data-ok-track-color",
    chartColors,
    "primary",
    "Split waffles: the color of the empty cells (default a neutral grey).",
    { optional: true },
  ),
  unitValue: number(
    "data-ok-unit-value",
    undefined,
    "Waffle and unit charts: how many units of value one mark stands for (default 1).",
    { min: 0 },
  ),
  maxUnits: number(
    "data-ok-max-units",
    undefined,
    "Waffle and unit charts: the most marks drawn; counts scale down above it (default 5000).",
    { min: 1 },
  ),
  cellRadius: number(
    "data-ok-cell-radius",
    undefined,
    "Waffle charts: the corner radius of square cells in pixels (default 2).",
    { min: 0 },
  ),
  beeswarmSpread: style(
    "data-ok-beeswarm-spread",
    chartBeeswarmSpreads,
    "swarm",
    "Beeswarm charts: dots push apart just enough not to overlap (`swarm`, the default) or spread across the lane by a fixed sequence (`jitter`).",
    { optional: true },
  ),
  violinNormalize: style(
    "data-ok-violin-normalize",
    chartViolinNormalize,
    "individual",
    "Violins: each violin fills its slot (`individual`, the default) or all share one density scale (`group`).",
    { optional: true },
  ),
  violinSide: style(
    "data-ok-violin-side",
    chartViolinSides,
    "both",
    "Violins: symmetric (`both`, the default) or half a violin: `left`, `right`, `top` or `bottom`.",
    { optional: true },
  ),
  bandwidthScale: number(
    "data-ok-bandwidth-scale",
    undefined,
    "Violins: multiplies the drawn half-width (default 1). This is not the statistical bandwidth (`kdeBandwidth`).",
    { min: 0 },
  ),
  kdeBandwidth: number(
    "data-ok-kde-bandwidth",
    undefined,
    "Violins: the kernel width of the density estimate, in value units (default Silverman's rule of thumb).",
    { min: 0 },
  ),
  kdeResolution: number(
    "data-ok-kde-resolution",
    undefined,
    "Violins: how many density samples each violin uses (4 to 256; default 64).",
    { min: 4 },
  ),
  violinBox: flag("data-ok-violin-box", "Violins: a five-number box beside the density."),
  violinWhiskers: style(
    "data-ok-violin-whiskers",
    chartViolinWhiskers,
    "minmax",
    "Violins with a box: the whiskers end at the data's extremes (`minmax`, the default) or at Tukey's 1.5 × IQR fences (`tukey`).",
    { optional: true },
  ),
  hideViolinPoints: flag("data-ok-hide-violin-points", "Violins: no dots for the observations."),
  violinPointSize: number(
    "data-ok-violin-point-size",
    undefined,
    "Violins: the radius of the observation dots in pixels (default 2.5).",
    { min: 0.5 },
  ),
  violinJitter: number(
    "data-ok-violin-jitter",
    undefined,
    "Violins: how far the dots spread, as a share of the half-width (0 to 1; default 0.5).",
    { min: 0 },
  ),
  unconstrainedViolinPoints: flag(
    "data-ok-unconstrained-violin-points",
    "Violins: the dots may leave the density outline.",
  ),
  violinMaxPoints: number(
    "data-ok-violin-max-points",
    undefined,
    "Violins: the most dots drawn per violin; extra observations are thinned evenly (default 3000).",
    { min: 1 },
  ),
  streamHoverOpacity: number(
    "data-ok-stream-hover-opacity",
    undefined,
    'Streamgraphs with `tooltip="point"`: the opacity of the bands that are not active (0 to 1; default 0.35).',
    { min: 0 },
  ),
  direction: style(
    "data-ok-direction",
    chartDirections,
    "top",
    "Tree and icicle charts: where the root sits, `top` (the default), `bottom`, `left` or `right`, or `radial` (trees: the root in the center, levels as rings).",
    { optional: true },
  ),
  layoutType: style(
    "data-ok-layout-type",
    chartLayoutTypes,
    "tree",
    "Tree charts: `tree` (a tidy tree, the default) or `cluster` (a dendrogram: every leaf on the last level).",
    { optional: true },
  ),
  edgeStyle: style(
    "data-ok-edge-style",
    chartEdgeStyles,
    "orthogonal",
    "Tree charts: links with right angles (`orthogonal`, the default), `curved` or `straight`.",
    { optional: true },
  ),
  enableExpandCollapse: flag(
    "data-ok-enable-expand-collapse",
    "Tree charts: a click, Enter or Space on a node with children hides or shows them.",
  ),
  innerSize: number(
    "data-ok-inner-size",
    undefined,
    "Sunburst charts: the hole in the center, in % of the radius (0 to 90; default 15). Unit charts with the `arc` layout: the inner radius in % of the outer (default 40).",
    { min: 0 },
  ),
  spacing: number(
    "data-ok-spacing",
    undefined,
    "Sunburst and icicle charts: the gap between arcs or cells in px (default 1).",
    { min: 0 },
  ),
  leaf: style(
    "data-ok-leaf",
    chartLeaves,
    "extend",
    "Sunburst and icicle charts: branches that end before the deepest level `extend` to the edge or `stop` at their level (default `extend` on sunbursts, `stop` on icicles).",
    { optional: true },
  ),
  tint: number(
    "data-ok-tint",
    undefined,
    "Sunburst and icicle charts: how much paler each level is than the level its color starts at (0 to 1; default 0.14).",
    { min: 0 },
  ),
  disableZoomOnClick: flag(
    "data-ok-disable-zoom-on-click",
    "Sunburst and icicle charts: a click, Enter or Space on a node doesn't zoom into it.",
  ),
  zoomType: style(
    "data-ok-zoom-type",
    chartZoomTypes,
    "value",
    "Icicle charts: a branch zoomed into keeps its ancestors as full bands above it (`value`, the default) or becomes the top level (`both`).",
    { optional: true },
  ),
  projection: style(
    "data-ok-projection",
    chartProjections,
    "equalEarth",
    "Geo charts: `equalEarth` (equal areas, the default), `mercator` (straight rhumb lines) or `equirectangular`.",
    { optional: true },
  ),
  geoLayout: style(
    "data-ok-geo-layout",
    chartGeoLayouts,
    "geographic",
    "Geo charts: real boundaries (`geographic`, the default) or equal hex tiles (`hex`).",
    { optional: true },
  ),
  scaleMethod: style(
    "data-ok-scale-method",
    chartScaleMethods,
    "quantile",
    "Geo charts: how values are split into classes: `quantile` (the default), `equalInterval`, `jenks` (natural breaks) or `threshold` (your own `scaleThresholds`).",
    { optional: true },
  ),
  xMin: number(
    "data-ok-x-min",
    undefined,
    "The first x position shown when nothing has zoomed the chart: a category index, a timestamp in milliseconds (date axes) or an x value (numeric axes).",
  ),
  xMax: number(
    "data-ok-x-max",
    undefined,
    "The last x position shown when nothing has zoomed the chart (see `xMin`).",
  ),
  xRange: number(
    "data-ok-x-range",
    undefined,
    "Shows the last so many x units, ending at `xMax` or the last x value (a sliding window for live data).",
    { min: 0 },
  ),
  xLabelRotate: number(
    "data-ok-x-label-rotate",
    undefined,
    "X labels turn by this many degrees (-90 to 90) when they don't fit flat. Without it, labels that don't fit are left out.",
    { min: -90 },
  ),
  xLabelRotateAlways: flag(
    "data-ok-x-label-rotate-always",
    "X labels turn by `xLabelRotate` even when they fit flat.",
  ),
  measure: style(
    "data-ok-measure",
    chartMeasureModes,
    "span",
    "Measure rulers: a **Measure** button in the toolbar; a drag (or Enter at two points) then measures the change between two x positions (`span`, the series' values) or two points (`free`).",
    { optional: true },
  ),
  measurePinOnRelease: flag(
    "data-ok-measure-pin-on-release",
    "Measure rulers stay on the chart when the drag ends, up to 20 of them (without it, a new ruler replaces the last one).",
  ),
  rangeBarGroupRows: flag(
    "data-ok-range-bar-group-rows",
    "Range bars and timelines: the series share one lane per category, so bars of different series line up in a row.",
  ),
  disableRangeBarOverlap: flag(
    "data-ok-disable-range-bar-overlap",
    "Range bars and timelines: bars that overlap in time go to lanes of their own instead of being drawn over each other.",
  ),
  hideZeroBarsWhenGrouped: flag(
    "data-ok-hide-zero-bars-when-grouped",
    "Grouped columns: zero and empty bars take no slot, so the other bars of a category close up around its center.",
  ),
  dataReducer: flag(
    "data-ok-data-reducer",
    "Long lines and areas draw only the points that shape them (Largest Triangle Three Buckets); the table, the tooltip and the keyboard keep every point.",
  ),
  dataReducerTargetPoints: number(
    "data-ok-data-reducer-target-points",
    undefined,
    "Points kept per series when reducing (default 250).",
    { min: 3 },
  ),
  dataReducerThreshold: number(
    "data-ok-data-reducer-threshold",
    undefined,
    "A series with more visible points than this is reduced (default 500).",
    { min: 3 },
  ),
  forecastCount: number(
    "data-ok-forecast-count",
    undefined,
    "How many points at the end of each line, area or bar series are a forecast: lines are dashed, areas and bars faint.",
    { min: 1 },
  ),
  forecastDashArray: number(
    "data-ok-forecast-dash-array",
    undefined,
    "Forecast line dashes in px (default 4).",
    { min: 1 },
  ),
  forecastStrokeWidth: number(
    "data-ok-forecast-stroke-width",
    undefined,
    "Forecast line width in px (default the series' width).",
    { min: 0 },
  ),
  forecastFillOpacity: number(
    "data-ok-forecast-fill-opacity",
    undefined,
    "Opacity of forecast areas and bars (0 to 1; default 0.5).",
    { min: 0 },
  ),
  noDataAlign: style(
    "data-ok-no-data-align",
    chartNoDataAligns,
    "center",
    "Where the `noDataText` message sits across the plot: `left`, `center` (the default) or `right`.",
    { optional: true },
  ),
  noDataVerticalAlign: style(
    "data-ok-no-data-vertical-align",
    chartNoDataVerticalAligns,
    "middle",
    "Where the `noDataText` message sits down the plot: `top`, `middle` (the default) or `bottom`.",
    { optional: true },
  ),
  scaleClasses: number(
    "data-ok-scale-classes",
    5,
    "Geo charts: how many value classes (at most the colors available).",
    { min: 1 },
  ),
  sphere: flag("data-ok-sphere", "Geo charts: the outline of the globe behind the regions."),
  graticule: flag(
    "data-ok-graticule",
    "Geo charts: lines of longitude and latitude every 30 degrees.",
  ),
  pixelShape: style(
    "data-ok-pixel-shape",
    chartPixelShapes,
    "circle",
    "Geo charts, `pixel` layout: the shape of each cell, `circle` (the default), `square` or `hexagon` (hexagons sit in rows half a step apart).",
    { optional: true },
  ),
  pixelSpacing: number(
    "data-ok-pixel-spacing",
    8,
    "Geo charts, `pixel` layout: the distance between the cells' centers in px (3 to 64).",
    { min: 3 },
  ),
  pixelSize: number(
    "data-ok-pixel-size",
    80,
    "Geo charts, `pixel` layout: each cell's width in % of the spacing (10 to 100).",
    { min: 10 },
  ),
  crossfilter: style(
    "data-ok-crossfilter",
    chartCrossfilters,
    "highlight",
    "Charts of a `group`: a selection (click, Enter or Space) or a brush in this chart filters the group, and this chart shows the group's filter as a `filter` (only the filtered categories keep their values) or a `highlight` (a tint behind them).",
    { optional: true },
  ),
  hiddenSeries: state(
    "aria-pressed",
    'Indexes of the series hidden through the legend (`aria-pressed="false"` on their buttons); categories in pie, donut and radial bar charts.',
    "toggle",
  ),
  selectedDataPoints: state(
    "instance.selectedDataPoints",
    "The selected points, `{ seriesIndex, dataPointIndex }[]`: a click selects the point, slice or cell under the pointer, Enter or Space the active one.",
    "select",
  ),
  zoomRange: state(
    "instance.zoomRange",
    "The visible window of the x axis, `{ min, max }` (category indexes or x values), or `null`.",
    "zoom",
  ),
});

export interface ChartAnatomyOptions {
  type?: ChartType | undefined;
  xType?: ChartXType | undefined;
  curve?: ChartCurve | undefined;
  legend?: ChartLegend | undefined;
  fill?: ChartFill | undefined;
  stacked?: boolean | undefined;
  horizontal?: boolean | undefined;
  height?: number | undefined;
  markerSize?: number | undefined;
  columnWidth?: number | undefined;
  barHeight?: number | undefined;
  yMin?: number | undefined;
  yMax?: number | undefined;
  dataLabels?: boolean | undefined;
  startAngle?: number | undefined;
  endAngle?: number | undefined;
  dashArray?: number | undefined;
  trackWidth?: number | undefined;
  total?: number | undefined;
  sparkline?: boolean | undefined;
  boxUpperColor?: ChartColor | undefined;
  boxLowerColor?: ChartColor | undefined;
  candleUpColor?: ChartColor | undefined;
  candleDownColor?: ChartColor | undefined;
  donutSize?: number | undefined;
  dataLabelBackground?: boolean | undefined;
  legendValues?: boolean | undefined;
  zoom?: boolean | undefined;
  toolbar?: boolean | undefined;
  animations?: boolean | undefined;
  orientation?: ChartOrientation | undefined;
  nodeWidth?: number | undefined;
  whitespace?: number | undefined;
  edgeOpacity?: number | undefined;
  navigator?: boolean | undefined;
  paneHeight?: number | undefined;
  allowMultipleDataPointsSelection?: boolean | undefined;
  stackType?: ChartStackType | undefined;
  stackOnlyBar?: boolean | undefined;
  stackTotals?: boolean | undefined;
  dataLabelPosition?: ChartDataLabelPosition | undefined;
  backgroundBars?: boolean | undefined;
  backgroundBarOpacity?: number | undefined;
  backgroundBarRadius?: number | undefined;
  markerShape?: ChartMarkerShape | undefined;
  fillPattern?: ChartPattern | undefined;
  strokeWidth?: number | undefined;
  colorBlindMode?: boolean | undefined;
  tooltip?: ChartTooltipMode | undefined;
  tooltipFixed?: ChartTooltipCorner | undefined;
  legendAlign?: ChartLegendAlign | undefined;
  showForSingleSeries?: boolean | undefined;
  disableLegendToggle?: boolean | undefined;
  grid?: ChartGrid | undefined;
  gridRowOpacity?: number | undefined;
  gridColumnOpacity?: number | undefined;
  waterfallPositiveColor?: ChartColor | undefined;
  waterfallNegativeColor?: ChartColor | undefined;
  waterfallTotalColor?: ChartColor | undefined;
  waterfallSubtotalColor?: ChartColor | undefined;
  hideConnectors?: boolean | undefined;
  direction?: ChartDirection | undefined;
  layoutType?: ChartLayoutType | undefined;
  edgeStyle?: ChartEdgeStyle | undefined;
  enableExpandCollapse?: boolean | undefined;
  innerSize?: number | undefined;
  spacing?: number | undefined;
  leaf?: ChartLeaf | undefined;
  tint?: number | undefined;
  disableZoomOnClick?: boolean | undefined;
  zoomType?: ChartZoomType | undefined;
  crossfilter?: ChartCrossfilter | undefined;
  projection?: ChartProjection | undefined;
  geoLayout?: ChartGeoLayout | undefined;
  scaleMethod?: ChartScaleMethod | undefined;
  scaleClasses?: number | undefined;
  sphere?: boolean | undefined;
  graticule?: boolean | undefined;
  pixelShape?: ChartPixelShape | undefined;
  pixelSpacing?: number | undefined;
  pixelSize?: number | undefined;
  streamOffset?: ChartStreamOffset | undefined;
  streamOrder?: ChartStreamOrder | undefined;
  hideStreamLabels?: boolean | undefined;
  streamLabelMinWidth?: number | undefined;
  streamHoverOpacity?: number | undefined;
  beeswarmSpread?: ChartBeeswarmSpread | undefined;
  unitLayout?: ChartUnitLayout | undefined;
  clusterLabels?: boolean | undefined;
  disableSortByGroup?: boolean | undefined;
  arcRows?: number | undefined;
  columns?: number | undefined;
  fillFrom?: ChartFillFrom | undefined;
  split?: boolean | undefined;
  tileColumns?: number | undefined;
  splitMax?: number | undefined;
  trackColor?: ChartColor | undefined;
  unitValue?: number | undefined;
  maxUnits?: number | undefined;
  cellRadius?: number | undefined;
  violinNormalize?: ChartViolinNormalize | undefined;
  violinSide?: ChartViolinSide | undefined;
  bandwidthScale?: number | undefined;
  kdeBandwidth?: number | undefined;
  kdeResolution?: number | undefined;
  violinBox?: boolean | undefined;
  violinWhiskers?: ChartViolinWhiskers | undefined;
  hideViolinPoints?: boolean | undefined;
  violinPointSize?: number | undefined;
  violinJitter?: number | undefined;
  unconstrainedViolinPoints?: boolean | undefined;
  violinMaxPoints?: number | undefined;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xRange?: number | undefined;
  xLabelRotate?: number | undefined;
  xLabelRotateAlways?: boolean | undefined;
  measure?: ChartMeasureMode | undefined;
  measurePinOnRelease?: boolean | undefined;
  rangeBarGroupRows?: boolean | undefined;
  disableRangeBarOverlap?: boolean | undefined;
  hideZeroBarsWhenGrouped?: boolean | undefined;
  dataReducer?: boolean | undefined;
  dataReducerTargetPoints?: number | undefined;
  dataReducerThreshold?: number | undefined;
  forecastCount?: number | undefined;
  forecastDashArray?: number | undefined;
  forecastStrokeWidth?: number | undefined;
  forecastFillOpacity?: number | undefined;
  noDataAlign?: ChartNoDataAlign | undefined;
  noDataVerticalAlign?: ChartNoDataVerticalAlign | undefined;
}

/** `data-ok-*` attributes of a chart root (numbers only when given). */
export const chartAttributes = (options: ChartAnatomyOptions = {}): DataAttributes =>
  optionAttributes(chartOptions, { ...options });

/** Chart trellis (ADR-0060): small multiples of one data set, one chart per panel. */
export const chartTrellisOptions = defineOptions("chart-trellis", "data-ok-chart-trellis", {
  columns: number(
    "data-ok-columns",
    undefined,
    "Panels per row from 600px up (1 to 6; default as many as fit, at least 220px wide). Narrower screens show one per row.",
    { min: 1 },
  ),
  promote: flag(
    "data-ok-promote",
    "Panel headers are buttons: pressing one shows that panel alone across the grid, with an **All panels** button to go back.",
  ),
});

export interface ChartTrellisAnatomyOptions {
  columns?: number | undefined;
  promote?: boolean | undefined;
}

/** `data-ok-*` attributes of a chart trellis root. */
export const chartTrellisAttributes = (options: ChartTrellisAnatomyOptions = {}): DataAttributes =>
  optionAttributes(chartTrellisOptions, { ...options });

// --- Carousel (ADR-0033) ------------------------------------------------------------------------

export const carouselColors = [
  "inherit",
  ...componentColorNames,
] as const satisfies readonly ColorName[];
export type CarouselColor = (typeof carouselColors)[number];
type CarouselAlignName = (typeof carouselAligns)[number];

export const carouselOptions = defineOptions("carousel", "data-ok-carousel", {
  align: style(
    "data-ok-align",
    carouselAligns,
    "center",
    "Where the selected slides sit: `start`, `center`, `end` (or a fraction 0–1 of the viewport).",
  ),
  axis: style(
    "data-ok-axis",
    carouselAxes,
    "x",
    "Scroll direction: horizontal `x` or vertical `y`.",
  ),
  containScroll: style(
    "data-ok-contain-scroll",
    carouselContainScrolls,
    "trimSnaps",
    "Edges: `trimSnaps` merges the snaps clamped at the ends, `keepSnaps` keeps them, `false` leaves space.",
  ),
  effect: style(
    "data-ok-effect",
    carouselEffects,
    "none",
    "Transition between slides: `fade`, or `opacity` / `scale` / `parallax` while scrolling.",
  ),
  loop: flag("data-ok-loop", "Endless: the first slide follows the last one."),
  dragFree: flag("data-ok-drag-free", "Free scrolling with momentum, without snapping."),
  skipSnaps: flag("data-ok-skip-snaps", "A strong swipe may pass several snaps."),
  autoHeight: flag("data-ok-auto-height", "The height follows the selected slides."),
  heightEvent: style(
    "data-ok-height-event",
    carouselHeightEvents,
    "select",
    "Auto height from the selected slides, or from every slide in view.",
    { when: "autoHeight" },
  ),
  wheelGestures: flag(
    "data-ok-wheel-gestures",
    "The mouse wheel and the trackpad move one snap per gesture.",
  ),
  forceWheelAxis: style(
    "data-ok-force-wheel-axis",
    carouselAxes,
    "x",
    "Wheel axis that moves the carousel (`y`: the vertical wheel moves a horizontal carousel).",
    { optional: true, when: "wheelGestures" },
  ),
  draggable: behavior(
    "data-ok-draggable",
    true,
    "Swipe and drag the slides; `false` turns it off.",
  ),
  focus: behavior(
    "data-ok-focus",
    true,
    "Focusing an element in a slide scrolls to that slide; `false` turns it off.",
  ),
  active: behavior(
    "data-ok-active",
    true,
    "`false` turns the carousel off (for example at a breakpoint).",
  ),
  startIndex: number("data-ok-start-index", 0, "Snap selected at first.", { min: 0 }),
  slidesToScroll: number(
    "data-ok-slides-to-scroll",
    1,
    "Slides per step, or `auto` (as many as fit).",
    { min: 1 },
  ),
  slidesToShow: number(
    "data-ok-slides-to-show",
    undefined,
    "Slides in view: a count, a percentage or `auto`; per breakpoint with `-sm`, `-md`, `-lg`, `-xl`.",
    { min: 0, units: ["%"] },
  ),
  slideSpacing: number("data-ok-slide-spacing", undefined, "Gap between slides (px).", {
    min: 0,
    units: ["px", "rem", "em"],
  }),
  duration: number(
    "data-ok-duration",
    25,
    "Speed of animated scrolls, in Embla units (25 is about 500 ms).",
    { min: 0 },
  ),
  dragThreshold: number(
    "data-ok-drag-threshold",
    10,
    "Pixels a mouse drag moves before clicks are ignored.",
    { min: 0 },
  ),
  inViewThreshold: number(
    "data-ok-in-view-threshold",
    0,
    "Share of a slide (0–1) that must show for it to count as in view.",
    { min: 0 },
  ),
  autoplay: flag("data-ok-autoplay", "Moves to the next snap every `autoplayDelay`."),
  autoplayDelay: number("data-ok-autoplay-delay", 4000, "Autoplay: milliseconds per snap.", {
    min: 0,
  }),
  autoplayJump: flag("data-ok-autoplay-jump", "Autoplay: change snaps without animation.", {
    when: "autoplay",
  }),
  autoScroll: flag("data-ok-auto-scroll", "Scrolls continuously."),
  autoScrollSpeed: number("data-ok-auto-scroll-speed", 2, "Auto scroll: pixels per frame.", {
    min: 0,
  }),
  autoScrollStartDelay: number(
    "data-ok-auto-scroll-start-delay",
    1000,
    "Auto scroll: milliseconds before it starts.",
    { min: 0 },
  ),
  autoScrollDirection: style(
    "data-ok-auto-scroll-direction",
    carouselAutoScrollDirections,
    "forward",
    "Auto scroll: `forward` or `backward`.",
    { when: "autoScroll" },
  ),
  playOnInit: behavior(
    "data-ok-play-on-init",
    true,
    "Autoplay and auto scroll start on their own (never with reduced motion); `false` waits for play.",
  ),
  stopOnInteraction: behavior(
    "data-ok-stop-on-interaction",
    true,
    "Swipes and drags stop autoplay; `false` pauses it until the carousel settles.",
  ),
  stopOnMouseEnter: behavior(
    "data-ok-stop-on-mouse-enter",
    true,
    "Hovering pauses autoplay until the pointer leaves; `false` keeps playing.",
  ),
  stopOnFocusIn: behavior(
    "data-ok-stop-on-focus-in",
    true,
    "Focus inside the carousel stops autoplay; `false` keeps playing.",
  ),
  stopOnLastSnap: flag("data-ok-stop-on-last-snap", "Autoplay stops at the last snap."),
  selected: state(
    "data-ok-snapped",
    "Selected snap: its slides carry `data-ok-snapped` (written by the controller).",
    "select",
  ),
});

export interface CarouselAnatomyOptions {
  align?: CarouselAlignName | number | undefined;
  axis?: CarouselAxis | undefined;
  containScroll?: CarouselContainScroll | false | undefined;
  effect?: CarouselEffect | undefined;
  loop?: boolean | undefined;
  dragFree?: boolean | undefined;
  skipSnaps?: boolean | undefined;
  autoHeight?: boolean | undefined;
  heightEvent?: CarouselHeightEvent | undefined;
  wheelGestures?: boolean | undefined;
  forceWheelAxis?: CarouselAxis | undefined;
  draggable?: boolean | undefined;
  focus?: boolean | undefined;
  active?: boolean | undefined;
  startIndex?: number | undefined;
  slidesToScroll?: number | "auto" | undefined;
  slidesToShow?: CarouselResponsive<CarouselSlidesToShow> | undefined;
  slideSpacing?: number | string | undefined;
  duration?: number | undefined;
  dragThreshold?: number | undefined;
  inViewThreshold?: number | undefined;
  autoplay?: boolean | undefined;
  autoplayDelay?: number | undefined;
  autoplayJump?: boolean | undefined;
  autoScroll?: boolean | undefined;
  autoScrollSpeed?: number | undefined;
  autoScrollStartDelay?: number | undefined;
  autoScrollDirection?: CarouselAutoScrollDirection | undefined;
  playOnInit?: boolean | undefined;
  stopOnInteraction?: boolean | undefined;
  stopOnMouseEnter?: boolean | undefined;
  stopOnFocusIn?: boolean | undefined;
  stopOnLastSnap?: boolean | undefined;
  /** Embla `breakpoints`: media query → behavior options (written as JSON). */
  breakpoints?: Record<string, CarouselBreakpointOptions> | undefined;
}

const CAROUSEL_BEHAVIORS = [
  "draggable",
  "focus",
  "active",
  "playOnInit",
  "stopOnInteraction",
  "stopOnMouseEnter",
  "stopOnFocusIn",
] as const;

/**
 * `data-ok-*` attributes of a carousel root. Behaviors are written only when turned off,
 * `slidesToShow` once per breakpoint (`data-ok-slides-to-show-md`), a numeric `align` and
 * `slidesToScroll="auto"` as given, and `breakpoints` as JSON.
 */
export function carouselAttributes(options: CarouselAnatomyOptions = {}): DataAttributes {
  const { align, containScroll, slidesToScroll, slidesToShow, breakpoints, ...rest } = options;
  const { options: spec } = carouselOptions;
  const attributes = optionAttributes(carouselOptions, {
    ...rest,
    align,
    containScroll: containScroll === false ? "false" : containScroll,
    slidesToScroll: slidesToScroll === "auto" ? undefined : slidesToScroll,
  });
  const numericAlign = typeof align === "number" ? parseAlign(align) : undefined;
  if (typeof numericAlign === "number") attributes[spec.align.attr] = String(numericAlign);
  if (slidesToScroll !== undefined && parseSlidesToScroll(slidesToScroll) === "auto")
    attributes["data-ok-slides-to-scroll"] = "auto";
  const shown = responsiveValues(slidesToShow);
  for (const breakpoint of carouselBreakpoints) {
    const value = parseSlidesToShow(shown[breakpoint]);
    if (value !== undefined) attributes[slidesToShowAttr(breakpoint)] = String(value);
  }
  for (const key of CAROUSEL_BEHAVIORS) {
    if (options[key] === false) attributes[spec[key].attr] = "false";
  }
  if (breakpoints && Object.keys(breakpoints).length > 0) {
    attributes["data-ok-breakpoints"] = JSON.stringify(breakpoints);
  }
  return attributes;
}

/** Reads the `slidesToShow` attributes of a carousel root, per breakpoint (HTML runtime). */
export function readSlidesToShow(element: Element): Partial<Record<CarouselBreakpoint, string>> {
  const out: Partial<Record<CarouselBreakpoint, string>> = {};
  for (const breakpoint of carouselBreakpoints) {
    const value = element.getAttribute(slidesToShowAttr(breakpoint));
    if (value !== null) out[breakpoint] = value;
  }
  return out;
}

export const carouselArrowsOptions = defineOptions("carousel-arrows", "data-ok-carousel-arrows", {
  variant: style(
    "data-ok-variant",
    carouselArrowsVariants,
    "basic",
    "`basic` icon buttons, `floating` on the sides of the slides, or `number` with a counter.",
  ),
  color: style(
    "data-ok-color",
    carouselColors,
    "inherit",
    "`inherit` (neutral) or a palette color.",
  ),
  placement: style(
    "data-ok-placement",
    carouselPlacements,
    "bottom-end",
    "Overlays the slides at that corner or side (absent: in the flow).",
    { optional: true },
  ),
});

export interface CarouselArrowsAnatomyOptions {
  variant?: CarouselArrowsVariant | undefined;
  color?: CarouselColor | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of the arrows group. */
export const carouselArrowsAttributes = (
  options: CarouselArrowsAnatomyOptions = {},
): DataAttributes => optionAttributes(carouselArrowsOptions, { ...options });

export const carouselDotsOptions = defineOptions("carousel-dots", "data-ok-carousel-dots", {
  variant: style(
    "data-ok-variant",
    carouselDotsVariants,
    "circular",
    "`circular` dots, `rounded` (the selected dot is a bar) or `number` buttons.",
  ),
  color: style(
    "data-ok-color",
    carouselColors,
    "inherit",
    "`inherit` (neutral) or a palette color.",
  ),
  placement: style(
    "data-ok-placement",
    carouselPlacements,
    "bottom",
    "Overlays the slides at that corner or side (absent: in the flow).",
    { optional: true },
  ),
});

export interface CarouselDotsAnatomyOptions {
  variant?: CarouselDotsVariant | undefined;
  color?: CarouselColor | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of the dots group. */
export const carouselDotsAttributes = (options: CarouselDotsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(carouselDotsOptions, { ...options });

export const carouselProgressOptions = defineOptions(
  "carousel-progress",
  "data-ok-carousel-progress",
  {
    variant: style(
      "data-ok-variant",
      carouselProgressVariants,
      "scroll",
      "`scroll` shows the scroll position, `autoplay` the time until the next snap.",
    ),
    color: style(
      "data-ok-color",
      carouselColors,
      "inherit",
      "`inherit` (neutral) or a palette color.",
    ),
    placement: style(
      "data-ok-placement",
      carouselPlacements,
      "top-end",
      "Overlays the slides at that corner or side (absent: in the flow).",
      { optional: true },
    ),
  },
);

export interface CarouselProgressAnatomyOptions {
  variant?: CarouselProgressVariant | undefined;
  color?: CarouselColor | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of a progress bar. */
export const carouselProgressAttributes = (
  options: CarouselProgressAnatomyOptions = {},
): DataAttributes => optionAttributes(carouselProgressOptions, { ...options });

export const carouselThumbsOptions = defineOptions("carousel-thumbs", "data-ok-carousel-thumbs", {
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A row of thumbnails, or a column.",
  ),
  placement: style(
    "data-ok-placement",
    carouselPlacements,
    "end",
    "Overlays the slides at that corner or side (absent: in the flow).",
    { optional: true },
  ),
});

export interface CarouselThumbsAnatomyOptions {
  orientation?: Orientation | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of the thumbnails group. */
export const carouselThumbsAttributes = (
  options: CarouselThumbsAnatomyOptions = {},
): DataAttributes => optionAttributes(carouselThumbsOptions, { ...options });

// --- Map (ADR-0025) -----------------------------------------------------------------------------

export const mapProjections = ["mercator", "globe"] as const;
export type MapProjection = (typeof mapProjections)[number];
export const mapAnchors = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export type MapAnchor = (typeof mapAnchors)[number];
export const mapAlignments = ["auto", "map", "viewport"] as const;
export type MapAlignment = (typeof mapAlignments)[number];
export const mapMarkerColors = paletteColorNames;
export type MapMarkerColor = PaletteColorName;
export const mapScaleUnits = ["metric", "imperial", "nautical"] as const;
export type MapScaleUnit = (typeof mapScaleUnits)[number];
export const mapPositions = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type MapPosition = (typeof mapPositions)[number];

/** Map interaction handlers (MapLibre names), each a `behavior` option that is on by default. */
export const mapHandlers = [
  "boxZoom",
  "doubleClickZoom",
  "dragPan",
  "dragRotate",
  "keyboard",
  "scrollZoom",
  "touchPitch",
  "touchZoomRotate",
] as const;
export type MapHandler = (typeof mapHandlers)[number];

export const mapOptions = defineOptions("map", "data-ok-map", {
  longitude: number(
    "data-ok-longitude",
    0,
    "Center longitude in degrees (HTML: changing it moves the map).",
  ),
  latitude: number("data-ok-latitude", 0, "Center latitude in degrees (−85 to 85)."),
  zoom: number("data-ok-zoom", 0, "Zoom level (0: the whole world).", { min: 0 }),
  pitch: number("data-ok-pitch", 0, "Tilt in degrees (0: looking straight down).", { min: 0 }),
  bearing: number("data-ok-bearing", 0, "Rotation in degrees clockwise from north."),
  minZoom: number("data-ok-min-zoom", 0, "Lowest zoom level people can reach."),
  maxZoom: number("data-ok-max-zoom", 22, "Highest zoom level people can reach (at most 24)."),
  minPitch: number("data-ok-min-pitch", 0, "Lowest tilt in degrees.", { min: 0 }),
  maxPitch: number("data-ok-max-pitch", 60, "Highest tilt in degrees (at most 85).", { min: 0 }),
  projection: style(
    "data-ok-projection",
    mapProjections,
    "mercator",
    "Projection: a flat `mercator` map or a `globe` when zoomed out.",
  ),
  boxZoom: behavior("data-ok-box-zoom", true, "Shift + drag zooms to the drawn box."),
  doubleClickZoom: behavior("data-ok-double-click-zoom", true, "Double click zooms in."),
  dragPan: behavior("data-ok-drag-pan", true, "Dragging moves the map."),
  dragRotate: behavior(
    "data-ok-drag-rotate",
    true,
    "Right-click drag (or Ctrl + drag) rotates and tilts the map.",
  ),
  keyboard: behavior(
    "data-ok-keyboard",
    true,
    "Arrow keys pan, + and − zoom, Shift + arrows rotate and tilt (the map has focus).",
  ),
  scrollZoom: behavior("data-ok-scroll-zoom", true, "The mouse wheel and trackpad zoom."),
  touchPitch: behavior("data-ok-touch-pitch", true, "Two-finger vertical drag tilts the map."),
  touchZoomRotate: behavior(
    "data-ok-touch-zoom-rotate",
    true,
    "Pinch zooms and two-finger twist rotates.",
  ),
  renderWorldCopies: behavior(
    "data-ok-render-world-copies",
    true,
    "Repeats the world side by side when zoomed out.",
  ),
  styleDiffing: behavior(
    "data-ok-style-diffing",
    true,
    "A new style is compared with the current one and only the differences are applied (off: the style reloads).",
  ),
  cooperativeGestures: flag(
    "data-ok-cooperative-gestures",
    "Page-friendly gestures: Ctrl + scroll zooms and two fingers pan, so the page keeps scrolling.",
  ),
  fullscreen: state(
    "data-ok-fullscreen",
    "Fills the screen (the fullscreen control; Escape leaves).",
    "fullscreen",
  ),
});

export type MapAnatomyOptions = {
  longitude?: number | undefined;
  latitude?: number | undefined;
  zoom?: number | undefined;
  pitch?: number | undefined;
  bearing?: number | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  minPitch?: number | undefined;
  maxPitch?: number | undefined;
  projection?: MapProjection | undefined;
  cooperativeGestures?: boolean | undefined;
  renderWorldCopies?: boolean | undefined;
  styleDiffing?: boolean | undefined;
} & { [K in MapHandler]?: boolean | undefined };

/** `data-ok-*` attributes of a map root: numbers when given, `="false"` for handlers turned off. */
export const mapAttributes = (options: MapAnatomyOptions = {}): DataAttributes => {
  const attributes = optionAttributes(mapOptions, { ...options });
  for (const key of [...mapHandlers, "renderWorldCopies", "styleDiffing"] as const)
    if (options[key] === false) attributes[mapOptions.options[key].attr] = "false";
  return attributes;
};

export const mapMarkerOptions = defineOptions("map-marker", "data-ok-map-marker", {
  longitude: number("data-ok-longitude", undefined, "Longitude of the point it marks."),
  latitude: number("data-ok-latitude", undefined, "Latitude of the point it marks."),
  anchor: style(
    "data-ok-anchor",
    mapAnchors,
    "center",
    "Which part of the marker sits on the point (`bottom` for pins).",
  ),
  color: style("data-ok-color", mapMarkerColors, "primary", "Color of the default pin."),
  draggable: flag(
    "data-ok-draggable",
    "People can drag the marker, or move it with the arrow keys once it has focus.",
  ),
  rotation: number("data-ok-rotation", undefined, "Rotation in degrees clockwise."),
  scale: number("data-ok-scale", 1, "Size of the default pin (1: 26px).", { min: 0 }),
  clickTolerance: number(
    "data-ok-click-tolerance",
    undefined,
    "Pixels a press may move and still count as a click, not a drag (default: the map's `clickTolerance`, 3).",
    { min: 0 },
  ),
  rotationAlignment: style(
    "data-ok-rotation-alignment",
    mapAlignments,
    "auto",
    "`map`: turns with the map; `viewport` and `auto`: stays upright.",
    { optional: true },
  ),
  pitchAlignment: style(
    "data-ok-pitch-alignment",
    mapAlignments,
    "auto",
    "`map`: lies flat on a tilted map; `viewport` and `auto`: faces the screen.",
    { optional: true },
  ),
});

export type MapMarkerAnatomyOptions = {
  longitude?: number | undefined;
  latitude?: number | undefined;
  anchor?: MapAnchor | undefined;
  color?: MapMarkerColor | undefined;
  draggable?: boolean | undefined;
  rotation?: number | undefined;
  scale?: number | undefined;
  clickTolerance?: number | undefined;
  rotationAlignment?: MapAlignment | undefined;
  pitchAlignment?: MapAlignment | undefined;
};

/** `data-ok-*` attributes of a marker. */
export const mapMarkerAttributes = (options: MapMarkerAnatomyOptions = {}): DataAttributes =>
  optionAttributes(mapMarkerOptions, { ...options });

export const mapPopupOptions = defineOptions("map-popup", "data-ok-map-popup", {
  longitude: number("data-ok-longitude", undefined, "Longitude of the point it points at."),
  latitude: number("data-ok-latitude", undefined, "Latitude of the point it points at."),
  anchor: style(
    "data-ok-anchor",
    mapAnchors,
    "bottom",
    "Which side of the popup points at the point (default: picked so the popup fits).",
    { optional: true },
  ),
  maxWidth: number("data-ok-max-width", 240, "Widest the popup gets, in px.", {
    min: 0,
    units: ["px", "rem", "em"],
  }),
  closeOnClick: behavior("data-ok-close-on-click", true, "A click on the map closes it."),
  closeOnMove: flag("data-ok-close-on-move", "Moving the map closes it."),
  focusAfterOpen: behavior(
    "data-ok-focus-after-open",
    true,
    "Moves focus into the popup when it opens (and back when it closes).",
  ),
});

export type MapPopupAnatomyOptions = {
  longitude?: number | undefined;
  latitude?: number | undefined;
  anchor?: MapAnchor | undefined;
  maxWidth?: number | string | undefined;
  closeOnClick?: boolean | undefined;
  closeOnMove?: boolean | undefined;
  focusAfterOpen?: boolean | undefined;
};

/** `data-ok-*` attributes of a popup (`="false"` for behaviors turned off). */
export const mapPopupAttributes = (options: MapPopupAnatomyOptions = {}): DataAttributes => {
  const attributes = optionAttributes(mapPopupOptions, { ...options });
  for (const key of ["closeOnClick", "focusAfterOpen"] as const)
    if (options[key] === false) attributes[mapPopupOptions.options[key].attr] = "false";
  return attributes;
};

export const mapNavigationOptions = defineOptions("map-navigation", "data-ok-map-navigation", {
  visualizePitch: flag("data-ok-visualize-pitch", "The compass also tilts with the map."),
});

export const mapGeolocateOptions = defineOptions("map-geolocate", "data-ok-map-geolocate", {
  trackUserLocation: flag(
    "data-ok-track-user-location",
    "Keeps following the location: the button turns tracking on and off.",
  ),
  showUserLocation: behavior("data-ok-show-user-location", true, "Shows a dot at the location."),
  showAccuracyCircle: behavior(
    "data-ok-show-accuracy-circle",
    true,
    "Shows a circle as wide as the location's accuracy.",
  ),
});

export const mapScaleOptions = defineOptions("map-scale", "data-ok-map-scale", {
  unit: style(
    "data-ok-unit",
    mapScaleUnits,
    "metric",
    "Units: `metric`, `imperial` or `nautical`.",
  ),
  maxWidth: number("data-ok-max-width", 100, "Longest the scale bar gets, in px.", { min: 1 }),
});

export const mapAttributionOptions = defineOptions("map-attribution", "data-ok-map-attribution", {
  compact: flag(
    "data-ok-compact",
    "Always folds the credits behind an info button (default: only on maps narrower than 640px).",
  ),
});

export const mapLegendVariants = ["classes", "gradient", "size"] as const;
export type MapLegendVariant = (typeof mapLegendVariants)[number];

export const mapLegendOptions = defineOptions("map-legend", "data-ok-map-legend", {
  variant: style(
    "data-ok-variant",
    mapLegendVariants,
    "classes",
    "`classes`: one swatch and range per class; `gradient`: one bar from the lowest value to the highest; `size`: nested circles of a size scale (proportional symbols).",
  ),
  interactive: behavior(
    "data-ok-interactive",
    true,
    "Classes are toggle buttons: pressing some mutes the regions outside them.",
  ),
});

export type MapLegendAnatomyOptions = {
  variant?: MapLegendVariant | undefined;
  interactive?: boolean | undefined;
};

/** `data-ok-*` attributes of a map legend (`data-ok-interactive="false"` when it is static). */
export const mapLegendAttributes = (options: MapLegendAnatomyOptions = {}): DataAttributes => {
  const attributes = optionAttributes(mapLegendOptions, { ...options });
  if (options.interactive === false)
    attributes[mapLegendOptions.options.interactive.attr] = "false";
  return attributes;
};

export type MapControlAnatomyOptions = {
  visualizePitch?: boolean | undefined;
  trackUserLocation?: boolean | undefined;
  showUserLocation?: boolean | undefined;
  showAccuracyCircle?: boolean | undefined;
  unit?: MapScaleUnit | undefined;
  maxWidth?: number | undefined;
  compact?: boolean | undefined;
};

/** `data-ok-*` attributes of the navigation, geolocate, scale or attribution control. */
export const mapControlAttributes = (
  control: "navigation" | "geolocate" | "scale" | "attribution",
  options: MapControlAnatomyOptions = {},
): DataAttributes => {
  const schema = {
    navigation: mapNavigationOptions,
    geolocate: mapGeolocateOptions,
    scale: mapScaleOptions,
    attribution: mapAttributionOptions,
  }[control];
  const attributes = optionAttributes(schema, { ...options });
  if (control === "geolocate")
    for (const key of ["showUserLocation", "showAccuracyCircle"] as const)
      if (options[key] === false) attributes[mapGeolocateOptions.options[key].attr] = "false";
  return attributes;
};

// --- Lightbox (ADR-0032) ------------------------------------------------------------------------

export const lightboxOptions = defineOptions("lightbox", "data-ok-lightbox", {
  imageFit: style(
    "data-ok-image-fit",
    lightboxImageFits,
    "contain",
    "How images fill their slide: `contain` (whole image) or `cover` (cropped to fill).",
  ),
  finite: flag("data-ok-finite", "The slides don't wrap around: the first and last slides stop."),
  disableZoom: flag(
    "data-ok-disable-zoom",
    "No zoom: hides the zoom buttons and ignores gestures.",
  ),
  disableTotal: flag("data-ok-disable-total", "Hides the counter (`1 / 5`)."),
  disableCaptions: flag("data-ok-disable-captions", "Hides the titles and descriptions."),
  disableSlideshow: flag("data-ok-disable-slideshow", "Hides the play / pause button."),
  disableThumbnails: flag("data-ok-disable-thumbnails", "Hides the thumbnails."),
  disableFullscreen: flag("data-ok-disable-fullscreen", "Hides the fullscreen button."),
  download: flag("data-ok-download", "Shows a download button for the current slide."),
  share: flag(
    "data-ok-share",
    "Shows a share button (Web Share API; hidden where the browser can't share).",
  ),
  rotate: flag("data-ok-rotate", "Shows buttons that rotate the current image by quarter turns."),
  rotateButtons: style(
    "data-ok-rotate-buttons",
    lightboxRotateButtons,
    "both",
    "Rotate buttons: `both`, `clockwise` or `counterclockwise`.",
    { when: "rotate" },
  ),
  captionsHidden: flag(
    "data-ok-captions-hidden",
    "Captions start hidden (the captions toggle shows them).",
  ),
  captionsShowToggle: flag(
    "data-ok-captions-show-toggle",
    "Shows a toolbar button that hides and shows the captions.",
  ),
  descriptionTextAlign: style(
    "data-ok-description-text-align",
    lightboxTextAligns,
    "start",
    "Alignment of the descriptions: `start`, `center` or `end`.",
  ),
  descriptionMaxLines: number(
    "data-ok-description-max-lines",
    3,
    "Lines a description shows before it is cut.",
    { min: 1 },
  ),
  thumbnailsPosition: style(
    "data-ok-thumbnails-position",
    lightboxThumbnailsPositions,
    "bottom",
    "Where the thumbnails sit: `bottom`, `top`, `start` or `end`.",
  ),
  thumbnailsImageFit: style(
    "data-ok-thumbnails-image-fit",
    lightboxImageFits,
    "contain",
    "How images fill their thumbnail: `contain` or `cover`.",
  ),
  thumbnailsWidth: number("data-ok-thumbnails-width", 120, "Thumbnail width (px).", { min: 0 }),
  thumbnailsHeight: number("data-ok-thumbnails-height", 80, "Thumbnail height (px).", { min: 0 }),
  thumbnailsBorder: number("data-ok-thumbnails-border", 3, "Thumbnail border width (px).", {
    min: 0,
  }),
  thumbnailsBorderRadius: number(
    "data-ok-thumbnails-border-radius",
    10,
    "Thumbnail corner radius (px).",
    { min: 0 },
  ),
  thumbnailsPadding: number("data-ok-thumbnails-padding", 0, "Space inside a thumbnail (px).", {
    min: 0,
  }),
  thumbnailsGap: number("data-ok-thumbnails-gap", 16, "Space between thumbnails (px).", { min: 0 }),
  thumbnailsVignette: behavior(
    "data-ok-thumbnails-vignette",
    true,
    "The thumbnails fade out at the edges of their track; `false` turns it off.",
  ),
  thumbnailsHidden: flag(
    "data-ok-thumbnails-hidden",
    "Thumbnails start hidden (the thumbnails toggle shows them).",
  ),
  thumbnailsShowToggle: flag(
    "data-ok-thumbnails-show-toggle",
    "Shows a toolbar button that hides and shows the thumbnails.",
  ),
  slideshowAutoplay: flag(
    "data-ok-slideshow-autoplay",
    "The slideshow starts when the lightbox opens (never with reduced motion).",
  ),
  slideshowDelay: number("data-ok-slideshow-delay", 3000, "Slideshow: milliseconds per slide.", {
    min: 0,
  }),
  fullscreenAuto: flag("data-ok-fullscreen-auto", "Enters fullscreen when the lightbox opens."),
  maxZoomPixelRatio: number(
    "data-ok-max-zoom-pixel-ratio",
    1,
    "Largest zoom of an image: image pixels per screen pixel.",
    { min: 0 },
  ),
  zoomInMultiplier: number("data-ok-zoom-in-multiplier", 2, "Zoom factor of one zoom step.", {
    min: 1,
  }),
  doubleClickMaxStops: number(
    "data-ok-double-click-max-stops",
    2,
    "Zoom steps a double click or double tap goes through before it zooms out.",
    { min: 0 },
  ),
  keyboardMoveDistance: number(
    "data-ok-keyboard-move-distance",
    50,
    "Pixels an arrow key moves a zoomed image.",
    { min: 0 },
  ),
  wheelZoomDistanceFactor: number(
    "data-ok-wheel-zoom-distance-factor",
    100,
    "Wheel distance for one zoom step (larger is slower).",
    { min: 1 },
  ),
  scrollToZoom: flag("data-ok-scroll-to-zoom", "The mouse wheel zooms without the Ctrl key."),
  maxZoom: number("data-ok-max-zoom", 8, "Largest zoom of custom zoomable slides.", { min: 1 }),
  closeOnEscape: behavior("data-ok-close-on-escape", true, "Escape closes; `false` turns it off."),
  closeOnBackdropClick: flag(
    "data-ok-close-on-backdrop-click",
    "A click beside the image closes the lightbox.",
  ),
  closeOnPullDown: flag("data-ok-close-on-pull-down", "Pulling the slide down closes it."),
  closeOnPullUp: flag("data-ok-close-on-pull-up", "Pulling the slide up closes it."),
  disableSwipeNavigation: flag(
    "data-ok-disable-swipe-navigation",
    "Swipes and drags don't change slides (buttons, keys and thumbnails still do).",
  ),
  padding: number("data-ok-padding", 16, "Space around each slide (px or `%`).", {
    min: 0,
    units: ["px", "%"],
  }),
  spacing: number(
    "data-ok-spacing",
    undefined,
    "Space between slides (px, or `%` of the slide area). Default `30%`.",
    { min: 0, units: ["px", "%"] },
  ),
  animationFade: number("data-ok-animation-fade", 250, "Fade-in duration on open (ms).", {
    min: 0,
  }),
  animationSwipe: number("data-ok-animation-swipe", 500, "Slide change duration (ms).", {
    min: 0,
  }),
  animationZoom: number("data-ok-animation-zoom", 500, "Zoom animation duration (ms).", { min: 0 }),
  inline: flag("data-ok-inline", "Shown in the page (a carousel) instead of a modal overlay."),
  open: state(
    "open",
    "Open state (`open` / `onOpenChange`; HTML: a trigger or `open()`).",
    "close",
  ),
  index: state(
    "data-ok-snapped",
    "Current slide (`index` / `onIndexChange`; HTML: `data-ok-index` on triggers, `goTo()`).",
    "view",
  ),
});

export interface LightboxAnatomyOptions {
  imageFit?: LightboxImageFit | undefined;
  finite?: boolean | undefined;
  disableZoom?: boolean | undefined;
  disableTotal?: boolean | undefined;
  disableCaptions?: boolean | undefined;
  disableSlideshow?: boolean | undefined;
  disableThumbnails?: boolean | undefined;
  disableFullscreen?: boolean | undefined;
  download?: boolean | undefined;
  share?: boolean | undefined;
  rotate?: boolean | undefined;
  rotateButtons?: LightboxRotateButtons | undefined;
  captionsHidden?: boolean | undefined;
  captionsShowToggle?: boolean | undefined;
  descriptionTextAlign?: LightboxTextAlign | undefined;
  descriptionMaxLines?: number | undefined;
  thumbnailsPosition?: LightboxThumbnailsPosition | undefined;
  thumbnailsImageFit?: LightboxImageFit | undefined;
  thumbnailsWidth?: number | undefined;
  thumbnailsHeight?: number | undefined;
  thumbnailsBorder?: number | undefined;
  thumbnailsBorderRadius?: number | undefined;
  thumbnailsPadding?: number | undefined;
  thumbnailsGap?: number | undefined;
  thumbnailsVignette?: boolean | undefined;
  thumbnailsHidden?: boolean | undefined;
  thumbnailsShowToggle?: boolean | undefined;
  slideshowAutoplay?: boolean | undefined;
  slideshowDelay?: number | undefined;
  fullscreenAuto?: boolean | undefined;
  maxZoomPixelRatio?: number | undefined;
  zoomInMultiplier?: number | undefined;
  doubleClickMaxStops?: number | undefined;
  keyboardMoveDistance?: number | undefined;
  wheelZoomDistanceFactor?: number | undefined;
  scrollToZoom?: boolean | undefined;
  maxZoom?: number | undefined;
  closeOnEscape?: boolean | undefined;
  closeOnBackdropClick?: boolean | undefined;
  closeOnPullDown?: boolean | undefined;
  closeOnPullUp?: boolean | undefined;
  disableSwipeNavigation?: boolean | undefined;
  padding?: number | string | undefined;
  spacing?: number | string | undefined;
  animationFade?: number | undefined;
  animationSwipe?: number | undefined;
  animationZoom?: number | undefined;
  inline?: boolean | undefined;
}

/**
 * `data-ok-*` attributes of a lightbox root (`<dialog>`, or a `div` when `inline`). Behaviors are
 * written only when turned off.
 */
export function lightboxAttributes(options: LightboxAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(lightboxOptions, { ...options });
  const { options: spec } = lightboxOptions;
  if (options.thumbnailsVignette === false) attributes[spec.thumbnailsVignette.attr] = "false";
  if (options.closeOnEscape === false) attributes[spec.closeOnEscape.attr] = "false";
  return attributes;
}

// --- Upload (ADR-0037) --------------------------------------------------------------------------

export const uploadVariants = ["default", "avatar", "box"] as const;
export const uploadLayouts = ["vertical", "horizontal"] as const;

export type UploadVariant = (typeof uploadVariants)[number];
export type UploadLayout = (typeof uploadLayouts)[number];

const uploadInput = "[data-ok-upload-input]";

export const uploadOptions = defineOptions("upload", "data-ok-upload", {
  variant: style(
    "data-ok-variant",
    uploadVariants,
    "default",
    "`default`: a drop zone with an illustration; `avatar`: a round photo picker; `box`: a small box.",
  ),
  layout: style(
    "data-ok-layout",
    uploadLayouts,
    "vertical",
    "File list: rows with names and sizes, or a wrapping row of tiles.",
  ),
  thumbnail: behavior(
    "data-ok-thumbnail",
    true,
    "Image files show a preview; `false` shows the file type icon instead.",
  ),
  multiple: native("multiple", "Accepts several files and keeps adding them.", {
    children: uploadInput,
  }),
  disabled: native("disabled", "Can't receive files (input disabled, dimmed).", {
    children: uploadInput,
  }),
  error: flag("data-ok-error", "Error colors on the zone and the helper text."),
  maxFiles: number(
    "data-ok-max-files",
    undefined,
    "Most files the upload holds (multiple; 0 = no limit). The others are rejected.",
    { min: 0 },
  ),
  maxSize: number("data-ok-max-size", undefined, "Largest accepted file, in bytes.", { min: 0 }),
  minSize: number("data-ok-min-size", undefined, "Smallest accepted file, in bytes.", { min: 0 }),
  noClick: flag("data-ok-no-click", "A press on the zone doesn't open the file dialog."),
  noKeyboard: flag(
    "data-ok-no-keyboard",
    "The input leaves the tab order (give people another way to open the dialog).",
  ),
  noDrag: flag("data-ok-no-drag", "Files can't be dropped on the zone."),
  noDragEventsBubbling: flag(
    "data-ok-no-drag-events-bubbling",
    "Drags handled here don't reach an outer upload.",
  ),
  noPaste: flag("data-ok-no-paste", "Pasting files while the upload has focus does nothing."),
  preventDropOnDocument: behavior(
    "data-ok-prevent-drop-on-document",
    true,
    "Files dropped outside an upload don't open in the tab.",
  ),
  useFsAccessApi: flag(
    "data-ok-use-fs-access-api",
    "Opens the File System Access picker where supported (the input otherwise).",
  ),
  value: state("files", "The files the upload holds (`value` / `defaultValue`).", "change"),
});

export interface UploadAnatomyOptions {
  variant?: UploadVariant | undefined;
  layout?: UploadLayout | undefined;
  thumbnail?: boolean | undefined;
  error?: boolean | undefined;
  maxFiles?: number | undefined;
  maxSize?: number | undefined;
  minSize?: number | undefined;
  noClick?: boolean | undefined;
  noKeyboard?: boolean | undefined;
  noDrag?: boolean | undefined;
  noDragEventsBubbling?: boolean | undefined;
  noPaste?: boolean | undefined;
  preventDropOnDocument?: boolean | undefined;
  useFsAccessApi?: boolean | undefined;
}

/** `data-ok-*` attributes of an upload root. Behaviors are written only when turned off. */
export function uploadAttributes(options: UploadAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(uploadOptions, { ...options });
  const { options: spec } = uploadOptions;
  if (options.thumbnail === false) attributes[spec.thumbnail.attr] = "false";
  if (options.preventDropOnDocument === false)
    attributes[spec.preventDropOnDocument.attr] = "false";
  return attributes;
}

// --- Walktour (ADR-0039) ------------------------------------------------------------------------

export const walktourOptions = defineOptions("walktour", "data-ok-walktour", {
  continuous: flag(
    "data-ok-continuous",
    "Next and Back move from tooltip to tooltip (otherwise the primary button closes the step).",
  ),
  showProgress: flag("data-ok-show-progress", "Adds the step count to the Next button: `(2/5)`."),
  showSkipButton: flag("data-ok-show-skip-button", "Shows a Skip button that ends the tour."),
  hideBackButton: flag("data-ok-hide-back-button", "Hides the Back button."),
  hideCloseButton: flag("data-ok-hide-close-button", "Hides the close button (the X)."),
  disableBeacon: flag(
    "data-ok-disable-beacon",
    "Steps open their tooltip at once instead of a pulsing beacon on the target.",
  ),
  disableCloseOnEsc: flag("data-ok-disable-close-on-esc", "Escape doesn't close the step."),
  disableOverlay: flag(
    "data-ok-disable-overlay",
    "No overlay and no spotlight: the page stays usable (the step is not modal).",
  ),
  disableOverlayClose: flag(
    "data-ok-disable-overlay-close",
    "A click on the overlay doesn't close the step.",
  ),
  spotlightClicks: flag(
    "data-ok-spotlight-clicks",
    "The target in the spotlight can be clicked (the step is then not modal).",
  ),
  disableScrolling: flag(
    "data-ok-disable-scrolling",
    "Doesn't scroll a target that is out of view into view.",
  ),
  scrollToFirstStep: flag(
    "data-ok-scroll-to-first-step",
    "Scrolls to the first step's target too (only later steps scroll otherwise).",
  ),
  spotlightPadding: number(
    "data-ok-spotlight-padding",
    10,
    "Space between the target and the edge of the spotlight (px).",
    { min: 0 },
  ),
  spotlightRadius: number("data-ok-spotlight-radius", 16, "Corner radius of the spotlight (px).", {
    min: 0,
  }),
  offset: number(
    "data-ok-offset",
    8,
    "Distance between the spotlight's edge and the tooltip, or the tip of its arrow (px).",
    { min: 0 },
  ),
  scrollOffset: number(
    "data-ok-scroll-offset",
    20,
    "Space kept above a target scrolled into view (px).",
    { min: 0 },
  ),
  scrollDuration: number(
    "data-ok-scroll-duration",
    300,
    "How long scrolling to a target takes (ms); `0` jumps. Instant with reduced motion.",
    { min: 0 },
  ),
  beaconTrigger: style(
    "data-ok-beacon-trigger",
    walktourBeaconTriggers,
    "click",
    "What opens a step from its beacon: `click`, or `hover` (a mouse over it; keys and taps still select it).",
    { optional: true },
  ),
  closeButtonAction: style(
    "data-ok-close-button-action",
    walktourCloseButtonActions,
    "close",
    "What the close button (the X) does: `close` (the next step's beacon) or `skip` (ends the tour).",
    { optional: true },
  ),
  disableFocusTrap: flag(
    "data-ok-disable-focus-trap",
    "Tab can leave the step: it is not modal, and the page stays reachable by keyboard.",
  ),
  targetWaitTimeout: number(
    "data-ok-target-wait-timeout",
    1000,
    "How long a step waits for its target to appear before it is skipped (ms); `0` skips at once.",
    { min: 0 },
  ),
  beforeTimeout: number(
    "data-ok-before-timeout",
    5000,
    "How long the tour waits for a step's `before` hook (HTML: `waitUntil()`) before it goes on (ms); `0` waits without a limit.",
    { min: 0 },
  ),
  run: state("data-ok-run", "Runs the tour (`run`; HTML: the attribute, `start()` / `stop()`)."),
  stepIndex: state(
    "data-ok-step-index",
    "The current step (`stepIndex` / `onStepChange`; HTML: the first step, `go()`).",
    "change",
  ),
});

export interface WalktourAnatomyOptions {
  continuous?: boolean | undefined;
  showProgress?: boolean | undefined;
  showSkipButton?: boolean | undefined;
  hideBackButton?: boolean | undefined;
  hideCloseButton?: boolean | undefined;
  disableBeacon?: boolean | undefined;
  disableCloseOnEsc?: boolean | undefined;
  disableOverlay?: boolean | undefined;
  disableOverlayClose?: boolean | undefined;
  spotlightClicks?: boolean | undefined;
  disableScrolling?: boolean | undefined;
  scrollToFirstStep?: boolean | undefined;
  spotlightPadding?: number | undefined;
  spotlightRadius?: number | undefined;
  offset?: number | undefined;
  scrollOffset?: number | undefined;
  scrollDuration?: number | undefined;
  beaconTrigger?: WalktourBeaconTrigger | undefined;
  closeButtonAction?: WalktourCloseButtonAction | undefined;
  disableFocusTrap?: boolean | undefined;
  targetWaitTimeout?: number | undefined;
  beforeTimeout?: number | undefined;
}

/** `data-ok-*` attributes of a walktour root. */
export const walktourAttributes = (options: WalktourAnatomyOptions = {}): DataAttributes =>
  optionAttributes(walktourOptions, { ...options });

export const walktourStepOptions = defineOptions("walktour-step", "data-ok-walktour-step", {
  placement: style(
    "data-ok-placement",
    walktourPlacements,
    "bottom",
    "Side of the target and alignment, `auto` (the side with the most room) or `center` (the middle of the screen, no target needed).",
  ),
  spotlightPadding: number(
    "data-ok-spotlight-padding",
    undefined,
    "This step's spotlight padding (px); default: the tour's.",
    { min: 0 },
  ),
  width: number("data-ok-width", undefined, "Tooltip width (px). Default 360px.", { min: 0 }),
  offset: number(
    "data-ok-offset",
    undefined,
    "This step's distance between the spotlight and the tooltip (px); default: the tour's.",
    { min: 0 },
  ),
  beaconPlacement: style(
    "data-ok-beacon-placement",
    placements,
    "bottom",
    "Side and alignment of the beacon on the target; default: the step's placement.",
    { optional: true },
  ),
  isFixed: flag(
    "data-ok-is-fixed",
    "The target doesn't move when the page scrolls (it is found on its own for fixed elements): the tour doesn't scroll to it.",
  ),
  beaconTrigger: style(
    "data-ok-beacon-trigger",
    walktourBeaconTriggers,
    "click",
    "This step's beacon trigger; default: the tour's.",
    { optional: true },
  ),
  closeButtonAction: style(
    "data-ok-close-button-action",
    walktourCloseButtonActions,
    "close",
    "This step's close button action; default: the tour's.",
    { optional: true },
  ),
  scrollDuration: number(
    "data-ok-scroll-duration",
    undefined,
    "This step's scroll duration (ms); default: the tour's.",
    { min: 0 },
  ),
  targetWaitTimeout: number(
    "data-ok-target-wait-timeout",
    undefined,
    "This step's target wait (ms); default: the tour's.",
    { min: 0 },
  ),
  beforeTimeout: number(
    "data-ok-before-timeout",
    undefined,
    "This step's `before` hook limit (ms); default: the tour's.",
    { min: 0 },
  ),
});

/** Step overrides of the tour's boolean options (`false` turns a tour option off for the step). */
export const walktourStepOverrides = [
  "continuous",
  "showProgress",
  "showSkipButton",
  "hideBackButton",
  "hideCloseButton",
  "disableBeacon",
  "disableCloseOnEsc",
  "disableOverlay",
  "disableOverlayClose",
  "spotlightClicks",
  "disableScrolling",
  "disableFocusTrap",
] as const;
export type WalktourStepOverride = (typeof walktourStepOverrides)[number];

export interface WalktourStepAnatomyOptions
  extends Partial<Record<WalktourStepOverride, boolean | undefined>> {
  placement?: WalktourPlacement | undefined;
  spotlightPadding?: number | undefined;
  width?: number | undefined;
  offset?: number | undefined;
  beaconPlacement?: Placement | undefined;
  isFixed?: boolean | undefined;
  beaconTrigger?: WalktourBeaconTrigger | undefined;
  closeButtonAction?: WalktourCloseButtonAction | undefined;
  scrollDuration?: number | undefined;
  targetWaitTimeout?: number | undefined;
  beforeTimeout?: number | undefined;
  /** A CSS selector (`data-ok-target`); elements and refs are resolved by the component. */
  target?: string | undefined;
  /** A CSS selector of the element to scroll to instead (`data-ok-scroll-target`). */
  scrollTarget?: string | undefined;
  /** A CSS selector of the element to put in the spotlight instead (`data-ok-spotlight-target`). */
  spotlightTarget?: string | undefined;
  /** The step's identifier (`data-ok-step-id`), passed in the tour's events. */
  id?: string | undefined;
}

/**
 * `data-ok-*` attributes of a step. Overrides are written only when given: `""` (on) or
 * `"false"` (off), so a step can turn off an option of the tour.
 */
export function walktourStepAttributes(options: WalktourStepAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(walktourStepOptions, { ...options });
  for (const key of walktourStepOverrides) {
    const value = options[key];
    if (value !== undefined) attributes[walktourOptions.options[key].attr] = value ? "" : "false";
  }
  if (typeof options.target === "string" && options.target)
    attributes["data-ok-target"] = options.target;
  if (typeof options.scrollTarget === "string" && options.scrollTarget)
    attributes["data-ok-scroll-target"] = options.scrollTarget;
  if (typeof options.spotlightTarget === "string" && options.spotlightTarget)
    attributes["data-ok-spotlight-target"] = options.spotlightTarget;
  if (typeof options.id === "string" && options.id) attributes["data-ok-step-id"] = options.id;
  return attributes;
}

/** Palettes an illustration's brand tones can take (ADR-0041). */
export const illustrationColors = paletteColorNames;
export type IllustrationColor = PaletteColorName;

export const illustrationOptions = defineOptions("illustration", "data-ok-illustration", {
  color: style(
    "data-ok-color",
    illustrationColors,
    "primary",
    "Palette of the brand tones (the accent and neutral tones stay).",
  ),
  size: number(
    "data-ok-size",
    undefined,
    "Width: a number in px, or a CSS length. The height follows the 4:3 picture. Default 480px, never wider than the container.",
    { min: 0, units: ["px", "rem", "em"] },
  ),
});

export interface IllustrationAnatomyOptions {
  color?: IllustrationColor | undefined;
  size?: number | string | undefined;
}

/** Root attributes; the root attribute holds the illustration's name. */
export const illustrationAttributes = (
  name: string,
  options: IllustrationAnatomyOptions = {},
): DataAttributes => ({
  ...optionAttributes(illustrationOptions, { ...options }),
  "data-ok-illustration": name,
});

// --- Gantt (ADR-0048) ---------------------------------------------------------------------------

export const ganttOptions = defineOptions("gantt", "data-ok-gantt", {
  view: style(
    "data-ok-view",
    ganttViews,
    "week",
    "Zoom preset: `day`, `week`, `month`, `quarter` or `year` (36, 16, 5, 1.6 or 0.5 px per day). The header tiers follow the zoom.",
  ),
  pixelsPerDay: number(
    "data-ok-pixels-per-day",
    undefined,
    "Zoom in px per day (0.25 to 120), instead of the view's. The zoom buttons write it.",
    { min: 0.25 },
  ),
  rowHeight: number("data-ok-row-height", 40, "Height of a task row in px (at least 24).", {
    min: 24,
  }),
  barMargin: number("data-ok-bar-margin", 8, "Space above and below a bar inside its row, in px.", {
    min: 0,
  }),
  tasksContainerWidth: number(
    "data-ok-tasks-container-width",
    440,
    "Width of the task list in px from 600px up (the name column takes what the other columns leave). Below 600px only the name column shows.",
    { min: 120 },
  ),
  barLabel: style(
    "data-ok-bar-label",
    ganttBarLabels,
    "right",
    "Where the task name sits: `right` of the bar, `inside` it, `left` of it, or `auto` (inside when it fits).",
  ),
  weekStart: number("data-ok-week-start", 1, "First day of a week, 0 = Sunday (default Monday).", {
    min: 0,
  }),
  showToday: behavior("data-ok-show-today", true, "Draws a line on today's date."),
  showNonWorkingDays: behavior(
    "data-ok-show-non-working-days",
    true,
    "Shades weekends and holidays at day and week zoom.",
  ),
  columnLines: behavior(
    "data-ok-column-lines",
    true,
    "Vertical lines between the timeline's columns.",
  ),
  criticalPath: flag(
    "data-ok-critical-path",
    "Highlights the tasks and dependencies with no slack (the critical path).",
  ),
  baseline: flag("data-ok-baseline", "Draws each task's planned dates as a thin bar under it."),
  projectBoundary: flag(
    "data-ok-project-boundary",
    "Dashed lines at the project's first and last day.",
  ),
  toolbar: flag("data-ok-toolbar", "A toolbar with zoom out and zoom in buttons."),
  selection: flag(
    "data-ok-selection",
    "Rows can be selected: click, Ctrl or Cmd + click, Shift + click, Space and Ctrl + A.",
  ),
  disableTooltip: flag("data-ok-disable-tooltip", "No tooltip on bar hover or row focus."),
  height: number(
    "data-ok-height",
    undefined,
    "Height of the chart's scroll area in px (default: as tall as its rows). With a height, only the rows in view are rendered.",
    { min: 80 },
  ),
  disableVirtualization: flag(
    "data-ok-disable-virtualization",
    "Renders every row even with a `height`.",
  ),
  exportFormat: style(
    "data-ok-export-format",
    ["svg", "png", "csv"] as const,
    "svg",
    "Format of the toolbar's download button: `svg`, `png` or `csv` (the data table).",
    { optional: true },
  ),
  disableExport: flag("data-ok-disable-export", "No download button in the toolbar."),
  editable: flag(
    "data-ok-editable",
    "Tasks can be edited: drag bars, their edges and their progress handles, or press Enter on a row (arrows move, Shift + arrows change the end, Page Up / Page Down the progress, Enter saves, Escape cancels). Double click or F2 asks for your own edit form.",
  ),
  taskDrag: behavior(
    "data-ok-task-drag",
    true,
    "With `editable`: bars move by drag and arrow keys.",
  ),
  taskResize: behavior(
    "data-ok-task-resize",
    true,
    "With `editable`: bar edges change the dates (drag, Shift + arrow keys).",
  ),
  progressDrag: behavior(
    "data-ok-progress-drag",
    true,
    "With `editable`: the progress handle sets the progress (drag, Page Up / Page Down).",
  ),
  collapsed: state(
    "data-ok-collapsed",
    "Collapsed parent rows: `data-ok-collapsed` on their rows of the data table (`aria-expanded` on the grid rows).",
    "toggle",
  ),
  selected: state(
    "data-ok-selected",
    "Selected rows: `data-ok-selected` on their rows of the data table (`aria-selected` on the grid rows).",
    "selectionchange",
  ),
});

export interface GanttAnatomyOptions {
  view?: GanttView | undefined;
  pixelsPerDay?: number | undefined;
  rowHeight?: number | undefined;
  barMargin?: number | undefined;
  tasksContainerWidth?: number | undefined;
  barLabel?: GanttBarLabel | undefined;
  weekStart?: number | undefined;
  criticalPath?: boolean | undefined;
  baseline?: boolean | undefined;
  projectBoundary?: boolean | undefined;
  toolbar?: boolean | undefined;
  selection?: boolean | undefined;
  disableTooltip?: boolean | undefined;
  editable?: boolean | undefined;
  height?: number | undefined;
  disableVirtualization?: boolean | undefined;
  exportFormat?: "svg" | "png" | "csv" | undefined;
  disableExport?: boolean | undefined;
}

/** `data-ok-*` attributes of a Gantt root (behavior options are written by the owner when off). */
export const ganttAttributes = (options: GanttAnatomyOptions = {}): DataAttributes =>
  optionAttributes(ganttOptions, { ...options });

// --- Typography ---------------------------------------------------------------------------------

/** Typography variants: the type scale of `@owlky/tokens`, plus `inherit` (the parent's font). */
export const typographyVariantNames = [...typographyVariants, "inherit"] as const;
export type TypographyVariantName = (typeof typographyVariantNames)[number];
/** Text colors: the palette's `main` tones and the three text tones. */
export const typographyColors = [
  ...paletteColorNames,
  "textPrimary",
  "textSecondary",
  "textDisabled",
] as const;
export type TypographyColor = (typeof typographyColors)[number];
export const typographyAligns = ["inherit", "left", "center", "right", "justify"] as const;
export type TypographyAlign = (typeof typographyAligns)[number];
/** Line counts of `maxLines` (CSS reads them from the attribute, so the list is closed). */
export const typographyMaxLines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export type TypographyMaxLines = (typeof typographyMaxLines)[number];

/**
 * The element each variant renders by default (MUI's `variantMapping`): headings for `h1`–`h6`,
 * `h6` for subtitles, `p` for body text and `inherit`, `span` for the rest.
 */
export const typographyVariantMapping: Readonly<Record<TypographyVariantName, string>> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  caption: "span",
  overline: "span",
  button: "span",
  inherit: "p",
};

export const typographyOptions = defineOptions("typography", "data-ok-typography", {
  variant: style(
    "data-ok-variant",
    typographyVariantNames,
    "body1",
    "A step of the type scale (font, size, weight, line height, case); `inherit` keeps the parent's font.",
  ),
  color: style(
    "data-ok-color",
    typographyColors,
    "textPrimary",
    "Text color: a palette's `main` tone or a text tone. Without it, the text keeps the parent's color.",
    { optional: true },
  ),
  align: style(
    "data-ok-align",
    typographyAligns,
    "inherit",
    "Text alignment. Without it, the text keeps the parent's alignment.",
    { optional: true },
  ),
  gutterBottom: flag("data-ok-gutter-bottom", "A bottom margin of 0.35em."),
  noWrap: flag(
    "data-ok-no-wrap",
    "One line: overflowing text ends with an ellipsis (needs a block or inline-block with a width).",
  ),
  maxLines: style(
    "data-ok-max-lines",
    typographyMaxLines,
    "1",
    "At most this many lines (1 to 10): longer text ends with an ellipsis on the last line. Without it, the text shows every line.",
    { optional: true },
  ),
  persistent: flag(
    "data-ok-persistent",
    "With `maxLines`: the text always takes the height of that many lines, even when it is shorter.",
  ),
});

export interface TypographyAnatomyOptions {
  variant?: TypographyVariantName | undefined;
  color?: TypographyColor | undefined;
  align?: TypographyAlign | undefined;
  gutterBottom?: boolean | undefined;
  noWrap?: boolean | undefined;
  /** 1–10 (a number or its string). */
  maxLines?: number | string | undefined;
  persistent?: boolean | undefined;
}

/** `data-ok-*` attributes of a typography element (`color`, `align` and `maxLines` only when given). */
export const typographyAttributes = ({
  maxLines,
  ...options
}: TypographyAnatomyOptions = {}): DataAttributes =>
  optionAttributes(typographyOptions, {
    ...options,
    maxLines: maxLines === undefined ? undefined : String(maxLines),
  });

/** The element a variant renders: `mapping` first, then the default mapping (unknown → `p`). */
export const typographyElement = <E = string>(
  variant: unknown,
  mapping: Partial<Record<TypographyVariantName, E>> = {},
): E | string => {
  const name = pick(typographyVariantNames, variant, "body1");
  const mapped = Object.hasOwn(mapping, name) ? mapping[name] : undefined;
  return mapped ?? typographyVariantMapping[name];
};

// --- Link ---------------------------------------------------------------------------------------

/** Link colors: Typography's, plus `inherit` (the parent's color, as in breadcrumbs). */
export const linkColors = [...typographyColors, "inherit"] as const;
export type LinkColor = (typeof linkColors)[number];
export const linkUnderlines = ["always", "hover", "none"] as const;
export type LinkUnderline = (typeof linkUnderlines)[number];

/**
 * Link (spec: link.md): a Typography root (`data-ok-typography` + `data-ok-link`) with Typography's
 * options; MUI's defaults differ (`variant` `inherit`, `color` `primary`, always written).
 */
export const linkOptions = defineOptions("link", "data-ok-link", {
  variant: style(
    "data-ok-variant",
    typographyVariantNames,
    "inherit",
    "A step of the type scale; `inherit` (the default) keeps the font of the text around the link.",
  ),
  color: style(
    "data-ok-color",
    linkColors,
    "primary",
    "Text color: a palette's `main` tone, a text tone, or `inherit` (the parent's color).",
  ),
  align: typographyOptions.options.align,
  gutterBottom: typographyOptions.options.gutterBottom,
  noWrap: typographyOptions.options.noWrap,
  maxLines: typographyOptions.options.maxLines,
  persistent: typographyOptions.options.persistent,
  underline: style(
    "data-ok-underline",
    linkUnderlines,
    "always",
    "When the link is underlined: `always`, on `hover` (pointer devices), or `none`.",
  ),
});

export interface LinkAnatomyOptions extends Omit<TypographyAnatomyOptions, "color"> {
  color?: LinkColor | undefined;
  underline?: LinkUnderline | undefined;
}

/** `data-ok-*` attributes of a link: Typography's marker first, then the link's options. */
export const linkAttributes = ({
  maxLines,
  ...options
}: LinkAnatomyOptions = {}): DataAttributes => ({
  "data-ok-typography": "",
  ...optionAttributes(linkOptions, {
    ...options,
    maxLines: maxLines === undefined ? undefined : String(maxLines),
  }),
});

const SAFE_REL = ["noopener", "noreferrer"] as const;

/**
 * The `rel` of a link: with `target="_blank"`, the consumer's tokens plus `noopener noreferrer`
 * (the new page gets no `window.opener` and no referrer); otherwise the consumer's value as given.
 */
export const linkRel = (target: unknown, rel: unknown): string | undefined => {
  const given = typeof rel === "string" ? rel : undefined;
  if (target !== "_blank") return given;
  const tokens = (given ?? "").split(/\s+/).filter(Boolean);
  for (const token of SAFE_REL)
    if (!tokens.some((t) => t.toLowerCase() === token)) tokens.push(token);
  return tokens.join(" ");
};

export const optionSchemas = {
  accordion: accordionOptions,
  "accordion-actions": accordionActionsOptions,
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
  "form-control": formControlOptions,
  "form-label": formLabelOptions,
  "form-group": formGroupOptions,
  "form-helper-text": formHelperTextOptions,
  "text-field": textFieldOptions,
  "number-field": numberFieldOptions,
  "phone-input": phoneInputOptions,
  select: selectOptions,
  "input-label": inputLabelOptions,
  avatar: avatarOptions,
  "avatar-group": avatarGroupOptions,
  badge: badgeOptions,
  chip: chipOptions,
  label: labelOptions,
  divider: dividerOptions,
  paper: paperOptions,
  card: cardOptions,
  "card-actions": cardActionsOptions,
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
  backdrop: backdropOptions,
  collapse: collapseOptions,
  toaster: toasterOptions,
  "table-sort-label": tableSortLabelOptions,
  tabs: tabsOptions,
  tab: tabOptions,
  breadcrumbs: breadcrumbsOptions,
  stepper: stepperOptions,
  step: stepOptions,
  "step-label": stepLabelOptions,
  "mobile-stepper": mobileStepperOptions,
  timeline: timelineOptions,
  "timeline-item": timelineItemOptions,
  "timeline-dot": timelineDotOptions,
  "organization-chart": organizationChartOptions,
  "organization-chart-node": organizationChartNodeOptions,
  image: imageOptions,
  rating: ratingOptions,
  slider: sliderOptions,
  "transfer-list": transferListOptions,
  "tree-view": treeViewOptions,
  autocomplete: autocompleteOptions,
  motion: motionOptions,
  "motion-group": motionGroupOptions,
  "motion-text": motionTextOptions,
  "count-up": countUpOptions,
  countdown: countdownOptions,
  "motion-border": motionBorderOptions,
  "scroll-progress": scrollProgressOptions,
  "data-grid": dataGridOptions,
  "date-field": dateFieldOptions,
  "date-calendar": dateCalendarOptions,
  "date-picker": datePickerOptions,
  "time-clock": timeClockOptions,
  "digital-clock": digitalClockOptions,
  "multi-section-digital-clock": multiSectionDigitalClockOptions,
  "date-range-calendar": dateRangeCalendarOptions,
  "date-range-picker": dateRangePickerOptions,
  editor: editorOptions,
  markdown: markdownOptions,
  chart: chartOptions,
  "chart-trellis": chartTrellisOptions,
  gantt: ganttOptions,
  carousel: carouselOptions,
  "carousel-arrows": carouselArrowsOptions,
  "carousel-dots": carouselDotsOptions,
  "carousel-progress": carouselProgressOptions,
  "carousel-thumbs": carouselThumbsOptions,
  "code-editor": codeEditorOptions,
  "diff-editor": diffEditorOptions,
  map: mapOptions,
  "map-marker": mapMarkerOptions,
  "map-popup": mapPopupOptions,
  "map-navigation": mapNavigationOptions,
  "map-geolocate": mapGeolocateOptions,
  "map-scale": mapScaleOptions,
  "map-attribution": mapAttributionOptions,
  "map-legend": mapLegendOptions,
  lightbox: lightboxOptions,
  upload: uploadOptions,
  illustration: illustrationOptions,
  typography: typographyOptions,
  link: linkOptions,
  walktour: walktourOptions,
  "walktour-step": walktourStepOptions,
} as const;
