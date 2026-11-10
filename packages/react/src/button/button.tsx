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
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from "react";
import { CircularProgress } from "../circular-progress/circular-progress.js";
import { renderButtonBase } from "./button-base.js";

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
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "children"> & {
    /** Renders an `<a>` with the button styling. */
    href?: undefined;
    /** The element to render: `"button"` (the default). */
    component?: "button" | undefined;
  };

export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color" | "children"> & {
    /** Renders an `<a>` with the button styling. */
    href: string;
    /** Removes `href` and sets `aria-disabled`, so the link can't be followed. */
    disabled?: boolean | undefined;
    /**
     * The component that renders the link instead of an `<a>`, such as a router link. It gets
     * `href` and the button's attributes. Default `"a"`.
     */
    LinkComponent?: ElementType | undefined;
    /** `"button"` (the default) still renders the link: `href` wins (MUI). */
    component?: "button" | undefined;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

/**
 * With `component`, the props of that element or component (a router link's `to`); without it,
 * `ButtonProps` (a `<button>`, or a link when `href` is set).
 */
export interface ButtonComponent {
  <C extends ElementType>(
    props: ButtonOwnProps & {
      /** The element or component to render, such as a router link. */
      component: C;
      /** Turns the button off: links get `aria-disabled` and leave the tab order. */
      disabled?: boolean | undefined;
      ref?: Ref<HTMLElement> | undefined;
    } & Omit<ComponentPropsWithoutRef<C>, keyof ButtonOwnProps | "component" | "disabled">,
  ): ReactElement | null;
  (props: ButtonProps & RefAttributes<HTMLButtonElement | HTMLAnchorElement>): ReactElement | null;
  displayName?: string | undefined;
}

/**
 * Button — spec: specs/components/button.md. A native `<button type="button">`, an `<a>` when
 * `href` is set (or the `LinkComponent`), or the `component`, such as a router link. The markup
 * matches the `@owlky/html` snippets exactly.
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

    const { component, LinkComponent, href, type, disabled, ...others } =
      rest as ButtonAsLinkProps & { type?: string; component?: ElementType };
    return renderButtonBase({
      ref,
      component,
      LinkComponent,
      href,
      inactive: disabled === true || loading,
      busy: loading,
      type,
      attributes,
      rest: others as Record<string, unknown>,
      children: content,
    });
  },
) as ButtonComponent;
