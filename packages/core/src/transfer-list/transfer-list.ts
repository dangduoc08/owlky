/*
 * Transfer list rules (the MUI demo), shared by React and the HTML runtime. Pure: values in,
 * values out; order is kept (moved items go to the end of the other side, in their order).
 */

export type TransferDirection = "right" | "left" | "all-right" | "all-left";

export interface TransferState {
  left: string[];
  right: string[];
  /** Checked items (on either side). */
  checked: string[];
}

/** Moves the checked items (or every item) to the other side; moved items are unchecked. */
export function transferMove(state: TransferState, direction: TransferDirection): TransferState {
  const toRight = direction === "right" || direction === "all-right";
  const from = toRight ? state.left : state.right;
  const moving = direction.startsWith("all-")
    ? [...from]
    : from.filter((v) => state.checked.includes(v));
  const stay = from.filter((v) => !moving.includes(v));
  const to = [...(toRight ? state.right : state.left), ...moving];
  return {
    left: toRight ? stay : to,
    right: toRight ? to : stay,
    checked: state.checked.filter((v) => !moving.includes(v)),
  };
}

/** Whether a move does anything (the button's enabled state). */
export function canTransfer(state: TransferState, direction: TransferDirection): boolean {
  const from = direction === "right" || direction === "all-right" ? state.left : state.right;
  if (direction.startsWith("all-")) return from.length > 0;
  return from.some((v) => state.checked.includes(v));
}

/** Select-all of one side: checks every item, or clears them when all were checked. */
export function toggleAll(checked: readonly string[], side: readonly string[]): string[] {
  const all = side.length > 0 && side.every((v) => checked.includes(v));
  return all ? checked.filter((v) => !side.includes(v)) : [...new Set([...checked, ...side])];
}

/** Select-all state of one side: `true`, `false` or `"mixed"`. */
export function sideCheckedState(
  checked: readonly string[],
  side: readonly string[],
): boolean | "mixed" {
  const count = side.filter((v) => checked.includes(v)).length;
  if (count === 0) return false;
  return count === side.length ? true : "mixed";
}

/** Default count text of an enhanced header: "1/4 selected". */
export const transferCountLabel = (checked: number, total: number): string =>
  `${checked}/${total} selected`;
