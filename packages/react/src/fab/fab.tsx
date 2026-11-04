import {
  type FabColor,
  type FabSize,
  type FabVariant,
  fabAttributes,
} from "@minimal-tailwind/core";
import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, forwardRef, type Ref } from "react";

interface FabOwnProps {
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

export type FabAsButtonProps = FabOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & { href?: undefined };

export type FabAsLinkProps = FabOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> & {
    /** Renders an `<a>` with the fab styling. */
    href: string;
    /** Removes `href` and sets `aria-disabled`, so the link can't be followed. */
    disabled?: boolean | undefined;
  };

export type FabProps = FabAsButtonProps | FabAsLinkProps;

/**
 * Fab — spec: specs/components/fab.md. A native `<button type="button">`, or an `<a>` when `href`
 * is set; round fabs need `aria-label`, extended fabs are named by their label.
 */
export const Fab = forwardRef<HTMLButtonElement | HTMLAnchorElement, FabProps>(function Fab(
  { variant, color, size, extended, animate, ...rest },
  ref,
) {
  const attributes = fabAttributes({ variant, color, size, extended, animate });
  if (rest.href !== undefined) {
    const { href, disabled, ...anchor } = rest as FabAsLinkProps;
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        {...attributes}
        {...anchor}
        href={disabled ? undefined : href}
        role={disabled ? "link" : anchor.role}
        aria-disabled={disabled ? true : anchor["aria-disabled"]}
      />
    );
  }
  const { type = "button", ...button } = rest as FabAsButtonProps;
  return <button ref={ref as Ref<HTMLButtonElement>} type={type} {...attributes} {...button} />;
});
