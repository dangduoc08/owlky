/*
 * Component icons (ADR-0070 § 9): Solar icons as data (`solar.ts`, generated). React maps the
 * nodes to elements, HTML runtimes build them with `createIcon` (DOM methods, no `innerHTML`),
 * node-tree renderers (Chart, Gantt) take `iconTree`, and snippets carry the same inline SVG:
 * `<svg data-ok-icon="<name>" viewBox="0 0 24 24" aria-hidden="true" focusable="false" …>`.
 * The stroke width comes from CSS (`--ok-icon-stroke`, icon.css): presentation attributes can't
 * read a custom property.
 */

/** SVG shapes an icon may contain. */
export type IconTag = "path" | "circle" | "rect";

/** One shape: its tag and attributes (geometry, `fill-rule`, `transform`…). */
export type IconNode = readonly [tag: IconTag, attrs: Readonly<Record<string, string>>];

export interface IconData {
  /** Solar name with its variant, such as `close-linear`: the `data-ok-icon` value. */
  readonly name: string;
  /** Presentation attributes of the `<svg>` (`fill`, `stroke`, line caps and joins). */
  readonly attrs: Readonly<Record<string, string>>;
  readonly nodes: readonly IconNode[];
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Attributes of an icon's `<svg>`, in markup order (decorative: hidden from assistive tech). */
export function iconAttributes(icon: IconData): Record<string, string> {
  return {
    "data-ok-icon": icon.name,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    focusable: "false",
    ...icon.attrs,
  };
}

/** A node tree of the icon (`{ tag, attrs, children }`), for renderers that draw node trees. */
export function iconTree(
  icon: IconData,
  attrs: Readonly<Record<string, string>> = {},
): {
  tag: "svg";
  attrs: Record<string, string>;
  children: { tag: IconTag; attrs: Readonly<Record<string, string>> }[];
} {
  return {
    tag: "svg",
    attrs: { ...attrs, ...iconAttributes(icon) },
    children: icon.nodes.map(([tag, nodeAttrs]) => ({ tag, attrs: nodeAttrs })),
  };
}

/** The icon as an `<svg>` element; `attrs` (part attributes) come first, like in the markup. */
export function createIcon(
  icon: IconData,
  attrs: Readonly<Record<string, string>> = {},
  doc: Document = document,
): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, "svg");
  for (const [name, value] of Object.entries({ ...attrs, ...iconAttributes(icon) }))
    svg.setAttribute(name, value);
  for (const [tag, nodeAttrs] of icon.nodes) {
    const node = doc.createElementNS(SVG_NS, tag);
    for (const [name, value] of Object.entries(nodeAttrs)) node.setAttribute(name, value);
    svg.append(node);
  }
  return svg;
}
