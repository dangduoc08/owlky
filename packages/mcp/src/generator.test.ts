import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Manifest } from "./manifest.js";

/*
 * scripts/manifest.mjs (ADR-0046): runs the generator twice against the built packages and checks
 * that the output is deterministic and complete. Needs `pnpm build` first.
 */

const root = resolve(import.meta.dirname, "../../..");
const dir = mkdtempSync(join(tmpdir(), "owlky-mcp-generator-"));
const generate = (file: string) => {
  execFileSync(process.execPath, ["scripts/manifest.mjs", "--out", file], {
    cwd: root,
    stdio: "pipe",
  });
  return readFileSync(file, "utf8");
};

type Schemas = Record<string, { root: string; options: Record<string, { attr: string }> }>;

let first = "";
let second = "";
let manifest: Manifest;
let optionSchemas: Schemas;
// Generating twice and importing the core bundle are slow on loaded machines (CI runners): both
// happen here, under one long hook timeout, so no test body waits on them.
beforeAll(async () => {
  first = generate(join(dir, "a.json"));
  second = generate(join(dir, "b.json"));
  manifest = JSON.parse(first) as Manifest;
  const core = (await import(pathToFileURL(join(root, "packages/core/dist/index.js")).href)) as {
    optionSchemas: Schemas;
  };
  optionSchemas = core.optionSchemas;
}, 120_000);
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("manifest generator", () => {
  it("is deterministic, with sorted keys", () => {
    expect(second).toBe(first);
    const check = (value: unknown, path: string) => {
      if (Array.isArray(value)) {
        for (const [i, item] of value.entries()) check(item, `${path}[${i}]`);
      } else if (value && typeof value === "object") {
        const keys = Object.keys(value);
        expect(keys, path).toEqual([...keys].sort());
        for (const key of keys) check((value as Record<string, unknown>)[key], `${path}.${key}`);
      }
    };
    check(manifest, "manifest");
  });

  it("carries the library version", () => {
    const { version } = JSON.parse(readFileSync(join(root, "packages/core/package.json"), "utf8"));
    expect(manifest.version).toBe(version);
  });

  it("has every option schema, option by option", () => {
    const found = new Map(
      manifest.components.flatMap((c) => c.schemas.map((schema) => [schema.name, schema])),
    );
    expect([...found.keys()].sort()).toEqual(Object.keys(optionSchemas).sort());
    for (const [name, schema] of Object.entries(optionSchemas)) {
      const entry = found.get(name);
      expect(entry?.root).toBe(schema.root);
      expect(entry?.options.map((o) => [o.name, o.attr])).toEqual(
        Object.entries(schema.options).map(([key, option]) => [key, option.attr]),
      );
    }
  });

  it("has every spec and every HTML snippet", () => {
    const specs = readdirSync(join(root, "specs/components"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
    expect(manifest.components.map((c) => c.name)).toEqual(specs.sort());
    const components = join(root, "packages/html/src/components");
    let count = 0;
    for (const folder of readdirSync(components)) {
      let files: string[];
      try {
        files = readdirSync(join(components, folder, "examples"));
      } catch {
        continue;
      }
      const component = manifest.components.find((c) => c.name === folder);
      for (const file of files.filter((name) => name.endsWith(".html"))) {
        count++;
        const markup = readFileSync(join(components, folder, "examples", file), "utf8");
        const shown = component?.stories.filter((story) => story.snippets.includes(file)) ?? [];
        if (shown.length === 0) expect(component?.snippets[file], `${folder}/${file}`).toBe(markup);
        for (const story of shown) expect(story.html).toContain(markup.trim());
      }
    }
    expect(count).toBeGreaterThan(500);
  });

  it("has the HTML and React code of every component story", () => {
    const stories = manifest.components.flatMap((c) => c.stories);
    expect(stories.length).toBeGreaterThan(300);
    for (const story of stories) {
      expect(story.react, story.id).toMatch(/@owlky\//);
      expect(story.html, story.id).toContain("@owlky/");
    }
    const storyRoot = join(root, "apps/storybook/src/components");
    const folders = readdirSync(storyRoot).filter((folder) =>
      readdirSync(join(storyRoot, folder)).includes(`${folder}.stories.tsx`),
    );
    expect(folders.length).toBeGreaterThan(50);
    for (const folder of folders) {
      const component = manifest.components.find((c) => c.name === folder);
      expect(component?.stories.length, folder).toBeGreaterThan(0);
    }
    expect(new Set(stories.map((s) => s.id)).size).toBe(stories.length);
  });

  it("has every guide that a docs page exports", () => {
    // Guides migrated to the website's docs content (ADR-0040) count too.
    const pages = ["apps/storybook/src", "apps/docs-content/src"].flatMap((dir) =>
      (readdirSync(join(root, dir), { recursive: true }) as string[]).filter((file) =>
        /export const \w+Sections: GuideSection\[\]/.test(
          /\.tsx?$/.test(file) ? readFileSync(join(root, dir, file), "utf8") : "",
        ),
      ),
    );
    expect(manifest.guides).toHaveLength(pages.length);
    for (const guide of manifest.guides) expect(guide.sections.length, guide.id).toBeGreaterThan(0);
    expect(manifest.guides.map((g) => g.id)).toContain("introduction");
  });

  it("names entries that exist and only current attributes", () => {
    const exportsOf = (pkg: string) =>
      (
        JSON.parse(readFileSync(join(root, `packages/${pkg}/package.json`), "utf8")) as {
          exports: Record<string, unknown>;
        }
      ).exports;
    const entries = { react: exportsOf("react"), html: exportsOf("html"), core: exportsOf("core") };
    const styles = exportsOf("styles");
    expect(styles["./components/*"]).toBeDefined();
    for (const component of manifest.components) {
      const imports = component.imports ?? {};
      expect(imports.react ?? imports.css, component.name).toBeDefined();
      for (const pkg of ["react", "html", "core"] as const) {
        const path = imports[pkg];
        if (path) expect(entries[pkg], path).toHaveProperty([`./${path.split("/")[2]}`]);
      }
      for (const css of imports.css ?? [])
        expect(readdirSync(join(root, "packages/styles/dist/components"))).toContain(
          css.replace("@owlky/styles/components/", ""),
        );
    }
    // Removed by the design styles: presets and font presets.
    const text = first;
    expect(text).not.toMatch(/data-ok-preset|data-ok-font\b(?!-)/);
    expect(manifest.attributes).toEqual(
      expect.arrayContaining(["data-ok-style", "data-ok-density", "data-ok-surface"]),
    );
    expect(manifest.guides.map((g) => g.id)).toContain("foundations-styles");
  });

  it("keeps decision-record references and implementation notes out of the descriptions", () => {
    for (const component of manifest.components) {
      expect(component.summary, component.name).not.toMatch(/ADR-\d|\bcore\b|runtime|specs\//);
      for (const section of component.sections)
        expect(section.body, `${component.name}#${section.id}`).not.toMatch(/ADR-\d/);
      for (const schema of component.schemas)
        for (const option of schema.options)
          expect(option.description, `${schema.name}.${option.name}`).not.toMatch(
            /ADR-\d|snippet|--_ok-/,
          );
    }
  });

  it("has every token and the Tailwind theme", () => {
    const tokens = JSON.parse(
      readFileSync(join(root, "packages/tokens/dist/tokens.json"), "utf8"),
    ) as { cssVariables: Record<string, Record<string, string>> };
    const names = new Set(
      Object.values(tokens.cssVariables)
        .flatMap((vars) => Object.keys(vars))
        .filter((name) => name.startsWith("--ok-")),
    );
    expect(manifest.tokens.variables.map((t) => t.name)).toEqual([...names].sort());
    expect(manifest.tokens.tailwind.map((u) => u.name)).toContain("--color-primary");
    expect(manifest.attributes).toContain("data-ok-theme");
  });
});
