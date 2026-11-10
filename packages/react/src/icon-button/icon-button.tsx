import {
  type IconButtonColor,
  type IconButtonEdge,
  type IconButtonSize,
  iconButtonAttributes,
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
import { renderButtonBase } from "../button/button-base.js";
import { CircularProgress } from "../circular-progress/circular-progress.js";

export interface IconButtonOwnProps {
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
  /** The icon. */
  children?: ReactNode;
}

export type IconButtonAsButtonProps = IconButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color" | "children"> & {
    /** Renders an `<a>` with the icon button styling (an icon link). */
    href?: undefined;
    /** The element to render: `"button"` (the default). */
    component?: "button" | undefined;
  };

export type IconButtonAsLinkProps = IconButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color" | "children"> & {
    /** Renders an `<a>` with the icon button styling (an icon link). */
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

export type IconButtonProps = IconButtonAsButtonProps | IconButtonAsLinkProps;

/**
 * With `component`, the props of that element or component (a router link's `to`); without it,
 * `IconButtonProps` (a `<button>`, or an icon link when `href` is set).
 */
export interface IconButtonComponent {
  <C extends ElementType>(
    props: IconButtonOwnProps & {
      /** The element or component to render, such as a router link. */
      component: C;
      /** Turns the button off: links get `aria-disabled` and leave the tab order. */
      disabled?: boolean | undefined;
      ref?: Ref<HTMLElement> | undefined;
    } & Omit<ComponentPropsWithoutRef<C>, keyof IconButtonOwnProps | "component" | "disabled">,
  ): ReactElement | null;
  (
    props: IconButtonProps & RefAttributes<HTMLButtonElement | HTMLAnchorElement>,
  ): ReactElement | null;
  displayName?: string | undefined;
}

/**
 * IconButton — spec: specs/components/icon-button.md. A native round `<button type="button">`
 * holding a decorative icon, an `<a>` when `href` is set (an icon link; or the `LinkComponent`),
 * or the `component`. Give it an accessible name with `aria-label`.
 */
export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(
  function IconButton(
    { color, size, edge, animate, loading = false, loadingIndicator, children, ...rest },
    ref,
  ) {
    const { component, LinkComponent, href, type, disabled, ...others } =
      rest as IconButtonAsLinkProps & { type?: string; component?: ElementType };
    return renderButtonBase({
      ref,
      component,
      LinkComponent,
      href,
      inactive: disabled === true || loading,
      busy: loading,
      type,
      attributes: iconButtonAttributes({ color, size, edge, animate, loading }),
      rest: others as Record<string, unknown>,
      children: (
        <>
          {loading && (
            <span data-ok-icon-button-loader="" aria-hidden="true">
              {loadingIndicator ?? <CircularProgress color="inherit" data-ok-button-spinner="" />}
            </span>
          )}
          {children}
        </>
      ),
    });
  },
) as IconButtonComponent;
