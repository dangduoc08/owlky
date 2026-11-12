import { paletteColorNames, typographyVariants } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  pick,
  style,
} from "../options/define.js";

// --- Typography ---------------------------------------------------------------------------------

/** Typography variants: the type scale of `@owlky/tokens`, plus `inherit` (the parent's font). */
export const typographyVariantNames = [...typographyVariants, "inherit"] as const;
export type TypographyVariantName = (typeof typographyVariantNames)[number];
/** Text colors: the palette's `main` tones and the three text tones. */
export const typographyColors = [
  ...paletteColorNames,
  "textPrimary",
  "textSecondary",
  "textDisabled",
] as const;
export type TypographyColor = (typeof typographyColors)[number];
export const typographyAligns = ["inherit", "left", "center", "right", "justify"] as const;
export type TypographyAlign = (typeof typographyAligns)[number];
/** Line counts of `maxLines` (CSS reads them from the attribute, so the list is closed). */
export const typographyMaxLines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
export type TypographyMaxLines = (typeof typographyMaxLines)[number];

/**
 * The element each variant renders by default (MUI's `variantMapping`): headings for `h1`–`h6`,
 * `h6` for subtitles, `p` for body text and `inherit`, `span` for the rest.
 */
export const typographyVariantMapping: Readonly<Record<TypographyVariantName, string>> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  caption: "span",
  overline: "span",
  button: "span",
  inherit: "p",
};

export const typographyOptions = defineOptions("typography", "data-ok-typography", {
  variant: style(
    "data-ok-variant",
    typographyVariantNames,
    "body1",
    "A step of the type scale (font, size, weight, line height, case); `inherit` keeps the parent's font.",
  ),
  color: style(
    "data-ok-color",
    typographyColors,
    "textPrimary",
    "Text color: a palette's `main` tone or a text tone. Without it, the text keeps the parent's color.",
    { optional: true },
  ),
  align: style(
    "data-ok-align",
    typographyAligns,
    "inherit",
    "Text alignment. Without it, the text keeps the parent's alignment.",
    { optional: true },
  ),
  gutterBottom: flag("data-ok-gutter-bottom", "A bottom margin of 0.35em."),
  noWrap: flag(
    "data-ok-no-wrap",
    "One line: overflowing text ends with an ellipsis (needs a block or inline-block with a width).",
  ),
  maxLines: style(
    "data-ok-max-lines",
    typographyMaxLines,
    "1",
    "At most this many lines (1 to 10): longer text ends with an ellipsis on the last line. Without it, the text shows every line.",
    { optional: true },
  ),
  persistent: flag(
    "data-ok-persistent",
    "With `maxLines`: the text always takes the height of that many lines, even when it is shorter.",
  ),
});

export interface TypographyAnatomyOptions {
  variant?: TypographyVariantName | undefined;
  color?: TypographyColor | undefined;
  align?: TypographyAlign | undefined;
  gutterBottom?: boolean | undefined;
  noWrap?: boolean | undefined;
  /** 1–10 (a number or its string). */
  maxLines?: number | string | undefined;
  persistent?: boolean | undefined;
}

/** `data-ok-*` attributes of a typography element (`color`, `align` and `maxLines` only when given). */
export const typographyAttributes = ({
  maxLines,
  ...options
}: TypographyAnatomyOptions = {}): DataAttributes =>
  optionAttributes(typographyOptions, {
    ...options,
    maxLines: maxLines === undefined ? undefined : String(maxLines),
  });

/** The element a variant renders: `mapping` first, then the default mapping (unknown → `p`). */
export const typographyElement = <E = string>(
  variant: unknown,
  mapping: Partial<Record<TypographyVariantName, E>> = {},
): E | string => {
  const name = pick(typographyVariantNames, variant, "body1");
  const mapped = Object.hasOwn(mapping, name) ? mapping[name] : undefined;
  return mapped ?? typographyVariantMapping[name];
};
