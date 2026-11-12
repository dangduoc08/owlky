import type { Manifest, ManifestOption } from "./manifest.js";
import { type ScannedElement, scanMarkup } from "./markup.js";
import { suggest } from "./search.js";

/*
 * `validate_markup` (ADR-0046): checks HTML against the anatomy. Rules:
 * - unknown-attribute  a `data-ok-*` name no package uses (error)
 * - invalid-value      a value outside an option's allowlist, or an invalid number (error)
 * - missing-part       a root without a part every instance needs (error)
 * - missing-root       `component` was given but none of its roots is in the markup (error)
 * - orphan-part        a part outside the root it always sits in (warning)
 * - flag-value         a presence attribute with a value: `="false"` still turns it on (warning)
 */

export type IssueRule =
  | "unknown-attribute"
  | "invalid-value"
  | "missing-part"
  | "missing-root"
  | "orphan-part"
  | "flag-value";

export interface Issue {
  readonly severity: "error" | "warning";
  readonly rule: IssueRule;
  readonly message: string;
  /** 1-based position of the element (0 for markup-wide issues). */
  readonly line: number;
  readonly column: number;
  readonly tag?: string;
  readonly attribute?: string;
  readonly suggestions?: readonly string[];
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly elementCount: number;
  readonly issues: readonly Issue[];
  /** More issues were found than `MAX_ISSUES`. */
  readonly truncated: boolean;
}

/** Largest markup accepted (characters). */
export const MAX_MARKUP = 200_000;
/** Issues reported at most. */
export const MAX_ISSUES = 200;

export interface Validator {
  validate(markup: string, roots?: readonly string[]): ValidationResult;
}

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function checkValue(option: ManifestOption, value: string): string | undefined {
  switch (option.kind) {
    case "style":
      return option.values?.includes(value) ||
        (option.pattern !== undefined && new RegExp(`^(?:${option.pattern})$`).test(value))
        ? undefined
        : `expects one of ${option.values?.map((v) => `"${v}"`).join(", ")}${option.pattern ? " or a matching value" : ""}`;
    case "behavior":
      return value === "" || value === "true" || value === "false"
        ? undefined
        : 'expects "false" (to turn it off) or no value';
    case "number": {
      // Keywords the description names, such as `auto` ("or `auto`: as many as fit").
      if (new RegExp(`\`${value}\``).test(option.description) && /^[a-z]+$/.test(value))
        return undefined;
      const unit = option.units?.find((u) => value.endsWith(u));
      const number = unit ? value.slice(0, -unit.length) : value;
      if (!NUMBER.test(number)) {
        return option.units
          ? `expects a number or a length in ${option.units.join(", ")}`
          : "expects a number";
      }
      if (option.min !== undefined && Number(number) < option.min)
        return `expects a number of at least ${option.min}`;
      return undefined;
    }
    default:
      return undefined;
  }
}

export function createValidator(manifest: Manifest): Validator {
  const known = new Set(manifest.attributes);
  const options = new Map<string, Map<string, ManifestOption[]>>(); // root → attr → options
  const required = new Map<string, readonly string[]>();
  for (const component of manifest.components) {
    for (const schema of component.schemas) {
      const byAttr = options.get(schema.root) ?? new Map<string, ManifestOption[]>();
      options.set(schema.root, byAttr);
      for (const option of schema.options) {
        if (option.children !== undefined) continue;
        byAttr.set(option.attr, [...(byAttr.get(option.attr) ?? []), option]);
      }
    }
    for (const [root, parts] of Object.entries(component.requiredParts)) required.set(root, parts);
  }

  return {
    validate(markup, roots = []) {
      const { elements } = scanMarkup(markup);
      const issues: Issue[] = [];
      let errorCount = 0;
      let warningCount = 0;
      const report = (issue: Issue) => {
        if (issue.severity === "error") errorCount++;
        else warningCount++;
        if (issues.length < MAX_ISSUES) issues.push(issue);
      };
      const at = (element: ScannedElement, attr: string) => ({
        line: element.line,
        column: element.column,
        tag: element.tag,
        attribute: attr,
      });

      const names = elements.map((element) => new Set(element.attributes.map(([name]) => name)));
      const descendants = elements.map(() => new Set<string>());
      for (let i = elements.length - 1; i >= 0; i--) {
        const parent = (elements[i] as ScannedElement).parent;
        if (parent === -1) continue;
        const into = descendants[parent] as Set<string>;
        for (const name of names[i] as Set<string>) into.add(name);
        for (const name of descendants[i] as Set<string>) into.add(name);
      }
      const insideRoot = (index: number, root: string) => {
        for (let i = index; i !== -1; i = (elements[i] as ScannedElement).parent)
          if ((names[i] as Set<string>).has(root)) return true;
        return false;
      };

      elements.forEach((element, index) => {
        const own = names[index] as Set<string>;
        const applying = [...own].filter((name) => options.has(name));
        for (const [name, value] of element.attributes) {
          if (name.startsWith("data-ok-") && !known.has(name)) {
            const suggestions = suggest(name, known, 3);
            report({
              severity: "error",
              rule: "unknown-attribute",
              message: `Unknown attribute ${name}.${suggestions.length ? ` Did you mean ${suggestions.join(", ")}?` : ""}`,
              ...at(element, name),
              ...(suggestions.length ? { suggestions } : {}),
            });
            continue;
          }
          const candidates = applying.flatMap(
            (root) => options.get(root)?.get(name) ?? ([] as ManifestOption[]),
          );
          if (candidates.length === 0) continue;
          if (candidates.every((option) => option.kind === "flag") && value !== "") {
            report({
              severity: "warning",
              rule: "flag-value",
              message: `${name} is a presence attribute: any value turns it on${value === "false" ? ' (remove it instead of writing "false")' : ""}.`,
              ...at(element, name),
            });
            continue;
          }
          const problems = candidates.map((option) => checkValue(option, value));
          if (problems.some((problem) => problem === undefined)) continue;
          const allowed = candidates.flatMap((option) => option.values ?? []);
          report({
            severity: "error",
            rule: "invalid-value",
            message: `${name}="${value}" on ${applying.join(" + ")} ${problems[0]}.`,
            ...at(element, name),
            ...(allowed.length ? { suggestions: [...new Set(allowed)] } : {}),
          });
        }
        for (const root of own) {
          const parts = required.get(root);
          if (!parts) continue;
          const found = descendants[index] as Set<string>;
          for (const part of parts) {
            if (found.has(part)) continue;
            report({
              severity: "error",
              rule: "missing-part",
              message: `${root} needs a descendant with ${part}.`,
              ...at(element, root),
              suggestions: [part],
            });
          }
        }
        for (const name of own) {
          const root = manifest.parts[name];
          if (root === undefined || insideRoot(index, root)) continue;
          report({
            severity: "warning",
            rule: "orphan-part",
            message: `${name} is a part of ${root}, but no ancestor has ${root}.`,
            ...at(element, name),
            suggestions: [root],
          });
        }
      });

      if (roots.length > 0 && !names.some((own) => roots.some((root) => own.has(root)))) {
        report({
          severity: "error",
          rule: "missing-root",
          message: `No element carries ${roots.length > 1 ? "any of " : ""}${roots.join(", ")}.`,
          line: 0,
          column: 0,
          suggestions: [...roots],
        });
      }
      return {
        valid: errorCount === 0,
        errorCount,
        warningCount,
        elementCount: elements.length,
        issues,
        truncated: errorCount + warningCount > issues.length,
      };
    },
  };
}
