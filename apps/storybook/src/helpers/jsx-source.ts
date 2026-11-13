import * as library from "@owlky/react";
import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

/*
 * Turns the example elements of a story into the JSX users copy from the Code panel. Library
 * components and icons are printed by name; local helper components (no hooks) are expanded so
 * the code only uses public components.
 */

/** Public components by identity: production builds minify function names. */
const LIBRARY = new Map<unknown, string>(
  Object.entries(library)
    .filter(([name]) => /^[A-Z]/.test(name))
    .map(([name, value]) => [value, name]),
);
const INDENT = "  ";

type ElementType = ReactElement["type"];
type Named = { displayName?: string };

function nameOf(type: ElementType): { name: string; expand: boolean } {
  if (typeof type === "string") return { name: type, expand: false };
  const known = LIBRARY.get(type);
  if (known) return { name: known, expand: false };
  // Example icons set an explicit displayName ending in "Icon"; other helpers are expanded.
  const name = (type as unknown as Named).displayName ?? "";
  return { name, expand: !name.endsWith("Icon") };
}

function propSource(key: string, value: unknown, used: Set<string>): string | null {
  if (key === "children" || key === "key" || value === undefined) return null;
  if (value === true) return key;
  if (typeof value === "string") return `${key}="${value}"`;
  if (isValidElement(value)) return `${key}={${render(value, 0, used).trim()}}`;
  // JSON has no Infinity (`repeat: Infinity` loops): print it as the JavaScript value.
  const json = JSON.stringify(value, (_, item) => (item === Infinity ? "@@Infinity@@" : item));
  return `${key}={${json?.replaceAll('"@@Infinity@@"', "Infinity")}}`;
}

function render(node: ReactNode, depth: number, used: Set<string>): string {
  const pad = INDENT.repeat(depth);
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return `${pad}${node}`;
  if (Array.isArray(node)) {
    return node
      .map((child) => render(child, depth, used))
      .filter(Boolean)
      .join("\n");
  }
  if (!isValidElement(node)) return "";
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.type === Fragment) return render(element.props["children"] as ReactNode, depth, used);
  const { name, expand } = nameOf(element.type);
  if (expand && typeof element.type === "function") {
    const output = (element.type as (props: unknown) => ReactNode)(element.props);
    return render(output, depth, used);
  }
  if (typeof element.type !== "string") used.add(name);
  const props = Object.entries(element.props)
    .map(([key, value]) => propSource(key, value, used))
    .filter((prop): prop is string => prop !== null);
  const open = props.length > 0 ? `${name} ${props.join(" ")}` : name;
  const children = element.props["children"] as ReactNode;
  const inner = render(children, depth + 1, used);
  if (!inner) return `${pad}<${open} />`;
  if (typeof children === "string" || typeof children === "number") {
    return `${pad}<${open}>${children}</${name}>`;
  }
  return `${pad}<${open}>\n${inner}\n${pad}</${name}>`;
}

export interface SourceGroup {
  title: string;
  content: ReactNode;
}

/** Story source: the import lines, then each group's JSX under a comment with its title. */
export function jsxSource(groups: SourceGroup[]): string {
  const used = new Set<string>();
  const body = groups
    .map((group) => `{/* ${group.title} */}\n${render(group.content, 0, used)}`)
    .join("\n\n");
  const icons = [...used].filter((name) => name.endsWith("Icon")).sort();
  const library = [...used].filter((name) => !name.endsWith("Icon")).sort();
  const lines = [
    'import "@owlky/styles/owlky-all.css";',
    `import { ${library.join(", ")} } from "@owlky/react";`,
  ];
  if (icons.length > 0) {
    lines.push(`// ${icons.join(", ")}: your own decorative SVG icons (aria-hidden="true").`);
  }
  return `${lines.join("\n")}\n\n${body}\n`;
}
