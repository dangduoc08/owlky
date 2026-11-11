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
  /** `sync` (default): new children enter while removed ones exit; `wait`: they enter after. */
  mode?: "sync" | "wait" | undefined;
  /** Called when every removed child has finished its exit. */
  onExitComplete?: (() => void) | undefined;
}

interface PresenceChildProps {
  present: boolean;
  initial: boolean;
  onExited(): void;
  children: ReactNode;
}

/** One child: tells its Motions whether it is present and waits for their exit once it isn't. */
function PresenceChild({ present, initial, onExited, children }: PresenceChildProps) {
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

const keyOf = (element: ReactElement): Key => element.key ?? "";

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
            onExited={() => {
              if (!exiting.current.delete(key)) return;
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
