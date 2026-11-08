"use client";

import {
  DEFAULT_PICKER_LOCALE,
  localeCalendar,
  type PickerDateAdapter,
  type PickerLocaleText,
  pickerLocaleText,
  safeLocale,
  withCalendar,
} from "@owlky/core";
import { createContext, type ReactNode, useContext, useMemo } from "react";

export interface PickerLocalization {
  /** BCP 47 locale for names, formats and the first day of the week (with its calendar). */
  locale: string;
  /** Picker texts (built-in English or Vietnamese, plus overrides). */
  localeText: PickerLocaleText;
  /** The locale was set by a provider (written as `data-ok-locale` for HTML parity). */
  explicit: boolean;
  /** The date library adapter (phase 4, ADR-0030); `null` = native `Date`. */
  dateAdapter: PickerDateAdapter<unknown> | null;
}

export const LocalizationContext = createContext<PickerLocalization | null>(null);

export interface LocalizationProviderProps {
  /** Locale of the pickers inside, such as `"vi-VN"`. Default `"en-US"`. */
  adapterLocale?: string | undefined;
  /** Text overrides (MUI's `localeText` keys), or a locale pack such as `pickersFrFR`. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /**
   * Converts your date library's objects (Day.js, date-fns, Luxon, Moment) to and from the
   * pickers' dates: `createDayjsAdapter(dayjs)` from `@owlky/core/adapters/dayjs`. Default:
   * native `Date`.
   */
  // biome-ignore lint/suspicious/noExplicitAny: an adapter of any date library.
  dateAdapter?: PickerDateAdapter<any> | undefined;
  /**
   * Calendar system (`"persian"`, `"islamic-umalqura"`…), as the locale's `-u-ca-` extension.
   * Default: the locale's extension, else the adapter's calendar, else Gregorian.
   */
  calendar?: string | undefined;
  children?: ReactNode;
}

/**
 * LocalizationProvider — spec: specs/components/date-picker.md. Sets the locale, texts, calendar
 * and date adapter of the pickers inside. Nested providers inherit and override.
 */
export function LocalizationProvider({
  adapterLocale,
  localeText,
  dateAdapter,
  calendar,
  children,
}: LocalizationProviderProps) {
  const parent = useContext(LocalizationContext);
  const value = useMemo<PickerLocalization>(() => {
    const adapter =
      (dateAdapter as PickerDateAdapter<unknown> | undefined) ?? parent?.dateAdapter ?? null;
    const base =
      adapterLocale !== undefined
        ? safeLocale(adapterLocale)
        : (parent?.locale ?? DEFAULT_PICKER_LOCALE);
    // The calendar: this provider's, else the locale's own extension, else the adapter's.
    const wanted = calendar ?? (localeCalendar(base) === "gregory" ? adapter?.calendar : undefined);
    const locale = wanted === undefined ? base : withCalendar(base, wanted);
    // Another locale starts from its built-in texts; the same locale keeps the parent's.
    const texts = parent && parent.locale === locale ? parent.localeText : pickerLocaleText(locale);
    return {
      locale,
      localeText: localeText ? pickerLocaleText(locale, { ...texts, ...localeText }) : texts,
      explicit: adapterLocale !== undefined || locale !== base || parent?.explicit === true,
      dateAdapter: adapter,
    };
  }, [adapterLocale, localeText, dateAdapter, calendar, parent]);
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

/**
 * The pickers' localization: the nearest provider merged with a component's own `localeText`
 * (MUI pickers accept `localeText` too).
 */
export function usePickerLocalization(localeText?: Partial<PickerLocaleText>): PickerLocalization {
  const context = useContext(LocalizationContext);
  return useMemo(() => {
    const locale = context?.locale ?? DEFAULT_PICKER_LOCALE;
    const base = context?.localeText ?? pickerLocaleText(locale);
    return {
      locale,
      localeText: localeText ? pickerLocaleText(locale, { ...base, ...localeText }) : base,
      explicit: context?.explicit === true,
      dateAdapter: context?.dateAdapter ?? null,
    };
  }, [context, localeText]);
}
