import { type PaperVariant, paperAttributes } from "@owlky/core";
import { type ElementType, forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface PaperProps extends HTMLAttributes<HTMLElement> {
  /** Default `"elevation"`. */
  variant?: PaperVariant | undefined;
  /** Shadow depth, 0 (none) to 24. Default `1`. Ignored by `outlined`. */
  elevation?: number | undefined;
  /** Square corners. */
  square?: boolean | undefined;
  /** The element to render, such as `"section"` or `"li"`. Default `"div"`. */
  component?: ElementType | undefined;
  children?: ReactNode;
}

/**
 * Paper — spec: specs/components/paper.md. A surface: paper background, rounded corners and an
 * elevation shadow or an outline. Surfaces built on it (Card) render a Paper with their own
 * `data-ok-*` marker.
 */
export const Paper = forwardRef<HTMLElement, PaperProps>(function Paper(
  { variant, elevation, square, component: Component = "div", ...props },
  ref,
) {
  return <Component ref={ref} {...paperAttributes({ variant, elevation, square })} {...props} />;
});
