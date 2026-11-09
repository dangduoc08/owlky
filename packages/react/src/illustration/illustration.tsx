import {
  type IllustrationColor,
  type Illustration as IllustrationData,
  type IllustrationNode,
  illustrationAria,
  illustrationAttributes,
  illustrationChildren,
  illustrationNodeAttributes,
  illustrationStyle,
} from "@owlky/core";
import { type CSSProperties, forwardRef, type ReactNode, type SVGProps } from "react";

export interface IllustrationProps
  extends Omit<SVGProps<SVGSVGElement>, "color" | "ref" | "children" | "title"> {
  /** The picture: an export of `@owlky/core/illustrations` (such as `error404`) or your own data. */
  illustration: IllustrationData;
  /** Palette of the brand tones. Default `"primary"`. */
  color?: IllustrationColor | undefined;
  /** Width: a number in px, or a CSS length such as `"20rem"`. Default 480px, never wider than the container. */
  size?: number | string | undefined;
  /**
   * The accessible name. With it (or `aria-label` / `aria-labelledby`) the picture is an image
   * (`role="img"`); without, it is decorative (`aria-hidden`).
   */
  title?: string | undefined;
}

const camel = (name: string) =>
  name.startsWith("data-") ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Core nodes → React elements (`stroke-width` → `strokeWidth`; data attributes unchanged). */
function toElements(nodes: readonly IllustrationNode[] | undefined): ReactNode[] {
  return illustrationChildren(nodes).map((node, index) => {
    const props: Record<string, unknown> = {};
    for (const [name, value] of Object.entries(illustrationNodeAttributes(node)))
      props[camel(name)] = value;
    const Tag = node.tag;
    return (
      // The tree is static data: its order is its identity.
      // biome-ignore lint/suspicious/noArrayIndexKey: static artwork, never reordered.
      <Tag key={index} {...props}>
        {node.tag === "g" ? toElements(node.children) : null}
      </Tag>
    );
  });
}

/**
 * Illustration — spec: specs/components/illustration.md (ADR-0041). Renders an illustration's
 * node tree as inline SVG; tones follow the theme through the stylesheet. Decorative unless
 * named (`title`, `aria-label` or `aria-labelledby`).
 */
export const Illustration = forwardRef<SVGSVGElement, IllustrationProps>(function Illustration(
  { illustration, color, size, title, style, ...props },
  ref,
) {
  const aria = illustrationAria(Boolean(props["aria-label"] || props["aria-labelledby"]), title);
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative (aria-hidden) unless named; `aria` sets one or the other.
    <svg
      ref={ref}
      {...illustrationAttributes(illustration.name, { color, size })}
      data-ok-runtime="off"
      viewBox={illustration.viewBox}
      focusable="false"
      {...aria}
      style={{ ...(illustrationStyle(size) as CSSProperties), ...style }}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {toElements(illustration.nodes)}
    </svg>
  );
});
