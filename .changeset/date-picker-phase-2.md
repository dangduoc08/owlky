---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Date pickers phase 2 (ADR-0022, ADR-0026): time and date time pickers. New React components `TimeField`, `DateTimeField`, `TimeClock`, `DigitalClock`, `MultiSectionDigitalClock`, `TimePicker`, `DesktopTimePicker`, `MobileTimePicker`, `StaticTimePicker`, `DateTimePicker`, `DesktopDateTimePicker`, `MobileDateTimePicker` and `StaticDateTimePicker`; in HTML the field and picker markup take `data-ok-value-type="time" | "date-time"` (ISO `HH:mm:ss` and `YYYY-MM-DDTHH:mm:ss`), and new runtimes `time-clock`, `digital-clock` and `multi-section-digital-clock`. Desktop pickers show digital clocks (beside the calendar for date times); mobile and static pickers show a toolbar, date / time tabs and an analog clock you can press, drag or drive with the keyboard. Time validation: `minTime`, `maxTime`, `minDateTime`, `maxDateTime`, `minutesStep`, `shouldDisableTime`, `disableIgnoringDatePartForTimeValidation`, past / future; `ampm` follows the locale; `timeSteps`, `skipDisabled` and `thresholdToRenderTimeInASingleColumn`. `PickerSelectionState` gains `"shallow"` (a clock drag in progress).
