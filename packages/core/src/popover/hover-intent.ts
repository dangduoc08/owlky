/*
 * Tooltip open / close timing (MUI Tooltip delays), shared by React and the HTML runtime. Reports
 * intent only: the owner opens or closes the tooltip in `onOpenChange`.
 *
 * - Mouse and pen: open `enterDelay` ms after entering the trigger, close `leaveDelay` ms (plus a
 *   100 ms grace, so the pointer can cross the gap) after leaving it — unless the pointer moved onto
 *   the tooltip (hoverable, WCAG 1.4.13).
 * - Keyboard focus: opens at once, closes on blur.
 * - Touch: a press held `enterTouchDelay` ms opens it; it closes `leaveTouchDelay` ms after release.
 */

export interface HoverIntentOptions {
  /** Default 100. */
  enterDelay?: number | undefined;
  /** Default 0. */
  leaveDelay?: number | undefined;
  /** Default 700. */
  enterTouchDelay?: number | undefined;
  /** Default 1500. */
  leaveTouchDelay?: number | undefined;
  onOpenChange: (open: boolean) => void;
}

export interface HoverIntent {
  readonly open: boolean;
  /** Pointer entered the trigger (`pointerType` from the event). */
  enter(pointerType?: string): void;
  /** Pointer left the trigger or the tooltip. */
  leave(): void;
  /** Pointer entered the tooltip itself: keep it open. */
  enterTooltip(): void;
  focus(): void;
  blur(): void;
  /** A touch press started on the trigger. */
  touchStart(): void;
  /** The touch press ended (or was canceled). */
  touchEnd(): void;
  /** Close now (Escape, the trigger was activated). */
  hide(): void;
  setOptions(options: HoverIntentOptions): void;
  /** Clears pending timers. */
  destroy(): void;
}

/** Time to cross the gap between the trigger and the tooltip without closing it. */
export const HOVER_GRACE = 100;

export function createHoverIntent(initial: HoverIntentOptions): HoverIntent {
  let options = initial;
  let open = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let focused = false;

  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const set = (next: boolean) => {
    clear();
    if (next === open) return;
    open = next;
    options.onOpenChange(next);
  };
  const later = (next: boolean, delay: number) => {
    clear();
    if (delay <= 0) set(next);
    else timer = setTimeout(() => set(next), delay);
  };

  return {
    get open() {
      return open;
    },
    enter(pointerType) {
      if (pointerType === "touch") return;
      later(true, options.enterDelay ?? 100);
    },
    leave() {
      if (focused) return;
      // Leaving before it opened cancels at once; an open tooltip waits for the grace time.
      if (!open) clear();
      else later(false, (options.leaveDelay ?? 0) + HOVER_GRACE);
    },
    enterTooltip() {
      if (open) clear();
    },
    focus() {
      focused = true;
      set(true);
    },
    blur() {
      focused = false;
      set(false);
    },
    touchStart() {
      later(true, options.enterTouchDelay ?? 700);
    },
    touchEnd() {
      if (open) later(false, options.leaveTouchDelay ?? 1500);
      else clear();
    },
    hide() {
      focused = false;
      set(false);
    },
    setOptions(next) {
      options = next;
    },
    destroy() {
      clear();
    },
  };
}
