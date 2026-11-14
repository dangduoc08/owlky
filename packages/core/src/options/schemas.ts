import { accordionActionsOptions, accordionOptions } from "../anatomy/accordion.js";
import { alertOptions } from "../anatomy/alert.js";
import { autocompleteOptions } from "../anatomy/autocomplete.js";
import { avatarGroupOptions, avatarOptions } from "../anatomy/avatar.js";
import { backdropOptions } from "../anatomy/backdrop.js";
import { badgeOptions } from "../anatomy/badge.js";
import { breadcrumbsOptions } from "../anatomy/breadcrumbs.js";
import { buttonOptions } from "../anatomy/button.js";
import { buttonGroupOptions } from "../anatomy/button-group.js";
import { cardActionsOptions, cardOptions } from "../anatomy/card.js";
import {
  carouselArrowsOptions,
  carouselDotsOptions,
  carouselOptions,
  carouselProgressOptions,
  carouselThumbsOptions,
} from "../anatomy/carousel.js";
import { chartOptions, chartTrellisOptions } from "../anatomy/chart.js";
import { checkboxOptions, formControlLabelOptions, switchOptions } from "../anatomy/checkbox.js";
import { chipOptions } from "../anatomy/chip.js";
import { codeEditorOptions, diffEditorOptions } from "../anatomy/code-editor.js";
import { collapseOptions } from "../anatomy/collapse.js";
import { dataGridOptions } from "../anatomy/data-grid.js";
import {
  dateCalendarOptions,
  dateFieldOptions,
  datePickerOptions,
  dateRangeCalendarOptions,
  dateRangePickerOptions,
  digitalClockOptions,
  multiSectionDigitalClockOptions,
  timeClockOptions,
} from "../anatomy/date-picker.js";
import { dialogOptions } from "../anatomy/dialog.js";
import { dividerOptions } from "../anatomy/divider.js";
import { drawerOptions } from "../anatomy/drawer.js";
import { editorOptions } from "../anatomy/editor.js";
import {
  formControlOptions,
  formGroupOptions,
  formHelperTextOptions,
  formLabelOptions,
  textFieldOptions,
} from "../anatomy/form-control.js";
import { ganttOptions } from "../anatomy/gantt.js";
import { fabOptions, iconButtonOptions } from "../anatomy/icon-button.js";
import { imageOptions } from "../anatomy/image.js";
import { labelOptions } from "../anatomy/label.js";
import { lightboxOptions } from "../anatomy/lightbox.js";
import { linkOptions } from "../anatomy/link.js";
import {
  listItemButtonOptions,
  listItemOptions,
  listItemTextOptions,
  listOptions,
  listSubheaderOptions,
} from "../anatomy/list.js";
import {
  mapAttributionOptions,
  mapGeolocateOptions,
  mapLegendOptions,
  mapMarkerOptions,
  mapNavigationOptions,
  mapOptions,
  mapPopupOptions,
  mapRegionsOptions,
  mapScaleOptions,
} from "../anatomy/map.js";
import { markdownOptions } from "../anatomy/markdown.js";
import { motionGroupOptions, motionOptions, motionTextOptions } from "../anatomy/motion.js";
import { countdownOptions, countUpOptions, motionBorderOptions } from "../anatomy/motion-other.js";
import { numberFieldOptions } from "../anatomy/number-field.js";
import {
  organizationChartNodeOptions,
  organizationChartOptions,
} from "../anatomy/organization-chart.js";
import { paginationOptions } from "../anatomy/pagination.js";
import { paperOptions } from "../anatomy/paper.js";
import { phoneInputOptions } from "../anatomy/phone-input.js";
import {
  menuItemOptions,
  menuOptions,
  popoverOptions,
  tooltipOptions,
} from "../anatomy/popover.js";
import { circularProgressOptions, linearProgressOptions } from "../anatomy/progress.js";
import { radioGroupOptions, radioOptions } from "../anatomy/radio.js";
import { ratingOptions } from "../anatomy/rating.js";
import { scrollProgressOptions } from "../anatomy/scroll-progress.js";
import { scrollbarOptions } from "../anatomy/scrollbar.js";
import { inputLabelOptions, selectOptions } from "../anatomy/select.js";
import { sliderOptions } from "../anatomy/slider.js";
import { toasterOptions } from "../anatomy/snackbar.js";
import { sortableOptions } from "../anatomy/sortable.js";
import {
  mobileStepperOptions,
  stepLabelOptions,
  stepOptions,
  stepperOptions,
} from "../anatomy/stepper.js";
import { tableOptions, tableSortLabelOptions } from "../anatomy/table.js";
import { tabOptions, tabsOptions } from "../anatomy/tabs.js";
import { timelineDotOptions, timelineItemOptions, timelineOptions } from "../anatomy/timeline.js";
import { toggleButtonOptions, toggleGroupOptions } from "../anatomy/toggle-button.js";
import { transferListOptions } from "../anatomy/transfer-list.js";
import { treeViewOptions } from "../anatomy/tree-view.js";
import { typographyOptions } from "../anatomy/typography.js";
import { uploadOptions } from "../anatomy/upload.js";
import { illustrationOptions, walktourOptions, walktourStepOptions } from "../anatomy/walktour.js";

