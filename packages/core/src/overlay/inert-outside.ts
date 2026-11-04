import { supports } from "../dom/support.js";

/**
 * Makes everything outside `element` inert (or aria-hidden where `inert` is unsupported).
 * Used by fallbacks that can't use the top layer. Returns a function that restores the
 * previous state exactly.
 */
export function inertOutside(element: Element): () => void {
  const useInert = supports.inert;
  const touched: { node: Element; previous: string | null }[] = [];
  const attribute = useInert ? "inert" : "aria-hidden";

  for (let node: Element | null = element; node && node !== node.ownerDocument.body; ) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || sibling instanceof HTMLScriptElement) continue;
      touched.push({ node: sibling, previous: sibling.getAttribute(attribute) });
      sibling.setAttribute(attribute, useInert ? "" : "true");
    }
    node = parent;
  }

  return () => {
    for (const { node, previous } of touched) {
      if (previous === null) node.removeAttribute(attribute);
      else node.setAttribute(attribute, previous);
    }
  };
}
