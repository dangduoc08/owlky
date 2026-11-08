"use client";

import {
  createDateConverter,
  isZonedTimezone,
  nowInTimezone,
  type PickerDateConverter,
  type PickerTimezone,
  type PickerValidDate,
  resolveTimezone,
} from "@owlky/core";
import {
  type ComponentType,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type PropsWithoutRef,
  type RefAttributes,
  useContext,
  useRef,
} from "react";
import { LocalizationContext } from "../localization-provider/localization-provider.js";

/**
 * Date adapters and time zones in React (phase 4, ADR-0030). Public picker components are their
 * implementation wrapped by `withPickerAdapter`: it converts the public dates (the adapter's type,
 * in the value's zone) to the engine's local wall-clock `Date`s and back, so the implementation
 * never sees another type or zone.
 */

/** A `Date` replaced by `PickerValidDate`, through ranges, callbacks and shortcuts. */
export type AdaptDate<T> = [T] extends [Date]
  ? PickerValidDate
  : T extends Date
    ? PickerValidDate
    : T extends (...args: infer A) => infer R
      ? (...args: { [I in keyof A]: AdaptDate<A[I]> }) => R extends Date | null ? AdaptDate<R> : R
      : T extends readonly [infer A, infer B]
        ? [AdaptDate<A>, AdaptDate<B>]
        : T extends readonly (infer E)[]
          ? readonly AdaptShortcut<E>[]
          : T;

/** Shortcuts: `getValue` returns public dates and validates them. */
type AdaptShortcut<E> = E extends { getValue: (context: infer C) => infer R }
  ? Omit<E, "getValue"> & {
      getValue: (
        context: {
          [K in keyof C]: C[K] extends (value: infer V) => boolean
            ? (value: AdaptDate<V>) => boolean
            : C[K];
        },
      ) => AdaptDate<R>;
    }
  : AdaptDate<E>;

/** Props whose dates the adapter converts. */
const DATE_PROPS = [
  "value",
  "defaultValue",
  "minDate",
  "maxDate",
  "minTime",
  "maxTime",
  "minDateTime",
  "maxDateTime",
  "referenceDate",
  "today",
] as const;
/** Callbacks whose date arguments the adapter converts. */
const CALLBACK_PROPS = [
  "onChange",
  "onAccept",
  "onError",
  "onMonthChange",
  "onYearChange",
  "shouldDisableDate",
  "shouldDisableMonth",
  "shouldDisableYear",
  "shouldDisableTime",
  "dayOfWeekFormatter",
] as const;
type AdaptedKey = (typeof DATE_PROPS)[number] | (typeof CALLBACK_PROPS)[number] | "shortcuts";

/** The public props of a picker component: dates of the adapter's type, plus `timezone`. */
export type AdaptedProps<P> = Omit<P, AdaptedKey> & {
  [K in keyof P as K extends AdaptedKey ? K : never]: AdaptDate<P[K]>;
} & {
  /**
   * Time zone of the value (MUI X): `"default"` (the value's own zone, else the computer's),
   * `"system"`, `"UTC"` or an IANA name such as `"America/New_York"`. The pickers show and edit
   * the wall time in that zone.
   */
  timezone?: PickerTimezone | undefined;
};

const IDENTITY: PickerDateConverter = {
  timezone: "system",
  toEngine: <T,>(value: unknown) => value as T,
  fromEngine: <T,>(value: unknown) => value as T,
};

const DateConverterContext = createContext<PickerDateConverter>(IDENTITY);

/** The converter of the closest adapted picker: public ↔ engine dates (slots and custom days). */
export const usePickerDateConverter = (): PickerDateConverter => useContext(DateConverterContext);

type Fn = (...args: unknown[]) => unknown;

/**
 * Wraps a picker implementation: without an adapter and a zone to convert, props pass through
 * untouched (the same objects); otherwise dates and callbacks are converted, with stable
 * objects per input so effects keyed on identity don't loop.
 */
export function withPickerAdapter<P extends object, R>(
  Base: ComponentType<P & RefAttributes<R>>,
  name: string,
): ForwardRefExoticComponent<PropsWithoutRef<AdaptedProps<P>> & RefAttributes<R>> {
  const Adapted = forwardRef<R, AdaptedProps<P>>(function Adapted(props, ref) {
    const context = useContext(LocalizationContext);
    const adapter = context?.dateAdapter ?? null;
    const { timezone, ...rest } = props as AdaptedProps<P> & Record<string, unknown>;
    const zone = resolveTimezone(timezone, adapter, [rest["value"], rest["defaultValue"]]);
    const latest = useRef<PickerDateConverter>(IDENTITY);
    const cache = useRef(new WeakMap<object, unknown>());
    const plain = !adapter && !isZonedTimezone(zone);
    if (plain) return <Base {...(rest as unknown as P)} ref={ref} />;

    const converter = createDateConverter(adapter, zone);
    if (latest.current.timezone !== converter.timezone) cache.current = new WeakMap();
    latest.current = converter;
    const memo = <T,>(key: object, build: () => T): T => {
      if (cache.current.has(key)) return cache.current.get(key) as T;
      const value = build();
      cache.current.set(key, value);
      return value;
    };
    const toEngine = (value: unknown): unknown =>
      value !== null && typeof value === "object"
        ? memo(value, () => converter.toEngine(value))
        : value;
    const wrap = (fn: Fn): Fn =>
      memo(
        fn,
        () =>
          (...args: unknown[]) =>
            fn(...args.map((arg) => latest.current.fromEngine(arg))),
      );
    const next: Record<string, unknown> = { ...rest };
    for (const key of DATE_PROPS) if (key in next) next[key] = toEngine(next[key]);
    for (const key of CALLBACK_PROPS)
      if (typeof next[key] === "function") next[key] = wrap(next[key] as Fn);
    if (Array.isArray(next["shortcuts"]))
      next["shortcuts"] = memo(next["shortcuts"] as object, () =>
        (next["shortcuts"] as { getValue: Fn }[]).map((item) => ({
          ...item,
          getValue: (context: { isValid: Fn }) =>
            latest.current.toEngine(
              item.getValue({
                ...context,
                isValid: (value: unknown) => context.isValid(latest.current.toEngine(value)),
              }),
            ),
        })),
      );
    if (isZonedTimezone(zone)) {
      if (next["today"] === undefined) next["today"] = nowInTimezone(zone);
      // HTML parity: the runtime reads the zone from the closest `data-ok-timezone`.
      next["data-ok-timezone"] = zone;
    }
    return (
      <DateConverterContext.Provider value={converter}>
        <Base {...(next as P)} ref={ref} />
      </DateConverterContext.Provider>
    );
  });
  Adapted.displayName = name;
  return Adapted as unknown as ForwardRefExoticComponent<
    PropsWithoutRef<AdaptedProps<P>> & RefAttributes<R>
  >;
}

export type { PickerValidDate };