/*
 * Every option schema by name: build scripts, Storybook Controls and the docs read it. It lives
 * outside the anatomy modules so that a bundle which imports one component's anatomy (Link's)
 * never keeps every schema (and the modules they import) through it.
 */
export const optionSchemas = {
  accordion: accordionOptions,
  "accordion-actions": accordionActionsOptions,
  alert: alertOptions,
  button: buttonOptions,
  "icon-button": iconButtonOptions,
  fab: fabOptions,
  "button-group": buttonGroupOptions,
  "toggle-button": toggleButtonOptions,
  "toggle-group": toggleGroupOptions,
  drawer: drawerOptions,
  sortable: sortableOptions,
  table: tableOptions,
  pagination: paginationOptions,
  scrollbar: scrollbarOptions,
  "circular-progress": circularProgressOptions,
  "linear-progress": linearProgressOptions,
  checkbox: checkboxOptions,
  switch: switchOptions,
  "form-control-label": formControlLabelOptions,
  radio: radioOptions,
  "radio-group": radioGroupOptions,
  "form-control": formControlOptions,
  "form-label": formLabelOptions,
  "form-group": formGroupOptions,
  "form-helper-text": formHelperTextOptions,
  "text-field": textFieldOptions,
  "number-field": numberFieldOptions,
  "phone-input": phoneInputOptions,
  select: selectOptions,
  "input-label": inputLabelOptions,
  avatar: avatarOptions,
  "avatar-group": avatarGroupOptions,
  badge: badgeOptions,
  chip: chipOptions,
  label: labelOptions,
  divider: dividerOptions,
  paper: paperOptions,
  card: cardOptions,
  "card-actions": cardActionsOptions,
  list: listOptions,
  "list-item": listItemOptions,
  "list-item-button": listItemButtonOptions,
  "list-item-text": listItemTextOptions,
  "list-subheader": listSubheaderOptions,
  popover: popoverOptions,
  tooltip: tooltipOptions,
  menu: menuOptions,
  "menu-item": menuItemOptions,
  dialog: dialogOptions,
  backdrop: backdropOptions,
  collapse: collapseOptions,
  toaster: toasterOptions,
  "table-sort-label": tableSortLabelOptions,
  tabs: tabsOptions,
  tab: tabOptions,
  breadcrumbs: breadcrumbsOptions,
  stepper: stepperOptions,
  step: stepOptions,
  "step-label": stepLabelOptions,
  "mobile-stepper": mobileStepperOptions,
  timeline: timelineOptions,
  "timeline-item": timelineItemOptions,
  "timeline-dot": timelineDotOptions,
  "organization-chart": organizationChartOptions,
  "organization-chart-node": organizationChartNodeOptions,
  image: imageOptions,
  rating: ratingOptions,
  slider: sliderOptions,
  "transfer-list": transferListOptions,
  "tree-view": treeViewOptions,
  autocomplete: autocompleteOptions,
  motion: motionOptions,
  "motion-group": motionGroupOptions,
  "motion-text": motionTextOptions,
  "count-up": countUpOptions,
  countdown: countdownOptions,
  "motion-border": motionBorderOptions,
  "scroll-progress": scrollProgressOptions,
  "data-grid": dataGridOptions,
  "date-field": dateFieldOptions,
  "date-calendar": dateCalendarOptions,
  "date-picker": datePickerOptions,
  "time-clock": timeClockOptions,
  "digital-clock": digitalClockOptions,
  "multi-section-digital-clock": multiSectionDigitalClockOptions,
  "date-range-calendar": dateRangeCalendarOptions,
  "date-range-picker": dateRangePickerOptions,
  editor: editorOptions,
  markdown: markdownOptions,
  chart: chartOptions,
  "chart-trellis": chartTrellisOptions,
  gantt: ganttOptions,
  carousel: carouselOptions,
  "carousel-arrows": carouselArrowsOptions,
  "carousel-dots": carouselDotsOptions,
  "carousel-progress": carouselProgressOptions,
  "carousel-thumbs": carouselThumbsOptions,
  "code-editor": codeEditorOptions,
  "diff-editor": diffEditorOptions,
  map: mapOptions,
  "map-marker": mapMarkerOptions,
  "map-popup": mapPopupOptions,
  "map-navigation": mapNavigationOptions,
  "map-geolocate": mapGeolocateOptions,
  "map-scale": mapScaleOptions,
  "map-attribution": mapAttributionOptions,
  "map-legend": mapLegendOptions,
  "map-regions": mapRegionsOptions,
  lightbox: lightboxOptions,
  upload: uploadOptions,
  illustration: illustrationOptions,
  typography: typographyOptions,
  link: linkOptions,
  walktour: walktourOptions,
  "walktour-step": walktourStepOptions,
} as const;
