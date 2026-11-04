import {
  type ButtonSize,
  type ButtonVariant,
  buttonAttributes,
  type ColorName,
} from "@minimal-tailwind/core";
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from "react";

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "color"> {
  /** Visual style. Default `"text"`. */
  variant?: ButtonVariant | undefined;
  /** Default `"inherit"` (neutral). */
  color?: ColorName | undefined;
  /** Default `"md"`. */
  size?: ButtonSize | undefined;
  /** Stretch to the container width. */
  fullWidth?: boolean | undefined;
  /** Decorative icon before the label (hidden from assistive technology). */
  startIcon?: ReactNode;
  /** Decorative icon after the label (hidden from assistive technology). */
  endIcon?: ReactNode;
}

/**
 * Button — spec: specs/components/button.md. Renders a native `<button>` (default
 * `type="button"`). For a link styled as a button, spread `buttonAttributes()` from
 * `@minimal-tailwind/core` on an `<a>`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, color, size, fullWidth, startIcon, endIcon, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      {...buttonAttributes({ variant, color, size, fullWidth })}
      {...props}
    >
      {startIcon != null && (
        <span data-mt-button-icon="start" aria-hidden="true">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon != null && (
        <span data-mt-button-icon="end" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  );
});
