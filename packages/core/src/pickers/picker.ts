/**
 * Picker helpers (ADR-0022): desktop / mobile choice, the action bar, shortcuts and the toolbar
 * text, shared by React and the HTML runtime.
 */
import { type DateRules, validateDate } from "./calendar.js";
import { isValidDate } from "./dates.js";
import { formatDate } from "./locale.js";

export const pickerVariants = ["responsive", "desktop", "mobile", "static"] as const;
/** How a picker shows its views: responsive (desktop or mobile), in a popover, in a dialog, inline. */
export type PickerVariant = (typeof pickerVariants)[number];

export const pickerActions = ["clear", "today", "cancel", "accept", "nextOrAccept"] as const;
export type PickerAction = (typeof pickerActions)[number];

export const pickerOrientations = ["portrait", "landscape"] as const;
export type PickerOrientation = (typeof pickerOrientations)[number];

/** Why a picker opened or closed (`onOpenChange`, HTML `detail.reason`). */
export type PickerOpenReason =
  | "button"
  | "escape"
  | "clickaway"
  | "accept"
  | "cancel"
  | "select"
  | "clear"
  | "today"
  | "shortcut"
  | "api";

/** MUI's default: a fine pointer (mouse, trackpad) gets the desktop picker. */
export const DEFAULT_DESKTOP_MODE_QUERY = "@media (pointer: fine)";

/**
 * Desktop or mobile for a responsive picker: `query` (with or without `@media`) is matched
 * against `view`; an invalid query or no `matchMedia` means desktop.
 */
export function resolvePickerMode(
  variant: PickerVariant,
  query: string | undefined,
  view: (Window & typeof globalThis) | null | undefined,
): "desktop" | "mobile" | "static" {
  if (variant === "desktop" || variant === "mobile" || variant === "static") return variant;
  const text = (query ?? DEFAULT_DESKTOP_MODE_QUERY).replace(/^\s*@media\s*/i, "").slice(0, 200);
  if (!view?.matchMedia) return "desktop";
  try {
    return view.matchMedia(text).matches ? "desktop" : "mobile";
  } catch {
    return "desktop";
  }
}

/** Default action bar: none on desktop, Cancel and OK elsewhere (MUI). */
export const defaultPickerActions = (mode: "desktop" | "mobile" | "static"): PickerAction[] =>
  mode === "desktop" ? [] : ["cancel", "accept"];

/** Known actions of a list or a space-separated attribute, in order, without duplicates. */
export function parsePickerActions(value: unknown): PickerAction[] | undefined {
  if (value == null) return undefined;
  const list = typeof value === "string" ? value.split(/\s+/) : Array.isArray(value) ? value : [];
  return [
    ...new Set(list.filter((a): a is PickerAction => pickerActions.includes(a as PickerAction))),
  ];
}

/** Picking closes the picker by default on desktop only (MUI). */
export const defaultCloseOnSelect = (mode: "desktop" | "mobile" | "static"): boolean =>
  mode === "desktop";

/** A shortcut of the shortcuts list. */
export interface PickerShortcut {
  label: string;
  /** The value it sets; `isValid` tells whether a date passes the picker's rules. */
  getValue: (context: { isValid: (value: Date | null) => boolean }) => Date | null;
  /** Stable key (default: the label). */
  id?: string | undefined;
}

/** A shortcut's value, or `undefined` when it throws or returns something else. */
export function shortcutValue(shortcut: PickerShortcut, rules: DateRules): Date | null | undefined {
  try {
    const value = shortcut.getValue({ isValid: (v) => validateDate(v, rules) === null });
    return value === null || isValidDate(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Toolbar title: "Sun, May 25" (the locale's short weekday, month and day). */
export function pickerToolbarText(value: Date | null, locale: string, empty: string): string {
  return isValidDate(value)
    ? formatDate(value, locale, { weekday: "short", month: "short", day: "numeric" })
    : empty;
}

/** Calendar header: "May 2025". */
export const calendarHeaderText = (month: Date, locale: string): string =>
  formatDate(month, locale, { month: "long", year: "numeric" });

/** Same instant, or both empty. Invalid dates are equal to each other. */
export function isSamePickerValue(a: Date | null, b: Date | null): boolean {
  if (a === null || b === null) return a === b;
  if (!isValidDate(a) || !isValidDate(b)) return !isValidDate(a) && !isValidDate(b);
  return a.getTime() === b.getTime();
}
