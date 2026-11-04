import { type ColorName, componentColorNames } from "@minimal-tailwind/tokens";

/*
 * Anatomy: the single mapping from component options to DOM attributes. React spreads these
 * objects; HTML snippets are written to match them (verified by the e2e anatomy parity test).
 * Defaults are emitted explicitly so rendered markup is self-describing. Values outside the
 * allowed lists fall back to the default (untrusted input never reaches the DOM).
 *
 * Each component adds a `<name>Attributes(options)` function here (see AGENTS.md checklist).
 */

export type DataAttributes = { [key: `data-mt-${string}`]: string };

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

// --- Button -----------------------------------------------------------------------------------

export const buttonVariants = ["text", "contained", "outlined", "soft"] as const;
export const buttonSizes = ["sm", "md", "lg", "xl"] as const;
export const buttonLoadingPositions = ["center", "start", "end"] as const;
export const buttonColors = [
  "inherit",
  ...componentColorNames,
] as const satisfies readonly ColorName[];

export type ButtonVariant = (typeof buttonVariants)[number];
export type ButtonSize = (typeof buttonSizes)[number];
export type ButtonLoadingPosition = (typeof buttonLoadingPositions)[number];

export interface ButtonAnatomyOptions {
  variant?: ButtonVariant | undefined;
  color?: ColorName | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
  loading?: boolean | undefined;
  loadingPosition?: ButtonLoadingPosition | undefined;
}

/** `data-mt-*` attributes of a button root (also used on `<a>` for link buttons). */
export function buttonAttributes(options: ButtonAnatomyOptions = {}): DataAttributes {
  const attributes: DataAttributes = {
    "data-mt-button": "",
    "data-mt-variant": pick(buttonVariants, options.variant, "text"),
    "data-mt-color": pick(buttonColors, options.color, "inherit"),
    "data-mt-size": pick(buttonSizes, options.size, "md"),
  };
  if (options.fullWidth === true) attributes["data-mt-full-width"] = "";
  if (options.loading === true) {
    attributes["data-mt-loading"] = "";
    attributes["data-mt-loading-position"] = pick(
      buttonLoadingPositions,
      options.loadingPosition,
      "center",
    );
  }
  return attributes;
}
