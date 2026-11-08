/**
 * Clock controllers (ADR-0026). Both report intent; the owner renders.
 *
 * `createTimeClockController` — the analog clock: a press or a drag on the face
 * (`[data-ok-time-clock-dial]`) picks the number under the pointer, keys on the listbox
 * (`[data-ok-time-clock-options]`) step it, Enter finishes the view.
 *
 * `createDigitalClockController` — the digital clocks: lists (`[role=listbox]`) of
 * `[data-ok-digital-clock-item]` options. Arrows, Page Up / Down, Home / End move focus inside a
 * list; Enter, Space or a press selects.
 */
import { clockValueFromPoint, stepTimeUnit, type TimeView } from "./time.js";

export interface TimeClockControllerState {
  view: TimeView;
  /** The view's current number, or `null` (no value). */
  unit: number | null;
  ampm: boolean;
  /** Minutes and seconds snap to this (MUI `minutesStep` for the minutes view). */
  step: number;
  disabled: boolean;
  readOnly: boolean;
  /** The number can't be picked. */
  isDisabled(unit: number): boolean;
}

export interface TimeClockControllerOptions {
  read(): TimeClockControllerState;
  /** A new number: `finish` after a release or Enter (the owner moves to the next view). */
  onChange(unit: number, finish: boolean): void;
}

export interface TimeClockController {
  destroy(): void;
}

const KEY_STEP: Record<string, number | "min" | "max"> = {
  ArrowUp: 1,
  ArrowDown: -1,
  PageUp: 5,
  PageDown: -5,
  Home: "min",
  End: "max",
};

/** 24-hour clocks: under this share of the face's width, a press picks the inner ring (MUI). */
const INNER_RING = 74 / 220;

export function createTimeClockController(
  root: HTMLElement,
  options: TimeClockControllerOptions,
): TimeClockController {
  const controller = new AbortController();
  const { signal } = controller;
  let pressed: number | null = null;
  let last: number | null = null;

  const dial = () => root.querySelector<HTMLElement>("[data-ok-time-clock-dial]");
  const listbox = () => root.querySelector<HTMLElement>("[data-ok-time-clock-options]");
  const editable = (state: TimeClockControllerState) => !state.disabled && !state.readOnly;

  const unitAt = (event: PointerEvent): number | null => {
    const face = dial() as HTMLElement;
    const rect = face.getBoundingClientRect();
    if (rect.width === 0) return null;
    const state = options.read();
    const unit = clockValueFromPoint(
      state.view,
      event.clientX - (rect.left + rect.width / 2),
      event.clientY - (rect.top + rect.height / 2),
      {
        ampm: state.ampm,
        step: state.view === "hours" ? 1 : state.step,
        innerRadius: rect.width * INNER_RING,
      },
    );
    return state.isDisabled(unit) ? null : unit;
  };

  root.addEventListener(
    "pointerdown",
    (event) => {
      const face = dial();
      if (!face?.contains(event.target as Node) || event.button !== 0) return;
      const state = options.read();
      if (!editable(state)) return;
      // Keeps the press from selecting text; focus goes to the listbox for the keyboard.
      event.preventDefault();
      listbox()?.focus({ preventScroll: true });
      pressed = event.pointerId;
      try {
        // Keeps the drag on the face when the pointer leaves it.
        face.setPointerCapture(event.pointerId);
      } catch {
        // A pointer the browser doesn't track (synthetic events): no capture needed.
      }
      last = unitAt(event);
      if (last !== null) options.onChange(last, false);
    },
    { signal },
  );

  root.addEventListener(
    "pointermove",
    (event) => {
      if (pressed !== event.pointerId) return;
      const unit = unitAt(event);
      if (unit === null || unit === last) return;
      last = unit;
      options.onChange(unit, false);
    },
    { signal },
  );

  const release = (event: PointerEvent, finish: boolean) => {
    if (pressed !== event.pointerId) return;
    pressed = null;
    const unit = finish ? (unitAt(event) ?? last) : null;
    last = null;
    if (unit !== null) options.onChange(unit, true);
  };
  root.addEventListener("pointerup", (event) => release(event, true), { signal });
  root.addEventListener("pointercancel", (event) => release(event, false), { signal });

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented || event.target !== listbox()) return;
      const state = options.read();
      if (event.key === "Enter") {
        if (!editable(state) || state.unit === null) return;
        event.preventDefault();
        options.onChange(state.unit, true);
        return;
      }
      const step = KEY_STEP[event.key];
      if (step === undefined || event.altKey) return;
      event.preventDefault();
      if (!editable(state)) return;
      const keyStep = state.view === "hours" ? 1 : state.step;
      const from = state.unit ?? (state.view === "hours" && state.ampm ? 12 : 0);
      let unit =
        typeof step === "number"
          ? stepTimeUnit(state.view, from, step * keyStep, state.ampm)
          : stepTimeUnit(state.view, from, step, state.ampm);
      // Skip numbers that can't be picked (at most one turn).
      for (let i = 0; i < 60 && state.isDisabled(unit); i++) {
        if (typeof step !== "number") break;
        unit = stepTimeUnit(state.view, unit, Math.sign(step) * keyStep, state.ampm);
      }
      if (!state.isDisabled(unit)) options.onChange(unit, false);
    },
    { signal },
  );

  return {
    destroy() {
      controller.abort();
    },
  };
}

