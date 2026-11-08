"use client";

import {
  countUpAttributes,
  countUpOptions,
  countUpText,
  createCountUp,
  createMotionTrigger,
  type MotionTrigger,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

export interface CountUpProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "prefix"> {
  /** Value reached at the end; screen readers read it (with the prefix and suffix) from the start. */
  end: number;
  /** First value shown. Default 0. */
  start?: number | undefined;
  /** Digits after the decimal point. Default 0. */
  decimals?: number | undefined;
  /** Length of the count, ms. Default 2000. */
  duration?: number | undefined;
  /** Text before the number, such as "$". */
  prefix?: ReactNode;
  /** Text after the number, such as "k" or "+". */
  suffix?: ReactNode;
  /** `inView` (default): counts when scrolled into view; `mount`: right away; `manual`: on `in`. */
  trigger?: MotionTrigger | undefined;
  /** Manual trigger: counts when it turns on. Default `true`. */
  in?: boolean | undefined;
  /** In view: counts only the first time (default). */
  once?: boolean | undefined;
  /** In view: the visible fraction (0 to 1) that starts the count. Default 0.3. */
  amount?: number | undefined;
}

const finite = (value: number | undefined, fallback: number, min = Number.NEGATIVE_INFINITY) =>
  typeof value === "number" && Number.isFinite(value) && value >= min ? value : fallback;

/**
 * CountUp — spec: specs/components/motion.md. Counts up to `end` when it scrolls into view (the
 * reference's "Count up"). Reduced motion shows the end value at once.
 */
export const CountUp = forwardRef<HTMLSpanElement, CountUpProps>(function CountUp(
  {
    end,
    start,
    decimals,
    duration,
    prefix,
    suffix,
    trigger = "inView",
    in: shown,
    once = true,
    amount,
    ...props
  },
  ref,
) {
  const { options } = countUpOptions;
  const from = finite(start, 0);
  const to = finite(end, 0);
  const digits = Math.round(finite(decimals, 0, 0));
  const length = finite(duration, options.duration.default as number, 0);
  const visible = finite(amount, options.amount.default as number, 0);
  const own = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRefs(own, ref);
  const [text, setText] = useState(() => countUpText(from, to, 0, digits));
  const manualIn = trigger === "manual" ? shown !== false : undefined;

  useEffect(() => {
    const counter = createCountUp({
      start: from,
      end: to,
      duration: length,
      decimals: digits,
      onUpdate: setText,
    });
    const handle = createMotionTrigger(own.current as HTMLElement, {
      trigger,
      once,
      amount: visible,
      in: manualIn,
      onChange: (active) => {
        if (active) counter.run();
      },
    });
    return () => {
      handle.destroy();
      counter.destroy();
    };
  }, [from, to, length, digits, trigger, once, visible, manualIn]);

  return (
    <span
      ref={mergedRef}
      {...countUpAttributes({
        start,
        end,
        decimals,
        duration,
        trigger,
        once,
        amount,
      })}
      data-ok-runtime="off"
      {...(manualIn ? { "data-ok-in": "" } : {})}
      {...props}
    >
      <span data-ok-count-up-label="">
        {prefix}
        {countUpText(from, to, 1, digits)}
        {suffix}
      </span>
      <span aria-hidden="true">
        {prefix}
        <span data-ok-count-up-value="">{text}</span>
        {suffix}
      </span>
    </span>
  );
});
