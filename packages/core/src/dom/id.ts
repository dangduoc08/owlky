// Per-copy random prefix: two copies of the library on one page can never generate the same id,
// without needing shared global state (ADR-0007).
const prefix = Math.random().toString(36).slice(2, 8);
let counter = 0;

/** Returns a page-unique id such as `mt-dialog-k3x9q1-4`. For React, prefer `useId()`. */
export function createId(name = "ok"): string {
  counter += 1;
  return `${name}-${prefix}-${counter}`;
}
