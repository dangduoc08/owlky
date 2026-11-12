import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  parseNumber,
  state,
  style,
} from "../options/define.js";
import { paperElevations } from "./drawer.js";

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
  elevation: style(
    "data-ok-elevation",
    paperElevations,
    "24",
    "Shadow depth of the paper, `0`–`24` (`--ok-elevation-<n>`). Without it, the theme's dialog shadow.",
    { optional: true, children: "[data-ok-dialog-paper]" },
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
