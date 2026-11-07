import {
  type BadgeAnchorOrigin,
  type BadgeColor,
  type BadgeOverlap,
  type BadgeVariant,
  badgeAttributes,
  badgeContent,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** The count or text in a standard badge. */
  badgeContent?: ReactNode;
  /** A count, a dot, or a presence status. Default `"standard"`. */
  variant?: BadgeVariant | undefined;
  /** Default `"default"` (grey). */
  color?: BadgeColor | undefined;
  /** The shape it sits on. Default `"rectangular"`. */
  overlap?: BadgeOverlap | undefined;
  /** Corner. Default `{ vertical: "top", horizontal: "right" }`. */
  anchorOrigin?: Partial<BadgeAnchorOrigin> | undefined;
  /** Hide the badge. */
  invisible?: boolean | undefined;
  /** Numbers above it show as `max+`. Default `99`. */
  max?: number | undefined;
  /** Show a `0` count (hidden by default). */
  showZero?: boolean | undefined;
}

/**
 * Badge — spec: specs/components/badge.md. A count, dot or status on the corner of its child.
 * The count is visible text: also say what it counts in the child's name (for example
 * `aria-label="4 new messages"`).
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    badgeContent: given,
    variant,
    color,
    overlap,
    anchorOrigin,
    invisible,
    max,
    showZero,
    children,
    ...props
  },
  ref,
) {
  const attributes = badgeAttributes({ variant, color, overlap, anchorOrigin });
  const standard = attributes["data-ok-variant"] === "standard";
  const shown = badgeContent(given, { max, showZero });
  const hidden = invisible === true || (standard && shown.invisible);
  return (
    <span ref={ref} {...attributes} {...(hidden ? { "data-ok-invisible": "" } : {})} {...props}>
      {children}
      <span data-ok-badge-badge="">{standard ? (shown.content as ReactNode) : null}</span>
    </span>
  );
});
