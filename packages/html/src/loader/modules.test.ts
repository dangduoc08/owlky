import { describe, expect, it } from "vitest";
import { codeEditor } from "../components/code-editor/code-editor.js";
import { diffEditor } from "../components/diff-editor/diff-editor.js";
import { editor } from "../components/editor/editor.js";
import { illustration } from "../components/illustration/illustration.js";
import { components } from "../components/index.js";
import { lightComponents } from "../components/light.js";
import { map } from "../components/map/map.js";
import { markdown } from "../components/markdown/markdown.js";
import { phoneInput } from "../components/phone-input/phone-input.js";
import type { ComponentDefinition } from "../runtime/types.js";
import { LAZY_MODULES } from "./modules.js";

// Every definition the CDN serves: `components` plus the opt-in engines.
const all = new Map<string, ComponentDefinition>(
  [...components, editor, map, markdown, codeEditor, diffEditor, phoneInput, illustration].map(
    (definition) => [definition.name, definition as ComponentDefinition],
  ),
);
const moduleSources = import.meta.glob("../modules/*.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("lazy modules (ADR-0068)", () => {
  it("cover every definition once, with the light components", () => {
    const lazy = Object.values(LAZY_MODULES).flatMap((module) => [...module.definitions]);
    const light = lightComponents.map((definition) => definition.name);
    expect(new Set(lazy).size).toBe(lazy.length);
    expect(light.filter((name) => lazy.includes(name))).toEqual([]);
    expect([...light, ...lazy].sort()).toEqual([...all.keys()].sort());
  });

  it("keep the light components in the order of `components`", () => {
    const order = components.map((definition) => definition.name);
    const light = lightComponents.map((definition) => definition.name);
    expect(light).toEqual(order.filter((name) => light.includes(name)));
  });

  it("match their definitions' root selectors", () => {
    for (const [name, module] of Object.entries(LAZY_MODULES)) {
      const selectors = module.definitions.map((definition) => all.get(definition)?.selector);
      expect(module.selector, name).toBe(selectors.join(","));
    }
  });

  it("have one entry file per module that registers exactly its definitions", () => {
    const files = Object.keys(moduleSources).map((path) => path.replace(/^.*\/(.+)\.ts$/, "$1"));
    expect(files.sort()).toEqual(Object.keys(LAZY_MODULES).sort());
    for (const [name, module] of Object.entries(LAZY_MODULES)) {
      const source = moduleSources[`../modules/${name}.ts`] as string;
      for (const definition of module.definitions)
        expect(source, `${name}: ${definition}`).toContain(`/${definition}/${definition}.js"`);
      expect(source.match(/from "\.\.\/components\//g)?.length, name).toBe(
        module.definitions.length,
      );
    }
  });
});
