"use client";

import { useCallback, useRef, useState } from "react";

export interface ControllableStateOptions<T> {
  /** Controlled value. `undefined` means uncontrolled. */
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}

/**
 * State that is controlled when `value` is provided and uncontrolled otherwise. `onChange` fires
 * for every requested change in both modes; in controlled mode the owner decides by updating
 * `value`.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const currentRef = useRef(current);
  currentRef.current = current;

  const setValue = useCallback(
    (next: T) => {
      if (Object.is(next, currentRef.current)) return;
      if (!controlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );

  return [current, setValue];
}
