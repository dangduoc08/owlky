import {
  type AlertSeverity,
  type AlertVariant,
  alertAttributes,
  checkCircleLinear,
  closeLinear,
  dangerCircleLinear,
  dangerTriangleLinear,
  type IconData,
  iconButtonAttributes,
  infoCircleLinear,
} from "@owlky/core";
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from "react";
import { Icon } from "../utils/icon.js";

/** Default severity icons (decorative, same SVG as the HTML snippets). */
const SEVERITY_ICONS: Record<AlertSeverity, IconData> = {
  success: checkCircleLinear,
  info: infoCircleLinear,
  warning: dangerTriangleLinear,
  error: dangerCircleLinear,
};

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  return <Icon icon={SEVERITY_ICONS[severity]} />;
}

function CloseIcon() {
  return <Icon icon={closeLinear} />;
}

export interface AlertProps extends ComponentPropsWithoutRef<"div"> {
  /** Meaning and default icon. Default `"success"`. */
  severity?: AlertSeverity | undefined;
  /** Default `"standard"`. */
  variant?: AlertVariant | undefined;
  /** Colors; default: the severity's. */
  color?: AlertSeverity | undefined;
  /** Replaces the severity icon; `false` hides it. */
  icon?: ReactNode;
  /** Icons per severity, replacing the defaults. */
  iconMapping?: Partial<Record<AlertSeverity, ReactNode>> | undefined;
  /** Actions at the end (buttons). Replaces the close button. */
  action?: ReactNode;
  /** Renders a close button that calls it; stop rendering the alert to dismiss it. */
  onClose?: (() => void) | undefined;
  /** Name of the close button. Default `"Close"`. */
  closeText?: string | undefined;
}

/**
 * Alert — spec: specs/components/alert.md. `role="alert"` by default (use `role="status"` for
 * non-urgent messages).
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    severity,
    variant,
    color,
    icon,
    iconMapping,
    action,
    onClose,
    closeText = "Close",
    role = "alert",
    children,
    ...props
  },
  ref,
) {
  const attributes = alertAttributes({ severity, variant, color });
  const resolved = attributes["data-ok-severity"] as AlertSeverity;
  const shownIcon = icon ?? iconMapping?.[resolved] ?? <SeverityIcon severity={resolved} />;
  const actions =
    action ??
    (onClose ? (
      <button
        type="button"
        {...iconButtonAttributes({ size: "sm" })}
        data-ok-alert-close=""
        aria-label={closeText}
        title={closeText}
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    ) : null);
  return (
    <div ref={ref} role={role} {...attributes} {...props}>
      {icon !== false && <div data-ok-alert-icon="">{shownIcon}</div>}
      <div data-ok-alert-message="">{children}</div>
      {actions != null && <div data-ok-alert-action="">{actions}</div>}
    </div>
  );
});

/** The alert's title, above the message. */
export const AlertTitle = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function AlertTitle(props, ref) {
    return <div ref={ref} data-ok-alert-title="" {...props} />;
  },
);
