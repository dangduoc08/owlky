import type { Element, ElementContent, Parents, Properties, Root, RootContent } from "hast";
import { defaultSchema, type Schema, sanitize } from "hast-util-sanitize";
import { urlAttributes } from "html-url-attributes";
import { find, html, svg } from "property-information";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype, { type Options as RemarkRehypeOptions } from "remark-rehype";
import { type PluggableList, unified } from "unified";
import { defaultUrlTransform, isExternalUrl } from "./url.js";

/** Decides whether an element stays (react-markdown's `allowElement`). */
export type AllowElement = (
  element: Readonly<Element>,
  index: number,
  parent: Readonly<Parents>,
) => boolean | null | undefined;

/** Rewrites a URL (`href`, `src`…): `""`, `null` or `undefined` removes it. */
export type UrlTransform = (
  url: string,
  key: string,
  node: Readonly<Element>,
) => string | null | undefined;

/**
 * Syntax highlighting for fenced code with a language (` ```js `). lowlight
 * (`createLowlight(common)`) fits as is; Owlky ships no grammar itself (as the Editor).
 */
export interface MarkdownHighlighter {
  highlight(language: string, value: string): Root;
  registered(language: string): boolean;
}

export type { Schema as MarkdownSanitizeSchema } from "hast-util-sanitize";
export type { RemarkRehypeOptions };

/** Options of the Markdown pipeline, shared by React and the HTML runtime (ADR-0035). */
export interface MarkdownProcessOptions {
  /** remark plugins (Markdown syntax tree), after the GitHub Flavored Markdown one. */
  remarkPlugins?: PluggableList | null | undefined;
  /** rehype plugins (HTML syntax tree), after raw HTML and its sanitizer. */
  rehypePlugins?: PluggableList | null | undefined;
  /** Options of remark-rehype (`allowDangerousHtml` is always on: raw HTML is handled here). */
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null | undefined;
  /** Only these tag names stay (not with `disallowedElements`). */
  allowedElements?: readonly string[] | null | undefined;
  /** These tag names are removed (not with `allowedElements`). */
  disallowedElements?: readonly string[] | null | undefined;
  /** Runs after `allowedElements` / `disallowedElements`: `false` removes the element. */
  allowElement?: AllowElement | null | undefined;
  /** Removed elements leave their children in place. */
  unwrapDisallowed?: boolean | null | undefined;
  /** HTML in the Markdown is dropped (by default it shows as text). */
  skipHtml?: boolean | null | undefined;
  /** URL rewriting (default `defaultUrlTransform`: safe protocols only). */
  urlTransform?: UrlTransform | null | undefined;
  /** GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks, footnotes (default on). */
  gfm?: boolean | null | undefined;
  /** HTML in the Markdown is parsed (rehype-raw), then sanitized with `sanitizeSchema`. */
  rawHtml?: boolean | null | undefined;
  /** Allow list used for raw HTML (default `markdownSanitizeSchema`, GitHub's plus a few). */
  sanitizeSchema?: Schema | null | undefined;
  /** Absolute `http(s)` links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). */
  externalLinks?: boolean | null | undefined;
  /** Syntax highlighting of fenced code with a language. */
  highlighter?: MarkdownHighlighter | null | undefined;
}

/**
 * The raw HTML allow list: GitHub's (hast-util-sanitize's default schema) plus `u`, `mark` and a
 * `style` attribute whose declarations are then limited to `text-align` and `text-transform`
 * (what the Editor writes).
 */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u", "mark"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "style"],
  },
};

/** Never rendered, whatever the options and plugins (they run code or change the page). */
const BLOCKED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "base",
  "link",
  "meta",
  "template",
  "noscript",
]);
/** Elements where whitespace text is invalid (React warns, browsers move it). */
const TABLE_PARENTS = new Set(["table", "thead", "tbody", "tfoot", "tr"]);
/** Style declarations kept from raw HTML. */
const ALLOWED_STYLES: Record<string, RegExp> = {
  "text-align": /^(left|right|center|justify|start|end)$/,
  "text-transform": /^(uppercase|lowercase|capitalize|none)$/,
};
const WHITESPACE = /^[ \t\n\f\r]*$/;

