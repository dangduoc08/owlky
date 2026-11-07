import {
  type IconButtonColor,
  type IconButtonEdge,
  type IconButtonSize,
  iconButtonAttributes,
} from "@owlky/core";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { CircularProgress } from "../circular-progress/circular-progress.js";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** `default` (secondary text), `inherit` (text color) or a palette color. Default `"default"`. */
  color?: IconButtonColor | undefined;
  /** `sm` 28px · `md` 36px · `lg` 48px. Default `"md"`. */
  size?: IconButtonSize | undefined;
  /** Pull the button out by its padding so the icon lines up with that edge. */
  edge?: IconButtonEdge | undefined;
  /** Scales up on hover and down while pressed (off with reduced motion). */
  animate?: boolean | undefined;
  /** Shows a loader instead of the icon, disables the button and sets `aria-busy`. */
  loading?: boolean | undefined;
  /** Replaces the spinner. Decorative: the button stays named by its `aria-label`. */
  loadingIndicator?: ReactNode;
}

/**
 * IconButton — spec: specs/components/icon-button.md. A native round `<button type="button">`
 * holding a decorative icon. Give it an accessible name with `aria-label`.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    color,
    size,
    edge,
    animate,
    loading = false,
    loadingIndicator,
    type = "button",
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      {...iconButtonAttributes({ color, size, edge, animate, loading })}
      {...props}
      disabled={disabled === true || loading}
      aria-busy={loading ? true : props["aria-busy"]}
    >
      {loading && (
        <span data-ok-icon-button-loader="" aria-hidden="true">
          {loadingIndicator ?? <CircularProgress color="inherit" data-ok-button-spinner="" />}
        </span>
      )}
      {children}
    </button>
  );
});
