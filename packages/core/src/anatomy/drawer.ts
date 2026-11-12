import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  parseNumber,
  pick,
  state,
  style,
} from "../options/define.js";

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
