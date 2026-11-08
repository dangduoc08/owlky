import {
  type MotionBorderColor,
  type MotionBorderShape,
  motionBorderAttributes,
} from "@owlky/core";
import { type CSSProperties, forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface MotionBorderProps extends HTMLAttributes<HTMLDivElement> {
  /** `rounded` (default) or `circle`. */
  shape?: MotionBorderShape | undefined;
  /** `multi` (default): several brand colors; a palette color: that color sweeping around. */
  color?: MotionBorderColor | undefined;
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
 * MotionBorder — spec: specs/components/motion.md. A gradient border that turns around its content
 * (the reference's "Logo", "Avatar" and "Border"). CSS only; reduced motion stops it.
 */
export const MotionBorder = forwardRef<HTMLDivElement, MotionBorderProps>(function MotionBorder(
  { shape, color, width, duration, paused, style, children, ...props },
  ref,
) {
  const px = valid(width);
  const ms = valid(duration);
  return (
    <div
      ref={ref}
      {...motionBorderAttributes({ shape, color, width, duration, paused })}
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
