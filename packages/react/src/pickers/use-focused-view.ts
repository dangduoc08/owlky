"use client";

import { createFocusedViewTracker, focusPickerViewPart, type PickerFocusedView } from "@owlky/core";
import { type RefObject, useEffect, useRef } from "react";

/**
 * MUI X `focusedView` / `onFocusedViewChange` for calendars and clocks: reports the view that
 * takes or loses the focus, and moves the focus into `focusedView` when it (or the shown view)
 * changes.
 */
export function useFocusedView<V extends PickerFocusedView>(
  rootRef: RefObject<HTMLElement | null>,
  focusedView: V | null | undefined,
  onFocusedViewChange: ((view: V, hasFocus: boolean) => void) | undefined,
  shownView?: string,
): void {
  const callback = useRef(onFocusedViewChange);
  callback.current = onFocusedViewChange;
  useEffect(() => {
    // The component's root: mounted before its effects run.
    const tracker = createFocusedViewTracker(rootRef.current as HTMLElement, (view, hasFocus) =>
      callback.current?.(view as V, hasFocus),
    );
    return () => tracker.destroy();
  }, [rootRef]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new shown view can take the focus.
  useEffect(() => {
    const root = rootRef.current;
    if (root && focusedView) focusPickerViewPart(root, focusedView);
  }, [rootRef, focusedView, shownView]);
}
