"use client";

import {
  type AnimateOptions,
  createMotionKeyframes,
  createMotionTrigger,
  type MotionKeyframes,
  type MotionState,
  type MotionTrigger,
  type MotionVariant,
  motionAttributes,
  motionGroupAttributes,
  motionGroupOptions,
  motionKeyframesAttributes,
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
  type ElementType,
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
  /**
   * In view: grows (or, with negative values, shrinks) the viewport's box before the visible
   * fraction is measured, written like CSS margins in `px` or `%`, such as `"0px 0px -100px"`.
   */
  viewportMargin?: string | undefined;
  /** In view: the scrolling ancestor whose box counts as the viewport. Default: the browser viewport. */
  viewportRoot?: RefObject<Element | null> | undefined;
  /** In view: called when the element enters the viewport (the `amount` is visible). With `once`, the first time only. */
  onViewportEnter?: ((entry: IntersectionObserverEntry) => void) | undefined;
  /** In view with `once={false}`: called when the element leaves the viewport (nothing is visible). */
  onViewportLeave?: ((entry: IntersectionObserverEntry) => void) | undefined;
}

/** The state of the enclosing MotionGroup (its Motions follow it). */
const GroupState = createContext<MotionState | undefined>(undefined);

/**
 * What an enclosing MotionPresence tells the Motions inside it: whether their child is still
 * present (gone → they exit), whether to skip the first entrance, and where they register so
 * the presence can wait for their exit.
 */
export interface MotionPresenceContextValue {
  present: boolean;
  initial: boolean;
  register(element: HTMLElement): () => void;
}

export const MotionPresenceContext = createContext<MotionPresenceContextValue | null>(null);

/**
 * The state a Motion shows inside a presence: `exit` once its child is gone, nothing (no
 * animation, the content as is) while `initial={false}` skips the first entrance.
 */
function usePresence(ref: RefObject<HTMLElement | null>, state: MotionState): MotionState | null {
  const presence = useContext(MotionPresenceContext);
  const [skip] = useState(() => presence?.initial === false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!presence || !element) return;
    return presence.register(element);
  }, [presence, ref]);
  if (!presence) return state;
  if (!presence.present) return "exit";
  return skip ? null : state;
}

/** Plays the element's `data-ok-keyframes` (core player) while it has keyframes. */
function useKeyframes(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const player = createMotionKeyframes(element);
    return () => player.destroy();
  }, [ref, active]);
}

