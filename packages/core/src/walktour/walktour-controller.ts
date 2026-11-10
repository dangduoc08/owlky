import { getTabbables, isFocusable, trapTab } from "../dom/focus.js";
import { supports } from "../dom/support.js";
import { inertOutside } from "../overlay/inert-outside.js";
import { createPopoverController, type PopoverController } from "../popover/popover-controller.js";
import { type Placement, parsePlacement, type Rect } from "../popover/position.js";
import {
  autoPlacement,
  beaconPoint,
  formatWalktour,
  overlayPath,
  padRect,
  roundedRectPath,
  type WalktourContext,
  type WalktourOrigin,
  type WalktourState,
  walktourBeaconTriggers,
  walktourCloseButtonActions,
  walktourPlacements,
} from "./walktour-model.js";

/** What the user asked for: the owner runs it through `walktourTransition`. */
export type WalktourIntent = "next" | "prev" | "close" | "skip" | "open";

/** The element a step points at, the one it scrolls to, and the one in its spotlight. */
export type WalktourTargetKind = "target" | "scroll" | "spotlight";

export interface WalktourControllerOptions {
  /** A button, Escape, the overlay or the beacon asked for `intent`. The controller changes nothing. */
  onIntent?: ((intent: WalktourIntent, origin: WalktourOrigin) => void) | undefined;
  /**
   * The step's target when it isn't a selector in `data-ok-target` (React elements and refs).
   * `undefined` falls back to the attribute. `kind` asks for the element to scroll to
   * (`scrollTarget`, `data-ok-scroll-target`) or to put in the spotlight (`spotlightTarget`,
   * `data-ok-spotlight-target`) instead; both default to the target.
   */
  resolveTarget?:
    | ((step: HTMLElement, index: number, kind: WalktourTargetKind) => Element | null | undefined)
    | undefined;
  /** Force the non-native fallback (tests, diagnostics); normally auto-detected. */
  forceFallback?: boolean | undefined;
}

export interface WalktourController {
  /** The step elements, in order. */
  readonly steps: HTMLElement[];
  /** The tour options the transitions need, read from the attributes now. */
  context(): WalktourContext;
  /** Shows `state`: the beacon or the tooltip of its step, or nothing when it isn't running. */
  render(state: WalktourState): void;
  /** Recomputes the spotlight, the beacon and the tooltip position. */
  update(): void;
  setOptions(options: WalktourControllerOptions): void;
  /** Hides everything without restoring focus and removes every listener. Idempotent. */
  destroy(): void;
}

/** Boolean options a step can override (`data-ok-<option>`, `"false"` turns a root option off). */
export const walktourStepFlags = [
  "data-ok-continuous",
  "data-ok-show-progress",
  "data-ok-show-skip-button",
  "data-ok-hide-back-button",
  "data-ok-hide-close-button",
  "data-ok-disable-beacon",
  "data-ok-disable-close-on-esc",
  "data-ok-disable-overlay",
  "data-ok-disable-overlay-close",
  "data-ok-spotlight-clicks",
  "data-ok-disable-scrolling",
  "data-ok-disable-focus-trap",
] as const;
export type WalktourStepFlag = (typeof walktourStepFlags)[number];

/** Gap between the spotlight and the tooltip's arrow tip, plus the arrow (12px) itself. */
const TOOLTIP_GAP = 20;
/** Beacon diameter (`--_ok-beacon-size` in walktour.css: 36px). */
export const WALKTOUR_BEACON_SIZE = 36;

const DEFAULTS = {
  spotlightPadding: 10,
  spotlightRadius: 16,
  scrollOffset: 20,
  scrollDuration: 300,
  targetWaitTimeout: 1000,
  beforeTimeout: 5000,
} as const;

/** An element or one of its ancestors is fixed (react-joyride's `hasPosition`): scrolling never moves it. */
function isFixed(element: Element): boolean {
  const doc = element.ownerDocument;
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node === doc.body || node === doc.documentElement) return false;
    if (getComputedStyle(node).position === "fixed") return true;
  }
  return false;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const px = (value: number) => `${value}px`;

