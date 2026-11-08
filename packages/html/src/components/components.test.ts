import { describe, expect, it } from "vitest";
import pkg from "../../package.json" with { type: "json" };
import { VERSION } from "../runtime/version.js";
import { components } from "./index.js";

// Browser-mode test: files are discovered with Vite glob imports (no Node fs).
// Opt-in components: registered by their own entry (`@owlky/html/editor`), not by `components`.
const OPT_IN = ["editor"];
const definitions = import.meta.glob("./*/*.ts", { eager: false });
const snippets = import.meta.glob("./*/examples/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("component registry", () => {
  it("registers every component that has a behavior module", () => {
    const withBehavior = Object.keys(definitions)
      .filter((path) => /^\.\/([^/]+)\/\1\.ts$/.test(path))
      .map((path) => path.split("/")[1])
      .filter((name) => !OPT_IN.includes(name as string));
    expect(components.map((c) => c.name).sort()).toEqual(withBehavior.sort());
  });

  it("uses only data-ok-* hooks that match the component naming convention", () => {
    for (const [path, html] of Object.entries(snippets) as [string, string][]) {
      const attributes = [...html.matchAll(/\s(data-[a-z-]+)/g)].map((m) => m[1]);
      for (const attribute of attributes) {
        expect(attribute, `${path} uses ${attribute}`).toMatch(/^data-ok-[a-z-]+$/);
      }
    }
  });

  it("keeps the runtime VERSION in sync with package.json", () => {
    expect(VERSION).toBe(pkg.version);
  });
});