const numberOr = (spec: { default: number | undefined }, value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : spec.default;

/** `viewportMargin` isn't an option of the schema (free text): written as the HTML markup has it. */
const viewportAttributes = (margin: string | undefined) =>
  margin?.trim() ? { "data-ok-viewport-margin": margin.trim() } : {};

/** The animation state of `ref`, driven by its trigger (or by the enclosing group). */
function useMotionState(
  ref: RefObject<HTMLElement | null>,
  {
    trigger = "inView",
    in: shown,
    once = true,
    amount,
    viewportMargin,
    viewportRoot,
    onViewportEnter,
    onViewportLeave,
  }: MotionTriggerProps,
  follow: MotionState | undefined,
): MotionState {
  const [state, setState] = useState<MotionState>("initial");
  const driven = follow !== undefined;
  const manualIn = trigger === "manual" ? (shown ?? true) : undefined;
  // The latest handlers, without restarting the observer when they change.
  const handlers = useRef({ onViewportEnter, onViewportLeave });
  handlers.current = { onViewportEnter, onViewportLeave };
  useEffect(() => {
    const element = ref.current;
    if (driven || !element) return;
    const handle = createMotionTrigger(element, {
      trigger,
      once,
      amount: numberOr(motionOptions.options.amount, amount) as number,
      in: manualIn,
      margin: viewportMargin?.trim() || undefined,
      root: viewportRoot?.current,
      onChange: (active) => setState((current) => nextMotionState(current, active)),
      onViewport: (inView, entry) =>
        (inView ? handlers.current.onViewportEnter : handlers.current.onViewportLeave)?.(entry),
    });
    return () => handle.destroy();
  }, [ref, driven, trigger, once, amount, manualIn, viewportMargin, viewportRoot]);
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

export interface MotionProps extends HTMLAttributes<HTMLElement>, MotionTriggerProps {
  /** The element to render, such as `"section"` or `"li"`. Default `"div"`. */
  component?: ElementType | undefined;
  /** Animation. Default `fadeIn`. */
  variant?: MotionVariant | undefined;
  /**
   * Custom keyframes, played instead of the variant when the Motion enters and backwards when it
   * exits: a target or a list of values per property, such as `{ rotate: [0, 270], opacity: 0.5 }`
   * (`x` / `y` in px, `rotate` in degrees, `scale`, and any CSS property).
   */
  keyframes?: MotionKeyframes | undefined;
  /**
   * How the custom keyframes play: `duration`, `delay` and `repeatDelay` in ms, `ease`, `times`,
   * `repeat` (`Infinity` loops), `repeatType`, or `type: "spring"` with `stiffness`, `damping`,
   * `mass` or `bounce`.
   */
  transition?: AnimateOptions | undefined;
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
export const Motion = forwardRef<HTMLElement, MotionProps>(function Motion(
  {
    component: Root = "div",
    variant,
    keyframes,
    transition,
    trigger,
    in: shown,
    once,
    amount,
    delay,
    duration,
    distance,
    paused,
    viewportMargin,
    viewportRoot,
    onViewportEnter,
    onViewportLeave,
    style,
    children,
    ...props
  },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const state = useMotionState(
    own,
    {
      trigger,
      in: shown,
      once,
      amount,
      viewportMargin,
      viewportRoot,
      onViewportEnter,
      onViewportLeave,
    },
    useContext(GroupState),
  );
  const shownState = usePresence(own, state);
  const custom = motionKeyframesAttributes(keyframes, transition);
  useKeyframes(own, custom["data-ok-keyframes"] !== undefined);
  useReplayOnChange(own, `${variant}|${duration}|${distance}`);
  return (
    <Root
      ref={mergedRef}
      {...motionAttributes({ variant, trigger, once, amount, delay, duration, distance, paused })}
      {...custom}
      {...viewportAttributes(viewportMargin)}
      data-ok-state={shownState ?? undefined}
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
    </Root>
  );
});

const valid = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

export interface MotionGroupProps extends HTMLAttributes<HTMLElement>, MotionTriggerProps {
  /** The element to render, such as `"ul"` or `"section"`. Default `"div"`. */
  component?: ElementType | undefined;
  /** Milliseconds between the entrances of the direct child Motions. Default 50. */
  stagger?: number | undefined;
  /** Motions (direct children are staggered in order). */
  children?: ReactNode;
}

/**
 * MotionGroup — spec: specs/components/motion.md. Plays the Motions inside it together, one
 * direct child after the other (the reference's "MultiItem").
 */
export const MotionGroup = forwardRef<HTMLElement, MotionGroupProps>(function MotionGroup(
  {
    component: Root = "div",
    trigger,
    in: shown,
    once,
    amount,
    delay,
    stagger,
    viewportMargin,
    viewportRoot,
    onViewportEnter,
    onViewportLeave,
    style,
    children,
    ...props
  },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const state = useMotionState(
    own,
    {
      trigger,
      in: shown,
      once,
      amount,
      viewportMargin,
      viewportRoot,
      onViewportEnter,
      onViewportLeave,
    },
    undefined,
  );
  const groupState = usePresence(own, state);
  let index = 0;
  const items = Children.map(children, (child) => {
    if (!isValidElement<{ style?: CSSProperties }>(child)) return child;
    const position = index++;
    return cloneElement(child as ReactElement<{ style?: CSSProperties }>, {
      style: { ...child.props.style, ...motionStyle({ index: position }) } as CSSProperties,
    });
  });
  return (
    <Root
      ref={mergedRef}
      {...motionGroupAttributes({ trigger, once, amount, delay, stagger })}
      {...viewportAttributes(viewportMargin)}
      data-ok-state={groupState ?? undefined}
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
      <GroupState.Provider value={groupState ?? "enter"}>{items}</GroupState.Provider>
    </Root>
  );
});

export interface MotionTextProps
  extends Omit<HTMLAttributes<HTMLElement>, "children">,
    MotionTriggerProps {
  /** The element to render, such as `"h2"` or `"p"`. Default `"span"`. */
  component?: ElementType | undefined;
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
export const MotionText = forwardRef<HTMLElement, MotionTextProps>(function MotionText(
  {
    component: Root = "span",
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
    viewportMargin,
    viewportRoot,
    onViewportEnter,
    onViewportLeave,
    style,
    ...props
  },
  ref,
) {
  const own = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const state = useMotionState(
    own,
    {
      trigger,
      in: shown,
      once,
      amount,
      viewportMargin,
      viewportRoot,
      onViewportEnter,
      onViewportLeave,
    },
    undefined,
  );
  const textState = usePresence(own, state);
  useReplayOnChange(own, `${variant}|${duration}|${distance}`);
  const words = splitMotionText(children);
  let index = 0;
  return (
    <Root
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
      {...viewportAttributes(viewportMargin)}
      data-ok-state={textState ?? undefined}
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
    </Root>
  );
});
