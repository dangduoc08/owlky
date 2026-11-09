import type { NumberOption, StyleOption } from "@owlky/core";
import { parseNumber, readStyle } from "@owlky/core";

/** A language or theme name from markup: Monaco ids only (custom ones registered in `beforeMount`). */
const NAME = /^[a-z0-9][\w.+#-]{0,63}$/i;
export const readName = (element: Element, attr: string): string | undefined => {
  const value = element.getAttribute(attr)?.trim();
  return value && NAME.test(value) ? value : undefined;
};

/** The theme: a valid name, otherwise the schema's default (`auto`). */
export const readTheme = (element: Element, spec: StyleOption): string =>
  readName(element, spec.attr) ?? readStyle(element, spec);

/** A model path (`file:///a.ts`); anything longer than 2 kB is ignored. */
export const readPath = (element: Element, attr: string): string | undefined => {
  const value = element.getAttribute(attr);
  return value && value.length <= 2048 ? value : undefined;
};

const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);

/** A copy of parsed JSON without prototype keys (Monaco merges options into its own objects). */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value === null || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, each] of Object.entries(value)) if (!UNSAFE.has(key)) out[key] = clean(each);
  return out;
}

/**
 * Monaco options from `data-ok-options` (JSON, at most 16 kB): a plain object or nothing. No
 * code runs: `JSON.parse` only, prototype keys dropped.
 */
export function readOptions(element: Element): Record<string, unknown> {
  const text = element.getAttribute("data-ok-options");
  if (!text || text.length > 16_384) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (clean(parsed) as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** `--_ok-code-editor-width|height` from the width / height options (invalid → none). */
export function sizeProperties(
  element: Element,
  width: NumberOption,
  height: NumberOption,
): Partial<Record<`--_ok-${string}`, string>> {
  const length = (spec: NumberOption) => {
    const value = parseNumber(spec, element.getAttribute(spec.attr));
    return value === undefined ? undefined : typeof value === "number" ? `${value}px` : value;
  };
  const w = length(width);
  const h = length(height);
  return {
    ...(w === undefined ? {} : { "--_ok-code-editor-width": w }),
    ...(h === undefined ? {} : { "--_ok-code-editor-height": h }),
  };
}

/** The accessible name of a textarea: `aria-label`, `aria-labelledby` or its `<label>`. */
export function labelOf(field: HTMLTextAreaElement | null): string | undefined {
  if (!field) return undefined;
  const label = field.getAttribute("aria-label")?.trim();
  if (label) return label;
  const ids = field.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
  const byId = ids
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  if (byId) return byId;
  // A textarea always has a `labels` list; an element's textContent is a string.
  const labels = [...(field.labels as NodeListOf<HTMLLabelElement>)].map((each) =>
    (each.textContent as string).trim(),
  );
  return labels.filter(Boolean).join(" ") || undefined;
}

/** Own parts of a root (not those of a nested editor). */
export const ownPart = <T extends Element>(root: Element, selector: string, rootSelector: string) =>
  [...root.querySelectorAll<T>(selector)].find((node) => node.closest(rootSelector) === root) ??
  null;
