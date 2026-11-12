"use client";

import {
  altArrowDownLinear,
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
  createElement,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  useId,
} from "react";
import { type SelectBehaviorProps, SelectRoot, type SelectValue } from "../select/select.js";
import { Icon } from "../utils/icon.js";

/** The select's arrow (decorative, same SVG as the HTML snippets). */
function SelectIcon() {
  return <Icon icon={altArrowDownLinear} data-ok-text-field-select-icon="" />;
}

export interface InputAdornmentProps extends HTMLAttributes<HTMLSpanElement> {
  /** Which side of the input it goes on. */
  position: "start" | "end";
  /** Presses go through the adornment to the input, such as for a decorative icon. */
  disablePointerEvents?: boolean | undefined;
  /** The element to render. Default `"span"`. */
  component?: ElementType | undefined;
}

/** InputAdornment — an icon, text or button before or after a text field's input. */
export const InputAdornment = forwardRef<HTMLSpanElement, InputAdornmentProps>(
  function InputAdornment({ position, disablePointerEvents, component = "span", ...props }, ref) {
    return createElement(component, {
      ref,
      "data-ok-text-field-adornment": position,
      ...(disablePointerEvents ? { "data-ok-disable-pointer-events": "" } : {}),
      ...props,
    });
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
  /**
   * Hide the label visually: it still names the input, and the field is laid out as if it had
   * none (a filled field gets less padding above the value).
   */
  hiddenLabel?: boolean | undefined;
  /** Show the focus colors even when the field doesn't have focus. */
  focused?: boolean | undefined;
  /** Outlined: keep the outline's notch open even when the label rests in the box. */
  notched?: boolean | undefined;
  /** Standard: draw no underline (give the field another focus style). */
  disableUnderline?: boolean | undefined;
  /**
   * The element rendered instead of the `<input>`, such as a masked input. It receives the input's
   * props and `ref`. Multiline fields and selects keep their own element.
   */
  inputComponent?: ElementType | undefined;
  /** The root element. Default `"div"`. */
  component?: ElementType | undefined;
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

/** What a standalone input (InputBase and its variants) changes in the TextField markup. */
interface Standalone {
  /** InputBase: no variant attribute, so no box. */
  readonly base: boolean;
  /** OutlinedInput `label`: the text the notch makes room for. */
  readonly legend: ReactNode;
}

/** What a component built on the TextField markup (NumberField) adds to its root. */
export interface FieldHost {
  /** More `data-ok-*` attributes on the root (after the text field's). */
  readonly attributes?: Readonly<Record<string, string>> | undefined;
  /** The root element. */
  readonly ref?: Ref<HTMLElement> | undefined;
}

/**
 * The TextField markup. Standalone inputs render it without a label and a helper text, with
 * `data-ok-input-base` on the root. Internal: not exported from the package.
 */
export function useFieldMarkup(
  {
    variant,
    size,
    color,
    label: labelProp,
    helperText,
    error,
    fullWidth,
    margin,
    shrink,
    hiddenLabel,
    focused,
    notched,
    disableUnderline,
    inputComponent,
    component = "div",
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
  }: TextFieldProps,
  ref: Ref<TextFieldElement>,
  standalone?: Standalone,
  host?: FieldHost,
) {
  // Standalone inputs have no label element (OutlinedInput's `label` only sizes the notch).
  const label = standalone ? undefined : labelProp;
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
    hiddenLabel,
    focused,
    notched,
    disableUnderline,
    minRows: min,
    maxRows: max,
  });
  if (standalone?.base) delete attributes["data-ok-variant"];
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
    input = createElement(inputComponent ?? "input", {
      ...props,
      ...shared,
      ref,
      type,
      placeholder: placeholder ?? " ",
    });
  }
  const outlined = attributes["data-ok-variant"] === "outlined";
  const legend = standalone ? standalone.legend : label;
  const outline = outlined && !standalone?.base && (
    <fieldset data-ok-text-field-outline="" aria-hidden="true">
      {legend != null && (
        <legend>
          <span>
            {legend}
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
  return createElement(
    component,
    {
      ...attributes,
      ...(standalone ? { "data-ok-input-base": "" } : {}),
      ...host?.attributes,
      "data-ok-runtime": "off",
      ref: host?.ref,
      className,
      style: { ...rowStyle, ...style },
    },
    <>
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
    </>,
  );
}

/**
 * TextField — spec: specs/components/text-field.md. A label, a native `<input>` (or `<textarea>`,
 * `<select>`), optional adornments and helper text. `ref` and the remaining props go to the input.
 */
export const TextField = forwardRef<TextFieldElement, TextFieldProps>(
  function TextField(props, ref) {
    return useFieldMarkup(props, ref);
  },
);

/** Props of `InputBase`: the TextField's input props, without a label, a helper text or a select. */
export type InputBaseProps = Omit<
  TextFieldProps,
  | "variant"
  | "label"
  | "helperText"
  | "margin"
  | "shrink"
  | "hiddenLabel"
  | "focused"
  | "notched"
  | "disableUnderline"
  | "select"
  | "selectProps"
  | "children"
  | "component"
>;

export interface OutlinedInputProps extends InputBaseProps {
  /** The text the outline's notch makes room for (the label you show elsewhere, such as an `InputLabel`). */
  label?: ReactNode;
  /** Keep the notch open (it needs a `label`). */
  notched?: boolean | undefined;
}

export interface FilledInputProps extends InputBaseProps {
  /** The filled look has no underline: kept for compatibility (the focus ring stays). */
  disableUnderline?: boolean | undefined;
  /** The padding of a field without a label (always the case here). */
  hiddenLabel?: boolean | undefined;
}

export interface InputProps extends InputBaseProps {
  /** Draw no underline (give the field another focus style). */
  disableUnderline?: boolean | undefined;
}

type StandaloneElement = TextFieldElement;

/**
 * InputBase — spec: specs/components/text-field.md. A bare input with no box, no label and no
 * helper text, for fields you style yourself (such as a search bar). Name it with `aria-label`.
 * `ref` and the remaining props go to the input.
 */
export const InputBase = forwardRef<StandaloneElement, InputBaseProps>(
  function InputBase(props, ref) {
    return useFieldMarkup(props, ref, { base: true, legend: undefined });
  },
);

/** OutlinedInput — the outlined field box without a label or a helper text. */
export const OutlinedInput = forwardRef<StandaloneElement, OutlinedInputProps>(
  function OutlinedInput({ label, ...props }, ref) {
    return useFieldMarkup({ ...props, variant: "outlined" }, ref, { base: false, legend: label });
  },
);

/** FilledInput — the filled field box without a label or a helper text. */
export const FilledInput = forwardRef<StandaloneElement, FilledInputProps>(
  function FilledInput(props, ref) {
    return useFieldMarkup({ ...props, variant: "filled" }, ref, { base: false, legend: undefined });
  },
);

/** Input — the standard (underlined) field without a label or a helper text. */
export const Input = forwardRef<StandaloneElement, InputProps>(function Input(props, ref) {
  return useFieldMarkup({ ...props, variant: "standard" }, ref, { base: false, legend: undefined });
});
