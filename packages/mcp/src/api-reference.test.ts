import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ManifestApiEntry, ManifestComponent } from "./manifest.js";
import { manifest } from "./test-utils.js";

/*
 * Completeness of the API reference (ADR-0049, roadmap 3.4): the generated reference
 * (scripts/api-reference.mjs, in the manifest) lists every schema option, every `data-ok-*` name
 * the snippets use, every event a runtime emits and every exported React component, each with a
 * description. `pnpm check:api` keeps the reference equal to the sources; this test keeps the
 * sources complete.
 */

const root = resolve(import.meta.dirname, "../../..");
const ATTRIBUTE = /data-ok-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const components = manifest().components;
const entriesOf = (component: ManifestComponent): readonly ManifestApiEntry[] =>
  component.api?.entries ?? [];

/** Every `data-ok-*` name the reference documents (options, roots, parts), in any component. */
const documented = new Set<string>(manifest().commonParts?.map((part) => part.name) ?? []);
for (const component of components)
  for (const entry of entriesOf(component)) {
    const html = entry.html;
    if (!html) continue;
    documented.add(html.attribute);
    for (const option of html.options ?? []) documented.add(option.attr);
    for (const part of html.parts ?? []) documented.add(part.name);
  }

describe("API reference", () => {
  it("covers every component", () => {
    const missing = components.filter((component) => entriesOf(component).length === 0);
    expect(missing.map((component) => component.name)).toEqual([]);
  });

  it("lists every schema option on the entry of its root", () => {
    const missing: string[] = [];
    for (const component of components)
      for (const schema of component.schemas) {
        const entry = entriesOf(component).find((item) => item.html?.attribute === schema.root);
        const listed = new Set(entry?.html?.options?.map((option) => option.name));
        for (const option of schema.options)
          if (!listed.has(option.name)) missing.push(`${schema.name}.${option.name}`);
      }
    expect(missing).toEqual([]);
  });

  it("documents every data-ok-* name of every snippet", () => {
    const base = join(root, "packages/html/src/components");
    const missing = new Set<string>();
    for (const folder of readdirSync(base, { withFileTypes: true })) {
      if (!folder.isDirectory()) continue;
      let files: string[] = [];
      try {
        files = readdirSync(join(base, folder.name, "examples"));
      } catch {
        continue;
      }
      for (const file of files)
        for (const [name] of readFileSync(
          join(base, folder.name, "examples", file),
          "utf8",
        ).matchAll(ATTRIBUTE))
          if (!documented.has(name)) missing.add(`${name} (${folder.name}/${file})`);
    }
    expect([...missing]).toEqual([]);
  });

  it("lists every event the runtimes emit, on the entry of that runtime", () => {
    const events = new Map<string, Set<string>>(); // runtime → events
    for (const component of components)
      for (const entry of entriesOf(component)) {
        const runtime = entry.html?.runtime;
        if (!runtime) continue;
        events.set(
          runtime,
          new Set(entry.html?.events?.map((event) => event.name.slice(`ok:${runtime}:`.length))),
        );
      }
    const base = join(root, "packages/html/src/components");
    const missing: string[] = [];
    for (const folder of readdirSync(base, { withFileTypes: true, recursive: true })) {
      if (!folder.isFile() || !/^[a-z-]+\.ts$/.test(folder.name) || folder.name === "index.ts")
        continue;
      const text = readFileSync(join(folder.parentPath, folder.name), "utf8");
      const name = /defineComponent(?:<[^>]*>)?\(\{\s*name:\s*"([a-z-]+)"/.exec(text)?.[1];
      // Literal names: `emit("change"` and `ok:<runtime>:<event>` dispatched by hand.
      if (name)
        for (const [, event] of text.matchAll(/\bemit\(\s*"([a-z]+)"/g))
          if (!events.get(name)?.has(event as string)) missing.push(`ok:${name}:${event}`);
      for (const [, runtime, event] of text.matchAll(/"ok:([a-z-]+):([a-z]+)"/g))
        if (events.has(runtime as string) && !events.get(runtime as string)?.has(event as string))
          missing.push(`ok:${runtime}:${event}`);
    }
    expect(missing).toEqual([]);
  });

  it("has an entry with props for every React component", () => {
    const missing: string[] = [];
    for (const component of components) {
      const names = new Set(
        entriesOf(component).flatMap((entry) => (entry.react ? [entry.name] : [])),
      );
      // PascalCase value exports are components (hooks, helpers and CONSTANTS are not).
      for (const name of component.react)
        if (/^[A-Z][a-z]/.test(name) && !names.has(name))
          missing.push(`${component.name}: ${name}`);
    }
    expect(missing).toEqual([]);
  });

  it("describes every prop, part, event and method", () => {
    const empty: string[] = [];
    for (const component of components)
      for (const entry of entriesOf(component)) {
        for (const prop of entry.react?.props ?? [])
          if (!prop.description) empty.push(`${entry.name}.${prop.name}`);
        for (const part of entry.html?.parts ?? []) if (!part.description) empty.push(part.name);
        for (const event of entry.html?.events ?? [])
          if (!event.description) empty.push(event.name);
        for (const method of entry.html?.methods ?? [])
          if (!method.description) empty.push(`${entry.name}#${method.name}`);
      }
    expect(empty).toEqual([]);
  });
});
