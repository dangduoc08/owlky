import type { IconData } from "@owlky/core";
import { createElement, type SVGProps } from "react";

/** SVG attribute names → React prop names (`stroke-linecap` → `strokeLinecap`). */
const prop = (name: string) =>
  name.startsWith("data-") || name.startsWith("aria-")
    ? name
    : name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

const props = (attrs: Readonly<Record<string, string>>) =>
  Object.fromEntries(Object.entries(attrs).map(([name, value]) => [prop(name), value]));

/**
 * A component icon (ADR-0070 § 9): the Solar data from `@owlky/core` as an `<svg>`, with the
 * same markup the HTML runtimes and snippets carry. Extra props (part attributes, sizes) come
 * first. Internal: components pick their icon; apps draw their own.
 */
export function Icon({ icon, ...rest }: { icon: IconData } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...rest}
      data-ok-icon={icon.name}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...props(icon.attrs)}
    >
      {icon.nodes.map(([tag, attrs], index) => createElement(tag, { key: index, ...props(attrs) }))}
    </svg>
  );
}
