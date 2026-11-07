import {
  type LinearProgressVariant,
  linearProgressAttributes,
  linearProgressStyle,
  type ProgressColor,
  parseNumber,
  progressAria,
  progressFraction,
  linearProgressOptions as schema,
} from "@owlky/core";
import { type ComponentPropsWithoutRef, type CSSProperties, forwardRef } from "react";

export interface LinearProgressProps extends Omit<ComponentPropsWithoutRef<"span">, "color"> {
  /**
   * `indeterminate` / `query` while the duration is unknown; `determinate` / `buffer` show
   * `value`. Default `"indeterminate"`.
   */
  variant?: LinearProgressVariant | undefined;
  /** Palette color, or `inherit` (the text color). Default `"primary"`. */
  color?: ProgressColor | undefined;
  /** Determinate and buffer: progress between `min` and `max`. Default `min`. */
  value?: number | undefined;
  /** Buffer: how far loading has got, between `value` and `max`. */
  valueBuffer?: number | undefined;
  /** Default `0`. */
  min?: number | undefined;
  /** Default `100`. */
  max?: number | undefined;
}

const number = (key: "value" | "min" | "max" | "valueBuffer", input: unknown) => {
  const parsed = parseNumber(schema.options[key], input);
  return typeof parsed === "number" ? parsed : undefined;
};

/**
 * LinearProgress — spec: specs/components/linear-progress.md. A `progressbar`: give it a name
 * (`aria-label` / `aria-labelledby`). CSS only; the value and buffer become private custom
 * properties on the root.
 */
export const LinearProgress = forwardRef<HTMLSpanElement, LinearProgressProps>(
  function LinearProgress({ variant, color, value, valueBuffer, min, max, style, ...props }, ref) {
    const attributes = linearProgressAttributes({ variant, color });
    const kind = attributes["data-ok-variant"] as LinearProgressVariant;
    const known = kind === "determinate" || kind === "buffer";
    const range = [number("value", value), number("min", min), number("max", max)] as const;
    const bufferValue = kind === "buffer" ? number("valueBuffer", valueBuffer) : undefined;
    const custom = linearProgressStyle({
      fraction: known ? progressFraction(...range) : undefined,
      buffer: kind === "buffer" ? progressFraction(bufferValue, range[1], range[2]) : undefined,
    });
    return (
      <span
        ref={ref}
        role="progressbar"
        {...attributes}
        data-ok-runtime="off"
        {...(known ? progressAria(...range) : {})}
        {...(bufferValue !== undefined ? { "data-ok-value-buffer": String(bufferValue) } : {})}
        style={{ ...(custom as CSSProperties), ...style }}
        {...props}
      >
        {kind === "buffer" && <span data-ok-linear-progress-dashed="" />}
        <span data-ok-linear-progress-bar="1" />
        {kind !== "determinate" && <span data-ok-linear-progress-bar="2" />}
      </span>
    );
  },
);
