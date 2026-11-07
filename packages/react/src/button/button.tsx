import {
  type ButtonLoadingPosition,
  type ButtonSize,
  type ButtonVariant,
  buttonAttributes,
  type ColorName,
} from "@owlky/core";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  forwardRef,
  type ReactNode,
  type Ref,
} from "react";
import { CircularProgress } from "../circular-progress/circular-progress.js";

export interface ButtonOwnProps {
  /** Visual style. Default `"text"`. */
  variant?: ButtonVariant | undefined;
  /** Default `"inherit"` (neutral). `black` / `white` are meant for light / dark surfaces. */
  color?: ColorName | undefined;
  /** `sm` 30px · `md` 36px · `lg` 48px · `xl` 56px. Default `"md"`. */
  size?: ButtonSize | undefined;
  /** Stretch to the container width. */
  fullWidth?: boolean | undefined;
  /** No shadow on contained buttons (on by default inside a ButtonGroup). */
  disableElevation?: boolean | undefined;
  /** Decorative icon before the label (hidden from assistive technology). */
  startIcon?: ReactNode;
  /** Decorative icon after the label (hidden from assistive technology). */
  endIcon?: ReactNode;
  /** Shows a loading indicator, disables the button and sets `aria-busy`. */
  loading?: boolean | undefined;
  /** Where the indicator goes: over the label (`center`) or in place of an icon. Default `center`. */
  loadingPosition?: ButtonLoadingPosition | undefined;
  /** Replaces the spinner, e.g. `"Loading…"`. Decorative: the label stays the accessible name. */
  loadingIndicator?: ReactNode;
  children?: ReactNode;
}

export type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "children"> & { href?: undefined };

export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color" | "children"> & {
    /** Renders an `<a>` with the button styling. */
    href: string;
    /** Removes `href` and sets `aria-disabled`, so the link can't be followed. */
    disabled?: boolean | undefined;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

/**
 * Button — spec: specs/components/button.md. A native `<button type="button">`, or an `<a>` when
 * `href` is set. The markup matches the `@owlky/html` snippets exactly.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant,
      color,
      size,
      fullWidth,
      disableElevation,
      startIcon,
      endIcon,
      loading = false,
      loadingPosition,
      loadingIndicator,
      children,
      ...rest
    } = props;

    const attributes = buttonAttributes({
      variant,
      color,
      size,
      fullWidth,
      disableElevation,
      loading,
      loadingPosition,
    });
    const content = (
      <>
        {startIcon != null && (
          <span data-ok-button-icon="start" aria-hidden="true">
            {startIcon}
          </span>
        )}
        {loading && (
          <span data-ok-button-loader="" aria-hidden="true">
            {loadingIndicator ?? <CircularProgress color="inherit" data-ok-button-spinner="" />}
          </span>
        )}
        <span data-ok-button-label="">{children}</span>
        {endIcon != null && (
          <span data-ok-button-icon="end" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </>
    );

    if (rest.href !== undefined) {
      const { href, disabled, ...anchor } = rest as ButtonAsLinkProps;
      const inactive = disabled === true || loading;
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          {...attributes}
          {...anchor}
          href={inactive ? undefined : href}
          role={inactive ? "link" : anchor.role}
          aria-disabled={inactive ? true : anchor["aria-disabled"]}
          aria-busy={loading ? true : anchor["aria-busy"]}
        >
          {content}
        </a>
      );
    }

    const { type = "button", disabled, ...button } = rest as ButtonAsButtonProps;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        {...attributes}
        {...button}
        disabled={disabled === true || loading}
        aria-busy={loading ? true : button["aria-busy"]}
      >
        {content}
      </button>
    );
  },
);
