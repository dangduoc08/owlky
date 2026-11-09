"use client";

import {
  type FormHelperTextMargin,
  formControlAttributes,
  formGroupAttributes,
  formHelperTextAttributes,
  formLabelAttributes,
  type SelectionControlColor,
  type SelectionControlSize,
  type TextFieldMargin,
  type TextFieldVariant,
} from "@owlky/core";
import {
  createContext,
  createElement,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  useContext,
} from "react";

/** The state a FormControl shares with its parts and a composed input (`useFormControl()`). */
export interface FormControlState {
  color: SelectionControlColor;
  size: SelectionControlSize;
  variant: TextFieldVariant;
  margin: TextFieldMargin;
  fullWidth: boolean;
  hiddenLabel: boolean;
  disabled: boolean;
  error: boolean;
  required: boolean;
  focused: boolean;
}

const FormControlContext = createContext<FormControlState | undefined>(undefined);

/** The enclosing FormControl's state, or `undefined` outside one. */
export function useFormControl(): FormControlState | undefined {
  return useContext(FormControlContext);
}

export interface FormControlProps extends HTMLAttributes<HTMLElement> {
  /** Color of a focused label; `default` is the text color. Default `"default"`. */
  color?: SelectionControlColor | undefined;
  /** Size shared with a composed input. Default `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** Variant shared with a composed input; `outlined` and `filled` indent the helper text. */
  variant?: TextFieldVariant | undefined;
  /** Vertical margin: `none` (default), `dense` (8 / 4px) or `normal` (16 / 8px). */
  margin?: TextFieldMargin | undefined;
  /** Stretch to the container width. */
  fullWidth?: boolean | undefined;
  /** A filled Select without a label: less padding above the value. */
  hiddenLabel?: boolean | undefined;
  /** Disabled label and helper text; a `fieldset` root also disables every control inside. */
  disabled?: boolean | undefined;
  /** Error colors for the label and the helper text. */
  error?: boolean | undefined;
  /** The label shows an asterisk. */
  required?: boolean | undefined;
  /** The label shows the focus color. */
  focused?: boolean | undefined;
  /** The root element, such as `fieldset`. Default `"div"`. */
  component?: ElementType | undefined;
}

/**
 * FormControl — spec: specs/components/form-control.md. Groups a control with its label and
 * helper text and shares their states: attributes on the root (read by the parts' CSS) and a
 * context for React parts and composed inputs.
 */
export const FormControl = forwardRef<HTMLElement, FormControlProps>(function FormControl(
  {
    color,
    size,
    variant,
    margin,
    fullWidth,
    hiddenLabel,
    disabled,
    error,
    required,
    focused,
    component = "div",
    children,
    ...props
  },
  ref,
) {
  const attributes = formControlAttributes({
    color,
    size,
    variant,
    margin,
    fullWidth,
    hiddenLabel,
    disabled,
    error,
    required,
    focused,
  });
  // Valid values only (unknown ones fall back to the defaults, as the attributes do).
  const state: FormControlState = {
    color: (attributes["data-ok-color"] ?? "default") as SelectionControlColor,
    size: (attributes["data-ok-size"] ?? "medium") as SelectionControlSize,
    variant: (attributes["data-ok-variant"] ?? "outlined") as TextFieldVariant,
    margin: (attributes["data-ok-margin"] ?? "none") as TextFieldMargin,
    fullWidth: fullWidth === true,
    hiddenLabel: hiddenLabel === true,
    disabled: disabled === true,
    error: error === true,
    required: required === true,
    focused: focused === true,
  };
  return createElement(
    component,
    {
      ref,
      ...attributes,
      ...(component === "fieldset" && disabled === true ? { disabled: true } : {}),
      ...props,
    },
    <FormControlContext.Provider value={state}>{children}</FormControlContext.Provider>,
  );
});

interface FormPartStates {
  /** Disabled colors for this part only (the FormControl's reach it through CSS). */
  disabled?: boolean | undefined;
  /** Error colors for this part only. */
  error?: boolean | undefined;
  /** Marks this part as required (FormLabel: shows the asterisk). */
  required?: boolean | undefined;
  /** Focused colors for this part only. */
  focused?: boolean | undefined;
  /** Marks the part of an input that has a value (no style). */
  filled?: boolean | undefined;
}

export interface FormLabelProps
  extends Omit<LabelHTMLAttributes<HTMLElement>, "color">,
    FormPartStates {
  /** Color when focused; default: the FormControl's. */
  color?: SelectionControlColor | undefined;
  /** The element: `label` (default; pair it with `htmlFor`), `legend` in a fieldset, or `span`. */
  component?: ElementType | undefined;
}

/**
 * FormLabel — the label of a FormControl: body2 in the secondary text color, colored by the
 * focused / error / disabled states. Shows an asterisk when it or its FormControl is required.
 */
export const FormLabel = forwardRef<HTMLElement, FormLabelProps>(function FormLabel(
  { color, disabled, error, required, focused, filled, component = "label", children, ...props },
  ref,
) {
  const control = useFormControl();
  const asterisk = required ?? control?.required ?? false;
  return createElement(
    component,
    {
      ref,
      ...formLabelAttributes({ color, disabled, error, required, focused, filled }),
      ...props,
    },
    children,
    asterisk ? (
      <span data-ok-form-label-asterisk="" aria-hidden="true">
        *
      </span>
    ) : null,
  );
});

export interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Controls side by side instead of a column. */
  row?: boolean | undefined;
}

/** FormGroup — a column (or `row`) of FormControlLabels. Server-safe. */
export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(function FormGroup(
  { row, ...props },
  ref,
) {
  return <div ref={ref} {...formGroupAttributes({ row })} {...props} />;
});

export interface FormHelperTextProps extends HTMLAttributes<HTMLElement>, FormPartStates {
  /** `dense`: 4px above instead of 6px; default: the FormControl's margin. */
  margin?: FormHelperTextMargin | undefined;
  /** `outlined` and `filled` indent the text; default: the FormControl's variant. */
  variant?: TextFieldVariant | undefined;
  /** The element. Default `"p"`. */
  component?: ElementType | undefined;
}

/**
 * FormHelperText — a hint or an error message under a control: caption text in the secondary
 * text color (the error tone with `error`). Reference it from the control (`aria-describedby`).
 */
export const FormHelperText = forwardRef<HTMLElement, FormHelperTextProps>(function FormHelperText(
  { margin, variant, disabled, error, required, focused, filled, component = "p", ...props },
  ref,
) {
  return createElement(component, {
    ref,
    ...formHelperTextAttributes({ margin, variant, disabled, error, required, focused, filled }),
    ...props,
  });
});
