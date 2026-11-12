import { type ImageRatio, type MarkdownImageMode, markdownAttributes } from "@owlky/core";
import {
  childSpace,
  type MarkdownElement,
  type MarkdownProcessOptions,
  type MarkdownRoot,
  markdownElementAttributes,
  markdownElementStyle,
  markdownTree,
  markdownTreeAsync,
} from "@owlky/core/markdown";
import {
  type ComponentProps,
  type CSSProperties,
  createElement,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Image, type ImageProps } from "../image/image.js";

export {
  type AllowElement,
  defaultUrlTransform,
  type MarkdownHighlighter,
  type MarkdownSanitizeSchema,
  markdownSanitizeSchema,
  type UrlTransform,
} from "@owlky/core/markdown";

/** Props every replacement component receives besides the element's own: its hast node. */
export interface ExtraProps {
  node?: MarkdownElement | undefined;
}

/** Tag name → replacement (a component, or another tag name such as `h1: "h2"`). */
export type Components = {
  [Tag in keyof JSX.IntrinsicElements]?:
    | ElementType<ComponentProps<Tag> & ExtraProps>
    | keyof JSX.IntrinsicElements;
};

/** react-markdown's options (ADR-0015) plus Owlky's (`gfm`, `rawHtml`, `externalLinks`…). */
export interface MarkdownOptions extends MarkdownProcessOptions {
  /** The Markdown source. */
  children?: string | null | undefined;
  /** Replaces elements by tag name. */
  components?: Components | null | undefined;
  /** `"image"`: pictures render as `Image` (lazy, placeholder, effect). Default `"native"`. */
  images?: MarkdownImageMode | undefined;
  /** With `images="image"`: the aspect ratio pictures are cropped to. Default: their own. */
  imageRatio?: ImageRatio | undefined;
}

export interface MarkdownProps
  extends MarkdownOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {}

type Space = "html" | "svg";

const camel = (property: string) =>
  property.startsWith("--")
    ? property
    : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

/** hast property → React prop (React's names; data-* / aria-* keep their attribute names). */
function propsOf(element: MarkdownElement, space: Space, key: string): Record<string, unknown> {
  const props: Record<string, unknown> = { key };
  const formControl = ["input", "textarea", "select"].includes(element.tagName);
  for (const attribute of markdownElementAttributes(element, space)) {
    const dataOrAria = /^(data|aria)-/.test(attribute.name);
    let name = dataOrAria ? attribute.name : attribute.property;
    // Read-only content: initial values, never controlled inputs.
    if (formControl && name === "checked") name = "defaultChecked";
    if (formControl && name === "value") name = "defaultValue";
    props[name] = attribute.value === true ? (dataOrAria ? "" : true) : attribute.value;
  }
  const style = markdownElementStyle(element);
  if (style.length > 0)
    props["style"] = Object.fromEntries(
      style.map(([property, value]) => [camel(property), value]),
    ) as CSSProperties;
  return props;
}

/** How pictures render: Image components (`images="image"`) or plain `img`. */
interface ImageMode {
  image: boolean;
  ratio: ImageRatio | undefined;
}

/** An `img` of the tree as an Image: its own attributes go to the picture (as in HTML). */
function markdownImage(props: Record<string, unknown>, mode: ImageMode): ReactElement {
  const { key, src, alt, width, height, ...other } = props;
  return createElement(Image, {
    key: key as string,
    src: src as string | undefined,
    alt: typeof alt === "string" ? alt : "",
    width: width as number | string | undefined,
    height: height as number | string | undefined,
    ratio: mode.ratio,
    imgProps: other as ImageProps["imgProps"],
  });
}

