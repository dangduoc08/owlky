import type { OptionSchema, OptionSpec } from "@owlky/core";
import type { ArgTypes } from "@storybook/react-vite";

/*
 * Story Controls generated from the component option schemas (ADR-0015), identical for the React
 * and the HTML story. Every control starts at "as in the examples" (undefined), so a story matches
 * its twin until you change something; e2e/tests/options-parity.spec.ts checks each option.
 * Descriptions come from the source schemas (Storybook aliases @owlky/core to src); the built
 * package keeps them in @owlky/core/option-docs.json instead (ADR-0068 §4).
 */

type InputType = NonNullable<ArgTypes[string]>;

const KEEP = "(as in the examples)";

function inputType(spec: OptionSpec): InputType {
  if (spec.kind === "style") {
    return {
      control: { type: "select" },
      options: [KEEP, ...spec.values],
      mapping: { [KEEP]: undefined },
      description: spec.description ?? "",
      table: { type: { summary: spec.values.map((value) => `"${value}"`).join(" | ") } },
    };
  }
  if (spec.kind === "number") {
    return {
      control: { type: "number", ...(spec.min !== undefined ? { min: spec.min } : {}) },
      // `type` lets Storybook turn URL args back into numbers.
      type: { name: "number", required: false },
      description: spec.description ?? "",
      table: {
        type: { summary: spec.units ? `number | ${spec.units.join(" | ")} length` : "number" },
      },
    };
  }
  return {
    control: { type: "boolean" },
    description: spec.description ?? "",
    table: { type: { summary: "boolean" } },
  };
}

/** Controls for the listed options of `schema` (in that order). */
export function schemaControls(schema: OptionSchema, keys: readonly string[]): ArgTypes {
  return Object.fromEntries(
    keys.map((key) => {
      const spec = schema.options[key];
      if (!spec) throw new Error(`${schema.name} has no option "${key}"`);
      return [key, inputType(spec)];
    }),
  );
}

/** Values of defined args only (undefined = keep the examples). */
const definedArgs = (args: Record<string, unknown>) =>
  Object.entries(args).filter(([, value]) => value !== undefined);

/**
 * HTML twin of React props: writes the args onto every component root inside `root` (or onto the
 * option's `children`), the way a page author would edit the attributes.
 */
export function applyHtmlArgs(root: Element, schema: OptionSchema, args: Record<string, unknown>) {
  for (const [key, value] of definedArgs(args)) {
    const spec = schema.options[key];
    if (!spec) continue;
    for (const component of root.querySelectorAll(`[${schema.root}]`)) {
      const targets = spec.children ? [...component.querySelectorAll(spec.children)] : [component];
      for (const target of targets) write(target, spec, value);
    }
  }
}

function write(element: Element, spec: OptionSpec, value: unknown) {
  switch (spec.kind) {
    case "style":
      element.setAttribute(spec.attr, String(value));
      break;
    case "flag":
      element.toggleAttribute(spec.attr, value === true);
      break;
    case "number":
      element.setAttribute(spec.attr, String(value));
      break;
    case "behavior":
      if (value === false) element.setAttribute(spec.attr, "false");
      else element.removeAttribute(spec.attr);
      break;
    case "native":
      // A disabled link can't be `disabled`: like the React Button, it loses href and is aria-disabled.
      if (spec.attr === "disabled" && element instanceof HTMLAnchorElement) {
        if (value === true) {
          element.removeAttribute("href");
          element.setAttribute("role", "link");
          element.setAttribute("aria-disabled", "true");
        }
      } else {
        element.toggleAttribute(spec.attr, value === true);
      }
      break;
    default:
      break;
  }
}
