import { type Ref, type RefCallback, useCallback, useRef } from "react";

/** Writes `value` into a ref (object or callback; a callback's cleanup isn't kept). */
export function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** Combines several refs (object or callback) into one stable callback ref. */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  const latest = useRef(refs);
  latest.current = refs;
  return useCallback((value: T | null) => {
    for (const ref of latest.current) setRef(ref, value);
  }, []);
}
