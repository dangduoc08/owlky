import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  style,
} from "../options/define.js";
import { type ToastPosition, toastPositions } from "../toast/toast-store.js";

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
