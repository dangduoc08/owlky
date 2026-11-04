import type { ColorName, PaletteColorName } from "@minimal-tailwind/tokens";

/*
 * Anatomy: the single mapping from component options to DOM attributes. React spreads these
 * objects; HTML snippets are written to match them (verified by the e2e anatomy parity test).
 * Defaults are emitted explicitly so rendered markup is self-describing.
 */

export type DataAttributes = { [key: `data-mt-${string}`]: string };

export type ButtonVariant = "text" | "contained" | "outlined" | "soft";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonAnatomyOptions {
  variant?: ButtonVariant | undefined;
  color?: ColorName | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
}

export function buttonAttributes(options: ButtonAnatomyOptions = {}): DataAttributes {
  const attributes: DataAttributes = {
    "data-mt-button": "",
    "data-mt-variant": options.variant ?? "text",
    "data-mt-color": options.color ?? "inherit",
    "data-mt-size": options.size ?? "md",
  };
  if (options.fullWidth) attributes["data-mt-full-width"] = "";
  return attributes;
}

export type SwitchSize = "sm" | "md";

export interface SwitchAnatomyOptions {
  color?: PaletteColorName | undefined;
  size?: SwitchSize | undefined;
}

export function switchAttributes(options: SwitchAnatomyOptions = {}): DataAttributes {
  return {
    "data-mt-switch": "",
    "data-mt-color": options.color ?? "primary",
    "data-mt-size": options.size ?? "md",
  };
}

export type DialogSize = "xs" | "sm" | "md" | "lg" | "full";

export interface DialogAnatomyOptions {
  size?: DialogSize | undefined;
}

export function dialogAttributes(options: DialogAnatomyOptions = {}): DataAttributes {
  return { "data-mt-dialog": "", "data-mt-size": options.size ?? "sm" };
}
