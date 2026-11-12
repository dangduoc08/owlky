import { paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  number,
  optionAttributes,
  parseNumber,
  style,
} from "../options/define.js";

// --- Avatar, AvatarGroup -----------------------------------------------------------------------

export const avatarVariants = ["circular", "rounded", "square"] as const;
export const avatarColors = ["default", ...paletteColorNames] as const;
export const avatarGroupSpacings = ["medium", "small"] as const;
export type AvatarVariant = (typeof avatarVariants)[number];
export type AvatarColor = (typeof avatarColors)[number];
export type AvatarGroupSpacing = (typeof avatarGroupSpacings)[number];

export const avatarOptions = defineOptions("avatar", "data-ok-avatar", {
  variant: style("data-ok-variant", avatarVariants, "circular", "Circle, 12px corners or square."),
  color: style("data-ok-color", avatarColors, "default", "Background for letters and icons."),
  size: number("data-ok-size", 40, "Width and height: a number in px, or a CSS length.", {
    min: 0,
    units: ["px", "rem", "em"],
  }),
});

export interface AvatarAnatomyOptions {
  variant?: AvatarVariant | undefined;
  color?: AvatarColor | undefined;
  size?: number | string | undefined;
}

/** `data-ok-*` attributes of an avatar (`size` only when given). */
export const avatarAttributes = (options: AvatarAnatomyOptions = {}): DataAttributes =>
  optionAttributes(avatarOptions, { ...options });

export const avatarGroupOptions = defineOptions("avatar-group", "data-ok-avatar-group", {
  spacing: number(
    "data-ok-spacing",
    undefined,
    "Overlap between avatars: `medium` (8px, the default), `small` (16px) or a number in px.",
    { min: 0 },
  ),
});

/**
 * The group's overlap: a keyword (`medium` · `small`), or a number of px (MUI's numeric
 * `spacing`). Anything else → `medium`.
 */
export const parseAvatarGroupSpacing = (value: unknown): AvatarGroupSpacing | number => {
  if ((avatarGroupSpacings as readonly unknown[]).includes(value))
    return value as AvatarGroupSpacing;
  const amount = parseNumber(avatarGroupOptions.options.spacing, value);
  return typeof amount === "number" ? amount : "medium";
};

/** The overlap a numeric spacing sets (`--_ok-overlap`, a negative length), else none. */
export const avatarGroupStyle = (value: unknown): Partial<Record<"--_ok-overlap", string>> => {
  const spacing = parseAvatarGroupSpacing(value);
  return typeof spacing === "number" ? { "--_ok-overlap": `${-spacing}px` } : {};
};

/** `data-ok-*` attributes of an avatar group: the spacing is always written (keyword or px). */
export const avatarGroupAttributes = (
  options: { spacing?: AvatarGroupSpacing | number | undefined } = {},
): DataAttributes => ({
  "data-ok-avatar-group": "",
  "data-ok-spacing": String(parseAvatarGroupSpacing(options.spacing)),
});
