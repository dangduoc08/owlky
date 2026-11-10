import type {
  AnyEvents,
  ComponentDefinition,
  ComponentInstance,
  EventMap,
  SetupContext,
} from "./types.js";

/**
 * Identity helper that gives a component definition full type inference. `E` is the event map
 * (`EventSpec` per event): `emit` then only takes its names and detail types.
 */
export const defineComponent = <I extends ComponentInstance, E extends EventMap<E> = AnyEvents>(
  definition: Omit<ComponentDefinition<I>, "setup"> & {
    setup(element: HTMLElement, context: SetupContext<E>): I;
  },
): ComponentDefinition<I> => definition as ComponentDefinition<I>;

/** Reads a boolean `data-ok-*` option: absent → `fallback`, `"false"` → false, otherwise true. */
export function readBooleanOption(element: Element, attribute: string, fallback: boolean): boolean {
  const value = element.getAttribute(attribute);
  if (value === null) return fallback;
  return value !== "false";
}
