import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { colorBindingVariables, defaultTheme, themeToCssVariables } from "@minimal-tailwind/tokens";
import { describe, expect, it } from "vitest";

const src = join(import.meta.dirname);
const components = readdirSync(join(src, "components")).filter((f) => f.endsWith(".css"));
const read = (file: string) => readFileSync(join(src, file), "utf8");

/** Splits a selector list on top-level commas only (commas inside parentheses are kept). */
function splitSelectorList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of list) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  return [...parts, current.trim()];
}

describe("styles source", () => {
  it("imports every component in the full bundle", () => {
    const index = read("index.css");
    for (const file of components) expect(index).toContain(`@import "./components/${file}";`);
  });

  it.each(components)(
    "%s: every selector has zero specificity (:where, nothing after it)",
    (file) => {
      const css = read(`components/${file}`).replace(/\/\*[\s\S]*?\*\//g, "");
      // Rule preludes: the text between the previous `{`, `}` or `;` and each `{`.
      const selectors = [...css.matchAll(/(?:^|[{};])\s*([^{};]+?)\s*\{/g)]
        .map((m) => m[1]?.trim() ?? "")
        .filter((s) => s && !s.startsWith("@") && !/^(from|to|\d+%)$/.test(s));
      for (const selectorList of selectors) {
        for (const selector of splitSelectorList(selectorList.replace(/\s+/g, " "))) {
          // One :where(...) wrapping everything; only ::backdrop may follow it.
          expect(selector.startsWith(":where("), `${file}: "${selector}"`).toBe(true);
          let depth = 0;
          let end = -1;
          for (let i = ":where".length; i < selector.length; i++) {
            if (selector[i] === "(") depth++;
            if (selector[i] === ")" && --depth === 0) {
              end = i;
              break;
            }
          }
          expect(["", "::backdrop"], `${file}: "${selector}"`).toContain(selector.slice(end + 1));
        }
      }
    },
  );

  it.each(components)("%s: no color-mix() (Tailwind rewrites it with opaque fallbacks)", (file) => {
    const css = read(`components/${file}`).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toContain("color-mix(");
  });

  it.each(["theme.css", ...components.map((f) => `components/${f}`)])(
    "%s references only --mt-* tokens that exist",
    (file) => {
      const { root, light } = themeToCssVariables(defaultTheme);
      const known = new Set([
        ...Object.keys(root),
        ...Object.keys(light),
        ...colorBindingVariables,
      ]);
      const used = [...read(file).matchAll(/var\((--mt-[a-z0-9-]+)/g)].map((m) => m[1]);
      for (const name of used) expect(known.has(name as string), `${file}: ${name}`).toBe(true);
    },
  );
});
