import { backdropAttributes } from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface BackdropProps extends HTMLAttributes<HTMLDivElement> {
  /** Shows the backdrop (it fades in and out; closed, it stays in the DOM, hidden). */
  open: boolean;
  /** Transparent: blocks clicks without dimming the page. */
  invisible?: boolean | undefined;
  /** Content shown in front of the page, centered (for example, a `CircularProgress`). */
  children?: ReactNode;
}

/**
 * Backdrop — spec: specs/components/backdrop.md. A fixed layer over the viewport. It reports
 * nothing itself: close it from your own handler (for example, `onClick`) or when work ends.
 */
export const Backdrop = forwardRef<HTMLDivElement, BackdropProps>(function Backdrop(
  { open, invisible, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      {...backdropAttributes({ invisible })}
      {...(open ? { "data-ok-open": "" } : {})}
      data-ok-runtime="off"
      {...props}
    >
      {children}
    </div>
  );
});
