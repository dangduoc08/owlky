import { type ColorName, componentColorNames, paletteColorNames } from "@minimal-tailwind/tokens";

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

// --- Icon button & Fab ------------------------------------------------------------------------

/** `default` is the neutral grey of icon buttons and fabs; `inherit` uses the text color. */
export const iconButtonColors = [
  "default",
  "inherit",
  ...componentColorNames,
] as const satisfies readonly (ColorName | "default")[];
export const iconButtonSizes = ["sm", "md", "lg"] as const;

export type IconButtonColor = (typeof iconButtonColors)[number];
export type IconButtonSize = (typeof iconButtonSizes)[number];

export interface IconButtonAnatomyOptions {
  color?: IconButtonColor | undefined;
  size?: IconButtonSize | undefined;
  animate?: boolean | undefined;
}

/** `data-mt-*` attributes of an icon button root. */
export function iconButtonAttributes(options: IconButtonAnatomyOptions = {}): DataAttributes {
  const attributes: DataAttributes = {
    "data-mt-icon-button": "",
    "data-mt-color": pick(iconButtonColors, options.color, "default"),
    "data-mt-size": pick(iconButtonSizes, options.size, "md"),
  };
  if (options.animate === true) attributes["data-mt-animate"] = "";
  return attributes;
}

export const fabVariants = ["contained", "outlined", "soft"] as const;
export const fabColors = iconButtonColors;
export const fabSizes = iconButtonSizes;

export type FabVariant = (typeof fabVariants)[number];
export type FabColor = IconButtonColor;
export type FabSize = IconButtonSize;

export interface FabAnatomyOptions {
  variant?: FabVariant | undefined;
  color?: FabColor | undefined;
  size?: FabSize | undefined;
  extended?: boolean | undefined;
  animate?: boolean | undefined;
}

/** `data-mt-*` attributes of a fab root. */
export function fabAttributes(options: FabAnatomyOptions = {}): DataAttributes {
  const attributes: DataAttributes = {
    "data-mt-fab": "",
    "data-mt-variant": pick(fabVariants, options.variant, "contained"),
    "data-mt-color": pick(fabColors, options.color, "default"),
    "data-mt-size": pick(fabSizes, options.size, "md"),
  };
  if (options.extended === true) attributes["data-mt-extended"] = "";
  if (options.animate === true) attributes["data-mt-animate"] = "";
  return attributes;
}

// --- Groups -----------------------------------------------------------------------------------

export const orientations = ["horizontal", "vertical"] as const;
export type Orientation = (typeof orientations)[number];

/** `data-mt-*` attributes of a button group root (`role="group"` is set by the markup). */
export function buttonGroupAttributes(options: { orientation?: Orientation | undefined } = {}) {
  return {
    "data-mt-button-group": "",
    "data-mt-orientation": pick(orientations, options.orientation, "horizontal"),
  } satisfies DataAttributes;
}

// --- Toggle button ----------------------------------------------------------------------------

export const toggleButtonColors = ["inherit", ...paletteColorNames] as const;
export const toggleButtonSizes = ["sm", "md", "lg"] as const;

export type ToggleButtonColor = (typeof toggleButtonColors)[number];
export type ToggleButtonSize = (typeof toggleButtonSizes)[number];

export interface ToggleButtonAnatomyOptions {
  color?: ToggleButtonColor | undefined;
  size?: ToggleButtonSize | undefined;
}

/** `data-mt-*` attributes of a toggle button (`aria-pressed` is set by the owner). */
export function toggleButtonAttributes(options: ToggleButtonAnatomyOptions = {}): DataAttributes {
  return {
    "data-mt-toggle-button": "",
    "data-mt-color": pick(toggleButtonColors, options.color, "inherit"),
    "data-mt-size": pick(toggleButtonSizes, options.size, "md"),
  };
}

export interface ToggleGroupAnatomyOptions {
  orientation?: Orientation | undefined;
  exclusive?: boolean | undefined;
}

/** `data-mt-*` attributes of a toggle group root (`role="group"` is set by the markup). */
export function toggleGroupAttributes(options: ToggleGroupAnatomyOptions = {}): DataAttributes {
  const attributes: DataAttributes = {
    "data-mt-toggle-group": "",
    "data-mt-orientation": pick(orientations, options.orientation, "horizontal"),
  };
  if (options.exclusive === true) attributes["data-mt-exclusive"] = "";
  return attributes;
}

// --- Drawer -----------------------------------------------------------------------------------

export const drawerAnchors = ["left", "right", "top", "bottom"] as const;
export type DrawerAnchor = (typeof drawerAnchors)[number];

/** `data-mt-*` attributes of a drawer `<dialog>`. */
export function drawerAttributes(options: { anchor?: DrawerAnchor | undefined } = {}) {
  return {
    "data-mt-drawer": "",
    "data-mt-anchor": pick(drawerAnchors, options.anchor, "left"),
  } satisfies DataAttributes;
}
