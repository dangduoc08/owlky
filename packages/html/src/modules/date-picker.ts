/** Lazy module `modules/date-picker.js` (ADR-0068): registers its components on the page's runtime. */
import { dateCalendar } from "../components/date-calendar/date-calendar.js";
import { dateField } from "../components/date-field/date-field.js";
import { datePicker } from "../components/date-picker/date-picker.js";
import { dateRangeCalendar } from "../components/date-range-calendar/date-range-calendar.js";
import { dateRangePicker } from "../components/date-range-picker/date-range-picker.js";
import { digitalClock } from "../components/digital-clock/digital-clock.js";
import { monthCalendar } from "../components/month-calendar/month-calendar.js";
import { multiInputRangeField } from "../components/multi-input-range-field/multi-input-range-field.js";
import { multiSectionDigitalClock } from "../components/multi-section-digital-clock/multi-section-digital-clock.js";
import { timeClock } from "../components/time-clock/time-clock.js";
import { yearCalendar } from "../components/year-calendar/year-calendar.js";
import { getRuntime } from "../runtime/global.js";

getRuntime()
  .register(
    dateField,
    dateCalendar,
    datePicker,
    dateRangeCalendar,
    dateRangePicker,
    timeClock,
    digitalClock,
    multiSectionDigitalClock,
    monthCalendar,
    yearCalendar,
    multiInputRangeField,
  )
  .start();
