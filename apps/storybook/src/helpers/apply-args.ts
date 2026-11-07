import * as library from "@owlky/react";
import { cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

/*
 * Story Controls for example collections: the chosen props (args) are applied to every element of
 * one component inside a story's examples. Undefined args change nothing, so a story with default
 * args renders exactly like its HTML twin (parity tests).
 */

type Props = Record<string, unknown>;

/** Copies `args` (defined values only) onto every `target` element in `node`. */
export function applyArgs(node: ReactNode, target: unknown, args: Props): ReactNode {
  const defined = Object.fromEntries(
    Object.entries(args).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(defined).length === 0) return node;
  return walk(node, target, defined);
}

function walk(node: ReactNode, target: unknown, args: Props): ReactNode {
  if (Array.isArray(node)) return node.map((child) => walk(child, target, args));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Props>;
  // Local example helpers (no hooks) are expanded so their inner elements can be reached.
  if (element.type !== target && element.type !== Fragment && typeof element.type === "function") {
    const name = (element.type as { displayName?: string }).displayName ?? "";
    if (!name.endsWith("Icon") && !isLibrary(element.type)) {
      return walk((element.type as (props: Props) => ReactNode)(element.props), target, args);
    }
  }
  const children = element.props["children"] as ReactNode;
  const mapped = children === undefined ? undefined : walk(children, target, args);
  const extra: Props = element.type === target ? { ...args } : {};
  // A FormControlLabel's control is a prop, not a child.
  const control = element.props["control"];
  if (isValidElement(control)) extra["control"] = walk(control, target, args);
  return mapped === undefined ? cloneElement(element, extra) : cloneElement(element, extra, mapped);
}

/** Public components are kept as they are (only their children are walked). */
const LIBRARY = new Set<unknown>(Object.values(library));
const isLibrary = (type: unknown) => LIBRARY.has(type);
