import {
  type CollapseEasing,
  type CollapseOrientation,
  type CollapseTimeout,
  collapseOptions,
  parseCollapseEasing,
} from "../anatomy/anatomy.js";
import { parseNumber, readStyle } from "../options/define.js";

/**
 * Collapse — spec: specs/components/collapse.md, ADR-0044. The element is closed while it has
 * `hidden` (written by its owner); the controller watches that attribute and animates the size
 * between the collapsed size and the content's natural size. It owns no state.
 */

export type CollapseStatus = "entering" | "entered" | "exiting" | "exited";
export type CollapsePhase = "enter" | "entering" | "entered" | "exit" | "exiting" | "exited";

export interface CollapseCallbacks {
  /** `hidden` was removed: the enter animation is about to start. */
  onEnter?: ((node: HTMLElement) => void) | undefined;
  /** The enter animation started. */
  onEntering?: ((node: HTMLElement) => void) | undefined;
  /** The element is fully open. */
  onEntered?: ((node: HTMLElement) => void) | undefined;
  /** `hidden` was added: the exit animation is about to start. */
  onExit?: ((node: HTMLElement) => void) | undefined;
  /** The exit animation started. */
  onExiting?: ((node: HTMLElement) => void) | undefined;
  /** The element is fully closed. */
  onExited?: ((node: HTMLElement) => void) | undefined;
}

export interface CollapseControllerOptions extends CollapseCallbacks {
  orientation?: CollapseOrientation | undefined;
  collapsedSize?: number | string | undefined;
  timeout?: CollapseTimeout | undefined;
  easing?: CollapseEasing | undefined;
}

export interface CollapseController {
  readonly status: CollapseStatus;
  /** Replaces the options (callbacks included); used on the next change. */
  update(options: CollapseControllerOptions): void;
  /** Ends a running animation at its end state and stops watching. */
  destroy(): void;
}

export const COLLAPSE_STATE = "data-ok-state";

const CALLBACKS = {
  enter: "onEnter",
  entering: "onEntering",
  entered: "onEntered",
  exit: "onExit",
  exiting: "onExiting",
  exited: "onExited",
} as const satisfies Record<CollapsePhase, keyof CollapseCallbacks>;

/**
 * Duration in ms for a distance in px (Material Design's formula for `timeout="auto"`): longer
 * moves take longer, about 300ms for 120px, capped at 3s.
 */
export function autoCollapseDuration(size: number): number {
  if (!(size > 0)) return 0;
  const ratio = size / 36;
  return Math.min(Math.round((4 + 15 * ratio ** 0.25 + ratio / 5) * 10), 3000);
}

export interface CollapseStyle {
  "--_ok-collapsed-size"?: string;
  "--_ok-collapse-closed-display"?: string;
}

/**
 * Private custom properties of a collapse root (React `style`, HTML runtime CSSOM): a collapsed
 * size other than 0 keeps the closed element rendered at that size. Invalid → nothing (closed
 * means `display: none`).
 */
export function collapseStyle(options: {
  collapsedSize?: unknown;
  orientation?: unknown;
}): CollapseStyle {
  const size = parseNumber(collapseOptions.options.collapsedSize, options.collapsedSize);
  if (size === undefined || size === 0 || (typeof size === "string" && parseFloat(size) === 0))
    return {};
  return {
    "--_ok-collapsed-size": typeof size === "number" ? `${size}px` : size,
    "--_ok-collapse-closed-display": options.orientation === "horizontal" ? "flex" : "block",
  };
}

/** The timeout written on an element: `data-ok-timeout` (+ `data-ok-timeout-exit`). */
export function readCollapseTimeout(element: Element): CollapseTimeout | undefined {
  const read = (attr: string): number | "auto" | undefined => {
    const value = element.getAttribute(attr);
    if (value === null) return undefined;
    if (value.trim() === "auto") return "auto";
    const parsed = parseNumber(collapseOptions.options.timeout, value);
    return typeof parsed === "number" ? parsed : undefined;
  };
  const enter = read("data-ok-timeout");
  const exit = read("data-ok-timeout-exit");
  if (exit === undefined) return enter;
  if (enter === "auto" || exit === "auto") return "auto";
  return { ...(enter === undefined ? {} : { enter }), exit };
}

/** The easing written on an element: `data-ok-easing` (+ `data-ok-easing-exit`). */
export function readCollapseEasing(element: Element): CollapseEasing | undefined {
  const enter = parseCollapseEasing(element.getAttribute("data-ok-easing"));
  const exit = parseCollapseEasing(element.getAttribute("data-ok-easing-exit"));
  if (exit === undefined) return enter;
  return { ...(enter === undefined ? {} : { enter }), exit };
}

/** The options an HTML element carries (everything but the callbacks). */
export function readCollapseOptions(element: Element): CollapseControllerOptions {
  return {
    orientation: readStyle(element, collapseOptions.options.orientation),
    collapsedSize: element.getAttribute(collapseOptions.options.collapsedSize.attr) ?? undefined,
    timeout: readCollapseTimeout(element),
    easing: readCollapseEasing(element),
  };
}