function* elements(node: Root | Element): Generator<Element> {
  for (const child of node.children) {
    if (child.type !== "element") continue;
    yield child;
    yield* elements(child);
  }
}

/** Parses a `style` attribute into `[property, value]` pairs (lowercase property names). */
export function parseStyle(value: unknown): [string, string][] {
  if (typeof value !== "string") return [];
  const out: [string, string][] = [];
  for (const declaration of value.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const text = declaration.slice(colon + 1).trim();
    // No resources from CSS (`url()`, `image-set()`): styles stay presentational.
    if (!property || !text || /url\(|image-set\(|expression\(/i.test(text)) continue;
    out.push([property, text]);
  }
  return out;
}

const serializeStyle = (pairs: readonly [string, string][]) =>
  pairs.map(([property, value]) => `${property}: ${value}`).join("; ");

/** rehype step: sanitizes raw HTML, narrows its styles, keeps in-page links working. */
const sanitizeRaw = (schema: Schema) => (tree: Root) => {
  const clean = sanitize(tree, schema) as Root;
  const ids = new Set<string>();
  for (const element of elements(clean)) {
    const style = element.properties["style"];
    if (style !== undefined) {
      const kept = parseStyle(style).filter(([property, value]) =>
        ALLOWED_STYLES[property]?.test(value.toLowerCase()),
      );
      if (kept.length > 0) element.properties["style"] = serializeStyle(kept);
      else delete element.properties["style"];
    }
    const id = element.properties["id"];
    if (typeof id === "string") ids.add(id);
  }
  // The sanitizer prefixes ids (`user-content-`, DOM clobbering): links to them follow.
  const prefix = schema.clobberPrefix ?? "";
  if (prefix)
    for (const element of elements(clean)) {
      const href = element.properties["href"];
      if (element.tagName !== "a" || typeof href !== "string" || !href.startsWith("#")) continue;
      const target = decodeURIComponent(href.slice(1));
      if (!ids.has(target) && ids.has(prefix + target))
        element.properties["href"] = `#${prefix}${target}`;
    }
  return clean;
};

/** The unified processor: remark-parse (+ GFM) → remark plugins → remark-rehype → rehype. */
export function createMarkdownProcessor(options: Readonly<MarkdownProcessOptions> = {}) {
  const raw = options.rawHtml === true && options.skipHtml !== true;
  const processor = unified().use(remarkParse);
  if (options.gfm !== false) processor.use(remarkGfm);
  // With raw HTML the sanitizer prefixes every id (footnotes too): remark-rehype adds none then.
  const prefix = raw ? { clobberPrefix: "" } : {};
  return processor
    .use(options.remarkPlugins ?? [])
    .use(remarkRehype, { ...prefix, ...options.remarkRehypeOptions, allowDangerousHtml: true })
    .use(
      raw
        ? [rehypeRaw, [sanitizeRaw, options.sanitizeSchema ?? markdownSanitizeSchema]]
        : ([] as PluggableList),
    )
    .use(options.rehypePlugins ?? []);
}

function checkOptions(options: Readonly<MarkdownProcessOptions>) {
  if (options.allowedElements && options.disallowedElements)
    throw new TypeError(
      "Markdown: `allowedElements` and `disallowedElements` can't be combined: pass one of them.",
    );
}

/** Markdown → hast, synchronously (every plugin must be synchronous). */
export function markdownTree(source: unknown, options: Readonly<MarkdownProcessOptions> = {}) {
  checkOptions(options);
  const text = typeof source === "string" ? source : "";
  const processor = createMarkdownProcessor(options);
  const tree = processor.runSync(processor.parse(text), text) as Root;
  return finishTree(tree, options);
}

/** Markdown → hast, with asynchronous plugins too. */
export async function markdownTreeAsync(
  source: unknown,
  options: Readonly<MarkdownProcessOptions> = {},
): Promise<Root> {
  checkOptions(options);
  const text = typeof source === "string" ? source : "";
  const processor = createMarkdownProcessor(options);
  const tree = (await processor.run(processor.parse(text), text)) as Root;
  return finishTree(tree, options);
}

function highlight(tree: Root, highlighter: MarkdownHighlighter) {
  for (const element of elements(tree)) {
    if (element.tagName !== "pre") continue;
    const code = element.children.find(
      (child): child is Element => child.type === "element" && child.tagName === "code",
    );
    // Code that already holds elements (highlighted, or raw HTML) stays as it is.
    const texts = code?.children.filter((child) => child.type === "text");
    if (!code || !texts || texts.length !== code.children.length) continue;
    const classes = Array.isArray(code.properties["className"])
      ? code.properties["className"].map(String)
      : [];
    if (classes.includes("no-highlight") || classes.includes("nohighlight")) continue;
    const language = classes
      .find((name) => name.startsWith("language-") || name.startsWith("lang-"))
      ?.replace(/^lang(uage)?-/, "");
    if (!language) continue;
    try {
      if (!highlighter.registered(language)) continue;
      const result = highlighter.highlight(language, texts.map((text) => text.value).join(""));
      code.children = result.children as ElementContent[];
      code.properties["className"] = ["hljs", ...classes.filter((name) => name !== "hljs")];
    } catch {
      // A failing grammar leaves the code as text.
    }
  }
}

/**
 * The last step (react-markdown's): raw HTML left as text or dropped, comments dropped, element
 * filters, URL transform, table cell alignment as `text-align`, external links, highlighting.
 */
export function finishTree(tree: Root, options: Readonly<MarkdownProcessOptions> = {}): Root {
  const urlTransform = options.urlTransform ?? defaultUrlTransform;
  const allowed = options.allowedElements;
  const disallowed = options.disallowedElements;

  const visit = (parent: Root | Element) => {
    const children = parent.children as RootContent[];
    const inTable = parent.type === "element" && TABLE_PARENTS.has(parent.tagName);
    let index = 0;
    while (index < children.length) {
      const node = children[index] as RootContent;
      if (node.type === "raw") {
        if (options.skipHtml) children.splice(index, 1);
        else children[index++] = { type: "text", value: node.value };
        continue;
      }
      if (node.type === "comment" || node.type === "doctype") {
        children.splice(index, 1);
        continue;
      }
      if (node.type === "text") {
        if (inTable && WHITESPACE.test(node.value)) children.splice(index, 1);
        else index++;
        continue;
      }
      if (BLOCKED_TAGS.has(node.tagName.toLowerCase())) {
        children.splice(index, 1);
        continue;
      }
      let remove = allowed
        ? !allowed.includes(node.tagName)
        : disallowed
          ? disallowed.includes(node.tagName)
          : false;
      if (!remove && options.allowElement)
        remove = !options.allowElement(node, index, parent as Parents);
      if (remove) {
        // Unwrapped children are visited in place of the element.
        if (options.unwrapDisallowed) children.splice(index, 1, ...node.children);
        else children.splice(index, 1);
        continue;
      }
      transformUrls(node, urlTransform);
      if ((node.tagName === "td" || node.tagName === "th") && node.properties["align"]) {
        const align = String(node.properties["align"]);
        delete node.properties["align"];
        // A `text-align` already in the style comes later and wins.
        const style = parseStyle(node.properties["style"]);
        node.properties["style"] = serializeStyle([["text-align", align], ...style]);
      }
      if (node.tagName === "a") secureLink(node.properties, options.externalLinks === true);
      visit(node);
      index++;
    }
  };
  visit(tree);
  if (options.highlighter) highlight(tree, options.highlighter);
  labelTaskItems(tree);
  return tree;
}

/** Text-level elements a task item's label may hold (HTML phrasing content). */
const PHRASING = new Set(
  "a abbr b bdi bdo br cite code data del dfn em i img ins kbd mark q s samp small span strike strong sub sup time tt u var wbr".split(
    " ",
  ),
);

/**
 * Task list boxes get a name: the box and the text after it go into a `label` (a box inside an
 * item, or inside an item's first paragraph in loose lists). Runs after the element filters, so
 * they can't remove the label with its content.
 */
function labelTaskItems(tree: Root) {
  for (const element of elements(tree)) {
    if (element.tagName !== "li" && element.tagName !== "p") continue;
    const kids = element.children;
    const first = kids.findIndex((kid) => !(kid.type === "text" && WHITESPACE.test(kid.value)));
    const box = kids[first];
    if (
      box?.type !== "element" ||
      box.tagName !== "input" ||
      String(box.properties["type"]).toLowerCase() !== "checkbox"
    )
      continue;
    let end = first + 1;
    while (end < kids.length) {
      const kid = kids[end] as ElementContent;
      if (kid.type === "element" && !PHRASING.has(kid.tagName)) break;
      end++;
    }
    // Whitespace before a nested list stays outside the label.
    while (end > first + 1) {
      const last = kids[end - 1] as ElementContent;
      if (!(last.type === "text" && WHITESPACE.test(last.value))) break;
      end--;
    }
    const label: Element = {
      type: "element",
      tagName: "label",
      properties: {},
      children: kids.slice(first, end),
    };
    kids.splice(first, end - first, label);
  }
}

function transformUrls(node: Element, urlTransform: UrlTransform) {
  for (const key of [...Object.keys(urlAttributes), "xLinkHref"]) {
    if (!Object.hasOwn(node.properties, key)) continue;
    const tags = (urlAttributes as Record<string, readonly string[] | null>)[key];
    // `href` and `xLinkHref` on any element (SVG links too).
    if (key !== "href" && key !== "xLinkHref" && tags && !tags.includes(node.tagName)) continue;
    const value = node.properties[key];
    const next = urlTransform(String(value ?? ""), key, node);
    // An empty URL is removed (React drops empty `href` / `src` too: both renderers agree).
    if (next === null || next === undefined || next === "") delete node.properties[key];
    else node.properties[key] = next;
  }
  // `srcset` lists URLs: unsafe candidates drop the whole attribute.
  const srcSet = node.properties["srcSet"];
  if (srcSet !== undefined) {
    const urls = (Array.isArray(srcSet) ? srcSet.map(String) : String(srcSet).split(","))
      .map((candidate) => candidate.trim().split(/\s+/)[0] ?? "")
      .filter(Boolean);
    if (urls.some((url) => urlTransform(url, "srcSet", node) !== url))
      delete node.properties["srcSet"];
  }
}

function secureLink(properties: Properties, external: boolean) {
  const href = properties["href"];
  if (external && typeof href === "string" && isExternalUrl(href)) properties["target"] = "_blank";
  if (properties["target"] === "_blank") {
    const rel = Array.isArray(properties["rel"])
      ? properties["rel"].map(String)
      : String(properties["rel"] ?? "")
          .split(/\s+/)
          .filter(Boolean);
    for (const token of ["noopener", "noreferrer"]) if (!rel.includes(token)) rel.push(token);
    properties["rel"] = rel;
  }
}

/** One attribute to write: its HTML name, its hast (React) property name and its value. */
export interface MarkdownAttribute {
  readonly name: string;
  readonly property: string;
  /** `true`: a boolean attribute (written as `""`). */
  readonly value: string | true;
}

const VALID_NAME = /^[A-Za-z_:][-A-Za-z0-9_:.]*$/;
const BLOCKED_ATTRIBUTES = new Set(["style", "srcdoc", "is"]);

/**
 * The attributes of an element, for both renderers (React props, `setAttribute` in HTML).
 * Never: event handlers (`on*`), invalid names, `srcdoc`, `is`, and `style` (see `markdownElementStyle`).
 */
export function markdownElementAttributes(
  element: Readonly<Element>,
  space: "html" | "svg" = "html",
): MarkdownAttribute[] {
  const out: MarkdownAttribute[] = [];
  for (const [property, value] of Object.entries(element.properties ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    const info = find(space === "svg" ? svg : html, property);
    const name = info.attribute;
    if (!VALID_NAME.test(name) || /^on/i.test(name) || BLOCKED_ATTRIBUTES.has(name.toLowerCase()))
      continue;
    const text =
      value === true
        ? (true as const)
        : Array.isArray(value)
          ? value.join(info.commaSeparated || property === "srcSet" ? ", " : " ")
          : String(value);
    out.push({ name, property, value: text });
  }
  return out;
}

/** The element's inline style as `[property, value]` pairs (set through CSSOM, never a string). */
export const markdownElementStyle = (element: Readonly<Element>): [string, string][] =>
  parseStyle(element.properties?.["style"]);

/** The namespace of an element's children: `svg` inside `<svg>` until `foreignObject`. */
export const childSpace = (element: Readonly<Element>, space: "html" | "svg"): "html" | "svg" =>
  element.tagName === "svg" ? "svg" : element.tagName === "foreignObject" ? "html" : space;
