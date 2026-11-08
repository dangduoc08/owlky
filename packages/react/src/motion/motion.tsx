"use client";

import {
  createMotionTrigger,
  type MotionState,
  type MotionTrigger,
  type MotionVariant,
  motionAttributes,
  motionGroupAttributes,
  motionGroupOptions,
  motionOptions,
  motionStyle,
  motionTextAttributes,
  motionTextOptions,
  nextMotionState,
  replayMotion,
  splitMotionText,
} from "@owlky/core";
import {
  Children,
  type CSSProperties,
  cloneElement,
  createContext,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

export interface MotionTriggerProps {
  /** `inView` (default): plays when scrolled into view; `mount`: right away; `manual`: follows `in`. */
  trigger?: MotionTrigger | undefined;
  /** Manual trigger: shown. Turning it off plays the exit. Default `true`. */
  in?: boolean | undefined;
  /** In view: plays only the first time (default). `false` also plays the exit when it leaves. */
  once?: boolean | undefined;
  /** In view: the visible fraction (0 to 1) that starts the animation. Default 0.3. */
  amount?: number | undefined;
  /** Wait before the entrance, ms. */
  delay?: number | undefined;
}

/** The state of the enclosing MotionGroup (its Motions follow it). */
const GroupState = createContext<MotionState | undefined>(undefined);

const numberOr = (spec: { default: number | undefined }, value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : spec.default;

/** The animation state of `ref`, driven by its trigger (or by the enclosing group). */
function useMotionState(
  ref: RefObject<HTMLElement | null>,
  { trigger = "inView", in: shown, once = true, amount }: MotionTriggerProps,
  follow: MotionState | undefined,
): MotionState {
  const [state, setState] = useState<MotionState>("initial");
  const driven = follow !== undefined;
  const manualIn = trigger === "manual" ? (shown ?? true) : undefined;
  useEffect(() => {
    const element = ref.current;
    if (driven || !element) return;
    const handle = createMotionTrigger(element, {
      trigger,
      once,
      amount: numberOr(motionOptions.options.amount, amount) as number,
      in: manualIn,
      onChange: (active) => setState((current) => nextMotionState(current, active)),
    });
    return () => handle.destroy();
  }, [ref, driven, trigger, once, amount, manualIn]);
  return follow ?? state;
}

/**
 * Replays an entered animation when how it looks changes (`variant`, `duration`, `distance`), as
 * the HTML runtime does when those attributes change. React keeps `data-ok-state` as "enter".
 */
function useReplayOnChange(ref: RefObject<HTMLElement | null>, look: string): void {
  const previous = useRef(look);
  useLayoutEffect(() => {
    if (previous.current === look) return;
    previous.current = look;
    const element = ref.current;
    if (element?.getAttribute("data-ok-state") !== "enter") return;
    replayMotion(element, (state) => {
      if (state === null) element.removeAttribute("data-ok-state");
      else element.setAttribute("data-ok-state", state);
    });
  }, [ref, look]);
}

export interface MotionProps extends HTMLAttributes<HTMLDivElement>, MotionTriggerProps {
  /** Animation. Default `fadeIn`. */
  variant?: MotionVariant | undefined;
  /** Entrance length, ms (default 640; loops: about 5 s). */
  duration?: number | undefined;
  /** Travel of directional variants, px (default 160 for slides, 120 for fades). */
  distance?: number | undefined;
  /** Pauses the animation (give looping variants a pause control: WCAG 2.2.2). */
  paused?: boolean | undefined;
  children?: ReactNode;
}

/**
 * Motion — spec: specs/components/motion.md. Animates its box in (or out) when it scrolls into
 * view, on mount or when `in` changes. Inside a MotionGroup it follows the group. To replay the
 * entrance, change its `key`.
 */
export const Motion = forwardRef<HTMLDivElement, MotionProps>(function Motion(
  {
    variant,
    trigger,
    in: shown,
    once,
    amount,
    delay,
    duration,
    distance,
    paused,
    style,
    children,
    ...props
  },
  ref,
) {
  const own = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const state = useMotionState(own, { trigger, in: shown, once, amount }, useContext(GroupState));
  useReplayOnChange(own, `${variant}|${duration}|${distance}`);
  return (
    <div
      ref={mergedRef}
      {...motionAttributes({ variant, trigger, once, amount, delay, duration, distance, paused })}
      data-ok-state={state}
      data-ok-runtime="off"
      {...(trigger === "manual" && (shown ?? true) ? { "data-ok-in": "" } : {})}
      style={
        {
          ...motionStyle({
            duration: valid(duration),
            delay: valid(delay),
            distance: valid(distance),
          }),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
});

const valid = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

export interface MotionGroupProps extends HTMLAttributes<HTMLDivElement>, MotionTriggerProps {
  /** Milliseconds between the entrances of the direct child Motions. Default 50. */
  stagger?: number | undefined;
  /** Motions (direct children are staggered in order). */
  children?: ReactNode;
}

/**
 * MotionGroup — spec: specs/components/motion.md. Plays the Motions inside it together, one
 * direct child after the other (the reference's "MultiItem").
 */
export const MotionGroup = forwardRef<HTMLDivElement, MotionGroupProps>(function MotionGroup(
  { trigger, in: shown, once, amount, delay, stagger, style, children, ...props },
  ref,
) {
  const own = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const state = useMotionState(own, { trigger, in: shown, once, amount }, undefined);
  let index = 0;
  const items = Children.map(children, (child) => {
    if (!isValidElement<{ style?: CSSProperties }>(child)) return child;
    const position = index++;
    return cloneElement(child as ReactElement<{ style?: CSSProperties }>, {
      style: { ...child.props.style, ...motionStyle({ index: position }) } as CSSProperties,
    });
  });
  return (
    <div
      ref={mergedRef}
      {...motionGroupAttributes({ trigger, once, amount, delay, stagger })}
      data-ok-state={state}
      data-ok-runtime="off"
      {...(trigger === "manual" && (shown ?? true) ? { "data-ok-in": "" } : {})}
      style={
        {
          ...motionStyle({
            delay: valid(delay),
            stagger: numberOr(motionGroupOptions.options.stagger, stagger),
          }),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <GroupState.Provider value={state}>{items}</GroupState.Provider>
    </div>
  );
});

export interface MotionTextProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children">,
    MotionTriggerProps {
  /** The text. Letters animate one after the other; assistive technologies read it whole. */
  children: string;
  /** Animation of each letter. Default `fadeIn`. */
  variant?: MotionVariant | undefined;
  /** Each letter's entrance, ms. */
  duration?: number | undefined;
  /** Travel of directional variants, px. */
  distance?: number | undefined;
  /** Milliseconds between letters. Default 25. */
  stagger?: number | undefined;
}

/** MotionText — spec: specs/components/motion.md. Animates a text letter by letter ("Text object"). */
export const MotionText = forwardRef<HTMLSpanElement, MotionTextProps>(function MotionText(
  {
    children,
    variant,
    trigger,
    in: shown,
    once,
    amount,
    delay,
    duration,
    distance,
    stagger,
    style,
    ...props
  },
  ref,
) {
  const own = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const state = useMotionState(own, { trigger, in: shown, once, amount }, undefined);
  useReplayOnChange(own, `${variant}|${duration}|${distance}`);
  const words = splitMotionText(children);
  let index = 0;
  return (
    <span
      ref={mergedRef}
      {...motionTextAttributes({
        variant,
        trigger,
        once,
        amount,
        delay,
        duration,
        distance,
        stagger,
      })}
      data-ok-state={state}
      data-ok-runtime="off"
      {...(trigger === "manual" && (shown ?? true) ? { "data-ok-in": "" } : {})}
      style={
        {
          ...motionStyle({
            duration: valid(duration),
            delay: valid(delay),
            distance: valid(distance),
            stagger: numberOr(motionTextOptions.options.stagger, stagger),
          }),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <span data-ok-motion-text-label="">{children}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: words are positional and never reorder.
          <Fragment key={w}>
            {w > 0 && " "}
            <span data-ok-motion-text-word="">
              {word.letters.map((letter, l) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: letters are positional and never reorder.
                  key={l}
                  data-ok-motion-char=""
                  style={motionStyle({ index: index++ }) as CSSProperties}
                >
                  {letter}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
});
