# ADR-0030: Pickers phase 4 — date adapters as opt-in entries, zones and calendars at the edge

**Status:** Accepted (2026-11-08). Extends ADR-0022 (phase 4, the last), ADR-0026 and ADR-0028.

## Context
Phase 4 of the pickers (ADR-0022) completes MUI X Date and Time Pickers: time zones (`timezone`:
`"default" | "system" | "UTC" |` an IANA name), a `dateAdapter` with generic date types and
adapters for Day.js, date-fns, Luxon and Moment, other calendar systems (MUI X: Jalali and Hijri
through adapters), locale packs, right-to-left layout, view renderers and layout customization
(`slots` / `slotProps`). The engine of phases 1–3 computes in local time on native `Date`, the
main packages have no date library dependency and must not get one, the HTML side has the same
markup as React and no JavaScript objects in its markup.

## Decision
1. **Adapters are opt-in entry points of `@owlky/core` that receive the consumer's library.**
   `@owlky/core/adapters/dayjs` (`createDayjsAdapter(dayjs)`), `/date-fns`
   (`createDateFnsAdapter({ TZDate })`), `/luxon` (`createLuxonAdapter(DateTime)`) and `/moment`
   (`createMomentAdapter(moment)`). They import only the libraries' **types**, so no build, bundle
   or install pulls a library in. The libraries are **optional peer dependencies** of
   `@owlky/core` (`peerDependenciesMeta.optional`, ranges they were tested with) and pinned dev
   dependencies for the tests; `@owlky/react` and `@owlky/html` declare nothing. An adapter is
   four functions (`isDate`, `toDate`, `fromDate(instant, zone)`, `getTimezone`) plus an optional
   `calendar`, so any other library (or a Jalali / Hijri build) is a small object of the app's.
2. **Generic dates through declaration merging (MUI X's `PickerValidDate`).** Core exports
   `interface PickerValidDateLookup { native: Date }` and `PickerValidDate` (its values). Each
   adapter entry adds its type (`declare module "../pickers/adapter.js"`), so importing an adapter
   widens the React props' dates; without one they stay `Date`.
3. **Conversion at the edge; the engine stays local-time `Date`.** A converter
   (`createDateConverter(adapter, zone)`) turns public dates into **wall-clock** `Date`s of the
   zone (`toWallClock`, `Intl.DateTimeFormat#formatToParts`) and back into instants in the value's
   zone (`fromWallClock`, two-pass offset search: gaps move forward, overlaps take the earlier
   instant). React's public components are their implementations wrapped by `withPickerAdapter`
   (`react/src/pickers/pickers.ts`): dates, limits, callbacks and shortcuts are converted, with
   stable objects per input; without an adapter and a zone, props pass through untouched.
   Implementations compose each other unwrapped. `"default"` reads the zone of the value
   (`adapter.getTimezone`), else the system's. Limitation: a wall time the **system** zone skips
   (its own daylight saving gap) moves by the gap.
4. **HTML values are the zone's wall times.** `data-ok-timezone` (on the element or an ancestor)
   sets the zone; markup, events and hidden inputs keep ISO 8601 without an offset, as in phases
   1–3. ISO input may carry an offset (`Z`, `+07:00`): it is converted to the zone (every type,
   `parsePickerValue(text, reference, zone)`). "Today" and "now" are the zone's. Every picker,
   field, calendar and clock instance gets `date` / `setDate()` / `setDateAdapter(adapter)`:
   the adapter's dates (instants without one). React writes the same `data-ok-timezone` on its
   root for parity.
5. **Calendar systems come from `Intl`, named by the locale.** The calendar is the locale's
   `-u-ca-` extension (`fa-IR-u-ca-persian`); React's `LocalizationProvider calendar` and HTML
   `data-ok-calendar` add it, and an adapter's `calendar` applies when the locale names none.
   `PickerCalendarSystem` (`year`, `month`, `day`, `make`, `daysInMonth`) is Gregorian by default
   or computed with `formatToParts` for `persian`, `islamic-umalqura`, `islamic-civil`,
   `islamic-tbla`, `buddhist` and `indian` (twelve months, growing years; others fall back to
   Gregorian). Calendar math (`startOfMonth`, `addMonths`, month grids, year lists, field
   sections, range months) takes the system as an optional argument (`DateRules.calendar`).
   **Values stay ISO 8601 (Gregorian)**; view coordinates follow the calendar: month buttons'
   indexes, year buttons' years, and `data-ok-month` is `YYYY-MM` in the Gregorian calendar, else
   the ISO date of the month's first day. All `Intl` formatting makes the calendar explicit
   (`intlLocale`), so `ar-SA` without an extension shows Gregorian months (it showed Hijri
   headers over a Gregorian grid before). Day numbers and field digits stay Latin.
6. **Locale packs are plain data:** `pickersFrFR`, `pickersDeDE`, `pickersEsES`, `pickersJaJP`,
   `pickersZhCN`, `pickersFaIR`, `pickersArSD` (the data grid's languages plus two right-to-left
   ones); English and Vietnamese stay built in and picked by the locale. React passes a pack as
   `localeText`; HTML to `setLocaleText()` (which now also relabels the action bar).
7. **Right to left by the document's direction.** The field controller flips ← / → by the
   group's computed `direction` (the calendar controller already did); CSS mirrors the month and
   clock arrows under `[dir="rtl"]` and uses logical insets. The analog clock keeps its face.
8. **Slots that fit the architecture.** React pickers take `slots` (`layout`, `toolbar`,
   `actionBar`, `shortcuts`, `day`, `openPickerIcon`, arrow icons) and `slotProps`
   (`toolbar.hidden`, `tabs.hidden`, `day` as an object or a function of the day's state,
   `layout`); custom parts read and change the picker through `usePickerContext()` and build on
   the exported defaults (`PickerDay`, `PickerLayout`, `PickerLayoutRoot`, `PickerLayoutContent`,
   `PickerActionBar`, `PickerShortcuts`). `viewRenderers` map views to renderers
   (`renderDateViewCalendar`, `renderTimeViewClock`, `renderDigitalClockTimeView`,
   `renderMultiSectionDigitalClockTimeView` or the app's), `null` leaves a view out and every view
   `null` leaves only the field. HTML has the same through markup (custom parts keep the
   `data-ok-*` hooks: `data-ok-picker-action`, `[data-ok-picker-toolbar-title]`; a picker without
   the other form's clock uses its one clock in every form) and `setDayRenderer((button, date) =>
   …)` on calendars and pickers.

## Consequences
- Additive APIs only: no prop, attribute or event changes meaning; snippets of phases 1–3
  regenerate byte for byte.
- The CDN bundle grows by about 2.6 kB (zones, calendars, the date API) and the CSS by a few
  bytes; both fit their budgets (114 / 120 kB, 35.3 / 38 kB gzip).
- Range pickers take `viewRenderers` with `null` only; custom time renderers are for the date,
  time and date time pickers.
- The date pickers are complete: every MUI X Community and Pro feature has a counterpart.
