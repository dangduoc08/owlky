import {
  type SelectionControlColor,
  type SelectionControlSize,
  type SwitchEdge,
  switchAttributes,
} from "@owlky/core";
import { type CSSProperties, forwardRef, type InputHTMLAttributes } from "react";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "color" | "onChange"> {
  /** Track color when on; `default` is the text color. Default `"primary"`. */
  color?: SelectionControlColor | undefined;
  /** `medium` (34 × 20px track) or `small` (26 × 16px). Default `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** Negative margin on that side, to align the track with content. */
  edge?: SwitchEdge | false | undefined;
  /** Called with the new checked state. */
  onChange?: ((checked: boolean) => void) | undefined;
  /** Class of the root span (other props go to the input). */
  className?: string | undefined;
  /** Style of the root span. */
  style?: CSSProperties | undefined;
}

/**
 * Switch — spec: specs/components/switch.md. A native checkbox with `role="switch"`; CSS only.
 * `ref` and the remaining props go to the input. Name it with a `FormControlLabel`, `aria-label`
 * or `aria-labelledby`.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { color, size, edge, onChange, className, style, ...props },
  ref,
) {
  return (
    <span {...switchAttributes({ color, size, edge })} className={className} style={style}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        data-ok-switch-input=""
        {...props}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      <span data-ok-switch-track="" aria-hidden="true" />
      <span data-ok-switch-thumb="" aria-hidden="true" />
    </span>
  );
});
