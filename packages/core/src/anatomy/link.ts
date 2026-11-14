import { type DataAttributes, defineOptions, optionAttributes, style } from "../options/define.js";
import {
  type TypographyAnatomyOptions,
  typographyColors,
  typographyOptions,
  typographyVariantNames,
} from "./typography.js";

// --- Link ---------------------------------------------------------------------------------------

/** Link colors: Typography's, plus `inherit` (the parent's color, as in breadcrumbs). */
export const linkColors = [...typographyColors, "inherit"] as const;
export type LinkColor = (typeof linkColors)[number];
export const linkUnderlines = ["always", "hover", "none"] as const;
export type LinkUnderline = (typeof linkUnderlines)[number];

/**
 * Link (spec: link.md): a Typography root (`data-ok-typography` + `data-ok-link`) with Typography's
 * options; MUI's defaults differ (`variant` `inherit`, `color` `primary`, always written).
 */
export const linkOptions = defineOptions("link", "data-ok-link", {
  variant: style(
    "data-ok-variant",
    typographyVariantNames,
    "inherit",
    "A step of the type scale; `inherit` (the default) keeps the font of the text around the link.",
  ),
  color: style(
    "data-ok-color",
    linkColors,
    "primary",
    "Text color: a palette's `main` tone, a text tone, or `inherit` (the parent's color).",
  ),
  align: typographyOptions.options.align,
  gutterBottom: typographyOptions.options.gutterBottom,
  noWrap: typographyOptions.options.noWrap,
  maxLines: typographyOptions.options.maxLines,
  persistent: typographyOptions.options.persistent,
  underline: style(
    "data-ok-underline",
    linkUnderlines,
    "always",
    "When the link is underlined: `always`, on `hover` (pointer devices), or `none`.",
  ),
});

export interface LinkAnatomyOptions extends Omit<TypographyAnatomyOptions, "color"> {
  color?: LinkColor | undefined;
  underline?: LinkUnderline | undefined;
}

/** `data-ok-*` attributes of a link: Typography's marker first, then the link's options. */
export const linkAttributes = ({
  maxLines,
  ...options
}: LinkAnatomyOptions = {}): DataAttributes => ({
  "data-ok-typography": "",
  ...optionAttributes(linkOptions, {
    ...options,
    maxLines: maxLines === undefined ? undefined : String(maxLines),
  }),
});

const SAFE_REL = ["noopener", "noreferrer"] as const;

/**
 * The `rel` of a link: with `target="_blank"`, the consumer's tokens plus `noopener noreferrer`
 * (the new page gets no `window.opener` and no referrer); otherwise the consumer's value as given.
 */
export const linkRel = (target: unknown, rel: unknown): string | undefined => {
  const given = typeof rel === "string" ? rel : undefined;
  if (target !== "_blank") return given;
  const tokens = (given ?? "").split(/\s+/).filter(Boolean);
  for (const token of SAFE_REL)
    if (!tokens.some((t) => t.toLowerCase() === token)) tokens.push(token);
  return tokens.join(" ");
};
