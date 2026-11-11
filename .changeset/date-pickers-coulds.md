---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/styles": minor
"@owlky/html": minor
---

Date pickers: single input range fields take `dateSeparator` (default `–`; range pickers pass it to their field); calendars and clocks (`DateCalendar`, `DateRangeCalendar`, `TimeClock`, `DigitalClock`, `MultiSectionDigitalClock`) take `focusedView` and `onFocusedViewChange(view, hasFocus)`; `TimeClock` takes `showViewSwitcher` (default `true`: the arrows still show); static pickers take `displayStaticWrapperAs` (`"desktop"`: no toolbar or action bar by default, the digital clocks, two range months). HTML: `data-ok-date-separator`, `data-ok-show-view-switcher="false"`, `data-ok-display-static-wrapper-as="desktop"`, a `focusedviewchange` event (`{ view, hasFocus }`) and `focusedView` / `setFocusedView(view)` on every calendar and clock instance. Core: `createFocusedViewTracker`, `focusPickerViewPart`, `pickerViewOf`, `pickerViewTarget`, type `PickerFocusedView`, `pickerStaticWrapperValues`, and a `dateSeparator` argument for `rangeFieldSections`.
