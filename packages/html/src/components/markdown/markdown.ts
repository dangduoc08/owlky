import { type ImageRatio, imageAttributes, markdownOptions, readBehavior } from "@owlky/core";
import {
  type AllowElement,
  childSpace,
  type MarkdownElement,
  type MarkdownHighlighter,
  type MarkdownProcessOptions,
  type MarkdownRoot,
  type MarkdownSanitizeSchema,
  markdownElementAttributes,
  markdownElementStyle,
  markdownTree,
  markdownTreeAsync,
  type RemarkRehypeOptions,
  type UrlTransform,
} from "@owlky/core/markdown";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface MarkdownInstance extends ComponentInstance {
  /** The Markdown source (the source element's text). */
  readonly value: string;
  /** Replaces the Markdown and renders it (emits `ok:markdown:render`). */
  setValue(markdown: string): void;
  /** Renders again from the current source and option attributes. */
  render(): void;
}

/** Options only JavaScript can give (functions, plugins): `createMarkdown({ … })`. */
export interface CreateMarkdownOptions {
  remarkPlugins?: MarkdownProcessOptions["remarkPlugins"];
  rehypePlugins?: MarkdownProcessOptions["rehypePlugins"];
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | undefined;
  allowElement?: AllowElement | undefined;
  urlTransform?: UrlTransform | undefined;
  sanitizeSchema?: MarkdownSanitizeSchema | undefined;
  /** Syntax highlighting of fenced code with a language (for example lowlight). */
  highlighter?: MarkdownHighlighter | undefined;
  /** Runs the pipeline asynchronously (needed for asynchronous plugins). */
  async?: boolean | undefined;
}

const { gfm: gfmOption, images: imagesOption, imageRatio: ratioOption } = markdownOptions.options;
const SVG = "http://www.w3.org/2000/svg";
const OPTION_ATTRIBUTES = [
  "data-ok-gfm",
  "data-ok-raw-html",
  "data-ok-skip-html",
  "data-ok-unwrap-disallowed",
  "data-ok-external-links",
  "data-ok-allowed-elements",
  "data-ok-disallowed-elements",
  imagesOption.attr,
  ratioOption.attr,
];
const TAG = /^[a-z][a-z0-9-]*$/i;

const tagList = (value: string | null) =>
  value === null ? undefined : value.split(/\s+/).filter((name) => TAG.test(name));

/** With `images="image"`: pictures become Image markup (the Image runtime then mounts them). */
interface ImageMode {
  ratio: ImageRatio | undefined;
}

/** The same markup as React's `Image` around a built `img` (lazy and async unless set). */
function imageOf(img: Element, mode: ImageMode, document: Document): HTMLSpanElement {
  const root = document.createElement("span");
  for (const [name, value] of Object.entries(imageAttributes({ ratio: mode.ratio })))
    root.setAttribute(name, value);
  const placeholder = document.createElement("span");
  placeholder.setAttribute("data-ok-image-placeholder", "");
  placeholder.setAttribute("aria-hidden", "true");
  if (!img.hasAttribute("alt")) img.setAttribute("alt", "");
  if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
  if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
  root.append(placeholder, img);
  return root;
}

/** The root's image mode: `null` for plain pictures. */
function imageMode(element: Element): ImageMode | null {
  if (element.getAttribute(imagesOption.attr) !== "image") return null;
  const ratio = element.getAttribute(ratioOption.attr) as ImageRatio | null;
  return { ratio: ratio !== null && ratioOption.values.includes(ratio) ? ratio : undefined };
}

