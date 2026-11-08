---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Date pickers phase 4 (ADR-0030), the last: the date pickers now cover every MUI X Date and Time Pickers feature. `timezone` (`"default"`, `"system"`, `"UTC"` or an IANA name) on every picker, field, calendar and clock, `data-ok-timezone` in HTML (ISO input may carry an offset). `LocalizationProvider` `dateAdapter` with opt-in adapters that take your own library and add no dependency: `@owlky/core/adapters/dayjs`, `/date-fns`, `/luxon` and `/moment`; dates are typed `PickerValidDate`, and HTML instances get `date`, `setDate()` and `setDateAdapter()`. Calendar systems through `Intl` (`calendar`, `data-ok-calendar` or the locale's `-u-ca-`: Persian, Hijri, Buddhist, Indian), locale packs (`pickersFrFR`, `pickersDeDE`, `pickersEsES`, `pickersJaJP`, `pickersZhCN`, `pickersFaIR`, `pickersArSD`), right-to-left keys and arrows, `slots` / `slotProps` (layout, toolbar, action bar, shortcuts, day, icons, `toolbar.hidden`, `tabs.hidden`), `usePickerContext()`, `viewRenderers` and HTML `setDayRenderer()`. Locales such as `ar-SA` without a calendar extension now show Gregorian month names that match the grid.
