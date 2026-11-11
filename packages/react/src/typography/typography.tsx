import {
  type TypographyAlign,
  type TypographyColor,
  type TypographyMaxLines,
  type TypographyVariantName,
  typographyAttributes,
  typographyElement,
} from "@owlky/core";
import { type AllHTMLAttributes, createElement, type ElementType, forwardRef } from "react";

export interface TypographyProps extends Omit<AllHTMLAttributes<HTMLElement>, "color" | "align"> {
  /** A step of the type scale, or `inherit`. Default `"body1"`. */
  variant?: TypographyVariantName | undefined;
  /** A palette's `main` tone or a text tone. Default: the parent's color. */
  color?: TypographyColor | undefined;
  /** Text alignment. Default: the parent's alignment (`"inherit"`). */
  align?: TypographyAlign | undefined;
  /** A bottom margin of 0.35em. */
  gutterBottom?: boolean | undefined;
  /** One line; overflowing text ends with an ellipsis. */
  noWrap?: boolean | undefined;
  /** At most this many lines, from 1 to 10: longer text ends with an ellipsis on the last line. Default: every line. */
  maxLines?: TypographyMaxLines | number | undefined;
  /** With `maxLines`, the text always takes the height of that many lines, even when it is shorter. */
  persistent?: boolean | undefined;
  /** The element to render, whatever the variant (for example `"h2"` with `variant="h4"`). */
  component?: ElementType | undefined;
  /** The element per variant, over the default mapping (`h1`–`h6`, subtitles `h6`, body `p`, others `span`). */
  variantMapping?: Partial<Record<TypographyVariantName, ElementType>> | undefined;
}

/**
 * Typography — spec: specs/components/typography.md. Text in a step of the type scale; the
 * element follows the variant (`variantMapping`) unless `component` picks one.
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(function Typography(
  {
    variant,
    color,
    align,
    gutterBottom,
    noWrap,
    maxLines,
    persistent,
    component,
    variantMapping,
    ...props
  },
  ref,
) {
  const attributes = typographyAttributes({
    variant,
    color,
    align,
    gutterBottom,
    noWrap,
    maxLines,
    persistent,
  });
  const type =
    component ?? typographyElement<ElementType>(attributes["data-ok-variant"], variantMapping);
  return createElement(type, { ref, ...attributes, ...props });
});
