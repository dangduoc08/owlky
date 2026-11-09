import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { colorBindingVariables, defaultTheme, themeToCssVariables } from "@owlky/tokens";
import { describe, expect, it } from "vitest";

const src = join(import.meta.dirname);
const components = readdirSync(join(src, "components")).filter((f) => f.endsWith(".css"));
const read = (file: string) => readFileSync(join(src, file), "utf8");

/** Splits at top-level separators (outside parentheses). */
function splitTop(value: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth === 0 && separator.test(char)) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const isLength = (part: string) => /^-?[\d.]+(px|rem|em)?$/.test(part) || part.startsWith("calc(");
const isZero = (part: string) => /^-?0+(\.0+)?(px|rem|em)?$/.test(part);

/** True when a shadow layer (`x y blur spread color`) has a blur radius other than 0. */
function blurred(layer: string): boolean {
  const lengths = splitTop(layer, /\s/).filter(isLength);
  return lengths.length >= 3 && !isZero(lengths[2] as string);
}

/**
 * Hand-written blurred shadows in a stylesheet: `box-shadow` / `text-shadow` layers and
 * `drop-shadow()` filters with a blur, unless the declaration follows a `shadow-literal:` comment.
 * Rings and borders drawn with a zero-blur shadow are allowed; so are token references.
 */
function literalShadows(css: string): string[] {
  const found: string[] = [];
  const declaration =
    /(\/\*[^*]*shadow-literal:[\s\S]*?\*\/\s*)?\b(box-shadow|text-shadow|filter)\s*:\s*([^;{}]+);/g;
  for (const [, exception, property, raw] of css.matchAll(declaration)) {
    if (exception) continue;
    const value = (raw as string)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (property === "filter") {
      for (const fn of value.match(/drop-shadow\((?:[^()]|\([^()]*(?:\([^()]*\))*[^()]*\))*\)/g) ??
        []) {
        if (blurred(fn.slice("drop-shadow(".length, -1))) found.push(fn);
      }
    } else {
      for (const layer of splitTop(value, /,/)) if (blurred(layer)) found.push(layer);
    }
  }
  return found;
}

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
          // One :where(...) wrapping everything; only a few pseudo-elements may follow it.
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
          expect(
            [
              "",
              "::before",
              "::after",
              "::placeholder",
              "::selection",
              "::backdrop",
              "::details-content",
              "::-webkit-details-marker",
              "::-webkit-scrollbar",
              "::-webkit-scrollbar-thumb",
              "::-webkit-scrollbar-corner",
            ],
            `${file}: "${selector}"`,
          ).toContain(selector.slice(end + 1));
        }
      }
    },
  );

  it.each(components)("%s: no color-mix() (Tailwind rewrites it with opaque fallbacks)", (file) => {
    const css = read(`components/${file}`).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toContain("color-mix(");
  });

  it.each(components)(
    "%s: blurred shadows come from --ok-shadow-* / --ok-elevation-* / --ok-drop-shadow-* tokens",
    (file) => {
      expect(literalShadows(read(`components/${file}`))).toEqual([]);
    },
  );

  it("flags hand-written blurred shadows and keeps rings, tokens and marked exceptions", () => {
    expect(literalShadows(":where(a) { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.2); }")).toEqual([
      "0 1px 2px 0 rgb(0 0 0 / 0.2)",
    ]);
    expect(literalShadows(":where(a) { filter: drop-shadow(0 1px 1px red); }")).toEqual([
      "drop-shadow(0 1px 1px red)",
    ]);
    expect(
      literalShadows(
        ":where(a) { box-shadow: var(--ok-shadow-z1), 0 0 0 calc(var(--ok-spacing) * 2) red; }",
      ),
    ).toEqual([]);
    expect(literalShadows(":where(a) { box-shadow: inset 0 0 0 2px var(--_ok-accent); }")).toEqual(
      [],
    );
    expect(literalShadows(":where(a) { filter: var(--ok-drop-shadow-z1); }")).toEqual([]);
    expect(
      literalShadows(
        ":where(a) {\n  /* shadow-literal: over photos */\n  filter: drop-shadow(0 0 2px black);\n}",
      ),
    ).toEqual([]);
  });

  it.each(["theme.css", ...components.map((f) => `components/${f}`)])(
    "%s references only --ok-* tokens that exist",
    (file) => {
      const { root, light } = themeToCssVariables(defaultTheme);
      const known = new Set([
        ...Object.keys(root),
        ...Object.keys(light),
        ...colorBindingVariables,
      ]);
      const used = [...read(file).matchAll(/var\((--ok-[a-z0-9-]+)/g)].map((m) => m[1]);
      for (const name of used) expect(known.has(name as string), `${file}: ${name}`).toBe(true);
    },
  );
});
