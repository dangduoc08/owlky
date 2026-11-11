import {
  type LinkColor,
  type LinkUnderline,
  linkAttributes,
  linkRel,
  type TypographyVariantName,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactElement,
  type Ref,
  type RefAttributes,
} from "react";
import { Typography, type TypographyProps } from "../typography/typography.js";

export interface LinkProps extends Omit<TypographyProps, "color" | "variantMapping"> {
  /** A palette's `main` tone, a text tone, or `inherit`. Default `"primary"`. */
  color?: LinkColor | undefined;
  /** When the link is underlined. Default `"always"`. */
  underline?: LinkUnderline | undefined;
  /** A step of the type scale. Default `"inherit"` (the font of the text around the link). */
  variant?: TypographyVariantName | undefined;
}

/** Link's own props (the options), shared by both call signatures. */
type LinkOwnProps = Pick<
  LinkProps,
  | "color"
  | "underline"
  | "variant"
  | "align"
  | "gutterBottom"
  | "noWrap"
  | "maxLines"
  | "persistent"
  | "children"
>;

/**
 * With `component`, the props of that element or component (a router link's `to`); without it,
 * `LinkProps` (an `a`, or a `button` when there is no `href`).
 */
export interface LinkComponent {
  <C extends ElementType>(
    props: LinkOwnProps & {
      /** The element or component to render, such as a router link. */
      component: C;
      ref?: Ref<HTMLElement> | undefined;
    } & Omit<ComponentPropsWithoutRef<C>, keyof LinkOwnProps | "component">,
  ): ReactElement | null;
  (props: LinkProps & RefAttributes<HTMLElement>): ReactElement | null;
  displayName?: string | undefined;
}

/**
 * Link — spec: specs/components/link.md. A Typography (`data-ok-typography` + `data-ok-link`)
 * rendered as `a`, or as `<button type="button">` when there is neither `href` nor `component`
 * (an action, not a destination). `href` passes through untouched; `target="_blank"` always gets
 * `rel="noopener noreferrer"`.
 */
export const Link = forwardRef<HTMLElement, LinkProps>(function Link(
  {
    color,
    underline,
    variant,
    align,
    gutterBottom,
    noWrap,
    maxLines,
    persistent,
    component,
    href,
    target,
    rel,
    ...props
  },
  ref,
) {
  const {
    "data-ok-typography": _,
    "data-ok-variant": linkVariant,
    ...attributes
  } = linkAttributes({
    color,
    underline,
    variant,
    align,
    gutterBottom,
    noWrap,
    maxLines,
    persistent,
  });
  const element = component ?? (href === undefined ? "button" : "a");
  const safeRel = linkRel(target, rel);
  return (
    <Typography
      ref={ref}
      component={element}
      variant={linkVariant as TypographyVariantName}
      {...attributes}
      {...(element === "button" ? { type: "button" } : {})}
      // Only what was given: a router link's own `href` (from `to`) must not be overwritten.
      {...(href === undefined ? {} : { href })}
      {...(target === undefined ? {} : { target })}
      {...(safeRel === undefined ? {} : { rel: safeRel })}
      {...props}
    />
  );
}) as LinkComponent;
