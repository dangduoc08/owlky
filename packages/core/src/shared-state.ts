/**
 * Page-wide shared state (ADR-0007).
 *
 * Only state that must be coordinated across *every* copy of the library on a page lives here:
 * the overlay layer stack and the scroll-lock counter. React and HTML implementations, and
 * duplicated bundles, all see the same object because the key is `Symbol.for(...)`.
 *
 * Each key embeds a protocol number. Bump it whenever the *shape* of that state changes, so an
 * old and a new copy never read each other's incompatible data — they simply stop coordinating
 * instead of corrupting each other.
 */
export function sharedState<T extends object>(key: string, protocol: number, create: () => T): T {
  const symbol = Symbol.for(`owlky.${key}@${protocol}`);
  const store = globalThis as unknown as Record<symbol, T | undefined>;
  let state = store[symbol];
  if (state === undefined) {
    state = create();
    Object.defineProperty(globalThis, symbol, { value: state, configurable: true });
  }
  return state;
}
