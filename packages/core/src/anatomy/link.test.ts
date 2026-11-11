import { describe, expect, it } from "vitest";
import {
  linkAttributes,
  linkColors,
  linkOptions,
  linkRel,
  linkUnderlines,
  optionSchemas,
  typographyOptions,
  typographyVariantNames,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

describe("linkAttributes", () => {
  it("is registered and shares Typography's options", () => {
    expect(optionSchemas.link).toBe(linkOptions);
    expect(linkOptions.options.align).toBe(typographyOptions.options.align);
    expect(linkOptions.options.gutterBottom).toBe(typographyOptions.options.gutterBottom);
    expect(linkOptions.options.noWrap).toBe(typographyOptions.options.noWrap);
    expect(linkOptions.options.maxLines).toBe(typographyOptions.options.maxLines);
    expect(linkOptions.options.persistent).toBe(typographyOptions.options.persistent);
  });

  it("emits Typography's marker first, then MUI's defaults", () => {
    const attributes = linkAttributes();
    expect(attributes).toEqual({
      "data-ok-typography": "",
      "data-ok-link": "",
      "data-ok-variant": "inherit",
      "data-ok-color": "primary",
      "data-ok-underline": "always",
    });
    expect(Object.keys(attributes).slice(0, 2)).toEqual(["data-ok-typography", "data-ok-link"]);
  });

  it.each(typographyVariantNames)("variant %s", (variant) => {
    expect(linkAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(linkColors)("color %s", (color) => {
    expect(linkAttributes({ color })["data-ok-color"]).toBe(color);
  });

  it.each(linkUnderlines)("underline %s", (underline) => {
    expect(linkAttributes({ underline })["data-ok-underline"]).toBe(underline);
  });

  it("Typography's align and flags", () => {
    expect(linkAttributes({ align: "center", gutterBottom: true, noWrap: true })).toMatchObject({
      "data-ok-align": "center",
      "data-ok-gutter-bottom": "",
      "data-ok-no-wrap": "",
    });
    expect(linkAttributes({ maxLines: 3, persistent: true })).toMatchObject({
      "data-ok-max-lines": "3",
      "data-ok-persistent": "",
    });
  });

  it("refuses invalid values", () => {
    expect(
      linkAttributes({
        variant: HOSTILE,
        color: HOSTILE,
        align: HOSTILE,
        underline: HOSTILE,
        gutterBottom: HOSTILE,
        noWrap: HOSTILE,
        maxLines: HOSTILE,
      }),
    ).toEqual(linkAttributes());
  });
});

describe("linkRel", () => {
  it("passes rel through untouched without target _blank", () => {
    expect(linkRel(undefined, undefined)).toBeUndefined();
    expect(linkRel("_self", "author")).toBe("author");
    expect(linkRel("frame", 42)).toBeUndefined();
  });

  it("adds noopener noreferrer to target _blank, keeping the consumer's tokens once", () => {
    expect(linkRel("_blank", undefined)).toBe("noopener noreferrer");
    expect(linkRel("_blank", "")).toBe("noopener noreferrer");
    expect(linkRel("_blank", "external  nofollow")).toBe("external nofollow noopener noreferrer");
    expect(linkRel("_blank", "NoReferrer external")).toBe("NoReferrer external noopener");
    expect(linkRel("_blank", "noopener noreferrer")).toBe("noopener noreferrer");
    expect(linkRel("_blank", HOSTILE)).toBe(`${HOSTILE} noopener noreferrer`);
  });
});
