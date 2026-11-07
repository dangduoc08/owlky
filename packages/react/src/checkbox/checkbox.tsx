"use client";

import {
  checkboxAttributes,
  type SelectionControlColor,
  type SelectionControlSize,
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
  /** Replaces the checked icon. */
  checkedIcon?: ReactNode;
  /** Replaces the indeterminate icon. */
  indeterminateIcon?: ReactNode;
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
    onChange,
    className,
    style,
    ...props
  },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const merged = useMergedRefs(input, ref);
  // Every render: a click clears the native flag; the prop stays the source of truth.
  // Effects run after commit, when the input exists.
  useEffect(() => {
    (input.current as HTMLInputElement).indeterminate = indeterminate === true;
  });
  return (
    <span
      {...checkboxAttributes({ color, size, indeterminate })}
      data-ok-runtime="off"
      className={className}
      style={style}
    >
      <input
        ref={merged}
        type="checkbox"
        data-ok-checkbox-input=""
        {...props}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      <span data-ok-checkbox-icon="unchecked" aria-hidden="true">
        {icon ?? <UncheckedIcon />}
      </span>
      <span data-ok-checkbox-icon="checked" aria-hidden="true">
        {checkedIcon ?? <CheckedIcon />}
      </span>
      <span data-ok-checkbox-icon="indeterminate" aria-hidden="true">
        {indeterminateIcon ?? <IndeterminateIcon />}
      </span>
    </span>
  );
});
