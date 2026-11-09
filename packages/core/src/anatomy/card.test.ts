import { describe, expect, it } from "vitest";
import {
  cardActionsAttributes,
  cardActionsOptions,
  cardAttributes,
  cardMediaElements,
  cardOptions,
  isCardMediaElement,
  optionSchemas,
  paperAttributes,
  paperElevations,
  paperOptions,
  paperVariants,
} from "./anatomy.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

describe("cardAttributes", () => {
  it("is registered, with Paper's options spread in", () => {
    expect(optionSchemas.card).toBe(cardOptions);
    expect(optionSchemas["card-actions"]).toBe(cardActionsOptions);
    for (const key of Object.keys(paperOptions.options))
      expect(cardOptions.options[key as keyof typeof cardOptions.options]).toBe(
        paperOptions.options[key as keyof typeof paperOptions.options],
      );
  });

  it("is a Paper root plus the card marker, Paper's marker first", () => {
    const attributes = cardAttributes();
    expect(attributes).toEqual({ ...paperAttributes(), "data-ok-card": "" });
    expect(Object.keys(attributes)[0]).toBe("data-ok-paper");
  });

  it.each(paperVariants)("variant %s", (variant) => {
    expect(cardAttributes({ variant })["data-ok-variant"]).toBe(variant);
  });

  it.each(paperElevations)("elevation %s (number and string)", (level) => {
    expect(cardAttributes({ elevation: Number(level) })["data-ok-elevation"]).toBe(level);
    expect(cardAttributes({ elevation: level })["data-ok-elevation"]).toBe(level);
  });

  it("square and raised flags; invalid values fall back to the defaults", () => {
    expect(cardAttributes({ square: true, raised: true })).toMatchObject({
      "data-ok-square": "",
      "data-ok-raised": "",
    });
    expect(
      cardAttributes({ variant: HOSTILE, elevation: HOSTILE, square: HOSTILE, raised: HOSTILE }),
    ).toEqual(cardAttributes());
    for (const elevation of [-1, 25, 1.5, Number.NaN])
      expect(cardAttributes({ elevation })["data-ok-elevation"]).toBe("1");
  });
});

describe("cardActionsAttributes", () => {
  it("marker, and disableSpacing only when on", () => {
    expect(cardActionsAttributes()).toEqual({ "data-ok-card-actions": "" });
    expect(cardActionsAttributes({ disableSpacing: true })).toEqual({
      "data-ok-card-actions": "",
      "data-ok-disable-spacing": "",
    });
    expect(cardActionsAttributes({ disableSpacing: HOSTILE })).toEqual(cardActionsAttributes());
  });
});

describe("isCardMediaElement", () => {
  it.each(cardMediaElements)("%s shows the media itself", (element) => {
    expect(isCardMediaElement(element)).toBe(true);
  });
  it("other elements, components and junk don't", () => {
    for (const element of ["div", "span", "IMG", "", null, undefined, () => null, {}, HOSTILE])
      expect(isCardMediaElement(element)).toBe(false);
  });
});
