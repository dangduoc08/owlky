import { type FabColor, type FabSize, type FabVariant, fabAttributes } from "@owlky/core";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactElement,
  type Ref,
  type RefAttributes,
} from "react";
import { renderButtonBase } from "../button/button-base.js";

export interface FabOwnProps {
  /** Default `"contained"`. */
  variant?: FabVariant | undefined;
  /** `default` (grey), `inherit` (dark) or a palette color. Default `"default"`. */
  color?: FabColor | undefined;
  /** Round `sm` 40 · `md` 48 · `lg` 56; extended `sm` 36 · `md` 40 · `lg` 48. Default `"md"`. */
  size?: FabSize | undefined;
  /** A pill with an icon and a label instead of a round icon button. */
  extended?: boolean | undefined;
  /** Scales up on hover and down while pressed (off with reduced motion). */
  animate?: boolean | undefined;
}

export type FabAsButtonProps = FabOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
    href?: undefined;
    /** The element to render: `"button"` (the default). */
    component?: "button" | undefined;
  };

export type FabAsLinkProps = FabOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> & {
    /** Renders an `<a>` with the fab styling. */
    href: string;
    /** Removes `href` and sets `aria-disabled`, so the link can't be followed. */
    disabled?: boolean | undefined;
    /**
     * The component that renders the link instead of an `<a>`, such as a router link. It gets
     * `href` and the fab's attributes. Default `"a"`.
     */
    LinkComponent?: ElementType | undefined;
    /** `"button"` (the default) still renders the link: `href` wins (MUI). */
    component?: "button" | undefined;
  };

export type FabProps = FabAsButtonProps | FabAsLinkProps;

/**
 * With `component`, the props of that element or component (a router link's `to`); without it,
 * `FabProps` (a `<button>`, or a link when `href` is set).
 */
export interface FabComponent {
  <C extends ElementType>(
    props: FabOwnProps & {
      /** The element or component to render, such as a router link. */
      component: C;
      /** Turns the fab off: links get `aria-disabled` and leave the tab order. */
      disabled?: boolean | undefined;
      ref?: Ref<HTMLElement> | undefined;
    } & Omit<ComponentPropsWithoutRef<C>, keyof FabOwnProps | "component" | "disabled">,
  ): ReactElement | null;
  (props: FabProps & RefAttributes<HTMLButtonElement | HTMLAnchorElement>): ReactElement | null;
  displayName?: string | undefined;
}

/**
 * Fab — spec: specs/components/fab.md. A native `<button type="button">`, an `<a>` when `href`
 * is set (or the `LinkComponent`), or the `component`; round fabs need `aria-label`, extended
 * fabs are named by their label.
 */
export const Fab = forwardRef<HTMLButtonElement | HTMLAnchorElement, FabProps>(function Fab(
  { variant, color, size, extended, animate, ...rest },
  ref,
) {
  const { component, LinkComponent, href, type, disabled, children, ...others } =
    rest as FabAsLinkProps & { type?: string; component?: ElementType };
  return renderButtonBase({
    ref,
    component,
    LinkComponent,
    href,
    inactive: disabled === true,
    busy: false,
    type,
    attributes: fabAttributes({ variant, color, size, extended, animate }),
    rest: others as Record<string, unknown>,
    children,
  });
}) as FabComponent;