function toReact(
  node: MarkdownRoot | MarkdownElement,
  components: Components | null | undefined,
  space: Space,
  mode: ImageMode = { image: false, ratio: undefined },
): ReactNode[] {
  // A finished tree holds elements and text only (comments, doctypes and raw HTML are gone).
  return node.children.map((content, index): ReactNode => {
    if (content.type === "text") return content.value;
    const child = content as MarkdownElement;
    const inner = childSpace(child, space);
    const props = propsOf(child, space, String(index));
    const children = toReact(child, components, inner, mode);
    const replacement = components?.[child.tagName as keyof Components];
    if (mode.image && child.tagName === "img" && replacement === undefined)
      return markdownImage(props, mode);
    if (replacement !== undefined && typeof replacement !== "string") props["node"] = child;
    const type = (replacement ?? child.tagName) as ElementType;
    return children.length > 0
      ? createElement(type, props, ...children)
      : createElement(type, props);
  });
}

/** Root attributes shared with the HTML markup (options HTML reads from attributes). */
function rootAttributes(options: MarkdownOptions) {
  return {
    ...markdownAttributes({
      images: options.images,
      imageRatio: options.images === "image" ? options.imageRatio : undefined,
      rawHtml: options.rawHtml === true,
      skipHtml: options.skipHtml === true,
      unwrapDisallowed: options.unwrapDisallowed === true,
      externalLinks: options.externalLinks === true,
    }),
    ...(options.gfm === false ? { "data-ok-gfm": "false" } : {}),
    ...(options.allowedElements
      ? { "data-ok-allowed-elements": options.allowedElements.join(" ") }
      : {}),
    ...(options.disallowedElements
      ? { "data-ok-disallowed-elements": options.disallowedElements.join(" ") }
      : {}),
  };
}

/** Splits props into the pipeline's options and the root `div`'s own attributes. */
export function splitMarkdownProps(props: MarkdownProps) {
  const {
    children,
    components,
    images,
    imageRatio,
    remarkPlugins,
    rehypePlugins,
    remarkRehypeOptions,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
    urlTransform,
    gfm,
    rawHtml,
    sanitizeSchema,
    externalLinks,
    highlighter,
    ...rest
  } = props;
  const options: MarkdownOptions = {
    children,
    components,
    images,
    imageRatio,
    remarkPlugins,
    rehypePlugins,
    remarkRehypeOptions,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
    urlTransform,
    gfm,
    rawHtml,
    sanitizeSchema,
    externalLinks,
    highlighter,
  };
  return { options, rest };
}

/** The root `div` around a rendered tree (shared by Markdown, MarkdownAsync and MarkdownHooks). */
export function renderMarkdownRoot(
  tree: MarkdownRoot | null,
  options: MarkdownOptions,
  rest: Omit<HTMLAttributes<HTMLDivElement>, "children">,
  ref?: Ref<HTMLDivElement>,
  fallback?: ReactNode,
): ReactElement {
  return (
    <div ref={ref} {...rest} {...rootAttributes(options)} data-ok-runtime="off">
      {tree
        ? toReact(tree, options.components, "html", {
            image: options.images === "image",
            ratio: options.imageRatio,
          })
        : fallback}
    </div>
  );
}

/**
 * Markdown — spec: specs/components/markdown.md (ADR-0035). Renders Markdown (GitHub Flavored by
 * default) as React elements: no `dangerouslySetInnerHTML`, unsafe URLs removed, raw HTML shown
 * as text unless `rawHtml` (then sanitized). Synchronous: plugins must be too (else
 * `MarkdownAsync` or `MarkdownHooks`).
 */
export const Markdown = forwardRef<HTMLDivElement, MarkdownProps>(function Markdown(props, ref) {
  const { options, rest } = splitMarkdownProps(props);
  return renderMarkdownRoot(markdownTree(options.children, options), options, rest, ref);
});

/** Markdown with asynchronous plugins, for servers (an async component). */
export async function MarkdownAsync(props: MarkdownProps): Promise<ReactElement> {
  const { options, rest } = splitMarkdownProps(props);
  return renderMarkdownRoot(await markdownTreeAsync(options.children, options), options, rest);
}
