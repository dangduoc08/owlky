/**
 * The attribute of each theme axis (ADR-0070 § 2). Runtimes that read computed tokens (Code
 * editor theme, Map, Data grid printing) watch or copy these. A literal list: no other imports.
 */
export const themeSettingAttributes = {
  mode: "data-ok-theme",
  style: "data-ok-style",
  density: "data-ok-density",
  surface: "data-ok-surface",
  contrast: "data-ok-contrast",
} as const;

/** Every attribute that changes token values. */
export const THEME_ATTRIBUTES: readonly string[] = [
  "data-ok-theme",
  "data-ok-style",
  "data-ok-density",
  "data-ok-surface",
  "data-ok-contrast",
];
