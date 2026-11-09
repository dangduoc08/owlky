/**
 * `@owlky/core/markdown` (ADR-0035): the Markdown pipeline (unified: remark-parse, remark-gfm,
 * remark-rehype, rehype-raw with an allow-list sanitizer) shared by React's `Markdown` and the
 * HTML `markdown` runtime. Not re-exported from `@owlky/core`: pages without Markdown don't load
 * unified.
 */
export type { Element as MarkdownElement, Root as MarkdownRoot } from "hast";
export {
  type AllowElement,
  childSpace,
  createMarkdownProcessor,
  finishTree,
  type MarkdownAttribute,
  type MarkdownHighlighter,
  type MarkdownProcessOptions,
  type MarkdownSanitizeSchema,
  markdownElementAttributes,
  markdownElementStyle,
  markdownSanitizeSchema,
  markdownTree,
  markdownTreeAsync,
  parseStyle,
  type RemarkRehypeOptions,
  type UrlTransform,
} from "./markdown.js";
export { defaultUrlTransform, isExternalUrl } from "./url.js";
