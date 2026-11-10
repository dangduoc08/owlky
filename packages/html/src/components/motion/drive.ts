import {
  createMotionTrigger,
  type MotionState,
  motionOptions,
  nextMotionState,
  readBehavior,
  readMotionViewport,
  readNumber,
  readStyle,
  replayMotion,
} from "@owlky/core";

const { trigger, once, amount } = motionOptions.options;
const IN = "data-ok-in";
export const STATE = "data-ok-state";

export interface MotionDriver {
  readonly state: MotionState;
  replay(): void;
  destroy(): void;
}

/** Detail of the in-view events (`enter`, `leave`). */
export interface MotionViewportDetail {
  /** The visible fraction of the element (0 to 1) when it was reported. */
  ratio: number;
}

/**
 * Shared by the motion, motion-group and motion-text runtimes: reads the trigger options of
 * `element` (the same attributes in the three schemas), keeps the state and hands it to `write`.
 * `data-ok-in` changes are followed for the manual trigger. `onViewport` hears the in-view
 * entrances and exits (`data-ok-viewport-margin` / `-root` tune the viewport).
 */
export function driveMotion(
  element: HTMLElement,
  write: (state: MotionState | null) => void,
  onViewport?: (inView: boolean, detail: MotionViewportDetail) => void,
): MotionDriver {
  let state: MotionState = "initial";
  write(state);
  const handle = createMotionTrigger(element, {
    trigger: readStyle(element, trigger),
    once: readBehavior(element, once),
    amount: readNumber(element, amount) as number,
    in: element.hasAttribute(IN),
    ...readMotionViewport(element),
    onChange(active) {
      const next = nextMotionState(state, active);
      if (next === state) return;
      state = next;
      write(state);
    },
    onViewport(inView, entry) {
      onViewport?.(inView, { ratio: entry.intersectionRatio });
    },
  });
  const observer = new MutationObserver(() => handle.update(element.hasAttribute(IN)));
  observer.observe(element, { attributes: true, attributeFilter: [IN] });
  return {
    get state() {
      return state;
    },
    replay() {
      replayMotion(element, write);
      state = "enter";
    },
    destroy() {
      handle.destroy();
      observer.disconnect();
    },
  };
}
