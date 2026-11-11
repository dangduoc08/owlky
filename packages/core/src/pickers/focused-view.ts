/*
 * Focused view (MUI X `focusedView` / `onFocusedViewChange`, roadmap 4.18.30): which view of a
 * calendar or a clock holds the focus. Shared by every calendar and clock owner (React, HTML).
 * The view of an element comes from the part it is in: the day grid (`day`), the month and year
 * radio groups, the time clock's listbox (the clock's current view), a digital clock's list
 * (`hours`) or a multi-section clock's column (`hours`, `minutes`, `seconds`, `meridiem`).
 */

/** A view that can hold the focus: a date view or a time view (with the meridiem column). */
export type PickerFocusedView =
  | "year"
  | "month"
  | "day"
  | "hours"
  | "minutes"
  | "seconds"
  | "meridiem";

const PARTS =
  "[data-ok-day-calendar], [data-ok-month-calendar], [data-ok-year-calendar], [data-ok-time-clock-options], [data-ok-digital-clock-section], [data-ok-digital-clock-list]";

/** The view `target` sits in, inside `root` (`null`: none, or outside `root`). */
export function pickerViewOf(root: Element, target: Element | null): PickerFocusedView | null {
  const part = target?.closest(PARTS);
  if (!part || !root.contains(part)) return null;
  if (part.hasAttribute("data-ok-day-calendar")) return "day";
  if (part.hasAttribute("data-ok-month-calendar")) return "month";
  if (part.hasAttribute("data-ok-year-calendar")) return "year";
  if (part.hasAttribute("data-ok-time-clock-options"))
    return (part.closest("[data-ok-time-clock]")?.getAttribute("data-ok-view") ??
      "hours") as PickerFocusedView;
  if (part.hasAttribute("data-ok-digital-clock-section"))
    return part.getAttribute("data-ok-digital-clock-section") as PickerFocusedView;
  return "hours";
}

/** The element that takes the focus for `view` inside `root`, or `null` (the view isn't shown). */
export function pickerViewTarget(root: Element, view: PickerFocusedView): HTMLElement | null {
  // Every view has one tab stop (roving tabindex; the time clock's listbox itself).
  for (const node of root.querySelectorAll<HTMLElement>('[tabindex="0"]'))
    if (!node.closest("[hidden]") && pickerViewOf(root, node) === view) return node;
  return null;
}

/**
 * Moves the focus into `view` (its tab stop) unless it is there already. Returns whether the
 * view holds the focus afterwards.
 */
export function focusPickerViewPart(root: Element, view: PickerFocusedView): boolean {
  if (pickerViewOf(root, document.activeElement) === view) return true;
  const target = pickerViewTarget(root, view);
  target?.focus();
  return target !== null && document.activeElement === target;
}

export interface FocusedViewTracker {
  /** The view that holds the focus, or `null`. */
  readonly view: PickerFocusedView | null;
  /** Checks the focused element again (the view changed while it kept the focus). */
  sync(): void;
  destroy(): void;
}

/**
 * Reports `onChange(view, hasFocus)` when the focus enters a view of `root` (`true`), leaves it
 * (`false`) or moves to another view (`false` for the old one, then `true`).
 */
export function createFocusedViewTracker(
  root: HTMLElement,
  onChange: (view: PickerFocusedView, hasFocus: boolean) => void,
): FocusedViewTracker {
  let view: PickerFocusedView | null = null;
  const update = (next: PickerFocusedView | null) => {
    if (next === view) return;
    const previous = view;
    view = next;
    if (previous) onChange(previous, false);
    if (next) onChange(next, true);
  };
  const onFocusIn = (event: FocusEvent) => update(pickerViewOf(root, event.target as Element));
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Element | null;
    update(next && root.contains(next) ? pickerViewOf(root, next) : null);
  };
  const sync = () => {
    const active = document.activeElement;
    update(active && root.contains(active) ? pickerViewOf(root, active) : null);
  };
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  // A clock that changes its view keeps the focus on its listbox, and a removed view drops the
  // focus without a `focusout` in some engines: check again after the owner's renders.
  const observer = new MutationObserver(sync);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-ok-view", "hidden"],
  });
  return {
    get view() {
      return view;
    },
    sync,
    destroy() {
      observer.disconnect();
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
    },
  };
}
