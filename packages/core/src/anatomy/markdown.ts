import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import { type ImageRatio, imageRatios } from "./image.js";

// --- Markdown (ADR-0035) ------------------------------------------------------------------------

export const markdownImageModes = ["native", "image"] as const;
export type MarkdownImageMode = (typeof markdownImageModes)[number];

export const markdownOptions = defineOptions("markdown", "data-ok-markdown", {
  gfm: behavior(
    "data-ok-gfm",
    true,
    "GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks and footnotes (`false`: CommonMark only).",
  ),
  rawHtml: flag(
    "data-ok-raw-html",
    "HTML in the Markdown is rendered, limited to an allow list (sanitized). Off: it shows as text.",
  ),
  skipHtml: flag("data-ok-skip-html", "HTML in the Markdown is dropped."),
  unwrapDisallowed: flag(
    "data-ok-unwrap-disallowed",
    "Elements removed by the element filters leave their children in place.",
  ),
  externalLinks: flag(
    "data-ok-external-links",
    'Absolute `http(s)` links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).',
  ),
  images: style(
    "data-ok-images",
    markdownImageModes,
    "native",
    "`image`: pictures render as Image components (lazy, placeholder, effect). `native`: plain `img`.",
    { optional: true },
  ),
  imageRatio: style(
    "data-ok-images-ratio",
    imageRatios,
    "16/9",
    "With `images` `image`: the aspect ratio the pictures are cropped to (default: their own).",
    { optional: true },
  ),
  value: state(
    "data-ok-markdown-source",
    "The Markdown: React `children`; HTML the text of the source element.",
    "render",
  ),
});

export type MarkdownAnatomyOptions = {
  images?: MarkdownImageMode | undefined;
  imageRatio?: ImageRatio | undefined;
  rawHtml?: boolean | undefined;
  skipHtml?: boolean | undefined;
  unwrapDisallowed?: boolean | undefined;
  externalLinks?: boolean | undefined;
};

/** `data-ok-*` attributes of a Markdown root (`data-ok-gfm="false"` is written by the owner). */
export const markdownAttributes = (options: MarkdownAnatomyOptions = {}): DataAttributes =>
  optionAttributes(markdownOptions, { ...options });
