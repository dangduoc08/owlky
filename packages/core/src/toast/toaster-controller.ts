/*
 * Toaster behavior shared by React and the HTML runtime (Sonner): swipe to dismiss, the hotkey
 * that expands and focuses the toasts, and the offset / gap custom properties. The controllers
 * report intent (`onDismiss`) and write only their own transient state (`data-ok-swiping`,
 * `data-ok-expanded`, `--_ok-swipe-*` through CSSOM).
 */
import type { ToastPosition } from "./toast-store.js";

export const swipeDirections = ["top", "right", "bottom", "left"] as const;
export type SwipeDirection = (typeof swipeDirections)[number];

/** Sonner's defaults: toward the vertical edge, and toward the side edge for corner positions. */
export function toastSwipeDirections(position: ToastPosition): SwipeDirection[] {
  const [y, x] = position.split("-") as [SwipeDirection, string];
  return x === "center" ? [y] : [y, x as SwipeDirection];
}

/** Valid directions from a list or a space-separated string, else `undefined`. */
export function parseSwipeDirections(value: unknown): SwipeDirection[] | undefined {
  // An empty attribute turns swiping off.
  if (typeof value === "string" && value.trim() === "") return [];
  const list = typeof value === "string" ? value.split(/\s+/) : Array.isArray(value) ? value : [];
  const valid = list.filter((d): d is SwipeDirection =>
    (swipeDirections as readonly unknown[]).includes(d),
  );
  return valid.length > 0 || (Array.isArray(value) && value.length === 0) ? valid : undefined;
}

/** Distance (px) or speed (px / ms) that dismisses a swiped toast (Sonner). */
export const SWIPE_THRESHOLD = 45;
export const SWIPE_VELOCITY = 0.11;

export interface ToastSwipeOptions {
  /** The directions allowed right now. */
  directions(): readonly SwipeDirection[];
  /** Whether this toast can be dismissed at all (`dismissible`). */
  enabled(): boolean;
  /** The toast was swiped away. */
  onDismiss(): void;
}

/**
 * Lets a pointer swipe a toast away. Presses on buttons and links don't start a swipe; a short
 * drag springs back. Keyboard users close toasts with the close button or Escape (WCAG 2.5.7).
 */
export function createToastSwipe(toast: HTMLElement, options: ToastSwipeOptions) {
  let start: { x: number; y: number; time: number; id: number } | null = null;
  let axis: "x" | "y" | null = null;
  const reset = () => {
    start = null;
    axis = null;
    toast.removeAttribute("data-ok-swiping");
    toast.style.removeProperty("--_ok-swipe-x");
    toast.style.removeProperty("--_ok-swipe-y");
  };
  const delta = (event: PointerEvent) => ({
    x: event.clientX - (start as { x: number }).x,
    y: event.clientY - (start as { y: number }).y,
  });
  /** The movement along `axis` that an allowed direction permits (0 otherwise, a little give). */
  const allowed = (d: { x: number; y: number }) => {
    const dirs = options.directions();
    const value = axis === "x" ? d.x : d.y;
    const forward = axis === "x" ? (value > 0 ? "right" : "left") : value > 0 ? "bottom" : "top";
    return dirs.includes(forward) ? value : value / (1 + Math.abs(value) / 8) / 4;
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || !options.enabled() || options.directions().length === 0) return;
    if ((event.target as Element).closest("button, a, input, select, textarea")) return;
    start = { x: event.clientX, y: event.clientY, time: event.timeStamp, id: event.pointerId };
  };
  const move = (event: PointerEvent) => {
    if (!start || event.pointerId !== start.id) return;
    const d = delta(event);
    if (axis === null) {
      if (Math.abs(d.x) < 4 && Math.abs(d.y) < 4) return;
      axis = Math.abs(d.x) > Math.abs(d.y) ? "x" : "y";
      toast.setAttribute("data-ok-swiping", "");
      try {
        toast.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointers can't be captured; the swipe still follows the events.
      }
    }
    const value = allowed(d);
    toast.style.setProperty(axis === "x" ? "--_ok-swipe-x" : "--_ok-swipe-y", `${value}px`);
  };
  const up = (event: PointerEvent) => {
    if (!start || event.pointerId !== start.id) return;
    const began = start;
    const d = delta(event);
    const dismiss =
      axis !== null &&
      (() => {
        const value = allowed(d);
        const raw = axis === "x" ? d.x : d.y;
        if (value !== raw) return false;
        const velocity = Math.abs(raw) / Math.max(1, event.timeStamp - began.time);
        return Math.abs(raw) >= SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY;
      })();
    reset();
    if (dismiss) options.onDismiss();
  };
  toast.addEventListener("pointerdown", down);
  toast.addEventListener("pointermove", move);
  toast.addEventListener("pointerup", up);
  toast.addEventListener("pointercancel", reset);
  return {
    destroy() {
      reset();
      toast.removeEventListener("pointerdown", down);
      toast.removeEventListener("pointermove", move);
      toast.removeEventListener("pointerup", up);
      toast.removeEventListener("pointercancel", reset);
    },
  };
}

