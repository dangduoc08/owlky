"use client";

import {
  radioAttributes,
  radioGroupAttributes,
  type SelectionControlColor,
  type SelectionControlSize,
} from "@owlky/core";
import {
  type CSSProperties,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useContext,
  useId,
} from "react";
import { useControllableState } from "../utils/use-controllable-state.js";

/** Default icons (decorative, same SVG as the HTML snippets). */
function UncheckedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

interface RadioGroupContextValue {
  name: string;
  value: string | null;
  select(value: string): void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "color" | "onChange"> {
  /** Color when selected; `default` is the text color. Default `"primary"`. */
  color?: SelectionControlColor | undefined;
  /** `medium` (40px target, 24px icon) or `small` (36 / 20px). Default `"medium"`. */
  size?: SelectionControlSize | undefined;
  /** Identifies the radio in a `RadioGroup` (and in the submitted form). */
  value?: string | undefined;
  /** Replaces the unselected icon. */
  icon?: ReactNode;
  /** Replaces the selected icon. */
  checkedIcon?: ReactNode;
  /** Standalone: called with `true` when the radio gets selected. */
  onChange?: ((checked: boolean) => void) | undefined;
  /** Class of the root span (other props go to the input). */
  className?: string | undefined;
  /** Style of the root span. */
  style?: CSSProperties | undefined;
}

/**
 * Radio — spec: specs/components/radio.md. A native `<input type="radio">` with themed icons. In a
 * `RadioGroup` it takes the group's name and selection. `ref` and the remaining props go to the input.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { color, size, value, icon, checkedIcon, onChange, className, style, ...props },
  ref,
) {
  const group = useContext(RadioGroupContext);
  const inGroup = group !== null && value !== undefined;
  return (
    <span {...radioAttributes({ color, size })} className={className} style={style}>
      <input
        ref={ref}
        type="radio"
        data-ok-radio-input=""
        value={value}
        {...(group ? { name: group.name } : {})}
        {...(inGroup ? { checked: group.value === value } : {})}
        {...props}
        onChange={(event) => {
          if (inGroup) group.select(value);
          onChange?.(event.currentTarget.checked);
        }}
      />
      <span data-ok-radio-icon="unchecked" aria-hidden="true">
        {icon ?? <UncheckedIcon />}
      </span>
      <span data-ok-radio-icon="checked" aria-hidden="true">
        {checkedIcon ?? <CheckedIcon />}
      </span>
    </span>
  );
});

export interface RadioGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Name of the radios (default: a generated one). */
  name?: string | undefined;
  /** Controlled: the selected value (`null` = none). */
  value?: string | null | undefined;
  /** Uncontrolled: the initially selected value. */
  defaultValue?: string | undefined;
  /** Called with the value of the radio that gets selected. */
  onChange?: ((value: string) => void) | undefined;
  /** Radios side by side instead of a column. */
  row?: boolean | undefined;
}

/**
 * RadioGroup — spec: specs/components/radio.md. `role="radiogroup"`: name it with `aria-label` or
 * `aria-labelledby`. The browser keeps one radio checked and moves with the arrow keys.
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { name, value, defaultValue, onChange, row, children, ...props },
  ref,
) {
  const generated = useId();
  const [selected, setSelected] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onChange as ((value: string | null) => void) | undefined,
  });
  return (
    <div ref={ref} role="radiogroup" {...radioGroupAttributes({ row })} {...props}>
      <RadioGroupContext.Provider
        value={{ name: name ?? generated, value: selected, select: (next) => setSelected(next) }}
      >
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
});
