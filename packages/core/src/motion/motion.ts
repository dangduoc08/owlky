/*
 * Motion (the reference's "Animate", Framer Motion variants) shared by React and the HTML runtime:
 * the animation state machine, the private custom properties that tune the CSS animations, and
 * `createMotionTrigger`, which reports when an element should be shown (mount, in view, manual).
 * The owner writes `data-ok-state`; the CSS in `motion.css` plays the animations.
 */

/**
 * `initial`: before the entrance (in-variants hidden, out-variants shown); `enter`: the variant
 * plays; `exit`: it plays backwards. No state at all (no JavaScript): the content just shows.
 */
export type MotionState = "initial" | "enter" | "exit";

/** The state after the trigger reports `active`: an element that never entered doesn't exit. */
export const nextMotionState = (current: MotionState, active: boolean): MotionState =>
  active ? "enter" : current === "initial" ? "initial" : "exit";

export interface MotionStyleOptions {
  /** Entrance length, ms. */
  duration?: number | string | undefined;
  /** Wait before the entrance, ms. */
  delay?: number | string | undefined;
  /** Travel of directional variants, px. */
  distance?: number | string | undefined;
  /** Groups and texts: ms between their items. */
  stagger?: number | string | undefined;
  /** Groups and texts: the item's position (multiplies `stagger`). */
  index?: number | undefined;
}

type MotionStyle = Partial<Record<`--_ok-motion-${string}`, string>>;

/** Private custom properties for the given options (absent values keep the CSS defaults). */
export function motionStyle(options: MotionStyleOptions): MotionStyle {
  const style: MotionStyle = {};
  if (options.duration !== undefined) style["--_ok-motion-duration"] = `${options.duration}ms`;
  if (options.delay !== undefined) style["--_ok-motion-delay"] = `${options.delay}ms`;
  if (options.distance !== undefined) style["--_ok-motion-distance"] = `${options.distance}px`;
  if (options.stagger !== undefined) style["--_ok-motion-stagger"] = `${options.stagger}ms`;
  if (options.index !== undefined) style["--_ok-motion-index"] = String(options.index);
  return style;
}

export interface MotionTriggerOptions {
  trigger: "inView" | "mount" | "manual";
  /** In view: report only the first entrance. */
  once: boolean;
  /** In view: visible fraction (clamped to 0–1). */
  amount: number;
  /** Manual trigger: the current `in`. */
  in?: boolean | undefined;
  /** Called with `true` to show (enter) and `false` to hide (exit). */
  onChange(active: boolean): void;
}

export interface MotionTriggerHandle {
  /** Manual trigger: a new `in`. */
  update(active: boolean): void;
  destroy(): void;
}

/**
 * Reports when `element` should be shown. `mount` reports at once; `manual` reports `in` now and
 * on every `update`; `inView` watches the element with an IntersectionObserver (without one, it
 * shows at once: content must never stay hidden).
 */
export function createMotionTrigger(
  element: Element,
  options: MotionTriggerOptions,
): MotionTriggerHandle {
  let observer: IntersectionObserver | undefined;
  if (options.trigger === "mount") options.onChange(true);
  else if (options.trigger === "manual") options.onChange(options.in ?? true);
  else if (typeof IntersectionObserver === "undefined") options.onChange(true);
  else {
    const amount = Math.min(Math.max(options.amount, 0), 1);
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // A zero-area target (scaled to 0) reports a ratio of 1 while it intersects.
          const visible = entry.isIntersecting && entry.intersectionRatio >= amount - 0.001;
          if (visible) {
            options.onChange(true);
            if (options.once) observer?.disconnect();
          } else if (!options.once && !entry.isIntersecting) options.onChange(false);
        }
      },
      { threshold: [0, amount] },
    );
    observer.observe(element);
  }
  return {
    update(active) {
      if (options.trigger === "manual") options.onChange(active);
    },
    destroy() {
      observer?.disconnect();
    },
  };
}

/** Restarts the entrance: drops the state for one style flush, then enters again. */
export function replayMotion(
  element: HTMLElement,
  write: (state: MotionState | null) => void,
): void {
  write(null);
  void element.offsetWidth;
  write("enter");
}

/** One span per letter (spaces stay text between word spans), for MotionText. */
export interface MotionTextWord {
  letters: string[];
}

/** Splits text into words of letters (grapheme-ish: code points), keeping the spaces between words. */
export const splitMotionText = (text: string): MotionTextWord[] =>
  text
    .split(/\s+/)
    .filter((word) => word !== "")
    .map((word) => ({ letters: Array.from(word) }));
