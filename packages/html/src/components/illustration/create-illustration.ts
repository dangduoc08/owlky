import {
  type Illustration,
  type IllustrationNode,
  illustrationAria,
  illustrationChildren,
  illustrationNodeAttributes,
  illustrationOptions,
  illustrationStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";

const SVG = "http://www.w3.org/2000/svg";
const NAME = "data-ok-illustration";
const SIZE = illustrationOptions.options.size.attr;

export interface IllustrationInstance extends ComponentInstance {
  /** The illustration drawn, or `undefined` when the name is unknown to this set. */
  readonly illustration: Illustration | undefined;
}

/** Builds the nodes with DOM methods (CSP-safe: no HTML strings). */
function build(parent: Element, nodes: readonly IllustrationNode[] | undefined): void {
  const document = parent.ownerDocument;
  for (const node of illustrationChildren(nodes)) {
    const element = document.createElementNS(SVG, node.tag);
    for (const [name, value] of Object.entries(illustrationNodeAttributes(node)))
      element.setAttribute(name, value);
    if (node.tag === "g") build(element, node.children);
    parent.append(element);
  }
}

/** Whether the element already holds artwork (a snippet pasted with its shapes). */
const hasArtwork = (element: Element) =>
  [...element.children].some((child) => child.localName !== "title");

/**
 * Illustration — spec: specs/components/illustration.md (ADR-0041). An illustration runtime for
 * the given set: `<svg data-ok-illustration="<name>">` elements without artwork get the named
 * illustration's shapes and `viewBox`; every one gets its `data-ok-size` as a private custom
 * property (CSSOM). Snippets that carry their shapes need no JavaScript, except for `size`.
 *
 * Markup: <svg data-ok-illustration="error-404" data-ok-color="primary" aria-hidden="true"></svg>
 * Named:  <svg data-ok-illustration="error-404" role="img" aria-label="Page not found"></svg>
 */
export function createIllustration(
  set: readonly Illustration[] | (() => Promise<readonly Illustration[]>),
) {
  const index = (list: readonly Illustration[]) => new Map(list.map((item) => [item.name, item]));
  let byName = typeof set === "function" ? undefined : index(set);
  /** A set given as a loader (the CDN module, ADR-0068 S5) loads once, when a picture needs it. */
  let loading: Promise<unknown> | undefined;
  const load = () => {
    loading ??= (set as () => Promise<readonly Illustration[]>)().then((list) => {
      byName = index(list);
    });
    return loading;
  };
  return defineComponent<IllustrationInstance>({
    name: "illustration",
    selector: `svg[${NAME}]`,
    setup(element) {
      let written: string[] = [];
      /** Shapes this runtime drew (redrawn when the name changes; authored artwork stays). */
      let drawn = false;
      let current: Illustration | undefined;
      let live = true;
      const draw = () => {
        if (!byName && (drawn || !hasArtwork(element))) void load().then(() => live && draw());
        current = byName?.get(element.getAttribute(NAME) ?? "");
        if (current && (drawn || !hasArtwork(element))) {
          for (const child of [...element.children])
            if (child.localName !== "title") child.remove();
          build(element, current.nodes);
          element.setAttribute("viewBox", current.viewBox);
          drawn = true;
        }
        if (!element.hasAttribute("aria-hidden") && !element.hasAttribute("role")) {
          const named =
            element.hasAttribute("aria-label") || element.hasAttribute("aria-labelledby");
          for (const [name, value] of Object.entries(illustrationAria(named)))
            element.setAttribute(name, value);
        }
        if (!element.hasAttribute("focusable")) element.setAttribute("focusable", "false");
      };
      const resize = () => {
        written = syncCustomProperties(
          element,
          illustrationStyle(element.getAttribute(SIZE)),
          written,
        );
      };
      draw();
      resize();
      const observer = new MutationObserver((records) => {
        if (records.some((record) => record.attributeName === NAME)) draw();
        if (records.some((record) => record.attributeName === SIZE)) resize();
      });
      observer.observe(element, { attributes: true, attributeFilter: [NAME, SIZE] });
      return {
        get illustration() {
          return current;
        },
        destroy() {
          live = false;
          observer.disconnect();
          syncCustomProperties(element, {}, written);
        },
      };
    },
  });
}
