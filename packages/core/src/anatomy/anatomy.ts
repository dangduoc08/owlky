/*
 * Anatomy: each component's option schema (ADR-0015) and the `<name>Attributes(options)` helper
 * built from it. React spreads these objects; HTML snippets carry the same attributes (verified by
 * the e2e parity tests, per option). Defaults are emitted explicitly so rendered markup is
 * self-describing; values outside the allowed lists fall back to the default (untrusted input
 * never reaches the DOM).
 */

export type { DataAttributes } from "../options/define.js";
export * from "./accordion.js";
export * from "./alert.js";
export * from "./autocomplete.js";
export * from "./avatar.js";
export * from "./backdrop.js";
export * from "./badge.js";
export * from "./breadcrumbs.js";
export * from "./button.js";
export * from "./button-group.js";
export * from "./card.js";
export * from "./carousel.js";
export * from "./chart.js";
export * from "./checkbox.js";
export * from "./chip.js";
export * from "./code-editor.js";
export * from "./collapse.js";
export * from "./data-grid.js";
export * from "./date-picker.js";
export * from "./dialog.js";
export * from "./divider.js";
export * from "./drawer.js";
export * from "./editor.js";
export * from "./form-control.js";
export * from "./gantt.js";
export * from "./icon-button.js";
export * from "./image.js";
export * from "./label.js";
export * from "./lightbox.js";
export * from "./link.js";
export * from "./list.js";
export * from "./map.js";
export * from "./markdown.js";
export * from "./motion.js";
export * from "./motion-other.js";
export * from "./number-field.js";
export * from "./organization-chart.js";
export * from "./pagination.js";
export * from "./paper.js";
export * from "./phone-input.js";
export * from "./popover.js";
export * from "./progress.js";
export * from "./radio.js";
export * from "./rating.js";
export * from "./scroll-progress.js";
export * from "./scrollbar.js";
export * from "./select.js";
export * from "./slider.js";
export * from "./snackbar.js";
export * from "./sortable.js";
export * from "./stepper.js";
export * from "./table.js";
export * from "./tabs.js";
export * from "./text-field.js";
export * from "./timeline.js";
export * from "./toggle-button.js";
export * from "./transfer-list.js";
export * from "./tree-view.js";
export * from "./typography.js";
export * from "./upload.js";
export * from "./walktour.js";
