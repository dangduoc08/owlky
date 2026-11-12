import { afterEach, describe, expect, it, vi } from "vitest";
import { loadShim } from "./shim.js";

const SLOT = Symbol.for("owlky.runtime");
type Scope = { [SLOT]?: unknown };
const scope = globalThis as Scope;
const saved = Object.getOwnPropertyDescriptor(globalThis, SLOT);

afterEach(() => {
  if (saved) Object.defineProperty(globalThis, SLOT, saved);
  else delete scope[SLOT];
  vi.restoreAllMocks();
});

describe("opt-in script shims (ADR-0068)", () => {
  it("ask the page's runtime to load their module", () => {
    const load = vi.fn(() => Promise.resolve());
    Object.defineProperty(globalThis, SLOT, {
      value: { protocol: 1, version: "x", runtime: { load } },
      configurable: true,
    });
    loadShim("map", "owlky-map.js");
    expect(load).toHaveBeenCalledWith("map");
  });

  it("report a page without owlky.js", () => {
    Object.defineProperty(globalThis, SLOT, { value: undefined, configurable: true });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    loadShim("editor", "owlky-editor.js");
    expect(error).toHaveBeenCalledWith("[owlky] owlky-editor.js needs owlky.js on the page.");
  });
});
