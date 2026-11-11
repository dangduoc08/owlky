"use client";
/*
 * Shared values — spec: specs/components/motion.md (Shared values), ADR-0062 (5.4). Framer
 * Motion's `useMotionValue`, `useTransform`, `useSpring` and `useMotionValueEvent` on core's
 * framework-free store; Motion's `style` binds shared values through CSSOM (no re-render).
 */
import {
  bindStyle,
  type InterpolateOptions,
  interpolate,
  isSharedValue,
  motionValue,
  type SharedValue,
  type SpringValueOptions,
  sharedStyle,
  springValue,
} from "@owlky/core";
import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Framer's `useMotionValue`: a value that changes without re-rendering the component. */
export function useMotionValue<T>(initial: T): SharedValue<T> {
  const [value] = useState(() => motionValue(initial));
  return value;
}

/** Framer's `useMotionValueEvent`: calls `callback` after each change of `value`. */
export function useMotionValueEvent<T>(
  value: SharedValue<T>,
  event: "change",
  callback: (latest: T) => void,
): void {
  const latest = useRef(callback);
  latest.current = callback;
  useEffect(() => value.on(event, (next) => latest.current(next)), [value, event]);
}

/**
 * Framer's `useTransform`: a value computed from others, such as `useTransform(x, (v) => v * 2)`,
 * `useTransform([x, y], ([a, b]) => a + b)` or `useTransform(x, [0, 100], [1, 0])`.
 */
export function useTransform<T>(
  source: SharedValue<number>,
  transform: (value: number) => T,
): SharedValue<T>;
export function useTransform<T>(
  sources: readonly SharedValue<unknown>[],
  transform: (values: unknown[]) => T,
): SharedValue<T>;
export function useTransform(
  source: SharedValue<number>,
  input: readonly number[],
  output: readonly number[],
  options?: InterpolateOptions,
): SharedValue<number>;
export function useTransform(
  sources: SharedValue<number> | readonly SharedValue<unknown>[],
  transform: ((value: never) => unknown) | readonly number[],
  output?: readonly number[],
  options?: InterpolateOptions,
): SharedValue<unknown> {
  const list = (Array.isArray(sources) ? sources : [sources]) as SharedValue<unknown>[];
  const compute = (): unknown => {
    if (typeof transform === "function")
      return Array.isArray(sources)
        ? (transform as (values: unknown[]) => unknown)(list.map((value) => value.get()))
        : (transform as (value: unknown) => unknown)(list[0]?.get());
    return interpolate(transform, output as readonly number[], options)(Number(list[0]?.get()));
  };
  const latest = useRef(compute);
  latest.current = compute;
  const [derived] = useState(() => motionValue(compute()));
  // biome-ignore lint/correctness/useExhaustiveDependencies: the sources are the dependencies.
  useEffect(() => {
    const update = () => derived.set(latest.current());
    update();
    const offs = list.map((value) => value.on("change", update));
    return () => {
      for (const off of offs) off();
    };
  }, [derived, ...list]);
  return derived;
}

/**
 * Framer's `useSpring`: a number that follows its target with a spring. With a shared value it
 * follows that value; with a number it starts there and `set()` moves it. The options are read
 * once.
 */
export function useSpring(
  source: number | SharedValue<number>,
  options?: SpringValueOptions,
): SharedValue<number> {
  const [spring] = useState(() =>
    springValue(typeof source === "number" ? source : source.get(), options),
  );
  useEffect(() => {
    if (typeof source === "number") return;
    spring.set(source.get());
    return source.on("change", (value) => spring.set(value));
  }, [source, spring]);
  useEffect(() => () => spring.stop(), [spring]);
  return spring;
}

/**
 * Motion's `style` with shared values (Framer's `style={{ x }}`): the values render as they are
 * now and follow their changes through CSSOM. Returns the style to render.
 */
export function useSharedStyle(
  ref: RefObject<HTMLElement | null>,
  style: CSSProperties | Record<string, unknown> | undefined,
): CSSProperties | undefined {
  const entries = style
    ? Object.entries(style).filter((entry): entry is [string, SharedValue<unknown>] =>
        isSharedValue(entry[1]),
      )
    : [];
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || entries.length === 0) return;
    const offs = entries.map(([name, value]) => bindStyle(element, name, value));
    return () => {
      for (const off of offs) off();
    };
  });
  if (!style) return undefined;
  // Shared values and the transform shorthands become CSS; the rest stays as it is.
  const rest: Record<string, unknown> = {};
  const converted: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(style)) {
    if (isSharedValue(value)) converted[name] = value.get();
    else if (SHORTHANDS.has(name)) converted[name] = value;
    else rest[name] = value;
  }
  if (Object.keys(converted).length === 0) return style as CSSProperties;
  return { ...rest, ...sharedStyle(converted) } as CSSProperties;
}

const SHORTHANDS = new Set(["x", "y", "scale", "scaleX", "scaleY", "rotate"]);