/** Builds DOM nodes from the pipeline's tree: `createElement`, `setAttribute`, CSSOM only. */
function build(
  parent: MarkdownRoot | MarkdownElement,
  space: "html" | "svg",
  document: Document,
  images: ImageMode | null = null,
): ChildNode[] {
  const out: ChildNode[] = [];
  for (const child of parent.children) {
    if (child.type === "text") out.push(document.createTextNode(child.value));
    if (child.type !== "element" || !TAG.test(child.tagName)) continue;
    const element =
      space === "svg" || child.tagName === "svg"
        ? document.createElementNS(SVG, child.tagName)
        : document.createElement(child.tagName);
    for (const attribute of markdownElementAttributes(child, space))
      element.setAttribute(attribute.name, attribute.value === true ? "" : attribute.value);
    const style = (element as HTMLElement | SVGElement).style;
    for (const [property, value] of markdownElementStyle(child)) style.setProperty(property, value);
    element.append(...build(child, childSpace(child, space), document, images));
    out.push(images && child.tagName === "img" ? imageOf(element, images, document) : element);
  }
  return out;
}

/**
 * Markdown — spec: specs/components/markdown.md (ADR-0035). Not in the default `components` list
 * (it loads unified): register it with `getRuntime().register(markdown)`, import
 * `@owlky/html/markdown`, or load `owlky-markdown.js` after `owlky.js`. `createMarkdown({ … })`
 * adds plugins, a highlighter, `allowElement` or `urlTransform`.
 *
 * Markup:  <div data-ok-markdown data-ok-raw-html>
 *            <pre data-ok-markdown-source># Title …(escaped Markdown text)…</pre>
 *          </div>
 * Behavior: renders the source's text before it (DOM methods, never an HTML string), hides the
 *          source, and renders again when the text or an option attribute changes.
 * Events:  ok:markdown:render (detail `{ value }`), ok:markdown:error (detail `{ error }`).
 */
export const createMarkdown = (setup: CreateMarkdownOptions = {}) =>
  defineComponent<MarkdownInstance>({
    name: "markdown",
    selector: "[data-ok-markdown]",

    setup(element, { emit }) {
      const source = [...element.children].find((child) =>
        child.hasAttribute("data-ok-markdown-source"),
      ) as HTMLElement | undefined;
      // Markup without a source (rendered on a server) stays as it is.
      if (!source) return { value: "", setValue() {}, render() {} };
      let rendered: ChildNode[] = [];
      let generation = 0;

      const options = (): MarkdownProcessOptions => ({
        ...setup,
        gfm: readBehavior(element, gfmOption),
        rawHtml: element.hasAttribute("data-ok-raw-html"),
        skipHtml: element.hasAttribute("data-ok-skip-html"),
        unwrapDisallowed: element.hasAttribute("data-ok-unwrap-disallowed"),
        externalLinks: element.hasAttribute("data-ok-external-links"),
        allowedElements: tagList(element.getAttribute("data-ok-allowed-elements")),
        disallowedElements: tagList(element.getAttribute("data-ok-disallowed-elements")),
      });

      const show = (tree: MarkdownRoot, value: string) => {
        for (const node of rendered) node.remove();
        rendered = build(tree, "html", element.ownerDocument, imageMode(element));
        source.before(...rendered);
        source.hidden = true;
        emit("render", { value });
      };
      const fail = (error: unknown) => {
        source.hidden = false;
        emit("error", { error });
      };

      const render = () => {
        const value = source.textContent as string;
        const current = ++generation;
        // Only the latest render (and none after destroy) is written.
        const write = (action: () => void) => {
          if (current === generation) action();
        };
        if (setup.async) {
          markdownTreeAsync(value, options()).then(
            (tree) => write(() => show(tree, value)),
            (error: unknown) => write(() => fail(error)),
          );
          return;
        }
        try {
          show(markdownTree(value, options()), value);
        } catch (error) {
          fail(error);
        }
      };

      const observer = new MutationObserver(render);
      observer.observe(element, { attributes: true, attributeFilter: OPTION_ATTRIBUTES });
      observer.observe(source, { characterData: true, childList: true, subtree: true });
      render();

      return {
        get value() {
          return source.textContent as string;
        },
        setValue(markdown: string) {
          source.textContent = markdown;
          observer.takeRecords();
          render();
        },
        render,
        destroy() {
          observer.disconnect();
          generation++;
        },
      };
    },
  });

/** The Markdown definition without plugins (`createMarkdown()` for those). */
export const markdown = createMarkdown();
