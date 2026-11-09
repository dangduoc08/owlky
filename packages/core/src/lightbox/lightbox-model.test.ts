import { describe, expect, it } from "vitest";
import { lightboxAttributes, lightboxOptions } from "../anatomy/anatomy.js";
import {
  carouselDurationFor,
  clamp,
  clampPan,
  defaultLightboxLabels,
  doubleClickZoom,
  fileName,
  formatLabel,
  imageMaxZoom,
  lightboxLabels,
  lightboxStyle,
  normalizeRotation,
  panLimit,
  parseLength,
  safeUrl,
  wheelZoomFactor,
  zoomAround,
} from "./lightbox-model.js";

describe("lightboxAttributes", () => {
  it("writes the style defaults and nothing else", () => {
    expect(lightboxAttributes()).toEqual({
      "data-ok-lightbox": "",
      "data-ok-image-fit": "contain",
      "data-ok-description-text-align": "start",
      "data-ok-thumbnails-position": "bottom",
      "data-ok-thumbnails-image-fit": "contain",
    });
  });

  it("writes every option value, behaviors only when off, and drops invalid values", () => {
    const attributes = lightboxAttributes({
      imageFit: "cover",
      finite: true,
      disableZoom: true,
      download: true,
      rotate: true,
      rotateButtons: "clockwise",
      thumbnailsPosition: "end",
      thumbnailsWidth: 96,
      thumbnailsVignette: false,
      closeOnEscape: false,
      padding: "5%",
      spacing: 24,
      slideshowDelay: -1,
      inline: true,
    });
    expect(attributes).toMatchObject({
      "data-ok-image-fit": "cover",
      "data-ok-finite": "",
      "data-ok-disable-zoom": "",
      "data-ok-download": "",
      "data-ok-rotate": "",
      "data-ok-rotate-buttons": "clockwise",
      "data-ok-thumbnails-position": "end",
      "data-ok-thumbnails-width": "96",
      "data-ok-thumbnails-vignette": "false",
      "data-ok-close-on-escape": "false",
      "data-ok-padding": "5%",
      "data-ok-spacing": "24",
      "data-ok-inline": "",
    });
    expect(attributes).not.toHaveProperty("data-ok-slideshow-delay");
    expect(
      lightboxAttributes({
        imageFit: "fill" as never,
        thumbnailsVignette: true,
        closeOnEscape: true,
      }),
    ).toEqual(lightboxAttributes());
    // `rotateButtons` only with `rotate`.
    expect(lightboxAttributes({ rotateButtons: "both" })).not.toHaveProperty(
      "data-ok-rotate-buttons",
    );
  });

  it("documents every option", () => {
    for (const spec of Object.values(lightboxOptions.options))
      expect(spec.description).not.toBe("");
  });
});

describe("labels", () => {
  it("merges strings over the defaults and ignores anything else", () => {
    const labels = lightboxLabels({ Close: "Fermer", Next: 3 as never, unknown: "x" } as never);
    expect(labels.Close).toBe("Fermer");
    expect(labels.Next).toBe("Next");
    expect(labels).not.toHaveProperty("unknown");
    expect(lightboxLabels()).toEqual(defaultLightboxLabels);
    expect(lightboxLabels(undefined)).toEqual(defaultLightboxLabels);
  });

  it("fills placeholders and keeps unknown ones", () => {
    expect(formatLabel("{index} of {total}", { index: 2, total: 5 })).toBe("2 of 5");
    expect(formatLabel("{index} {missing}", { index: 1 })).toBe("1 {missing}");
  });
});

describe("zoom math", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it("computes the largest image zoom", () => {
    expect(imageMaxZoom(2400, 600, 1)).toBe(4);
    expect(imageMaxZoom(2400, 600, 1, 2)).toBe(2);
    expect(imageMaxZoom(2400, 600, 0.5, 0.5)).toBe(2);
    expect(imageMaxZoom(300, 600, 1)).toBe(1);
    expect(imageMaxZoom(0, 600, 1)).toBe(1);
    expect(imageMaxZoom(2400, 0, 1)).toBe(1);
    expect(imageMaxZoom(2400, 600, 0)).toBe(1);
  });

  it("limits panning to the overflow", () => {
    expect(panLimit(400, 2, 400)).toBe(200);
    expect(panLimit(400, 1, 500)).toBe(0);
    const frame = { width: 400, height: 200 };
    const content = { width: 400, height: 200 };
    expect(clampPan({ zoom: 2, x: 500, y: -500 }, content, frame)).toEqual({
      zoom: 2,
      x: 200,
      y: -100,
    });
    expect(clampPan({ zoom: 1, x: 5, y: 5 }, content, frame)).toEqual({ zoom: 1, x: 0, y: 0 });
  });

  it("zooms around a point", () => {
    const frame = { width: 400, height: 200 };
    const content = { width: 400, height: 200 };
    expect(zoomAround({ zoom: 1, x: 0, y: 0 }, 2, { x: 100, y: 50 }, content, frame)).toEqual({
      zoom: 2,
      x: -100,
      y: -50,
    });
    // Zooming from a zero zoom keeps the offsets.
    expect(zoomAround({ zoom: 0, x: 10, y: 0 }, 2, { x: 0, y: 0 }, content, frame).x).toBe(10);
  });

  it("steps double clicks and goes back to 1", () => {
    expect(doubleClickZoom(1, 2, 2, 8)).toBe(2);
    expect(doubleClickZoom(2, 2, 2, 8)).toBe(4);
    expect(doubleClickZoom(4, 2, 2, 8)).toBe(1);
    expect(doubleClickZoom(1, 2, 2, 3)).toBe(2);
    expect(doubleClickZoom(2, 2, 2, 3)).toBe(3);
    expect(doubleClickZoom(1, 2, 0, 8)).toBe(1);
    expect(doubleClickZoom(1, 1, 1, 8)).toBeCloseTo(1.01);
  });

  it("turns wheel deltas into factors", () => {
    expect(wheelZoomFactor(-100, 100)).toBe(1.25);
    expect(wheelZoomFactor(100, 100)).toBe(0.75);
    expect(wheelZoomFactor(-10_000, 100)).toBe(2);
    expect(wheelZoomFactor(10_000, 0)).toBe(0.5);
  });
});