/** A non-negative number from an attribute, or `fallback`. */
function readPx(element: Element, attr: string, fallback: number): number {
  const text = element.getAttribute(attr);
  if (text === null || text.length > 16 || !/^\d+(?:\.\d+)?$/.test(text.trim())) return fallback;
  return Number(text);
}

/** `selector` in `from`'s document, or `null` (an invalid selector is no target, never an error). */
function query(from: Element, selector: string): Element | null {
  if (!selector || selector.length > 512) return null;
  try {
    return (from.getRootNode() as Document | ShadowRoot).querySelector(selector);
  } catch {
    return null;
  }
}

/** The nearest ancestor that scrolls vertically, or the page. */
function scrollParent(element: Element): Element {
  const doc = element.ownerDocument;
  for (let node = element.parentElement; node && node !== doc.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight)
      return node;
  }
  return doc.scrollingElement as Element;
}

/**
 * Walktour behavior shared by React and the HTML runtime (ADR-0039). It renders a state the owner
 * keeps: the step's tooltip is a Popover (`createPopoverController`, top layer, anchored to the
 * target), the overlay a Backdrop shown in the top layer under it with an SVG path that leaves a
 * rounded cut-out around the target (the spotlight), the beacon a button on the target's edge.
 * Positions and the cut-out go through CSSOM and SVG attributes. Buttons, Escape, the overlay and
 * the beacon only report intent (`onIntent`).
 */
