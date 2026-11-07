import {
  type CircularProgressVariant,
  circularProgressAttributes,
  circularProgressGeometry,
  circularProgressStyle,
  type ProgressColor,
  parseNumber,
  progressAria,
  progressFraction,
  progressSize,
  circularProgressOptions as schema,
} from "@owlky/core";
import { type ComponentPropsWithoutRef, type CSSProperties, forwardRef } from "react";

export interface CircularProgressProps extends Omit<ComponentPropsWithoutRef<"span">, "color"> {
  /** `indeterminate` spins while the duration is unknown. Default `"indeterminate"`. */
  variant?: CircularProgressVariant | undefined;
  /** Palette color, or `inherit` (the text color). Default `"primary"`. */
  color?: ProgressColor | undefined;
  /** Determinate: progress between `min` and `max`. Default `min`. */
  value?: number | undefined;
  /** Default `0`. */
  min?: number | undefined;
  /** Default `100`. */
  max?: number | undefined;
  /** Width and height: a number in px, or a CSS length such as `"3rem"`. Default `40`. */
  size?: number | string | undefined;
  /** Stroke width, in 1/44 of the size. Default `3.6`. */
  thickness?: number | undefined;
  /** Indeterminate: a fixed arc that only spins. */
  disableShrink?: boolean | undefined;
  /** Shows the faint full circle behind the arc. */
  enableTrackSlot?: boolean | undefined;
}

/**
 * CircularProgress — spec: specs/components/circular-progress.md. A `progressbar`: give it a
 * name (`aria-label` / `aria-labelledby`). CSS only; size, thickness and the value become private
 * custom properties on the root.
 */
export const CircularProgress = forwardRef<HTMLSpanElement, CircularProgressProps>(
  function CircularProgress(
    {
      variant,
      color,
      value,
      min,
      max,
      size,
      thickness,
      disableShrink,
      enableTrackSlot,
      style,
      ...props
    },
    ref,
  ) {
    const attributes = circularProgressAttributes({
      variant,
      color,
      size,
      thickness,
      disableShrink,
      enableTrackSlot,
    });
    const determinate = attributes["data-ok-variant"] === "determinate";
    const valid = (key: "value" | "min" | "max" | "thickness", input: unknown) => {
      const parsed = parseNumber(schema.options[key], input);
      return typeof parsed === "number" ? parsed : undefined;
    };
    const range = [valid("value", value), valid("min", min), valid("max", max)] as const;
    const validSize = parseNumber(schema.options.size, size);
    const validThickness = valid("thickness", thickness);
    const geometry = circularProgressGeometry(validThickness);
    const custom = circularProgressStyle({
      size: progressSize(validSize),
      thickness: validThickness,
      fraction: determinate ? progressFraction(...range) : undefined,
    });
    return (
      <span
        ref={ref}
        role="progressbar"
        {...attributes}
        data-ok-runtime="off"
        {...(determinate ? progressAria(...range) : {})}
        style={{ ...(custom as CSSProperties), ...style }}
        {...props}
      >
        <svg data-ok-circular-progress-svg="" aria-hidden="true" viewBox="22 22 44 44">
          <circle
            data-ok-circular-progress-circle=""
            cx="44"
            cy="44"
            r={geometry.r}
            strokeWidth={geometry.strokeWidth}
          />
        </svg>
      </span>
    );
  },
);
