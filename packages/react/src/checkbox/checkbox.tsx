"use client";

import {
  checkboxAttributes,
  type SelectionControlColor,
  type SelectionControlSize,
  type SwatchShape,
  swatchColor,
  swatchStyle,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

/** Default icons (decorative, same SVG as the HTML snippets). */
function UncheckedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect
        x="3.75"
        y="3.75"
        width="16.5"
        height="16.5"
        rx="4.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
      <path
        data-ok-checkbox-mark=""
        d="m7.75 12.25 2.75 2.75 5.75-6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndeterminateIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
      <path data-ok-checkbox-mark="" d="M8 12h8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The check mark of a checked color swatch (decorative, same SVG as the HTML snippets). */
function SwatchMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "color" | "onChange"> {
  /** Color when checked or indeterminate; `default` is the text color. Default `"primary"`. */
  color?: SelectionControlColor | undefined;
  /** `medium` (40px target, 24px icon) or `small` (36 / 20px). Default `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** Mixed state: shows a dash and sets the input's `indeterminate`. */
  indeterminate?: boolean | undefined;
  /** Replaces the unchecked icon. */
  icon?: ReactNode;
  /** Replaces the checked icon (with `swatch`: the mark on the checked swatch). */
  checkedIcon?: ReactNode;
  /** Replaces the indeterminate icon. */
  indeterminateIcon?: ReactNode;
  /** Shows a color swatch instead of the icons (a color picker): a CSS color, such as `#FF9800`, or a `var(--ok-…)` token. Name the checkbox with the color's name (`aria-label="Orange"`). */
  swatch?: string | undefined;
  /** Swatch shape: `rounded` (default) or `circular`. */
  shape?: SwatchShape | undefined;
  /** Called with the new checked state. */
  onChange?: ((checked: boolean) => void) | undefined;
  /** Class of the root span (other props go to the input). */
  className?: string | undefined;
  /** Style of the root span. */
  style?: CSSProperties | undefined;
}

/**
 * Checkbox — spec: specs/components/checkbox.md. A native `<input type="checkbox">` with themed
 * icons; `ref` and the remaining props go to the input. Name it with a `FormControlLabel`,
 * `aria-label` or `aria-labelledby`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    color,
    size,
    indeterminate = false,
    icon,
    checkedIcon,
    indeterminateIcon,
    swatch,
    shape,
    onChange,
    className,
    style,
    ...props
  },
  ref,
) {
  const swatched = swatch !== undefined;
  const input = useRef<HTMLInputElement>(null);
  const merged = useMergedRefs(input, ref);
  // Every render: a click clears the native flag; the prop stays the source of truth.
  // Effects run after commit, when the input exists.
  useEffect(() => {
    (input.current as HTMLInputElement).indeterminate = indeterminate === true;
  });
  return (
    <span
      {...checkboxAttributes({ color, size, indeterminate, shape })}
      {...(swatched ? { "data-ok-swatch": swatchColor(swatch) ?? "" } : {})}
      data-ok-runtime="off"
      className={className}
      style={swatched ? { ...(swatchStyle(swatch) as CSSProperties), ...style } : style}
    >
      <input
        ref={merged}
        type="checkbox"
        data-ok-checkbox-input=""
        {...props}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      {swatched ? (
        <span data-ok-checkbox-swatch="" aria-hidden="true">
          {checkedIcon ?? <SwatchMark />}
        </span>
      ) : (
        <>
          <span data-ok-checkbox-icon="unchecked" aria-hidden="true">
            {icon ?? <UncheckedIcon />}
          </span>
          <span data-ok-checkbox-icon="checked" aria-hidden="true">
            {checkedIcon ?? <CheckedIcon />}
          </span>
          <span data-ok-checkbox-icon="indeterminate" aria-hidden="true">
            {indeterminateIcon ?? <IndeterminateIcon />}
          </span>
        </>
      )}
    </span>
  );
});
