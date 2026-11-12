import { type PaletteColorName, paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import { type Placement, placements } from "../popover/position.js";
import {
  type WalktourBeaconTrigger,
  type WalktourCloseButtonAction,
  type WalktourPlacement,
  walktourBeaconTriggers,
  walktourCloseButtonActions,
  walktourPlacements,
} from "../walktour/walktour-model.js";

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