export interface DigitalClockControllerOptions {
  /** Disabled and read-only clocks only move focus. */
  read(): { disabled: boolean; readOnly: boolean };
  /** An option was chosen (press, Enter or Space). */
  onSelect(item: HTMLElement): void;
}

export interface DigitalClockController {
  /** Focuses list `index`'s selected option (else its first enabled one). */
  focusList(index: number): void;
  /** Scrolls every list so its selected option is at the top (as MUI does when it opens). */
  scrollToSelected(): void;
  destroy(): void;
}

const ITEM = "[data-ok-digital-clock-item]";

/**
 * Scrolls every digital clock list inside `root` so its selected option is at the top (MUI, when
 * a clock appears: pickers call it after they open).
 */
export function scrollDigitalClocks(root: Element): void {
  for (const list of root.querySelectorAll<HTMLElement>('[role="listbox"]')) {
    const selected = list.querySelector<HTMLElement>(`${ITEM}[aria-selected="true"]`);
    if (!selected) continue;
    list.scrollTop =
      selected.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
  }
}

export function createDigitalClockController(
  root: HTMLElement,
  options: DigitalClockControllerOptions,
): DigitalClockController {
  const controller = new AbortController();
  const { signal } = controller;
  const lists = () => [...root.querySelectorAll<HTMLElement>('[role="listbox"]')];
  const itemsOf = (list: Element) => [...list.querySelectorAll<HTMLElement>(ITEM)];
  const enabled = (item: HTMLElement) => item.getAttribute("aria-disabled") !== "true";
  const choose = (item: HTMLElement) => {
    const state = options.read();
    if (!enabled(item) || state.disabled || state.readOnly) return;
    options.onSelect(item);
  };

  root.addEventListener(
    "click",
    (event) => {
      const item = (event.target as Element).closest<HTMLElement>(ITEM);
      if (item && root.contains(item)) choose(item);
    },
    { signal },
  );

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented) return;
      const item = (event.target as Element).closest<HTMLElement>(ITEM);
      if (!item) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(item);
        return;
      }
      const list = item.closest('[role="listbox"]') as HTMLElement;
      const items = itemsOf(list).filter(enabled);
      if (items.length === 0) return;
      const at = Math.max(items.indexOf(item), 0);
      let next: number;
      switch (event.key) {
        case "ArrowDown":
          next = (at + 1) % items.length;
          break;
        case "ArrowUp":
          next = (at - 1 + items.length) % items.length;
          break;
        case "PageDown":
          next = Math.min(at + 5, items.length - 1);
          break;
        case "PageUp":
          next = Math.max(at - 5, 0);
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = items.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      items[next]?.focus();
    },
    { signal },
  );

  return {
    focusList(index) {
      const list = lists()[index];
      if (!list) return;
      const items = itemsOf(list);
      const target =
        items.find((item) => item.getAttribute("aria-selected") === "true") ?? items.find(enabled);
      target?.focus({ preventScroll: true });
    },
    scrollToSelected() {
      scrollDigitalClocks(root);
    },
    destroy() {
      controller.abort();
    },
  };
}
