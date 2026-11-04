import {
  type IconButtonColor,
  type IconButtonSize,
  iconButtonAttributes,
} from "@minimal-tailwind/core";
import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** `default` (secondary text), `inherit` (text color) or a palette color. Default `"default"`. */
  color?: IconButtonColor | undefined;
  /** `sm` 28px · `md` 36px · `lg` 48px. Default `"md"`. */
  size?: IconButtonSize | undefined;
  /** Scales up on hover and down while pressed (off with reduced motion). */
  animate?: boolean | undefined;
}

/**
 * IconButton — spec: specs/components/icon-button.md. A native round `<button type="button">`
 * holding a decorative icon. Give it an accessible name with `aria-label`.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { color, size, animate, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} {...iconButtonAttributes({ color, size, animate })} {...props} />
  );
});
