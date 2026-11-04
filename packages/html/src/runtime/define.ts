import type { ComponentDefinition, ComponentInstance } from "./types.js";

/** Identity helper that gives a component definition full type inference. */
export const defineComponent = <I extends ComponentInstance>(
  definition: ComponentDefinition<I>,
): ComponentDefinition<I> => definition;

/** Reads a boolean `data-mt-*` option: absent → `fallback`, `"false"` → false, otherwise true. */
export function readBooleanOption(element: Element, attribute: string, fallback: boolean): boolean {
  const value = element.getAttribute(attribute);
  if (value === null) return fallback;
  return value !== "false";
}
