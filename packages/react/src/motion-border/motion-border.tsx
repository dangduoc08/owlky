import {
  type MotionBorderColor,
  type MotionBorderSecondaryColor,
  type MotionBorderShape,
  motionBorderAttributes,
} from "@owlky/core";
import { type CSSProperties, forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface MotionBorderProps extends HTMLAttributes<HTMLDivElement> {
  /** `rounded` (default) or `circle`. */
  shape?: MotionBorderShape | undefined;
  /**
   * `multi` (default): several brand colors all around; `inherit` (the text color) or a palette
   * color: a light running along the border.
   */
  color?: MotionBorderColor | undefined;
  /** A second light in this color, starting on the opposite side (ignored with `multi`). */
  secondaryColor?: MotionBorderSecondaryColor | undefined;
  /** Border width, px. Default 2. */
  width?: number | undefined;
  /** One turn, ms (default about 5 s). */
  duration?: number | undefined;
  /** Stops the turning border (give looping animations a pause control: WCAG 2.2.2). */
  paused?: boolean | undefined;
  children?: ReactNode;
}

const valid = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

/**
 * MotionBorder — spec: specs/components/motion.md. A gradient border, or one or two lights, turning
 * around its content over a faint track. Per-side widths and per-corner radii come from CSS
 * (`border-width`, `border-radius`). CSS only; reduced motion stops it.
 */
export const MotionBorder = forwardRef<HTMLDivElement, MotionBorderProps>(function MotionBorder(
  { shape, color, secondaryColor, width, duration, paused, style, children, ...props },
  ref,
) {
  const px = valid(width);
  const ms = valid(duration);
  return (
    <div
      ref={ref}
      {...motionBorderAttributes({ shape, color, secondaryColor, width, duration, paused })}
      data-ok-runtime="off"
      style={
        {
          ...(px !== undefined ? { "--_ok-motion-border-width": `${px}px` } : {}),
          ...(ms !== undefined ? { "--_ok-motion-border-duration": `${ms}ms` } : {}),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
});
