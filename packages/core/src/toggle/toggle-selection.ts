/**
 * Toggle selection rules shared by React and the HTML runtime (specs/components/toggle-button.md).
 * Pure: the owner decides whether to apply the result (controlled state, cancelable events).
 */

/**
 * The selection after the user presses `value`.
 * Exclusive: pressing the pressed value clears the selection, any other value replaces it.
 * Multiple: adds the value, or removes it when it was pressed (order of `selected` is kept).
 */
export function nextToggleSelection(
  selected: readonly string[],
  value: string,
  exclusive: boolean,
): string[] {
  const pressed = selected.includes(value);
  if (exclusive) return pressed ? [] : [value];
  return pressed ? selected.filter((item) => item !== value) : [...selected, value];
}

/** Group value as exposed to users: `string | null` when exclusive, `string[]` otherwise. */
export type ToggleGroupValue = string | null | readonly string[];

/** Normalizes a public group value to the list of selected values. */
export function toSelection(value: ToggleGroupValue | undefined): string[] {
  if (value == null) return [];
  return typeof value === "string" ? [value] : [...value];
}

/** Converts a selection back to the public shape for the group mode. */
export function fromSelection(selection: readonly string[], exclusive: boolean): ToggleGroupValue {
  return exclusive ? (selection[0] ?? null) : [...selection];
}
