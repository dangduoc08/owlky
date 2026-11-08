"use client";

import {
  DEFAULT_PICKER_LOCALE,
  type PickerLocaleText,
  pickerLocaleText,
  safeLocale,
} from "@owlky/core";
import { createContext, type ReactNode, useContext, useMemo } from "react";

export interface PickerLocalization {
  /** BCP 47 locale for names, formats and the first day of the week. */
  locale: string;
  /** Picker texts (built-in English or Vietnamese, plus overrides). */
  localeText: PickerLocaleText;
  /** The locale was set by a provider (written as `data-ok-locale` for HTML parity). */
  explicit: boolean;
}

const LocalizationContext = createContext<PickerLocalization | null>(null);

export interface LocalizationProviderProps {
  /** Locale of the pickers inside, such as `"vi-VN"`. Default `"en-US"`. */
  adapterLocale?: string | undefined;
  /** Text overrides (MUI's `localeText` keys). */
  localeText?: Partial<PickerLocaleText> | undefined;
  children?: ReactNode;
}

/**
 * LocalizationProvider — spec: specs/components/date-picker.md. Sets the locale and texts of the
 * pickers inside. Nested providers inherit and override.
 */
export function LocalizationProvider({
  adapterLocale,
  localeText,
  children,
}: LocalizationProviderProps) {
  const parent = useContext(LocalizationContext);
  const value = useMemo<PickerLocalization>(() => {
    const locale =
      adapterLocale !== undefined
        ? safeLocale(adapterLocale)
        : (parent?.locale ?? DEFAULT_PICKER_LOCALE);
    // Another locale starts from its built-in texts; the same locale keeps the parent's.
    const base = parent && parent.locale === locale ? parent.localeText : pickerLocaleText(locale);
    return {
      locale,
      localeText: localeText ? pickerLocaleText(locale, { ...base, ...localeText }) : base,
      explicit: adapterLocale !== undefined || parent?.explicit === true,
    };
  }, [adapterLocale, localeText, parent]);
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
    };
  }, [context, localeText]);
}
