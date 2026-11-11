/*
 * Exit before removal — spec: specs/components/motion.md, ADR-0062. An owner that is about to
 * remove, hide or close an element first writes its exit state and waits for the animations that
 * state starts (CSS animations and transitions, and the engine's script animations), then acts.
 * Used by Motion (React `MotionPresence`, HTML `exit()` / `hide()` / `remove()`) and the modal
 * controller (Dialog, Drawer).
 */

const STATE = "data-ok-state";
const MOTION = "[data-ok-motion], [data-ok-motion-group], [data-ok-motion-text]";

export interface AnimationWait {
  /** `true` once every animation ended; `false` when the wait was cancelled. Never rejects. */
  readonly finished: Promise<boolean>;
  /**
   * Whether there was anything to wait for when the wait started (read synchronously): `false`
   * means `finished` is about to resolve and the owner may act at once.
   */
  readonly running: boolean;
  /** Stops waiting (`finished` resolves `false`). */
  cancel(): void;
}

/** Finite animations running on `element` and its subtree (loops never end: skipped). */
export function runningAnimations(element: Element): Animation[] {
  return element.getAnimations({ subtree: true }).filter((animation) => {
    if (animation.playState === "finished" || animation.playState === "idle") return false;
    const end = animation.effect?.getComputedTiming().endTime;
    return typeof end === "number" && Number.isFinite(end);
  });
}

/**
 * Remaining time of an animation found by `runningAnimations`, ms (its end minus its current
 * time): such an animation always has an effect with a finite end and a current time.
 */
const remaining = (animation: Animation) => {
  const end = Number((animation.effect as AnimationEffect).getComputedTiming().endTime);
  const rate = Math.abs(animation.playbackRate) || 1;
  return Math.max(end - Number(animation.currentTime), 0) / rate;
};

/**
 * Waits for the finite animations of `elements` (and their subtrees) that are running now. With
 * `late`, it looks once more after a microtask (animations that a MutationObserver starts, such as
 * a Motion's keyframes). A safety timer resolves it after the longest remaining time plus 100 ms,
 * in case an animation never reports its end (a removed element).
 */
export function waitForAnimations(
  elements: Element | readonly Element[],
  {
    late = false,
    ignore,
  }: {
    late?: boolean;
    /** Animations that were running before the change: not waited for (they aren't the exit). */
    ignore?: ReadonlySet<Animation> | undefined;
  } = {},
): AnimationWait {
  const roots = Array.isArray(elements) ? (elements as readonly Element[]) : [elements as Element];
  // A style flush creates the CSS animations and transitions of a state written just before.
  for (const root of roots) if (root.isConnected) getComputedStyle(root).opacity;
  const fresh = (animation: Animation) => !ignore?.has(animation);
  const found = new Set(roots.flatMap(runningAnimations).filter(fresh));
  let resolve!: (value: boolean) => void;
  const finished = new Promise<boolean>((done) => {
    resolve = done;
  });
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const end = (value: boolean) => {
    if (settled) return;
    settled = true;
    if (timer !== undefined) clearTimeout(timer);
    resolve(value);
  };
  let generation = 0;
  const watch = (animations: Animation[]) => {
    const own = ++generation;
    const longest = Math.max(0, ...animations.map(remaining));
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => end(true), longest + 100);
    Promise.all(
      animations.map((a) =>
        a.finished.then(
          () => undefined,
          () => undefined,
        ),
      ),
    ).then(() => {
      if (own === generation && checked) end(true);
    });
  };
  let checked = !late;
  if (found.size > 0) watch([...found]);
  if (late) {
    queueMicrotask(() => {
      checked = true;
      if (settled) return;
      const more = roots.flatMap(runningAnimations).filter((a) => fresh(a) && !found.has(a));
      for (const animation of more) found.add(animation);
      if (found.size === 0) end(true);
      else watch([...found]);
    });
  } else if (found.size === 0) end(true);
  return {
    finished,
    running: found.size > 0 || late,
    cancel() {
      end(false);
    },
  };
}

export interface ExitHandle extends AnimationWait {
  /** Puts the state the element had before the exit back (after the owner closed or hid it). */
  restore(): void;
}

/**
 * Plays the exit of `element` and waits for it: a Motion gets `data-ok-state="exit"` (its CSS exit,
 * or its keyframes backwards), any other element `data-ok-state="exiting"` for its own CSS.
 * `cancel()` stops waiting and restores the previous state (an interrupted exit).
 */
export function playExit(element: HTMLElement): ExitHandle {
  const previous = element.getAttribute(STATE);
  const motion = element.matches(MOTION);
  // Only what the exit state starts counts: an entrance or a carousel slide still running doesn't.
  const before = new Set(runningAnimations(element));
  element.setAttribute(STATE, motion ? "exit" : "exiting");
  const restore = () => {
    if (element.getAttribute(STATE) !== (motion ? "exit" : "exiting")) return;
    if (previous === null) element.removeAttribute(STATE);
    else element.setAttribute(STATE, previous);
  };
  const wait = waitForAnimations(element, {
    ignore: before,
    late:
      element.matches("[data-ok-keyframes]") ||
      element.querySelector("[data-ok-keyframes]") !== null,
  });
  return {
    finished: wait.finished,
    get running() {
      return wait.running;
    },
    cancel() {
      wait.cancel();
      restore();
    },
    restore,
  };
}
