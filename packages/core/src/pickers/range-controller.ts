/**
 * Range calendar pointer controller (ADR-0028): the hover preview and drag editing of a range
 * calendar's days. It reports intent — the hovered day, the day an end is dragged over, the drop —
 * and never changes the range itself. Keys and presses stay with `createCalendarController`; after
 * a drop, the owner calls `consumeClick()` at the start of its pick handler so the click that ends
 * the drag isn't also a pick.
 *
 * Markup it reads: `button[data-ok-picker-day][data-ok-date]` with `data-ok-range-start` /
 * `data-ok-range-end` on the range's ends.
 */
import { parseIsoDate } from "./dates.js";
import type { RangePosition } from "./range.js";

export interface RangeDragControllerState {
  disabled: boolean;
  readOnly: boolean;
  disableDragEditing: boolean;
}

export interface RangeDragControllerOptions {
  read(): RangeDragControllerState;
  /** A mouse hovers a day (`null`: it left the days). */
  onPreview(date: Date | null): void;
  /** An end is dragged over `date` (pointer still down). */
  onDrag(date: Date, position: RangePosition): void;
  /** The drag ended on `date`: move that end there. */
  onDrop(date: Date, position: RangePosition): void;
  /** The drag was canceled (or ended where it started). */
  onDragEnd(): void;
}

export interface RangeDragController {
  /** `true` once after a drop: the click that follows isn't a pick. */
  consumeClick(): boolean;
  destroy(): void;
}

const DAY = "[data-ok-picker-day]";

export function createRangeDragController(
  root: HTMLElement,
  options: RangeDragControllerOptions,
): RangeDragController {
  const controller = new AbortController();
  const { signal } = controller;
  const doc = root.ownerDocument;
  let drag: {
    pointer: number;
    origin: string;
    position: RangePosition | null;
    moved: boolean;
  } | null = null;
  let suppress = false;

  const dayAt = (target: EventTarget | null) => {
    const day = (target as Element | null)?.closest?.<HTMLButtonElement>(DAY);
    return day && root.contains(day) && !day.disabled ? day : null;
  };
  const dateOf = (day: Element) => parseIsoDate(day.getAttribute("data-ok-date"));
  const editable = () => {
    const state = options.read();
    return !state.disabled && !state.readOnly;
  };

  root.addEventListener(
    "pointerover",
    (event) => {
      if (event.pointerType === "touch" || drag || !editable()) return;
      const day = dayAt(event.target);
      if (day) options.onPreview(dateOf(day));
    },
    { signal },
  );
  root.addEventListener(
    "pointerleave",
    () => {
      if (!drag) options.onPreview(null);
    },
    { signal },
  );

  root.addEventListener(
    "pointerdown",
    (event) => {
      suppress = false;
      if (event.button !== 0 || !editable() || options.read().disableDragEditing) return;
      const day = dayAt(event.target);
      if (!day) return;
      const start = day.hasAttribute("data-ok-range-start");
      const end = day.hasAttribute("data-ok-range-end");
      if (!start && !end) return;
      // A one-day range picks the end by the direction of the first move.
      drag = {
        pointer: event.pointerId,
        origin: day.getAttribute("data-ok-date") as string,
        position: start && end ? null : start ? "start" : "end",
        moved: false,
      };
      try {
        day.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic events have no active pointer: moves still reach the day's ancestors.
      }
    },
    { signal },
  );

  const over = (event: PointerEvent) => {
    // Touch pointers stay captured by the pressed day: find the day under the pointer.
    return dayAt(doc.elementFromPoint(event.clientX, event.clientY));
  };

  root.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      const day = over(event);
      if (!day) return;
      const iso = day.getAttribute("data-ok-date") as string;
      if (iso === drag.origin && !drag.moved) return;
      const date = dateOf(day);
      if (!date) return;
      drag.moved = true;
      drag.position ??= iso < drag.origin ? "start" : "end";
      event.preventDefault();
      options.onDrag(date, drag.position);
    },
    { signal },
  );

  const finish = (event: PointerEvent, drop: boolean) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const current = drag;
    drag = null;
    const day = drop ? over(event) : null;
    const date = day ? dateOf(day) : null;
    if (
      current.moved &&
      current.position &&
      date &&
      day?.getAttribute("data-ok-date") !== current.origin
    ) {
      suppress = true;
      options.onDrop(date, current.position);
      return;
    }
    if (current.moved) suppress = true;
    options.onDragEnd();
  };
  root.addEventListener("pointerup", (event) => finish(event, true), { signal });
  root.addEventListener("pointercancel", (event) => finish(event, false), { signal });
  root.addEventListener(
    "keydown",
    () => {
      suppress = false;
    },
    { signal },
  );

  return {
    consumeClick() {
      const was = suppress;
      suppress = false;
      return was;
    },
    destroy() {
      controller.abort();
    },
  };
}