/** Sonner's default hotkey: Alt + T (`event.altKey` and `event.code === "KeyT"`). */
export const TOASTER_HOTKEY = ["altKey", "KeyT"] as const;

/** Whether a key event presses every key of `hotkey` (modifiers by name, others by `code`). */
export function matchesHotkey(event: KeyboardEvent, hotkey: readonly string[]): boolean {
  if (hotkey.length === 0) return false;
  return hotkey.every((key) =>
    key === "altKey" || key === "ctrlKey" || key === "metaKey" || key === "shiftKey"
      ? event[key]
      : event.code === key,
  );
}

/** A hotkey from `"altKey+KeyT"` (HTML) or a list; invalid → the default. */
export function parseHotkey(value: unknown): readonly string[] {
  const list = typeof value === "string" ? value.split("+").map((k) => k.trim()) : value;
  return Array.isArray(list) && list.every((k) => typeof k === "string" && /^\w{1,20}$/.test(k))
    ? (list as string[])
    : TOASTER_HOTKEY;
}

/**
 * The hotkey: pressing it expands the toaster (`data-ok-expanded`) and moves the focus to its
 * newest toast list; Escape inside, or the focus leaving, collapses it again.
 */
export function createToasterHotkey(
  toaster: HTMLElement,
  options: { hotkey(): readonly string[] },
) {
  const doc = toaster.ownerDocument;
  const collapse = () => toaster.removeAttribute("data-ok-expanded");
  const keydown = (event: KeyboardEvent) => {
    if (matchesHotkey(event, options.hotkey())) {
      const list = toaster.querySelector<HTMLElement>(
        "[data-ok-toaster-list]:has(> [data-ok-toast])",
      );
      if (!list) return;
      toaster.setAttribute("data-ok-expanded", "");
      list.tabIndex = -1;
      list.focus();
      return;
    }
    if (event.key === "Escape" && toaster.contains(doc.activeElement)) collapse();
  };
  const focusout = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && toaster.contains(event.relatedTarget)) return;
    collapse();
  };
  doc.addEventListener("keydown", keydown);
  toaster.addEventListener("focusout", focusout);
  return {
    destroy() {
      doc.removeEventListener("keydown", keydown);
      toaster.removeEventListener("focusout", focusout);
      collapse();
    },
  };
}

/** A toaster offset: a number of px, a CSS length, or one per side (Sonner `offset`). */
export type ToasterOffset =
  | number
  | string
  | {
      top?: number | string;
      right?: number | string;
      bottom?: number | string;
      left?: number | string;
    };

const LENGTH = /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|vh|vw|%)?$/;
const length = (value: unknown): string | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? `${value}px` : undefined;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!LENGTH.test(text)) return undefined;
  return /\d$/.test(text) ? `${text}px` : text;
};

/**
 * The toaster's custom properties: `--_ok-toaster-<side>` (desktop offset),
 * `--_ok-toaster-mobile-<side>` (under 600px) and `--_ok-toast-gap`. Invalid values are dropped
 * (the stylesheet's defaults apply).
 */
export function toasterStyle(options: {
  offset?: unknown;
  mobileOffset?: unknown;
  gap?: unknown;
}): Partial<Record<`--_ok-${string}`, string>> {
  const out: Partial<Record<`--_ok-${string}`, string>> = {};
  const sides = (value: unknown, prefix: string) => {
    if (value === undefined || value === null) return;
    const all = length(value);
    for (const side of ["top", "right", "bottom", "left"] as const) {
      const one =
        all ??
        (typeof value === "object" ? length((value as Record<string, unknown>)[side]) : undefined);
      if (one !== undefined) out[`--_ok-${prefix}-${side}`] = one;
    }
  };
  sides(options.offset, "toaster");
  sides(options.mobileOffset, "toaster-mobile");
  const gap = typeof options.gap === "string" ? Number(options.gap) : options.gap;
  if (typeof gap === "number" && Number.isFinite(gap) && gap >= 0)
    out["--_ok-toast-gap"] = `${gap}px`;
  return out;
}
