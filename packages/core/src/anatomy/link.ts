import { type DataAttributes, defineOptions, optionAttributes, style } from "../options/define.js";
import { accordionActionsOptions, accordionOptions } from "./accordion.js";
import { alertOptions } from "./alert.js";
import { autocompleteOptions } from "./autocomplete.js";
import { avatarGroupOptions, avatarOptions } from "./avatar.js";
import { backdropOptions } from "./backdrop.js";
import { badgeOptions } from "./badge.js";
import { breadcrumbsOptions } from "./breadcrumbs.js";
import { buttonOptions } from "./button.js";
import { buttonGroupOptions } from "./button-group.js";
import { cardActionsOptions, cardOptions } from "./card.js";
import {
  carouselArrowsOptions,
  carouselDotsOptions,
  carouselOptions,
  carouselProgressOptions,
  carouselThumbsOptions,
} from "./carousel.js";
import { chartOptions, chartTrellisOptions } from "./chart.js";
import { checkboxOptions, formControlLabelOptions, switchOptions } from "./checkbox.js";
import { chipOptions } from "./chip.js";
import { codeEditorOptions, diffEditorOptions } from "./code-editor.js";
import { collapseOptions } from "./collapse.js";
import { dataGridOptions } from "./data-grid.js";
import {
  dateCalendarOptions,
  dateFieldOptions,
  datePickerOptions,
  dateRangeCalendarOptions,
  dateRangePickerOptions,
  digitalClockOptions,
  multiSectionDigitalClockOptions,
  timeClockOptions,
} from "./date-picker.js";
import { dialogOptions } from "./dialog.js";
import { dividerOptions } from "./divider.js";
import { drawerOptions } from "./drawer.js";
import { editorOptions } from "./editor.js";
import {
  formControlOptions,
  formGroupOptions,
  formHelperTextOptions,
  formLabelOptions,
  textFieldOptions,
} from "./form-control.js";
import { ganttOptions } from "./gantt.js";
import { fabOptions, iconButtonOptions } from "./icon-button.js";
import { imageOptions } from "./image.js";
import { labelOptions } from "./label.js";
import { lightboxOptions } from "./lightbox.js";
import {
  listItemButtonOptions,
  listItemOptions,
  listItemTextOptions,
  listOptions,
  listSubheaderOptions,
} from "./list.js";
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
} from "./map.js";
import { markdownOptions } from "./markdown.js";
import { motionGroupOptions, motionOptions, motionTextOptions } from "./motion.js";
import { countdownOptions, countUpOptions, motionBorderOptions } from "./motion-other.js";
import { numberFieldOptions } from "./number-field.js";
import { organizationChartNodeOptions, organizationChartOptions } from "./organization-chart.js";
import { paginationOptions } from "./pagination.js";
import { paperOptions } from "./paper.js";
import { phoneInputOptions } from "./phone-input.js";
import { menuItemOptions, menuOptions, popoverOptions, tooltipOptions } from "./popover.js";
import { circularProgressOptions, linearProgressOptions } from "./progress.js";
import { radioGroupOptions, radioOptions } from "./radio.js";
import { ratingOptions } from "./rating.js";
import { scrollProgressOptions } from "./scroll-progress.js";
import { scrollbarOptions } from "./scrollbar.js";
import { inputLabelOptions, selectOptions } from "./select.js";
import { sliderOptions } from "./slider.js";
import { toasterOptions } from "./snackbar.js";
import { sortableOptions } from "./sortable.js";
import { mobileStepperOptions, stepLabelOptions, stepOptions, stepperOptions } from "./stepper.js";
import { tableOptions, tableSortLabelOptions } from "./table.js";
import { tabOptions, tabsOptions } from "./tabs.js";
import { timelineDotOptions, timelineItemOptions, timelineOptions } from "./timeline.js";
import { toggleButtonOptions, toggleGroupOptions } from "./toggle-button.js";
import { transferListOptions } from "./transfer-list.js";
import { treeViewOptions } from "./tree-view.js";
import {
  type TypographyAnatomyOptions,
  typographyColors,
  typographyOptions,
  typographyVariantNames,
} from "./typography.js";
import { uploadOptions } from "./upload.js";
import { illustrationOptions, walktourOptions, walktourStepOptions } from "./walktour.js";

// --- Link ---------------------------------------------------------------------------------------

/** Link colors: Typography's, plus `inherit` (the parent's color, as in breadcrumbs). */
export const linkColors = [...typographyColors, "inherit"] as const;
export type LinkColor = (typeof linkColors)[number];
export const linkUnderlines = ["always", "hover", "none"] as const;
export type LinkUnderline = (typeof linkUnderlines)[number];

/**
 * Link (spec: link.md): a Typography root (`data-ok-typography` + `data-ok-link`) with Typography's
 * options; MUI's defaults differ (`variant` `inherit`, `color` `primary`, always written).
 */
export const linkOptions = defineOptions("link", "data-ok-link", {
  variant: style(
    "data-ok-variant",
    typographyVariantNames,
    "inherit",
    "A step of the type scale; `inherit` (the default) keeps the font of the text around the link.",
  ),
  color: style(
    "data-ok-color",
    linkColors,
    "primary",
    "Text color: a palette's `main` tone, a text tone, or `inherit` (the parent's color).",
  ),
  align: typographyOptions.options.align,
  gutterBottom: typographyOptions.options.gutterBottom,
  noWrap: typographyOptions.options.noWrap,
  maxLines: typographyOptions.options.maxLines,
  persistent: typographyOptions.options.persistent,
  underline: style(
    "data-ok-underline",
    linkUnderlines,
    "always",
    "When the link is underlined: `always`, on `hover` (pointer devices), or `none`.",
  ),
});

export interface LinkAnatomyOptions extends Omit<TypographyAnatomyOptions, "color"> {
  color?: LinkColor | undefined;
  underline?: LinkUnderline | undefined;
}

/** `data-ok-*` attributes of a link: Typography's marker first, then the link's options. */
export const linkAttributes = ({
  maxLines,
  ...options
}: LinkAnatomyOptions = {}): DataAttributes => ({
  "data-ok-typography": "",
  ...optionAttributes(linkOptions, {
    ...options,
    maxLines: maxLines === undefined ? undefined : String(maxLines),
  }),
});

const SAFE_REL = ["noopener", "noreferrer"] as const;

/**
 * The `rel` of a link: with `target="_blank"`, the consumer's tokens plus `noopener noreferrer`
 * (the new page gets no `window.opener` and no referrer); otherwise the consumer's value as given.
 */
export const linkRel = (target: unknown, rel: unknown): string | undefined => {
  const given = typeof rel === "string" ? rel : undefined;
  if (target !== "_blank") return given;
  const tokens = (given ?? "").split(/\s+/).filter(Boolean);
  for (const token of SAFE_REL)
    if (!tokens.some((t) => t.toLowerCase() === token)) tokens.push(token);
  return tokens.join(" ");
};

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
