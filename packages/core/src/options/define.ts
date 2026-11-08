/**
 * Option schemas (ADR-0015): one declaration per component option, shared by React (props →
 * attributes), the HTML runtime (attributes → options), Storybook Controls and parity tests.
 *
 * Kinds:
 * - `style`    enum written as `data-ok-<option>="<value>"` (unknown values → default)
 * - `flag`     boolean written as a presence attribute (`data-ok-full-width`)
 * - `native`   boolean native attribute (`disabled`)
 * - `behavior` boolean read by the runtime on every action; `data-ok-<option>="false"` turns it off
 * - `state`    state kept in the DOM (`open`, `aria-pressed`); documented, changed through the API
 * - `number`   number (or CSS length) written as `<attr>="<value>"` when given and valid; ARIA
 *              attributes (`aria-valuenow`) are written by the component, `data-ok-*` ones by
 *              `optionAttributes`; invalid values → default
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
  readonly attr: `data-ok-${string}`;
  readonly values: readonly V[];
  /** Written explicitly when no (valid) value is given — unless the option is `optional`. */
  readonly default: V;
  /** Written only when a valid value is given; otherwise the attribute is absent. */
  readonly optional?: boolean | undefined;
}

export interface FlagOption extends OptionBase {
  readonly kind: "flag";
  readonly attr: `data-ok-${string}`;
}

export interface NativeOption extends OptionBase {
  readonly kind: "native";
  readonly attr: string;
}

export interface BehaviorOption extends OptionBase {
  readonly kind: "behavior";
  readonly attr: `data-ok-${string}`;
  readonly default: boolean;
}

export interface StateOption extends OptionBase {
  readonly kind: "state";
  /** Where the state lives in the DOM. */
  readonly attr: string;
  /** HTML event that reports changes. */
  readonly event?: string | undefined;
}

export interface NumberOption extends OptionBase {
  readonly kind: "number";
  readonly attr: string;
  /** Used when the value is absent or invalid; `undefined` = no value. */
  readonly default: number | undefined;
  /** Smallest valid value (inclusive); smaller values are invalid. */
  readonly min?: number | undefined;
  /** CSS length units accepted besides a plain number (= px), e.g. `["px", "rem", "em"]`. */
  readonly units?: readonly string[] | undefined;
}

export type OptionSpec =
  | StyleOption
  | FlagOption
  | NativeOption
  | BehaviorOption
  | StateOption
  | NumberOption;

export interface OptionSchema<O extends Record<string, OptionSpec> = Record<string, OptionSpec>> {
  /** Component name (`ok:<name>:<event>`, `runtime.get(el, name)`). */
  readonly name: string;
  /** Root marker attribute, e.g. `data-ok-button`. */
  readonly root: `data-ok-${string}`;
  readonly options: O;
}

export type DataAttributes = { [key: `data-ok-${string}`]: string };

/** Pure: lets bundlers drop unused schemas. */
export const style = /* @__NO_SIDE_EFFECTS__ */ <const V extends string>(
  attr: `data-ok-${string}`,
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
  attr: `data-ok-${string}`,
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
  attr: `data-ok-${string}`,
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
export const number = /* @__NO_SIDE_EFFECTS__ */ (
  attr: string,
  defaultValue: number | undefined,
  description: string,
  extra: { min?: number; units?: readonly string[] } = {},
): NumberOption => ({ kind: "number", attr, default: defaultValue, description, ...extra });

/** Pure: lets bundlers drop unused schemas. */
export const defineOptions = /* @__NO_SIDE_EFFECTS__ */ <
  const O extends Record<string, OptionSpec>,
>(
  name: string,
  root: `data-ok-${string}`,
  options: O,
): OptionSchema<O> => ({ name, root, options });

/** `value` when it is one of `values`, otherwise `fallback` (untrusted input never reaches the DOM). */
export const pick = <T extends string>(values: readonly T[], value: unknown, fallback: T): T =>
  values.includes(value as T) ? (value as T) : fallback;

/** A decimal number, with an optional exponent (`5e-8`: the String() of tiny steps). */
const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

/**
 * A valid value of a `number` option, or `undefined`: a finite number (or numeric string) at
 * least `min` (exponents allowed: `"5e-8"`), or — with `units` — a non-negative length such as
 * `"3rem"` (returned as written). Anything else (NaN, `"1e999"`, `"calc(…)"`, markup) is invalid.
 */
export function parseNumber(spec: NumberOption, value: unknown): number | string | undefined {
  let parsed: number;
  if (typeof value === "number") parsed = value;
  else if (typeof value === "string" && value.length <= 32) {
    const text = value.trim();
    const unit = spec.units?.find((u) => text.endsWith(u) && NUMBER.test(text.slice(0, -u.length)));
    if (unit !== undefined) {
      const amount = Number(text.slice(0, -unit.length));
      return Number.isFinite(amount) && amount >= 0 ? `${amount}${unit}` : undefined;
    }
    if (!NUMBER.test(text)) return undefined;
    parsed = Number(text);
  } else return undefined;
  if (!Number.isFinite(parsed) || (spec.min !== undefined && parsed < spec.min)) return undefined;
  return parsed;
}

/**
 * Root attributes for the given option values: every `style` option is written (explicit
 * defaults), every `flag` that is on and every valid `data-ok-*` number, honoring `when`. Options
 * written on children are skipped.
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
    else if (spec.kind === "number" && spec.attr.startsWith("data-ok-")) {
      const value = parseNumber(spec, values[key]);
      if (value !== undefined) attributes[spec.attr as `data-ok-${string}`] = String(value);
    }
  }
  return attributes;
}

/** HTML: reads a `behavior` option — absent → default, `"false"` → false, anything else → true. */
export function readBehavior(element: Element, spec: BehaviorOption): boolean {
  const value = element.getAttribute(spec.attr);
  return value === null ? spec.default : value !== "false";
}

/** HTML: reads a `number` option — absent or invalid → default. */
export function readNumber(element: Element, spec: NumberOption): number | string | undefined {
  return parseNumber(spec, element.getAttribute(spec.attr)) ?? spec.default;
}

/** HTML: reads a `style` option through its allowlist. */
export function readStyle<V extends string>(element: Element, spec: StyleOption<V>): V {
  return pick(spec.values, element.getAttribute(spec.attr), spec.default);
}
