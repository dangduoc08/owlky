/*
 * Illustration (ADR-0041) — spec: specs/components/illustration.md. An illustration is data: a
 * tree of SVG nodes whose colored shapes name a tone (`data-ok-tone`) instead of a color. The
 * stylesheet maps tones to `--ok-*` tokens, so every illustration follows the color scheme,
 * nested themes, presets and the `color` option. React renders the tree as elements, the HTML
 * runtime with `createElementNS`; the data itself ships in the opt-in `@owlky/core/illustrations`.
 */
import { illustrationOptions } from "../anatomy/anatomy.js";
import { parseNumber } from "../options/define.js";

/** SVG elements an illustration may contain (no `use`, `image`, `foreignObject`, `script`, …). */
export const illustrationTags = [
  "g",
  "path",
  "circle",
  "ellipse",
  "rect",
  "polygon",
  "polyline",
  "line",
] as const;
export type IllustrationTag = (typeof illustrationTags)[number];

/** Geometry and compositing attributes a node may carry (no `href`, `style`, event handlers). */
export const illustrationAttributeNames = [
  "d",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "width",
  "height",
  "points",
  "x1",
  "y1",
  "x2",
  "y2",
  "transform",
  "opacity",
  "fill-rule",
  "stroke-dasharray",
] as const;
export type IllustrationAttributeName = (typeof illustrationAttributeNames)[number];

/**
 * Tones a shape can take. Brand tones follow the `color` option (primary by default), accent
 * tones the warning palette; neutral tones follow the color scheme (`paper`, `neutral`,
 * `outline`, `line`, `shadow`, `shade`, `ink`); greys, white and skin tones are fixed.
 */
export const illustrationTones = [
  "lighter",
  "light",
  "main",
  "dark",
  "darker",
  "accent-light",
  "accent-main",
  "accent-dark",
  "paper",
  "neutral",
  "outline",
  "line",
  "shadow",
  "shade",
  "grey-300",
  "grey-500",
  "grey-600",
  "ink",
  "white",
  "skin-light",
  "skin-medium",
  "skin-deep",
] as const;
export type IllustrationTone = (typeof illustrationTones)[number];

export interface IllustrationNode {
  readonly tag: IllustrationTag;
  /** The shape's color. Every shape (anything but `g`) has one. */
  readonly tone?: IllustrationTone | undefined;
  /** Paints the tone as an outline of this width instead of a fill. */
  readonly stroke?: number | undefined;
  readonly attrs?:
    | Readonly<Partial<Record<IllustrationAttributeName, string | number>>>
    | undefined;
  readonly children?: readonly IllustrationNode[] | undefined;
}

export interface Illustration {
  /** Kebab-case name, written as `data-ok-illustration="<name>"`. */
  readonly name: string;
  /** Every built-in illustration uses `0 0 480 360`, so pictures line up on a page. */
  readonly viewBox: string;
  readonly nodes: readonly IllustrationNode[];
}

const TAGS: readonly string[] = illustrationTags;
const ATTRIBUTES: readonly string[] = illustrationAttributeNames;
const TONES: readonly string[] = illustrationTones;
/** Numbers, letters and the punctuation of path data and transforms: never markup or `url(`. */
const SAFE_VALUE = /^[-+0-9a-z.,\s()]*$/i;

export const isIllustrationTag = (tag: unknown): tag is IllustrationTag =>
  TAGS.includes(tag as string);

/**
 * The attributes of one node, as both owners write them: its allowed geometry attributes, then
 * `data-ok-tone`, then `data-ok-stroke` and `stroke-width` for outlines. Unknown attributes,
 * tones and unsafe values are dropped, so data from elsewhere can't inject references or URLs.
 */
export function illustrationNodeAttributes(node: IllustrationNode): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    const text = String(value);
    if (ATTRIBUTES.includes(name) && SAFE_VALUE.test(text) && !/url\s*\(/i.test(text))
      attributes[name] = text;
  }
  if (node.tag !== "g" && TONES.includes(node.tone as string))
    attributes["data-ok-tone"] = node.tone as string;
  if (
    node.tag !== "g" &&
    typeof node.stroke === "number" &&
    Number.isFinite(node.stroke) &&
    node.stroke > 0
  ) {
    attributes["data-ok-stroke"] = "";
    attributes["stroke-width"] = String(node.stroke);
  }
  return attributes;
}

/** The tag of every node, keeping only allowed elements (others are skipped with their children). */
export const illustrationChildren = (nodes: readonly IllustrationNode[] | undefined) =>
  (nodes ?? []).filter((node) => isIllustrationTag(node.tag));

/** Private custom properties of the root: the size (`size` option) as a CSS length. */
export function illustrationStyle(size: unknown): Partial<Record<`--_ok-${string}`, string>> {
  const value = parseNumber(illustrationOptions.options.size, size);
  if (value === undefined) return {};
  return { "--_ok-illustration-size": typeof value === "number" ? `${value}px` : value };
}

/**
 * Root ARIA of an illustration: `role="img"` when it has a name (`title`, or an `aria-label` /
 * `aria-labelledby` the author wrote: `named`), otherwise decorative (`aria-hidden="true"`).
 */
export function illustrationAria(named: boolean, title?: string): Record<string, string> {
  if (title) return { role: "img", "aria-label": title };
  return named ? { role: "img" } : { "aria-hidden": "true" };
}