describe("rotation", () => {
  it("rounds to quarter turns", () => {
    expect(normalizeRotation(90)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation("180")).toBe(180);
    expect(normalizeRotation(44)).toBe(0);
    expect(normalizeRotation(Number.NaN)).toBe(0);
    expect(normalizeRotation("x")).toBe(0);
    expect(normalizeRotation(null)).toBe(0);
  });
});

describe("URLs", () => {
  const base = "https://example.com/gallery/";

  it("accepts http(s), blob and image or video data URLs", () => {
    expect(safeUrl("photo.jpg", base)?.href).toBe("https://example.com/gallery/photo.jpg");
    expect(safeUrl(" https://cdn.example.com/a.png ", base)?.host).toBe("cdn.example.com");
    expect(safeUrl("blob:https://example.com/123", base)?.protocol).toBe("blob:");
    expect(safeUrl("data:image/png;base64,AAAA", base)?.protocol).toBe("data:");
  });

  it("rejects script, file and other URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
      "",
      "   ",
      null,
      undefined,
      "http://[invalid",
    ])
      expect(safeUrl(url, base)).toBeNull();
  });

  it("names files after the last path segment", () => {
    expect(fileName(new URL("https://example.com/a/My%20photo.jpg"))).toBe("My photo.jpg");
    expect(fileName(new URL("https://example.com/"))).toBe("download");
    expect(fileName(new URL("https://example.com/a/%E0%A4%A"))).toBe("%E0%A4%A");
    expect(fileName(new URL("data:image/png;base64,AAAA"))).toBe("download");
    expect(fileName(new URL("blob:https://example.com/1"))).toBe("download");
  });
});

describe("sizes", () => {
  it("parses lengths", () => {
    expect(parseLength(16)).toBe("16px");
    expect(parseLength("16")).toBe("16px");
    expect(parseLength("16px")).toBe("16px");
    expect(parseLength("10%")).toBe("10%");
    expect(parseLength("10%", "cqw")).toBe("10cqw");
    for (const bad of [-1, Number.NaN, "1rem", "calc(1px)", "x".repeat(20), null])
      expect(parseLength(bad)).toBeNull();
  });

  it("writes private custom properties for valid values only", () => {
    expect(
      lightboxStyle({
        padding: "5%",
        spacing: "30%",
        thumbnailsWidth: 96,
        thumbnailsHeight: "64",
        thumbnailsBorder: 0,
        thumbnailsBorderRadius: 4,
        thumbnailsPadding: 2,
        thumbnailsGap: 8,
        descriptionMaxLines: 2.7,
        animationFade: 100,
        animationZoom: 0,
      }),
    ).toEqual({
      "--_ok-lightbox-padding": "5%",
      "--_ok-lightbox-spacing": "30cqw",
      "--_ok-lightbox-thumb-width": "96px",
      "--_ok-lightbox-thumb-height": "64px",
      "--_ok-lightbox-thumb-border": "0px",
      "--_ok-lightbox-thumb-radius": "4px",
      "--_ok-lightbox-thumb-padding": "2px",
      "--_ok-lightbox-thumb-gap": "8px",
      "--_ok-lightbox-lines": "2",
      "--_ok-lightbox-fade": "100ms",
      "--_ok-lightbox-zoom-duration": "0ms",
    });
    expect(
      lightboxStyle({
        padding: "x",
        thumbnailsWidth: -1,
        descriptionMaxLines: 0,
        animationFade: "",
      }),
    ).toEqual({});
  });

  it("converts swipe durations to carousel units", () => {
    expect(carouselDurationFor(500)).toBe(25);
    expect(carouselDurationFor(0)).toBe(0);
    expect(carouselDurationFor(-20)).toBe(0);
  });
});
