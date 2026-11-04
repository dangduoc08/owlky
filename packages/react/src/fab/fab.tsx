import {
  type FabColor,
  type FabSize,
  type FabVariant,
  fabAttributes,
} from "@minimal-tailwind/core";
import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface FabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Default `"contained"`. */
  variant?: FabVariant | undefined;
  /** `default` (grey), `inherit` (dark) or a palette color. Default `"default"`. */
  color?: FabColor | undefined;
  /** Round `sm` 40 · `md` 48 · `lg` 56; extended `sm` 36 · `md` 40 · `lg` 48. Default `"md"`. */
  size?: FabSize | undefined;
  /** A pill with an icon and a label instead of a round icon button. */
  extended?: boolean | undefined;
  /** Scales up on hover and down while pressed (off with reduced motion). */
  animate?: boolean | undefined;
}

/**
 * Fab — spec: specs/components/fab.md. A native `<button type="button">`; round fabs need
 * `aria-label`, extended fabs are named by their label.
 */
export const Fab = forwardRef<HTMLButtonElement, FabProps>(function Fab(
  { variant, color, size, extended, animate, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      {...fabAttributes({ variant, color, size, extended, animate })}
      {...props}
    />
  );
});
