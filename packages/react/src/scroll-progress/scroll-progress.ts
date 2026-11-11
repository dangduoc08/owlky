"use client";
/*
 * Scroll progress — spec: specs/components/scroll-progress.md (ADR-0062, 5.2). Framer Motion's
 * `useScroll`: the `scroll` prop of LinearProgress / CircularProgress (`useScrollProgress`) and
 * `useScroll()` for your own drawing. Both resolve refs and ids, then hand over to core.
 */
import {
  createScrollProgress,
  type DataAttributes,
  observeScroll,
  type ScrollAxis,
  type ScrollInfo,
  type ScrollOffset,
  type ScrollOptions,
  scrollProgressAttributes,
} from "@owlky/core";
import { type RefObject, useEffect, useState } from "react";

/** An element: a ref, or the `id` of an element on the page (written to the markup). */
export type ScrollElement = RefObject<Element | null> | string;

export interface UseScrollOptions {
  /** The scroll container: a ref or an element `id`. Default: the page. */
  container?: ScrollElement | undefined;
  /** The element whose way through the container is measured: a ref or an `id`. Default: the whole content. */
  target?: ScrollElement | undefined;
  /** Scroll direction the progress follows: `y` (vertical) or `x` (horizontal). Default `"y"`. */
  axis?: ScrollAxis | undefined;
  /**
   * Where the progress is 0 and 1: two intersections of the target and the container, such as
   * `["start end", "end start"]`. Default `["start start", "end end"]`.
   */
  offset?: ScrollOffset | string | undefined;
}

const element = (input: ScrollElement | undefined): Element | null =>
  input === undefined
    ? null
    : typeof input === "string"
      ? document.getElementById(input)
      : input.current;

const resolve = (options: UseScrollOptions): ScrollOptions => ({
  container: element(options.container),
  target: element(options.target),
  axis: options.axis,
  offset: options.offset,
});

/** Attributes of a progress that follows the scroll (`scroll` prop), decorative (`aria-hidden`). */
export function scrollProgressProps(
  scroll: boolean | UseScrollOptions | undefined,
): DataAttributes & { "aria-hidden"?: "true" } {
  if (!scroll) return {};
  const options = scroll === true ? {} : scroll;
  return {
    ...scrollProgressAttributes({
      axis: options.axis,
      container: typeof options.container === "string" ? options.container : undefined,
      target: typeof options.target === "string" ? options.target : undefined,
      offset: options.offset,
    }),
    "aria-hidden": "true",
  };
}

/** What the effects depend on: options compared by value, refs by identity. */
const dependencies = (options: UseScrollOptions | boolean | undefined) => {
  const value = options === true ? {} : options || undefined;
  return [
    value !== undefined,
    value?.container,
    value?.target,
    value?.axis,
    value?.offset === undefined ? undefined : JSON.stringify(value.offset),
  ] as const;
};

/** Follows the scroll on `ref`'s element while `scroll` is set (core `createScrollProgress`). */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  scroll: boolean | UseScrollOptions | undefined,
): void {
  const [on, container, target, axis, offset] = dependencies(scroll);
  useEffect(() => {
    const node = ref.current;
    if (!on || !node) return;
    const controller = createScrollProgress(
      node,
      resolve({ container, target, axis, offset: offset && JSON.parse(offset) }),
    );
    return () => controller.destroy();
  }, [ref, on, container, target, axis, offset]);
}

const START: ScrollInfo = { scrollX: 0, scrollY: 0, scrollXProgress: 0, scrollYProgress: 0 };

/**
 * Framer Motion's `useScroll`: the scroll position (px) and progress (0–1) of the page, a
 * container or a target, per axis. Re-renders on scroll, at most once a frame; to draw a
 * progress, prefer the `scroll` prop of LinearProgress / CircularProgress (no re-render).
 */
export function useScroll(options: UseScrollOptions = {}): ScrollInfo {
  const [info, setInfo] = useState(START);
  const [, container, target, axis, offset] = dependencies(options);
  useEffect(
    () =>
      observeScroll(
        resolve({ container, target, axis, offset: offset && JSON.parse(offset) }),
        (next) =>
          setInfo((previous) =>
            previous.scrollX === next.scrollX &&
            previous.scrollY === next.scrollY &&
            previous.scrollXProgress === next.scrollXProgress &&
            previous.scrollYProgress === next.scrollYProgress
              ? previous
              : next,
          ),
      ),
    [container, target, axis, offset],
  );
  return info;
}
