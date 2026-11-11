import { NumberField } from "@owlky/react";

/** Basic: a value with buttons on either side; it never goes below 0. */
export function NumberBasicDemo() {
  return (
    <NumberField id="number-basic" size="small" aria-label="Quantity" defaultValue={0} min={0} />
  );
}

/** With helper text: a label above the value and a hint under the field. */
export function NumberHelperDemo() {
  return (
    <NumberField
      id="number-helper"
      label="Bedrooms"
      defaultValue={0}
      min={0}
      max={10}
      helperText="Helper text"
    />
  );
}

/** Disabled: neither the input nor the buttons respond. */
export function NumberDisabledDemo() {
  return <NumberField id="number-disabled" label="Bedrooms" defaultValue={0} min={0} disabled />;
}
