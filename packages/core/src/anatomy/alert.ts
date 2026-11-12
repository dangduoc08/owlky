import {
  type DataAttributes,
  defineOptions,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Alert ------------------------------------------------------------------------------------

export const alertSeverities = ["success", "info", "warning", "error"] as const;
export const alertVariants = ["standard", "filled", "outlined"] as const;
export type AlertSeverity = (typeof alertSeverities)[number];
export type AlertVariant = (typeof alertVariants)[number];

export const alertOptions = defineOptions("alert", "data-ok-alert", {
  severity: style("data-ok-severity", alertSeverities, "success", "Meaning and default icon."),
  variant: style("data-ok-variant", alertVariants, "standard", "Tinted, filled or outlined."),
  color: style("data-ok-color", alertSeverities, "success", "Colors (default: the severity's)."),
  open: state("hidden", "Removed from view when its close button is pressed (HTML).", "close"),
});

export interface AlertAnatomyOptions {
  severity?: AlertSeverity | undefined;
  variant?: AlertVariant | undefined;
  color?: AlertSeverity | undefined;
}

/** `data-ok-*` attributes of an alert; the color defaults to the severity's. */
export const alertAttributes = (options: AlertAnatomyOptions = {}): DataAttributes => {
  const known = (value: unknown): value is AlertSeverity =>
    alertSeverities.includes(value as AlertSeverity);
  const severity = known(options.severity)
    ? options.severity
    : alertOptions.options.severity.default;
  return optionAttributes(alertOptions, {
    ...options,
    severity,
    color: known(options.color) ? options.color : severity,
  });
};
