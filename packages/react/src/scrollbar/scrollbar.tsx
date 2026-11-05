import { scrollbarAttributes } from "@owlky/core";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface ScrollbarProps extends ComponentPropsWithoutRef<"section"> {
  /** The thumb shows on hover and focus only. Default `true`. */
  autoHide?: boolean | undefined;
}

/**
 * Scrollbar — spec: specs/components/scrollbar.md. A named, focusable scroll area with themed
 * native scrollbars.
 */
export const Scrollbar = forwardRef<HTMLElement, ScrollbarProps>(function Scrollbar(
  { autoHide, tabIndex = 0, ...props },
  ref,
) {
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return (
    <section
      ref={ref}
      {...scrollbarAttributes({ autoHide })}
      aria-label={named ? undefined : "scrollable content"}
      tabIndex={tabIndex}
      {...props}
    />
  );
});
