import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkboxAttributes,
  checkboxOptions,
  radioAttributes,
  radioOptions,
} from "../anatomy/anatomy.js";
import { swatchChannels, swatchColor, swatchStyle } from "./swatch.js";

afterEach(() => vi.unstubAllGlobals());

describe("swatchColor", () => {
  it("accepts CSS colors and Owlky tokens", () => {
    for (const color of [
      "#FF9800",
      "#f90",
      "#ff980080",
      "rgb(0 150 136)",
      "rgba(0, 150, 136, 0.5)",
      "hsl(36 100% 50%)",
      "oklch(70% 0.2 50)",
      "teal",
      "var(--ok-palette-primary-main)",
    ])
      expect(swatchColor(color)).toBe(color);
    expect(swatchColor("  #FF9800 ")).toBe("#FF9800");
  });

  it("rejects anything that isn't a plain color", () => {
    for (const value of [
      "url(x)",
      "red;background:url(x)",
      "red}body{color:red",
      '"><img onerror>',
      "var(--x)",
      "var(--ok-a) red",
      "expression(alert(1))",
      "notacolor",
      "#12345",
      `#${"f".repeat(80)}`,
      "",
      42,
      null,
      undefined,
    ])
      expect(swatchColor(value)).toBeUndefined();
  });

  it("trusts the syntax where CSS can't check it (server rendering)", () => {
    vi.stubGlobal("CSS", undefined);
    expect(swatchColor("notacolor")).toBe("notacolor");
    expect(swatchColor("url(x)")).toBeUndefined();
  });
});

describe("swatchChannels", () => {
  it("reads #hex and rgb() colors", () => {
    expect(swatchChannels("#FF9800")).toEqual([255, 152, 0]);
    expect(swatchChannels("#f90")).toEqual([255, 153, 0]);
    expect(swatchChannels("#f90a")).toEqual([255, 153, 0]);
    expect(swatchChannels("#FF980080")).toEqual([255, 152, 0]);
    expect(swatchChannels("rgb(0 150 136)")).toEqual([0, 150, 136]);
    expect(swatchChannels("rgba(0, 150.4, 300, 0.5)")).toEqual([0, 150, 255]);
    expect(swatchChannels("teal")).toBeUndefined();
  });
});

describe("swatchStyle", () => {
  it("writes the color and the mark that contrasts more", () => {
    expect(swatchStyle("#FFEB3B")).toEqual({
      "--_ok-swatch": "#FFEB3B",
      "--_ok-swatch-mark": "var(--ok-palette-common-black)",
    });
    expect(swatchStyle("#3F51B5")).toEqual({
      "--_ok-swatch": "#3F51B5",
      "--_ok-swatch-mark": "var(--ok-palette-common-white)",
    });
    expect(swatchStyle("teal")["--_ok-swatch-mark"]).toBe("var(--ok-palette-common-white)");
    expect(swatchStyle("url(x)")).toEqual({});
  });
});

describe("swatch shape option", () => {
  it("is written only when valid", () => {
    expect(radioAttributes({ shape: "rounded" })["data-ok-shape"]).toBe("rounded");
    expect(radioAttributes({})["data-ok-shape"]).toBeUndefined();
    expect(checkboxAttributes({ shape: "circular" })["data-ok-shape"]).toBe("circular");
    expect(checkboxAttributes({ shape: "oval" as never })["data-ok-shape"]).toBeUndefined();
    expect(radioOptions.options.shape.default).toBe("circular");
    expect(checkboxOptions.options.shape.default).toBe("rounded");
  });
});
