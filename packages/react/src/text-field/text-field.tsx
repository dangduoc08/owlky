"use client";

import {
  parseNumber,
  type SelectionControlColor,
  type SelectionControlSize,
  selectBehaviorAttributes,
  type TextFieldMargin,
  type TextFieldVariant,
  textFieldAttributes,
  textFieldOptions,
} from "@owlky/core";
import {
  type ChangeEvent,
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  useId,
} from "react";
import { type SelectBehaviorProps, SelectRoot, type SelectValue } from "../select/select.js";

/** The select's arrow (decorative, same SVG as the HTML snippets). */
function SelectIcon() {
  return (
    <svg data-ok-text-field-select-icon="" aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface InputAdornmentProps extends HTMLAttributes<HTMLSpanElement> {
  /** Which side of the input it goes on. */
  position: "start" | "end";
}

/** InputAdornment — an icon, text or button before or after a text field's input. */
export const InputAdornment = forwardRef<HTMLSpanElement, InputAdornmentProps>(
  function InputAdornment({ position, ...props }, ref) {
    return <span ref={ref} data-ok-text-field-adornment={position} {...props} />;
  },
);

/** Options of TextField's select (`select`): `native: false` makes it a listbox Select. */
export interface TextFieldSelectProps
  extends Omit<
    SelectBehaviorProps<SelectValue>,
    "value" | "defaultValue" | "onChange" | "multiple"
  > {
  /**
   * A native `<select>` with `<option>` children (the default here). `false`: a listbox Select
   * with `MenuItem` children (MUI's default).
   */
  native?: boolean | undefined;
}

/** The element `ref` points to: the input, the textarea or the select. */
export type TextFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type FieldElement = HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement;

export interface TextFieldProps
  extends Omit<
    InputHTMLAttributes<FieldElement>,
    "size" | "color" | "onChange" | "value" | "defaultValue" | "children"
  > {
  /** Outline, tinted fill or underline. Default `"outlined"`. */
  variant?: TextFieldVariant | undefined;
  /** `medium` or `small` (dense). Default `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** Focus color; `default` is the text color. Default `"default"`. */
  color?: SelectionControlColor | undefined;
  /** The floating label; it names the input. */
  label?: ReactNode;
  /** Text under the field, such as a hint or an error message (linked with `aria-describedby`). */
  helperText?: ReactNode;
  /** Error colors and `aria-invalid`. */
  error?: boolean | undefined;
  /** Stretch to the container width. */
  fullWidth?: boolean | undefined;
  /** Vertical margin. Default `"none"`. */
  margin?: TextFieldMargin | undefined;
  /** Keep the label above the value even when the field is empty. */
  shrink?: boolean | undefined;
  /** Controlled value. */
  value?: string | number | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: string | number | undefined;
  /** Called with the new value. */
  onChange?: ((value: string) => void) | undefined;
  /** A `<textarea>` instead of an `<input>`. */
  multiline?: boolean | undefined;
  /** Multiline: fixed number of rows. */
  rows?: number | undefined;
  /** Multiline: rows shown at least (grows with the content where supported). */
  minRows?: number | undefined;
  /** Multiline: rows before it scrolls. */
  maxRows?: number | undefined;
  /** A native `<select>`; pass `<option>` elements as children. */
  select?: boolean | undefined;
  /** Select options: `{ native: false }` makes a listbox Select (pass `MenuItem` children). */
  selectProps?: TextFieldSelectProps | undefined;
  /** The `<option>` elements of a select (`MenuItem`s with `selectProps.native` `false`). */
  children?: ReactNode;
  /** An `InputAdornment` with `position="start"`. */
  startAdornment?: ReactNode;
  /** An `InputAdornment` with `position="end"`. */
  endAdornment?: ReactNode;
  /** Class of the root (other props go to the input). */
  className?: string | undefined;
  /** Style of the root. */
  style?: CSSProperties | undefined;
}

/**
 * TextField — spec: specs/components/text-field.md. A label, a native `<input>` (or `<textarea>`,
 * `<select>`), optional adornments and helper text. `ref` and the remaining props go to the input.
 */
export const TextField = forwardRef<TextFieldElement, TextFieldProps>(function TextField(
  {
    variant,
    size,
    color,
    label,
    helperText,
    error,
    fullWidth,
    margin,
    shrink,
    id,
    onChange,
    multiline,
    rows,
    minRows,
    maxRows,
    select,
    selectProps,
    children,
    startAdornment,
    endAdornment,
    placeholder,
    required,
    type,
    className,
    style,
    ...props
  },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const helperId = helperText != null ? `${inputId}-helper-text` : undefined;
  const textarea = multiline === true && select !== true;
  const rowNumber = (key: "minRows" | "maxRows", input: unknown) => {
    const parsed = parseNumber(textFieldOptions.options[key], input);
    return typeof parsed === "number" ? parsed : undefined;
  };
  // Like MUI, a multiline field without `rows` grows from one row.
  const min = textarea
    ? (rowNumber("minRows", minRows) ?? (rows === undefined ? 1 : undefined))
    : undefined;
  const max = textarea ? rowNumber("maxRows", maxRows) : undefined;
  const attributes = textFieldAttributes({
    variant,
    size,
    color,
    error,
    fullWidth,
    margin,
    shrink,
    minRows: min,
    maxRows: max,
  });
  const rowStyle = {
    ...(min !== undefined ? { "--_ok-min-rows": String(min) } : {}),
    ...(max !== undefined ? { "--_ok-max-rows": String(max) } : {}),
  } as CSSProperties;
  const describedBy = [props["aria-describedby"], helperId].filter(Boolean).join(" ") || undefined;
  const shared = {
    id: inputId,
    "data-ok-text-field-input": "",
    required,
    "aria-invalid": error === true ? true : props["aria-invalid"],
    "aria-describedby": describedBy,
    onChange: (event: ChangeEvent<FieldElement>) => onChange?.(event.currentTarget.value),
  };
  let input: ReactNode;
  if (select === true) {
    input = (
      <>
        <select {...props} {...shared} ref={ref as Ref<HTMLSelectElement>}>
          {children}
        </select>
        <SelectIcon />
      </>
    );
  } else if (textarea) {
    input = (
      <textarea
        {...props}
        {...shared}
        ref={ref as Ref<HTMLTextAreaElement>}
        rows={rows ?? min}
        // `:placeholder-shown` tells the CSS whether there's a value: always set a placeholder.
        placeholder={placeholder ?? " "}
      />
    );
  } else {
    input = (
      <input
        {...props}
        {...shared}
        ref={ref as Ref<HTMLInputElement>}
        type={type}
        placeholder={placeholder ?? " "}
      />
    );
  }
  const outlined = attributes["data-ok-variant"] === "outlined";
  const outline = outlined && (
    <fieldset data-ok-text-field-outline="" aria-hidden="true">
      {label != null && (
        <legend>
          <span>
            {label}
            {required ? " *" : null}
          </span>
        </legend>
      )}
    </fieldset>
  );
  // A listbox Select composed in the control (`select` + `selectProps.native === false`).
  const listbox = select === true && selectProps?.native === false;
  const labelId = listbox && label != null ? `${inputId}-label` : undefined;
  let control: ReactNode;
  if (listbox) {
    const { native: _native, ...behavior } = selectProps;
    control = (
      <SelectRoot
        host="text-field"
        rootProps={{
          "data-ok-text-field-control": "",
          ...selectBehaviorAttributes({
            autoWidth: behavior.autoWidth,
            displayEmpty: behavior.displayEmpty,
          }),
        }}
        rootRef={null}
        triggerId={inputId}
        labelId={labelId}
        name={props.name}
        error={error === true}
        disabled={props.disabled === true}
        required={required === true}
        readOnly={props.readOnly === true}
        triggerAria={{ "aria-label": props["aria-label"], "aria-describedby": describedBy }}
        inputRef={ref as Ref<HTMLInputElement>}
        start={startAdornment}
        end={endAdornment}
        outline={outline}
        value={props.value}
        defaultValue={props.defaultValue}
        onChange={(next) => onChange?.(String(next))}
        {...(behavior as SelectBehaviorProps)}
      >
        {children}
      </SelectRoot>
    );
  } else
    control = (
      <div data-ok-text-field-control="">
        {startAdornment}
        {input}
        {endAdornment}
        {outline}
      </div>
    );
  return (
    <div
      {...attributes}
      data-ok-runtime="off"
      className={className}
      style={{ ...rowStyle, ...style }}
    >
      {label != null && (
        <label data-ok-text-field-label="" htmlFor={inputId} id={labelId}>
          {label}
          {required ? (
            <span data-ok-text-field-asterisk="" aria-hidden="true">
              {" *"}
            </span>
          ) : null}
        </label>
      )}
      {control}
      {helperText != null && (
        <div data-ok-text-field-helper="" id={helperId}>
          {helperText}
        </div>
      )}
    </div>
  );
});
