import { describe, expect, it } from "vitest";
import {
  optionSchemas,
  typographyAligns,
  typographyAttributes,
  typographyColors,
  typographyElement,
  typographyOptions,
  typographyVariantMapping,
  typographyVariantNames,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

describe("typographyAttributes", () => {
  it("is registered", () => expect(optionSchemas.typography).toBe(typographyOptions));

  it("emits the default variant; color and align only when given", () => {
    expect(typographyAttributes()).toEqual({
      "data-ok-typography": "",
      "data-ok-variant": "body1",
    });
  });

  it.each(typographyVariantNames)("variant %s", (variant) => {
    expect(typographyAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(typographyColors)("color %s", (color) => {
    expect(typographyAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(typographyAligns)("align %s", (align) => {
    expect(typographyAttributes({ align })["data-ok-align"]).toBe(align);
  });

  it("flags and invalid values", () => {
    expect(typographyAttributes({ gutterBottom: true, noWrap: true })).toMatchObject({
      "data-ok-gutter-bottom": "",
      "data-ok-no-wrap": "",
    });
    expect(
      typographyAttributes({
        variant: HOSTILE,
        color: HOSTILE,
        align: HOSTILE,
        gutterBottom: HOSTILE,
        noWrap: HOSTILE,
      }),
    ).toEqual(typographyAttributes());
  });
});

describe("typographyElement", () => {
  it("maps every variant like MUI", () => {
    expect(typographyVariantNames.map((variant) => typographyElement(variant))).toEqual([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "h6",
      "h6",
      "p",
      "p",
      "span",
      "span",
      "span",
      "p",
    ]);
    expect(Object.keys(typographyVariantMapping)).toEqual([...typographyVariantNames]);
  });

  it("uses the mapping first and falls back to body1 for unknown variants", () => {
    expect(typographyElement("h1", { h1: "h2" })).toBe("h2");
    expect(typographyElement("body1", { h1: "h2" })).toBe("p");
    expect(typographyElement("caption", { caption: undefined })).toBe("span");
    expect(typographyElement(HOSTILE)).toBe("p");
    expect(typographyElement(HOSTILE, { body1: "div" })).toBe("div");
  });

  it("ignores inherited mapping keys (prototype pollution)", () => {
    const polluted = JSON.parse('{"__proto__":{"h1":"script"}}');
    expect(typographyElement("h1", polluted)).toBe("h1");
    expect(({} as Record<string, unknown>)["h1"]).toBeUndefined();
  });
});
