import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
} from "../options/define.js";

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
