// Source folders (packages/react/src, packages/html/src/components, packages/styles/src/components)
// whose name isn't a spec: the spec that documents them. Shared by scripts/manifest.mjs and
// scripts/api-reference.mjs.

/** Folder → spec, for folders that the date-picker pattern below doesn't cover. */
export const FOLDER_SPEC = {
  "count-up": "motion",
  countdown: "motion",
  "motion-border": "motion",
  "motion-group": "motion",
  "motion-text": "motion",
  "diff-editor": "code-editor",
  "mobile-stepper": "stepper",
  "table-pagination": "table",
  toaster: "snackbar",
  clipboard: "text-field",
  "number-field": "text-field",
  phone: "phone-input",
  "toggle-group": "toggle-button",
  "avatar-group": "avatar",
  "chart-trellis": "chart",
  "chart-first-paint": "chart",
  utils: "date-picker",
  pickers: "date-picker",
  "localization-provider": "date-picker",
  "multi-input-range-field": "date-picker",
  "month-calendar": "date-picker",
  "year-calendar": "date-picker",
};

/** The spec that documents `folder`, or `undefined`. `specs` holds the spec names. */
export const folderSpec = (folder, specs) =>
  FOLDER_SPEC[folder] ??
  (specs.has(folder)
    ? folder
    : /^(date|time|multi-section|digital)-|-clock$/.test(folder)
      ? "date-picker"
      : undefined);
