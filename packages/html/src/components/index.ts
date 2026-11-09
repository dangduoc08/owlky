/*
 * Every component that has runtime behavior. CSS-only components have no definition — their
 * HTML + CSS is complete on its own.
 * Adding a component = one folder + one entry here (checked by components.test.ts).
 */
import type { ComponentDefinition } from "../runtime/types.js";
import { accordion } from "./accordion/accordion.js";
import { alert } from "./alert/alert.js";
import { autocomplete } from "./autocomplete/autocomplete.js";
import { avatar } from "./avatar/avatar.js";
import { backdrop } from "./backdrop/backdrop.js";
import { breadcrumbs } from "./breadcrumbs/breadcrumbs.js";
import { carousel } from "./carousel/carousel.js";
import { chart } from "./chart/chart.js";
import { checkbox } from "./checkbox/checkbox.js";
import { chip } from "./chip/chip.js";
import { circularProgress } from "./circular-progress/circular-progress.js";
import { countUp } from "./count-up/count-up.js";
import { dataGrid } from "./data-grid/data-grid.js";
import { dateCalendar } from "./date-calendar/date-calendar.js";
import { dateField } from "./date-field/date-field.js";
import { datePicker } from "./date-picker/date-picker.js";
import { dateRangeCalendar } from "./date-range-calendar/date-range-calendar.js";
import { dateRangePicker } from "./date-range-picker/date-range-picker.js";
import { dialog } from "./dialog/dialog.js";
import { digitalClock } from "./digital-clock/digital-clock.js";
import { drawer } from "./drawer/drawer.js";
import { lightbox } from "./lightbox/lightbox.js";
import { linearProgress } from "./linear-progress/linear-progress.js";
import { list } from "./list/list.js";
import { menu } from "./menu/menu.js";
import { mobileStepper } from "./mobile-stepper/mobile-stepper.js";
import { monthCalendar } from "./month-calendar/month-calendar.js";
import { motion } from "./motion/motion.js";
import { motionBorder } from "./motion-border/motion-border.js";
import { motionGroup } from "./motion-group/motion-group.js";
import { motionText } from "./motion-text/motion-text.js";
import { multiInputRangeField } from "./multi-input-range-field/multi-input-range-field.js";
import { multiSectionDigitalClock } from "./multi-section-digital-clock/multi-section-digital-clock.js";
import { organizationChart } from "./organization-chart/organization-chart.js";
import { pagination } from "./pagination/pagination.js";
import { popover } from "./popover/popover.js";
import { rating } from "./rating/rating.js";
import { slider } from "./slider/slider.js";
import { sortable } from "./sortable/sortable.js";
import { stepper } from "./stepper/stepper.js";
import { table } from "./table/table.js";
import { tablePagination } from "./table-pagination/table-pagination.js";
import { tabs } from "./tabs/tabs.js";
import { textField } from "./text-field/text-field.js";
import { timeClock } from "./time-clock/time-clock.js";
import { toaster } from "./toaster/toaster.js";
import { toggleButton } from "./toggle-button/toggle-button.js";
import { toggleGroup } from "./toggle-group/toggle-group.js";
import { tooltip } from "./tooltip/tooltip.js";
import { transferList } from "./transfer-list/transfer-list.js";
import { treeView } from "./tree-view/tree-view.js";
import { walktour } from "./walktour/walktour.js";
import { yearCalendar } from "./year-calendar/year-calendar.js";

export const components: readonly ComponentDefinition[] = [
  tooltip as ComponentDefinition,
  toaster as ComponentDefinition,
  popover as ComponentDefinition,
  menu as ComponentDefinition,
  dialog as ComponentDefinition,
  backdrop as ComponentDefinition,
  accordion as ComponentDefinition,
  alert as ComponentDefinition,
  avatar as ComponentDefinition,
  chart as ComponentDefinition,
  checkbox as ComponentDefinition,
  chip as ComponentDefinition,
  circularProgress as ComponentDefinition,
  drawer as ComponentDefinition,
  linearProgress as ComponentDefinition,
  list as ComponentDefinition,
  pagination as ComponentDefinition,
  sortable as ComponentDefinition,
  table as ComponentDefinition,
  tablePagination as ComponentDefinition,
  textField as ComponentDefinition,
  toggleButton as ComponentDefinition,
  toggleGroup as ComponentDefinition,
  tabs as ComponentDefinition,
  breadcrumbs as ComponentDefinition,
  stepper as ComponentDefinition,
  mobileStepper as ComponentDefinition,
  rating as ComponentDefinition,
  slider as ComponentDefinition,
  transferList as ComponentDefinition,
  treeView as ComponentDefinition,
  autocomplete as ComponentDefinition,
  motion as ComponentDefinition,
  motionGroup as ComponentDefinition,
  motionText as ComponentDefinition,
  countUp as ComponentDefinition,
  motionBorder as ComponentDefinition,
  dataGrid as ComponentDefinition,
  dateField as ComponentDefinition,
  dateCalendar as ComponentDefinition,
  monthCalendar as ComponentDefinition,
  yearCalendar as ComponentDefinition,
  timeClock as ComponentDefinition,
  digitalClock as ComponentDefinition,
  multiSectionDigitalClock as ComponentDefinition,
  datePicker as ComponentDefinition,
  dateRangeCalendar as ComponentDefinition,
  multiInputRangeField as ComponentDefinition,
  dateRangePicker as ComponentDefinition,
  carousel as ComponentDefinition,
  organizationChart as ComponentDefinition,
  lightbox as ComponentDefinition,
  walktour as ComponentDefinition,
];
