"use client";

import {
  createNumberFieldController,
  formatNumberInput,
  type NumberFieldChangeDetails,
  numberFieldAttributes,
  numberFieldSettings,
  numberFieldState,
  typedNumberChange,
} from "@owlky/core";
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { IconButton } from "../icon-button/icon-button.js";
import { InputAdornment, type TextFieldProps, useFieldMarkup } from "./text-field.js";

/** The minus and plus icons (decorative, same SVG as the HTML snippets). */
function StepIcon({ plus }: { plus: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d={plus ? "M5 12h14M12 5v14" : "M5 12h14"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface NumberFieldProps
  extends Omit<
    TextFieldProps,
    | "value"
    | "defaultValue"
    | "onChange"
    | "multiline"
    | "rows"
    | "minRows"
    | "maxRows"
    | "select"
    | "selectProps"
    | "children"
    | "type"
    | "inputComponent"
    | "startAdornment"
    | "endAdornment"
    | "min"
    | "max"
    | "step"
  > {
  /** Controlled value (`null` = empty). */
  value?: number | null | undefined;
  /** Uncontrolled initial value. Default `null` (empty). */
  defaultValue?: number | null | undefined;
  /**
   * Called with each new value and why it changed (`details.reason`: `input-change`,
   * `input-clear`, `input-blur`, `keyboard`, `increment-press` or `decrement-press`).
   */
  onValueChange?: ((value: number | null, details: NumberFieldChangeDetails) => void) | undefined;
  /** Called when the person finishes a change: a step, a press, Enter or leaving the input. */
  onValueCommitted?:
    | ((value: number | null, details: NumberFieldChangeDetails) => void)
    | undefined;
  /** Lowest value. */
  min?: number | undefined;
  /** Highest value. */
  max?: number | undefined;
  /** How much the buttons and Arrow Up / Arrow Down change the value. Default `1`. */
  step?: number | undefined;
  /** Step with Alt + Arrow Up / Arrow Down. Default `0.1`. */
  smallStep?: number | undefined;
  /** Step of Page Up / Page Down and Shift + Arrow Up / Arrow Down. Default `10`. */
  largeStep?: number | undefined;
  /** A step lands on a multiple of `step` counted from `min` (such as 1.5 → 2). */
  snapOnStep?: boolean | undefined;
  /** Typed values outside `min` / `max` stay as typed; steps still stop at the bounds. */
  allowOutOfRange?: boolean | undefined;
  /** The decrement button's accessible name. Default `"Decrease"`. */
  decrementLabel?: string | undefined;
  /** The increment button's accessible name. Default `"Increase"`. */
  incrementLabel?: string | undefined;
}

/**
 * NumberField — spec: specs/components/text-field.md (number input). A text field whose input is
 * a spin button, with decrement and increment buttons in its adornments. `ref` and the remaining
 * props go to the input.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    onValueCommitted,
    min,
    max,
    step,
    smallStep,
    largeStep,
    snapOnStep,
    allowOutOfRange,
    decrementLabel = "Decrease",
    incrementLabel = "Increase",
    id,
    size,
    disabled,
    readOnly,
    ...props
  },
  ref,
) {
  const controlled = valueProp !== undefined;
  const [own, setOwn] = useState<number | null>(defaultValue);
  const value = controlled ? valueProp : own;
  // Text being typed: shown instead of the value until the change is committed.
  const [draft, setDraft] = useState<string | null>(null);
  const generated = useId();
  const inputId = id ?? generated;
  const rootRef = useRef<HTMLElement>(null);
  const latest = useRef({ value, controlled, onValueChange, onValueCommitted });
  latest.current = { value, controlled, onValueChange, onValueCommitted };

  const report = (next: number | null, details: NumberFieldChangeDetails) => {
    if (!latest.current.controlled) setOwn(next);
    latest.current.onValueChange?.(next, details);
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: one controller per field; it reads the latest values.
  useEffect(() => {
    const root = rootRef.current as HTMLElement;
    const controller = createNumberFieldController(
      root,
      {
        getValue: () => latest.current.value,
        onChange: (next, details) => report(next, details),
        onCommit(next, details) {
          setDraft(null);
          latest.current.onValueCommitted?.(next, details);
        },
      },
      // Typing is reported from `onChange` below (core: a native listener would undo it).
      { input: false },
    );
    return () => controller.destroy();
  }, []);

  const options = { min, max, step, smallStep, largeStep, snapOnStep, allowOutOfRange };
  const settings = numberFieldSettings(options);
  const state = numberFieldState(value, settings, disabled === true || readOnly === true);
  const iconSize = size === "small" ? "sm" : "md";
  const button = (plus: boolean) => (
    <InputAdornment position={plus ? "end" : "start"}>
      <IconButton
        size={iconSize}
        edge={plus ? "end" : "start"}
        tabIndex={-1}
        aria-label={plus ? incrementLabel : decrementLabel}
        aria-controls={inputId}
        disabled={!(plus ? state.canIncrement : state.canDecrement)}
        {...(plus
          ? { "data-ok-number-field-increment": "" }
          : { "data-ok-number-field-decrement": "" })}
      >
        <StepIcon plus={plus} />
      </IconButton>
    </InputAdornment>
  );
  return useFieldMarkup(
    {
      autoComplete: "off",
      ...props,
      id: inputId,
      size,
      disabled,
      readOnly,
      role: "spinbutton",
      inputMode: "decimal",
      "aria-valuenow": value ?? undefined,
      "aria-valuemin": settings.min,
      "aria-valuemax": settings.max,
      value: draft ?? formatNumberInput(value),
      onChange(text: string) {
        setDraft(text);
        const typed = typedNumberChange(text, latest.current.value);
        if (typed) report(typed.value, { reason: typed.reason });
      },
      startAdornment: button(false),
      endAdornment: button(true),
    },
    ref,
    undefined,
    { attributes: numberFieldAttributes(options), ref: rootRef },
  );
});
