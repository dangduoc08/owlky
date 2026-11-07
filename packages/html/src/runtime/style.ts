/**
 * Writes private custom properties through CSSOM (CSP-safe: no style strings) and removes the
 * ones written before that are no longer wanted. Returns the names now written.
 */
export function syncCustomProperties(
  element: HTMLElement,
  next: Partial<Record<`--_ok-${string}`, string>>,
  previous: readonly string[],
): string[] {
  const entries = Object.entries(next) as [string, string][];
  const names = entries.map(([name]) => name);
  for (const name of previous) if (!names.includes(name)) element.style.removeProperty(name);
  for (const [name, value] of entries) element.style.setProperty(name, value);
  return names;
}
