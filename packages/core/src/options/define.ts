/**
 * Option schemas (ADR-0015): one declaration per component option, shared by React (props →
 * attributes), the HTML runtime (attributes → options), Storybook Controls and parity tests.
 *
 * Kinds:
 * - `style`    enum written as `data-mt-<option>="<value>"` (unknown values → default)
 * - `flag`     boolean written as a presence attribute (`data-mt-full-width`)
 * - `native`   boolean native attribute (`disabled`)
 * - `behavior` boolean read by the runtime on every action; `data-mt-<option>="false"` turns it off
 * - `state`    state kept in the DOM (`open`, `aria-pressed`); documented, changed through the API
 */

export interface OptionBase {
  readonly description: string;
  /** HTML: the option is written on these children of the root instead of the root itself. */
  readonly children?: string | undefined;
  /** Only emitted while this other flag option is on (e.g. `loadingPosition` with `loading`). */
  readonly when?: string | undefined;
}

export interface StyleOption<V extends string = string> extends OptionBase {
  readonly kind: "style";
  readonly attr: `data-mt-${string}`;
  readonly values: readonly V[];
  /** Written explicitly when no (valid) value is given — unless the option is `optional`. */
  readonly default: V;
  /** Written only when a valid value is given; otherwise the attribute is absent. */
  readonly optional?: boolean | undefined;
}

export interface FlagOption extends OptionBase {
  readonly kind: "flag";
  readonly attr: `data-mt-${string}`;
}

export interface NativeOption extends OptionBase {
  readonly kind: "native";
  readonly attr: string;
}

export interface BehaviorOption extends OptionBase {
  readonly kind: "behavior";
  readonly attr: `data-mt-${string}`;
  readonly default: boolean;
}

export interface StateOption extends OptionBase {
  readonly kind: "state";
  /** Where the state lives in the DOM. */
  readonly attr: string;
  /** HTML event that reports changes. */
  readonly event?: string | undefined;
}

export type OptionSpec = StyleOption | FlagOption | NativeOption | BehaviorOption | StateOption;

export interface OptionSchema<O extends Record<string, OptionSpec> = Record<string, OptionSpec>> {
  /** Component name (`mt:<name>:<event>`, `runtime.get(el, name)`). */
  readonly name: string;
  /** Root marker attribute, e.g. `data-mt-button`. */
  readonly root: `data-mt-${string}`;
  readonly options: O;
}

export type DataAttributes = { [key: `data-mt-${string}`]: string };

/** Pure: lets bundlers drop unused schemas. */
export const style = /* @__NO_SIDE_EFFECTS__ */ <const V extends string>(
  attr: `data-mt-${string}`,
  values: readonly V[],
  defaultValue: V,
  description: string,
  extra: Pick<OptionBase, "children" | "when"> & { optional?: boolean } = {},
): StyleOption<V> => ({
  kind: "style",
  attr,
  values,
  default: defaultValue,
  description,
  ...extra,
});

/** Pure: lets bundlers drop unused schemas. */
export const flag = /* @__NO_SIDE_EFFECTS__ */ (
  attr: `data-mt-${string}`,
  description: string,
  extra: Pick<OptionBase, "children" | "when"> = {},
): FlagOption => ({ kind: "flag", attr, description, ...extra });

/** Pure: lets bundlers drop unused schemas. */
export const native = /* @__NO_SIDE_EFFECTS__ */ (
  attr: string,
  description: string,
  extra: Pick<OptionBase, "children"> = {},
): NativeOption => ({ kind: "native", attr, description, ...extra });

/** Pure: lets bundlers drop unused schemas. */
export const behavior = /* @__NO_SIDE_EFFECTS__ */ (
  attr: `data-mt-${string}`,
  defaultValue: boolean,
  description: string,
): BehaviorOption => ({ kind: "behavior", attr, default: defaultValue, description });

/** Pure: lets bundlers drop unused schemas. */
export const state = /* @__NO_SIDE_EFFECTS__ */ (
  attr: string,
  description: string,
  event?: string,
): StateOption => ({
  kind: "state",
  attr,
  description,
  event,
});

/** Pure: lets bundlers drop unused schemas. */
export const defineOptions = /* @__NO_SIDE_EFFECTS__ */ <
  const O extends Record<string, OptionSpec>,
>(
  name: string,
  root: `data-mt-${string}`,
  options: O,
): OptionSchema<O> => ({ name, root, options });

/** `value` when it is one of `values`, otherwise `fallback` (untrusted input never reaches the DOM). */
export const pick = <T extends string>(values: readonly T[], value: unknown, fallback: T): T =>
  values.includes(value as T) ? (value as T) : fallback;

/**
 * Root attributes for the given option values: every `style` option is written (explicit
 * defaults), every `flag` that is on, honoring `when`. Options written on children are skipped.
 */
export function optionAttributes(
  schema: OptionSchema,
  values: Record<string, unknown> = {},
): DataAttributes {
  const attributes: DataAttributes = { [schema.root]: "" };
  for (const [key, spec] of Object.entries(schema.options)) {
    if (spec.children !== undefined) continue;
    if (spec.when !== undefined && values[spec.when] !== true) continue;
    if (spec.kind === "style") {
      if (!spec.optional) attributes[spec.attr] = pick(spec.values, values[key], spec.default);
      else if (spec.values.includes(values[key] as string))
        attributes[spec.attr] = values[key] as string;
    } else if (spec.kind === "flag" && values[key] === true) attributes[spec.attr] = "";
  }
  return attributes;
}

/** HTML: reads a `behavior` option — absent → default, `"false"` → false, anything else → true. */
export function readBehavior(element: Element, spec: BehaviorOption): boolean {
  const value = element.getAttribute(spec.attr);
  return value === null ? spec.default : value !== "false";
}

/** HTML: reads a `style` option through its allowlist. */
export function readStyle<V extends string>(element: Element, spec: StyleOption<V>): V {
  return pick(spec.values, element.getAttribute(spec.attr), spec.default);
}
