import { formControlLabelAttributes, type LabelPlacement } from "@owlky/core";
import {
  cloneElement,
  forwardRef,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

/** Props a `FormControlLabel` passes down to its control (only when set, and the control's win). */
const PASSED = ["checked", "disabled", "required", "onChange", "value"] as const;

export interface FormControlLabelProps
  extends Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange"> {
  /** The control: a `Checkbox` or a `Switch`. */
  control: ReactElement;
  /** The visible text (or element) that names the control. */
  label: ReactNode;
  /** Where the text sits around the control. Default `"end"`. */
  labelPlacement?: LabelPlacement | undefined;
  /** Passed to the control; the text turns grey. */
  disabled?: boolean | undefined;
  /** Shows an asterisk and passes `required` to the control. */
  required?: boolean | undefined;
  /** Passed to the control. */
  checked?: boolean | undefined;
  /** Passed to the control. */
  onChange?: ((checked: boolean) => void) | undefined;
  /** Passed to the control. */
  value?: string | undefined;
}

/**
 * FormControlLabel — spec: specs/components/form-control-label.md. A `<label>` around a control
 * and its text, so clicking the text toggles the control and names it. Server-safe (no hooks).
 */
export const FormControlLabel = forwardRef<HTMLLabelElement, FormControlLabelProps>(
  function FormControlLabel(
    { control, label, labelPlacement, disabled, required, checked, onChange, value, ...props },
    ref,
  ) {
    const given = { checked, disabled, required, onChange, value };
    const own = control.props as Record<string, unknown>;
    const passed = Object.fromEntries(
      PASSED.filter((key) => given[key] !== undefined && own[key] === undefined).map((key) => [
        key,
        given[key],
      ]),
    );
    return (
      // biome-ignore lint/a11y/noLabelWithoutControl: the control is the `control` element, rendered inside.
      <label ref={ref} {...formControlLabelAttributes({ labelPlacement, required })} {...props}>
        {cloneElement(control, passed)}
        <span data-ok-form-control-label-text="">
          {label}
          {required ? (
            <span data-ok-form-control-label-asterisk="" aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      </label>
    );
  },
);