const toMs = (value: string): number | undefined => {
  const match = /^([\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return undefined;
  const amount = Number(match[1]) * (match[2] === "s" ? 1000 : 1);
  return Number.isFinite(amount) ? amount : undefined;
};

const pickPhase = <T>(value: T | { enter?: T; exit?: T } | undefined, entering: boolean) =>
  value !== null && typeof value === "object"
    ? entering
      ? (value as { enter?: T }).enter
      : (value as { exit?: T }).exit
    : value;

export function createCollapseController(
  element: HTMLElement,
  initial: CollapseControllerOptions = {},
): CollapseController {
  let options = initial;
  let animation: Animation | null = null;
  let open = !element.hidden;
  let status: CollapseStatus = open ? "entered" : "exited";
  let display = "";
  let inlineDisplay = false;
  let easingWritten = false;

  const report = (phase: CollapsePhase) => options[CALLBACKS[phase]]?.(element);
  const horizontal = () => options.orientation === "horizontal";
  const property = () => (horizontal() ? "width" : "height");
  const remember = () => {
    const value = getComputedStyle(element).display;
    if (value !== "none") display = value;
  };
  if (open) remember();

  // Written `!important`: some resets hide `[hidden]` with an important rule (Tailwind's
  // preflight), which only an important inline declaration overrides.
  const writeDisplay = (value: string) => {
    element.style.setProperty("display", value, "important");
    inlineDisplay = true;
  };
  const clearDisplay = () => {
    if (inlineDisplay) element.style.removeProperty("display");
    inlineDisplay = false;
  };
  /** At rest: a closed collapse with a collapsed size stays rendered (a clipped slice). */
  const rest = () => {
    const closed = collapseStyle(options)["--_ok-collapse-closed-display"];
    if (!open && closed) writeDisplay(closed);
    else clearDisplay();
  };
  rest();

  const collapsed = () => {
    const size = parseNumber(collapseOptions.options.collapsedSize, options.collapsedSize);
    return size === undefined ? "0px" : typeof size === "number" ? `${size}px` : size;
  };
  const measure = () => {
    const box = element.getBoundingClientRect();
    return horizontal() ? box.width : box.height;
  };

  const timing = (entering: boolean, distance: number) => {
    const css = getComputedStyle(element);
    if (css.getPropertyValue("--_ok-collapse-reduce").trim() === "1") return null;
    const timeout = pickPhase(options.timeout, entering);
    const duration =
      timeout === "auto"
        ? autoCollapseDuration(distance)
        : typeof timeout === "number" && Number.isFinite(timeout) && timeout >= 0
          ? timeout
          : (toMs(css.getPropertyValue("--_ok-collapse-duration")) ?? 0);
    if (duration === 0) return null;
    // The easing goes through the custom property, so `var(--ok-easing-*)` resolves.
    const easing = parseCollapseEasing(pickPhase(options.easing, entering));
    if (easing !== undefined) {
      element.style.setProperty("--_ok-collapse-easing", easing);
      easingWritten = true;
    } else if (easingWritten) {
      element.style.removeProperty("--_ok-collapse-easing");
      easingWritten = false;
    }
    let resolved = getComputedStyle(element).getPropertyValue("--_ok-collapse-easing").trim();
    if (easingWritten && !CSS.supports("animation-timing-function", resolved)) {
      element.style.removeProperty("--_ok-collapse-easing");
      easingWritten = false;
      resolved = getComputedStyle(element).getPropertyValue("--_ok-collapse-easing").trim();
    }
    return { duration, easing: resolved || "ease" };
  };

  /** Current animated size, then stops the animation (an interruption starts from there). */
  const stop = (): string | null => {
    if (!animation) return null;
    const current = getComputedStyle(element)[property()];
    animation.cancel();
    animation = null;
    return current;
  };

  const settle = (entering: boolean) => {
    animation = null;
    element.removeAttribute(COLLAPSE_STATE);
    rest();
    status = entering ? "entered" : "exited";
    report(entering ? "entered" : "exited");
  };

  const run = (entering: boolean) => {
    const from = stop();
    if (entering) clearDisplay();
    report(entering ? "enter" : "exit");
    status = entering ? "entering" : "exiting";
    if (entering) remember();
    else if (getComputedStyle(element).display === "none") {
      // Author CSS (`[hidden] { display: none }`) would hide it at once: keep it rendered.
      writeDisplay(display || "block");
    }
    element.setAttribute(COLLAPSE_STATE, entering ? "entering" : "exiting");
    const natural = measure();
    const start = from ?? (entering ? collapsed() : `${natural}px`);
    const end = entering ? `${natural}px` : collapsed();
    const time = timing(entering, natural);
    if (!time || typeof element.animate !== "function") {
      report(entering ? "entering" : "exiting");
      settle(entering);
      return;
    }
    const prop = property();
    const current = element.animate([{ [prop]: start }, { [prop]: end }], time);
    animation = current;
    // A cancelled animation (interrupted, destroyed) rejects: the newer one settles instead.
    current.finished.then(
      () => {
        if (animation === current) settle(entering);
      },
      () => undefined,
    );
    report(entering ? "entering" : "exiting");
  };

  const observer = new MutationObserver(() => {
    const next = !element.hidden;
    if (next === open) return;
    open = next;
    run(next);
  });
  observer.observe(element, { attributes: true, attributeFilter: ["hidden"] });

  return {
    get status() {
      return status;
    },
    update(next) {
      options = next;
      if (!animation) rest();
    },
    destroy() {
      observer.disconnect();
      // Ends at the end state without reporting it (the owner is going away).
      stop();
      element.removeAttribute(COLLAPSE_STATE);
      clearDisplay();
      if (easingWritten) element.style.removeProperty("--_ok-collapse-easing");
      easingWritten = false;
      status = open ? "entered" : "exited";
    },
  };
}
