"use client";

import { type AnimationWait, waitForAnimations } from "@owlky/core";
import {
  Children,
  isValidElement,
  type Key,
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { MotionPresenceContext, type MotionPresenceContextValue } from "./motion.js";

export interface MotionPresenceProps {
  /** Elements with a `key` that hold Motions. A removed one stays until its Motions have exited. */
  children?: ReactNode;
  /** `false` skips the first entrance of the children rendered with the presence. Default `true`. */
  initial?: boolean | undefined;
  /**
   * `sync` (default): new children enter while removed ones exit; `wait`: they enter after;
   * `popLayout`: a removed child leaves the layout at once (absolutely positioned where it was)
   * while it exits, so siblings with `layout` move into its place. Its Motion must be the child's
   * root element, inside a positioned parent.
   */
  mode?: "sync" | "wait" | "popLayout" | undefined;
  /** Called when every removed child has finished its exit. */
  onExitComplete?: (() => void) | undefined;
}

interface PresenceChildProps {
  present: boolean;
  initial: boolean;
  pop: boolean;
  onExited(): void;
  children: ReactNode;
}

const POPPED = ["position", "top", "left", "width", "height", "box-sizing"] as const;

/**
 * Takes `elements` out of the layout where they are (absolute, same box; reads before writes).
 * Returns the function that puts back their own inline styles.
 */
function popOut(elements: HTMLElement[]): () => void {
  const boxes = elements.map((element) => {
    const style = getComputedStyle(element);
    return {
      element,
      top: element.offsetTop - Number.parseFloat(style.marginTop),
      left: element.offsetLeft - Number.parseFloat(style.marginLeft),
      width: element.offsetWidth,
      height: element.offsetHeight,
      saved: POPPED.map((name) => [name, element.style.getPropertyValue(name)] as const),
    };
  });
  for (const { element, top, left, width, height } of boxes) {
    element.style.setProperty("position", "absolute");
    element.style.setProperty("top", `${top}px`);
    element.style.setProperty("left", `${left}px`);
    element.style.setProperty("width", `${width}px`);
    element.style.setProperty("height", `${height}px`);
    element.style.setProperty("box-sizing", "border-box");
  }
  return () => {
    for (const { element, saved } of boxes)
      for (const [name, value] of saved)
        if (value) element.style.setProperty(name, value);
        else element.style.removeProperty(name);
  };
}

/** One child: tells its Motions whether it is present and waits for their exit once it isn't. */
function PresenceChild({ present, initial, pop, onExited, children }: PresenceChildProps) {
  const elements = useRef(new Set<HTMLElement>());
  const exited = useRef(onExited);
  exited.current = onExited;
  const value = useMemo<MotionPresenceContextValue>(
    () => ({
      present,
      initial,
      register(element) {
        elements.current.add(element);
        return () => elements.current.delete(element);
      },
    }),
    [present, initial],
  );
  // popLayout: out of the flow in the same commit, before siblings are measured after it.
  useLayoutEffect(() => {
    if (present || !pop) return;
    const all = [...elements.current];
    const roots = all.filter(
      (element) => !all.some((other) => other !== element && other.contains(element)),
    );
    return popOut(roots);
  }, [present, pop]);
  useEffect(() => {
    if (present) return;
    const targets = [...elements.current];
    if (targets.length === 0) {
      exited.current();
      return;
    }
    let wait: AnimationWait | undefined = waitForAnimations(targets, { late: true });
    wait.finished.then((ended) => {
      if (ended) exited.current();
    });
    return () => {
      wait?.cancel();
      wait = undefined;
    };
  }, [present]);
  return <MotionPresenceContext.Provider value={value}>{children}</MotionPresenceContext.Provider>;
}

/** `Children.toArray` gives every element a key. */
const keyOf = (element: ReactElement): Key => element.key as Key;

/**
 * MotionPresence — spec: specs/components/motion.md (Framer Motion's `AnimatePresence`). Keeps a
 * removed child rendered until the Motions inside it have played their exit, then removes it.
 * Give every child a `key`.
 */
export function MotionPresence({
  children,
  initial = true,
  mode = "sync",
  onExitComplete,
}: MotionPresenceProps): ReactElement {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const exiting = useRef(new Map<Key, ReactElement>());
  const last = useRef<ReactElement[]>([]);
  const first = useRef(true);
  const complete = useRef(onExitComplete);
  complete.current = onExitComplete;

  const present = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const presentKeys = new Set(present.map(keyOf));
  for (const element of last.current) {
    const key = keyOf(element);
    if (!presentKeys.has(key) && !exiting.current.has(key)) exiting.current.set(key, element);
  }
  for (const key of presentKeys) exiting.current.delete(key);

  // Removed children keep their place among the present ones.
  const list: ReactElement[] = [...present];
  last.current.forEach((element, index) => {
    if (exiting.current.has(keyOf(element))) list.splice(Math.min(index, list.length), 0, element);
  });
  const rendered =
    mode === "wait" && exiting.current.size > 0
      ? list.filter((element) => exiting.current.has(keyOf(element)))
      : list;

  useLayoutEffect(() => {
    last.current = rendered;
    first.current = false;
  });

  return (
    <>
      {rendered.map((element) => {
        const key = keyOf(element);
        const gone = exiting.current.has(key);
        return (
          <PresenceChild
            key={key}
            present={!gone}
            initial={first.current ? initial : true}
            pop={mode === "popLayout"}
            onExited={() => {
              // Called once per exit: the effect runs again only when the child returns.
              exiting.current.delete(key);
              last.current = last.current.filter((item) => keyOf(item) !== key);
              rerender();
              if (exiting.current.size === 0) complete.current?.();
            }}
          >
            {element}
          </PresenceChild>
        );
      })}
    </>
  );
}
