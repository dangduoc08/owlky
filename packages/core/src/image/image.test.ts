import { describe, expect, it } from "vitest";
import {
  imageAttributes,
  imageEffects,
  imageFits,
  imageLoadState,
  imageOptions,
  imageOverlays,
  imagePositions,
  imageRatio,
  imageRatios,
  imageStyle,
} from "../anatomy/anatomy.js";
import { isStyleValue } from "../options/define.js";

describe("imageAttributes", () => {
  it("writes the defaults and leaves optional options out", () => {
    expect(imageAttributes()).toEqual({
      "data-ok-image": "",
      "data-ok-fit": "cover",
      "data-ok-position": "center",
      "data-ok-effect": "blur",
    });
  });

  it("writes every valid value", () => {
    for (const ratio of imageRatios)
      expect(imageAttributes({ ratio })["data-ok-ratio"]).toBe(ratio);
    for (const fit of imageFits) expect(imageAttributes({ fit })["data-ok-fit"]).toBe(fit);
    for (const position of imagePositions)
      expect(imageAttributes({ position })["data-ok-position"]).toBe(position);
    for (const effect of imageEffects)
      expect(imageAttributes({ effect })["data-ok-effect"]).toBe(effect);
    for (const overlay of imageOverlays)
      expect(imageAttributes({ overlay })["data-ok-overlay"]).toBe(overlay);
    expect(
      imageAttributes({
        overlay: "info",
        overlayFrom: "secondary",
        disablePlaceholder: true,
        visibleByDefault: true,
      }),
    ).toEqual({
      "data-ok-image": "",
      "data-ok-fit": "cover",
      "data-ok-position": "center",
      "data-ok-effect": "blur",
      "data-ok-overlay": "info",
      "data-ok-overlay-from": "secondary",
      "data-ok-disable-placeholder": "",
      "data-ok-visible-by-default": "",
    });
  });

  it("drops overlayFrom without a color overlay", () => {
    expect(imageAttributes({ overlayFrom: "error" })["data-ok-overlay-from"]).toBeUndefined();
    expect(
      imageAttributes({ overlay: "dark", overlayFrom: "error" })["data-ok-overlay-from"],
    ).toBeUndefined();
  });

  it("falls back on invalid values (untrusted input never reaches the DOM)", () => {
    const bad = '"><img src=x onerror=alert(1)>' as never;
    expect(
      imageAttributes({ ratio: bad, fit: bad, position: bad, effect: bad, overlay: bad }),
    ).toEqual({
      "data-ok-image": "",
      "data-ok-fit": "cover",
      "data-ok-position": "center",
      "data-ok-effect": "blur",
    });
    expect(
      imageAttributes({ overlay: "primary", overlayFrom: "../x" as never }),
    ).not.toHaveProperty("data-ok-overlay-from");
  });
});

describe("imageLoadState", () => {
  it("reads loading, loaded and error from the image", () => {
    expect(imageLoadState({ complete: false, naturalWidth: 0 })).toBe("loading");
    expect(imageLoadState({ complete: true, naturalWidth: 20 })).toBe("loaded");
    expect(imageLoadState({ complete: true, naturalWidth: 0 })).toBe("error");
  });

  it("matches real images", async () => {
    const img = new Image();
    img.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'/%3E";
    await img.decode();
    expect(imageLoadState(img)).toBe("loaded");
    const broken = new Image();
    const failed = new Promise((resolve) => broken.addEventListener("error", resolve));
    broken.src = "data:image/png;base64,AAAA";
    await failed;
    expect(imageLoadState(broken)).toBe("error");
  });
});

describe("custom ratios", () => {
  it("accepts any positive width/height or number, without spaces", () => {
    expect(imageRatio("16/10")).toBe("16/10");
    expect(imageRatio(" 4 / 1 ")).toBe("4/1");
    expect(imageRatio("2.35/1")).toBe("2.35/1");
    expect(imageRatio(1.6)).toBe("1.6");
    expect(imageRatio(".5")).toBe(".5");
    for (const ratio of imageRatios) expect(imageRatio(ratio)).toBe(ratio);
  });

  it("refuses zero, negative, non-finite and hostile values", () => {
    for (const value of ["0/1", "1/0", "-1/2", "0", "", "auto", "1/2/3", "1e3", "calc(1)", "16:9"])
      expect(imageRatio(value)).toBeUndefined();
    for (const value of [
      0,
      -2,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      null,
      {},
      `${"1".repeat(40)}`,
    ])
      expect(imageRatio(value)).toBeUndefined();
    expect(imageRatio('1"><script>')).toBeUndefined();
  });

  it("writes a custom ratio as given and its private property", () => {
    expect(imageAttributes({ ratio: "16/10" })["data-ok-ratio"]).toBe("16/10");
    expect(imageAttributes({ ratio: 1.6 })["data-ok-ratio"]).toBe("1.6");
    expect(imageAttributes({ ratio: "0/1" })).not.toHaveProperty("data-ok-ratio");
    expect(imageStyle("16/10")).toEqual({ "--_ok-image-ratio": "16 / 10" });
    expect(imageStyle(2)).toEqual({ "--_ok-image-ratio": "2" });
  });

  it("needs no private property for a named ratio or none", () => {
    for (const ratio of imageRatios) expect(imageStyle(ratio)).toEqual({});
    expect(imageStyle(undefined)).toEqual({});
    expect(imageStyle("wide")).toEqual({});
  });

  it("validates custom values through the schema's pattern", () => {
    const { ratio } = imageOptions.options;
    expect(isStyleValue(ratio, "16/10")).toBe(true);
    expect(isStyleValue(ratio, "16/9")).toBe(true);
    expect(isStyleValue(ratio, "wide")).toBe(false);
    expect(isStyleValue(ratio, 2)).toBe(false);
  });
});
