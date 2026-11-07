import { type ChipColor, type LabelVariant, labelAttributes } from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface LabelProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Default `"soft"`. */
  variant?: LabelVariant | undefined;
  /** `default` (neutral), palette, `black` / `white`. Default `"default"`. */
  color?: ChipColor | undefined;
  /** Decorative icon before the text. */
  startIcon?: ReactNode;
  /** Decorative icon after the text. */
  endIcon?: ReactNode;
}

/** Label — spec: specs/components/label.md. A small status tag (not interactive). */
export const Label = forwardRef<HTMLSpanElement, LabelProps>(function Label(
  { variant, color, startIcon, endIcon, children, ...props },
  ref,
) {
  return (
    <span ref={ref} {...labelAttributes({ variant, color })} {...props}>
      {startIcon != null && (
        <span data-ok-label-icon="start" aria-hidden="true">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon != null && (
        <span data-ok-label-icon="end" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </span>
  );
});