export function createWalktourController(
  root: HTMLElement,
  initialOptions: WalktourControllerOptions = {},
): WalktourController {
  let options = initialOptions;
  const fallback = options.forceFallback === true || !supports.popover;
  const doc = root.ownerDocument;
  const win = doc.defaultView as Window;
  const listeners = new AbortController();
  const popovers = new Map<HTMLElement, PopoverController>();
  let openStep: HTMLElement | null = null;
  let openTarget: Element | null = null;
  /** The element in the spotlight: the step's `spotlightTarget`, else its target. */
  let openSpotlight: Element | null = null;
  let scrollFrame = 0;
  let beaconTarget: Element | null = null;
  let beaconStep: HTMLElement | null = null;
  let rendered: WalktourState | null = null;
  let returnFocus: HTMLElement | null = null;
  let resize: ResizeObserver | null = null;
  let frame = 0;
  let restoreInert: (() => void) | null = null;

  const overlay = () => root.querySelector<HTMLElement>(":scope > [data-ok-walktour-overlay]");
  const beacon = () => root.querySelector<HTMLElement>(":scope > [data-ok-walktour-beacon]");
  const live = () => root.querySelector<HTMLElement>(":scope > [data-ok-walktour-live]");
  const stepsOf = () =>
    Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-ok-walktour-step]"));

  /** A boolean option: the step's attribute when it has one, else the root's. */
  const flag = (step: Element | null | undefined, attr: WalktourStepFlag) => {
    const value = step?.getAttribute(attr) ?? root.getAttribute(attr);
    return value !== null && value !== "false";
  };
  /** A number option: the step's attribute, else the root's, else the default. */
  const num = (step: Element, attr: string, fallbackValue: number) =>
    readPx(step, attr, readPx(root, attr, fallbackValue));

  /** A keyword option: the step's attribute when valid, else the root's, else the default. */
  const choice = <V extends string>(
    step: Element | null | undefined,
    attr: string,
    values: readonly V[],
    fallbackValue: V,
  ): V => {
    for (const value of [step?.getAttribute(attr), root.getAttribute(attr)])
      if (values.includes(value as V)) return value as V;
    return fallbackValue;
  };

  const placementOf = (step: Element) => {
    const value = step.getAttribute("data-ok-placement");
    return walktourPlacements.includes(value as never) ? (value as string) : "bottom";
  };

  function targetOf(
    step: HTMLElement,
    index: number,
    kind: WalktourTargetKind = "target",
  ): Element | null {
    const resolved = options.resolveTarget?.(step, index, kind);
    if (resolved !== undefined) return resolved?.isConnected ? resolved : null;
    const attr = kind === "target" ? "data-ok-target" : `data-ok-${kind}-target`;
    return query(root, step.getAttribute(attr) ?? "");
  }

  /** Centered steps: `center`, or the page itself (`body`) as target. */
  const centered = (step: HTMLElement, target: Element | null) =>
    placementOf(step) === "center" || target === doc.body || target === doc.documentElement;

  const available = (index: number) => {
    const step = stepsOf()[index];
    if (!step) return false;
    const target = targetOf(step, index);
    return target !== null || placementOf(step) === "center";
  };

  const viewport = () => ({ width: doc.documentElement.clientWidth, height: win.innerHeight });

  function spotlightRect(step: HTMLElement, target: Element | null): Rect | null {
    if (!target || centered(step, target)) return null;
    const rect = target.getBoundingClientRect();
    return padRect(
      { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      num(step, "data-ok-spotlight-padding", DEFAULTS.spotlightPadding),
    );
  }

  function updateOverlay() {
    const element = overlay();
    if (!element || !openStep) return;
    const rect = spotlightRect(openStep, openSpotlight);
    const radius = num(openStep, "data-ok-spotlight-radius", DEFAULTS.spotlightRadius);
    const cutout = rect ? roundedRectPath(rect, radius) : "";
    const { width, height } = viewport();
    element
      .querySelector("[data-ok-walktour-mask]")
      ?.setAttribute("d", overlayPath(width, height, cutout));
    element.querySelector("[data-ok-walktour-hole]")?.setAttribute("d", cutout);
  }

  function updateBeacon() {
    const element = beacon();
    if (!element || !beaconTarget || !beaconStep) return;
    const rect = beaconTarget.getBoundingClientRect();
    const box = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    // `beaconPlacement` (a side and alignment), else the step's placement.
    const own = beaconStep.getAttribute("data-ok-beacon-placement");
    const placement = own && own !== "auto" && own !== "center" ? own : placementOf(beaconStep);
    const side =
      placement === "auto" || placement === "center"
        ? "bottom"
        : parsePlacement(placement, "bottom");
    const point = beaconPoint(box, side, WALKTOUR_BEACON_SIZE);
    element.style.setProperty("--_ok-walktour-beacon-x", px(point.x));
    element.style.setProperty("--_ok-walktour-beacon-y", px(point.y));
  }

  /** `auto` → the side with the most room (measured with the tooltip's current size). */
  function resolvePlacement(step: HTMLElement, target: Element | null): Placement {
    const placement = placementOf(step);
    if (placement !== "auto") return parsePlacement(placement, "bottom");
    if (!target) return "bottom";
    const rect = spotlightRect(step, target) as Rect;
    return autoPlacement(rect, { width: step.offsetWidth, height: step.offsetHeight }, viewport());
  }

  function update() {
    if (openStep) {
      if (!centered(openStep, openTarget)) {
        popovers.get(openStep)?.setOptions(popoverOptions(openStep, openTarget));
      }
      updateOverlay();
    }
    updateBeacon();
  }

  const schedule = () => {
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  function observe(...elements: (Element | null)[]) {
    resize?.disconnect();
    for (const element of new Set(elements)) {
      if (!element) continue;
      resize ??= new ResizeObserver(schedule);
      resize.observe(element);
    }
  }

  const primaryOf = (step: HTMLElement) =>
    step.querySelector<HTMLElement>('[data-ok-walktour-action="primary"]');

  function popoverOptions(step: HTMLElement, target: Element | null) {
    const padding = num(step, "data-ok-spotlight-padding", DEFAULTS.spotlightPadding);
    const arrow = step.hasAttribute("data-ok-arrow") && !centered(step, target);
    return {
      placement: resolvePlacement(step, target),
      arrow: arrow ? 24 : 0,
      offset: padding + (arrow ? TOOLTIP_GAP : 8),
      closeOnOutside: false,
      closeOnEscape: !flag(step, "data-ok-disable-close-on-esc"),
      autoFocus: true,
      restoreFocus: false,
      initialFocus: () => {
        const primary = primaryOf(step);
        return isFocusable(primary) ? primary : getTabbables(step)[0];
      },
      onDismiss: () => options.onIntent?.("close", "escape"),
    };
  }

  function popoverOf(step: HTMLElement) {
    let popover = popovers.get(step);
    if (!popover) {
      popover = createPopoverController(step, { forceFallback: options.forceFallback });
      popovers.set(step, popover);
    }
    return popover;
  }

  function showOverlay(show: boolean, step?: HTMLElement) {
    const element = overlay();
    if (!element) return;
    const shown = element.hasAttribute("data-ok-open");
    if (show) {
      element.toggleAttribute("data-ok-spotlight-clicks", flag(step, "data-ok-spotlight-clicks"));
      if (shown) return;
      element.setAttribute("data-ok-open", "");
      if (fallback) element.setAttribute("data-ok-fallback", "");
      else {
        // Closed (no data-ok-open): safe to (re)declare and show.
        element.setAttribute("popover", "manual");
        element.showPopover();
      }
    } else if (shown) {
      element.removeAttribute("data-ok-open");
      if (!fallback && element.matches(":popover-open")) element.hidePopover();
    }
  }

  /** Tooltip parts the options show or hide, the live text and the size. */
  function decorate(step: HTMLElement, index: number, size: number) {
    const last = index === size - 1;
    const hide = (selector: string, hidden: boolean) => {
      for (const element of step.querySelectorAll<HTMLElement>(selector)) element.hidden = hidden;
    };
    hide('[data-ok-walktour-action="back"]', index === 0 || flag(step, "data-ok-hide-back-button"));
    hide('[data-ok-walktour-action="skip"]', last || !flag(step, "data-ok-show-skip-button"));
    hide('[data-ok-walktour-action="close"]', flag(step, "data-ok-hide-close-button"));
    hide("[data-ok-walktour-progress]", last || !flag(step, "data-ok-show-progress"));
    const width = readPx(step, "data-ok-width", 0);
    if (width > 0) step.style.setProperty("--_ok-walktour-width", px(width));
    else step.style.removeProperty("--_ok-walktour-width");
    const region = live();
    if (region) {
      const format = region.getAttribute("data-ok-format") ?? "Step {current} of {total}";
      region.textContent = formatWalktour(format, index, size);
    }
  }

  function closeTooltip() {
    if (!openStep) return;
    const step = openStep;
    openStep = null;
    openTarget = null;
    openSpotlight = null;
    popovers.get(step)?.close();
    step.removeAttribute("aria-modal");
    step.removeAttribute("data-ok-centered");
    setModal(false);
  }

  /** A modal step makes the page outside the tour inert (the overlay already blocks it). */
  function setModal(modal: boolean) {
    if (modal) restoreInert ??= inertOutside(root);
    else {
      restoreInert?.();
      restoreInert = null;
    }
  }

  function hideBeacon() {
    const element = beacon();
    if (element) element.hidden = true;
    beaconTarget = null;
    beaconStep = null;
  }

  /** Focus is in the tour (a step or the beacon), or was lost when one of them closed. */
  const focusInTour = () => {
    const active = doc.activeElement;
    return !active || active === doc.body || root.contains(active);
  };

  /** Scrolls `parent` to `top` in `duration` ms (eased; instant for 0 or reduced motion). */
  function animateScroll(parent: Element, top: number, duration: number) {
    if (scrollFrame) win.cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    const start = parent.scrollTop;
    const distance = top - start;
    const reduce = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // react-joyride: short distances take 50 ms.
    const time = reduce ? 0 : Math.abs(distance) < 100 ? Math.min(duration, 50) : duration;
    if (time <= 0 || distance === 0) {
      parent.scrollTo({ top, behavior: "instant" as ScrollBehavior });
      return;
    }
    const began = win.performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / time);
      parent.scrollTo({
        top: start + distance * easeInOut(t),
        behavior: "instant" as ScrollBehavior,
      });
      scrollFrame = t < 1 ? win.requestAnimationFrame(tick) : 0;
    };
    scrollFrame = win.requestAnimationFrame(tick);
  }

  function scrollTo(step: HTMLElement, target: Element, index: number) {
    if (flag(step, "data-ok-disable-scrolling")) return;
    if (index === 0 && !root.hasAttribute("data-ok-scroll-to-first-step")) return;
    // `scrollTarget`, else `spotlightTarget`: scrolled to on their own (no room for the tooltip).
    const other = targetOf(step, index, "scroll") ?? targetOf(step, index, "spotlight");
    const element = other ?? target;
    const parent = scrollParent(element);
    const page = parent === doc.scrollingElement;
    // A fixed target doesn't move when the page scrolls (react-joyride's `isFixed`).
    if (page && (step.hasAttribute("data-ok-is-fixed") || isFixed(element))) return;
    const view = viewport();
    let top: number;
    let bottom: number;
    if (other) {
      const box = other.getBoundingClientRect();
      top = box.top;
      bottom = box.bottom;
    } else {
      // Never centered here: the target has a spotlight.
      const rect = spotlightRect(step, target) as Rect;
      const [side] = resolvePlacement(step, target).split("-");
      const tooltip =
        step.offsetHeight +
        num(step, "data-ok-spotlight-padding", DEFAULTS.spotlightPadding) +
        TOOLTIP_GAP;
      top = side === "top" ? rect.y - tooltip : rect.y;
      bottom = side === "bottom" ? rect.y + rect.height + tooltip : rect.y + rect.height;
    }
    if (top >= 0 && bottom <= view.height) return;
    const offset = num(step, "data-ok-scroll-offset", DEFAULTS.scrollOffset);
    const base = page ? 0 : parent.getBoundingClientRect().top;
    animateScroll(
      parent,
      Math.max(0, parent.scrollTop + top - base - offset),
      num(step, "data-ok-scroll-duration", DEFAULTS.scrollDuration),
    );
  }

  function showTooltip(step: HTMLElement, index: number, size: number) {
    const target = targetOf(step, index);
    const center = centered(step, target);
    // `disableFocusTrap`: Tab may leave the step, so it isn't modal (the overlay still blocks presses).
    const modal =
      !flag(step, "data-ok-disable-overlay") &&
      !flag(step, "data-ok-spotlight-clicks") &&
      !flag(step, "data-ok-disable-focus-trap");
    const withOverlay = !flag(step, "data-ok-disable-overlay");
    const overlayShown = overlay()?.hasAttribute("data-ok-open") === true;
    // The overlay joins the top layer under the step: a step already open goes back on top.
    if (openStep !== step || (withOverlay && !overlayShown)) closeTooltip();
    hideBeacon();
    decorate(step, index, size);
    step.toggleAttribute("data-ok-centered", center);
    if (modal) step.setAttribute("aria-modal", "true");
    else step.removeAttribute("aria-modal");
    setModal(modal);
    showOverlay(withOverlay, step);
    openStep = step;
    openTarget = center ? null : target;
    openSpotlight = openTarget && (targetOf(step, index, "spotlight") ?? openTarget);
    observe(openTarget, openSpotlight);
    const popover = popoverOf(step);
    popover.setOptions(popoverOptions(step, openTarget));
    // Centered steps are placed by CSS; the controller still needs an element to measure.
    popover.open(openTarget ?? root);
    if (openTarget) scrollTo(step, openTarget, index);
    updateOverlay();
  }

  /** `takeFocus`: a step of a running tour closes to the beacon (not the tour's start). */
  function showBeacon(step: HTMLElement, index: number, takeFocus: boolean) {
    const hadFocus = takeFocus && focusInTour();
    closeTooltip();
    showOverlay(false);
    const element = beacon();
    const target = targetOf(step, index);
    if (!element) return;
    beaconStep = step;
    beaconTarget = target ?? root;
    observe(target);
    element.hidden = false;
    updateBeacon();
    if (hadFocus) element.focus();
  }

  function hideAll(restoreFocus: boolean) {
    const hadFocus = focusInTour();
    closeTooltip();
    hideBeacon();
    showOverlay(false);
    observe(null);
    root.removeAttribute("data-ok-status");
    const target = returnFocus;
    returnFocus = null;
    if (restoreFocus && hadFocus && isFocusable(target)) target.focus();
  }

  // Buttons and the beacon report what they ask for.
  root.addEventListener(
    "click",
    (event) => {
      const node = event.target as Element | null;
      if (rendered?.status !== "running" || !node) return;
      if (node.closest("[data-ok-walktour-beacon]")) {
        options.onIntent?.("open", "beacon");
        return;
      }
      if (node.closest("[data-ok-walktour-mask]")) {
        if (!flag(openStep, "data-ok-disable-overlay-close"))
          options.onIntent?.("close", "overlay");
        return;
      }
      const button = node.closest<HTMLElement>("[data-ok-walktour-action]");
      if (!button || !openStep?.contains(button) || button.getAttribute("aria-disabled") === "true")
        return;
      const action = button.getAttribute("data-ok-walktour-action") as string;
      const primary = flag(openStep, "data-ok-continuous") ? "next" : "close";
      const intents: Record<string, WalktourIntent> = {
        primary,
        back: "prev",
        skip: "skip",
        close: choice(openStep, "data-ok-close-button-action", walktourCloseButtonActions, "close"),
      };
      const intent = Object.hasOwn(intents, action) ? intents[action] : undefined;
      if (intent) options.onIntent?.(intent, action as WalktourOrigin);
    },
    { signal: listeners.signal },
  );
  // `beaconTrigger: "hover"`: a mouse entering the beacon opens the step (keys and taps click it).
  root.addEventListener(
    "pointerover",
    (event) => {
      const node = event.target as Element | null;
      if (
        rendered?.status !== "running" ||
        rendered.lifecycle !== "beacon" ||
        event.pointerType !== "mouse" ||
        !node?.closest("[data-ok-walktour-beacon]") ||
        choice(beaconStep, "data-ok-beacon-trigger", walktourBeaconTriggers, "click") !== "hover"
      )
        return;
      options.onIntent?.("open", "beacon");
    },
    { signal: listeners.signal },
  );
  // Tab stays in a modal step (the overlay blocks the page).
  root.addEventListener(
    "keydown",
    (event) => {
      if (
        openStep?.getAttribute("aria-modal") === "true" &&
        openStep.contains(event.target as Node)
      )
        trapTab(openStep, event);
    },
    { signal: listeners.signal },
  );
  win.addEventListener("resize", schedule, { signal: listeners.signal });
  win.addEventListener("scroll", schedule, {
    signal: listeners.signal,
    capture: true,
    passive: true,
  });

  return {
    get steps() {
      return stepsOf();
    },

    context() {
      const steps = stepsOf();
      return {
        size: steps.length,
        // The current step may override it.
        continuous: flag(steps[rendered?.index ?? -1], "data-ok-continuous"),
        disableBeacon: (index) => flag(steps[index], "data-ok-disable-beacon"),
        available,
        targetWaitTimeout: (index) =>
          num(steps[index] ?? root, "data-ok-target-wait-timeout", DEFAULTS.targetWaitTimeout),
        beforeTimeout: (index) =>
          num(steps[index] ?? root, "data-ok-before-timeout", DEFAULTS.beforeTimeout),
      };
    },

    render(state) {
      if (listeners.signal.aborted) return;
      const steps = stepsOf();
      const step = steps[state.index];
      if (state.waiting && state.status === "running") {
        // Waiting for a hook or a target: nothing shows, the tour keeps running.
        if (rendered?.status !== "running") returnFocus = doc.activeElement as HTMLElement | null;
        rendered = state;
        root.setAttribute("data-ok-status", state.status);
        closeTooltip();
        hideBeacon();
        showOverlay(false);
        observe(null);
        return;
      }
      if (state.status !== "running" || !step) {
        rendered = state;
        hideAll(true);
        return;
      }
      if (rendered?.status !== "running") {
        const active = doc.activeElement;
        returnFocus = active as HTMLElement | null;
      }
      root.setAttribute("data-ok-status", state.status);
      const wasRunning = rendered?.status === "running";
      rendered = state;
      if (state.lifecycle === "beacon") showBeacon(step, state.index, wasRunning);
      else showTooltip(step, state.index, steps.length);
    },

    update,

    setOptions(next) {
      options = { ...next, forceFallback: options.forceFallback };
    },

    destroy() {
      if (listeners.signal.aborted) return;
      hideAll(false);
      for (const popover of popovers.values()) popover.destroy();
      popovers.clear();
      resize?.disconnect();
      if (frame) win.cancelAnimationFrame(frame);
      if (scrollFrame) win.cancelAnimationFrame(scrollFrame);
      listeners.abort();
    },
  };
}
