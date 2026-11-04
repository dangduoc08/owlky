import {
  type AlertSeverity,
  type AlertVariant,
  alertAttributes,
  iconButtonAttributes,
} from "@owlky/core";
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from "react";

/** Default severity icons (decorative, same SVG as the HTML snippets). */
const ICON_PATHS: Record<AlertSeverity, string[]> = {
  success: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M8.5 12.5l2.5 2.5 4.5-5"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 11v5", "M12 8h.01"],
  warning: ["M12 3.5 2.5 20h19L12 3.5z", "M12 10v4", "M12 17h.01"],
  error: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7.5v5.5", "M12 16.5h.01"],
};

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[severity].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
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
