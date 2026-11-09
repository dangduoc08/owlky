import { describe, expect, it } from "vitest";
import {
  illustrationAttributes,
  illustrationColors,
  illustrationOptions,
} from "../anatomy/anatomy.js";
import {
  type IllustrationNode,
  illustrationAria,
  illustrationChildren,
  illustrationNodeAttributes,
  illustrationStyle,
  illustrationTones,
  isIllustrationTag,
} from "./illustration.js";

const HOSTILE = '"><script>alert(1)</script>';

describe("illustrationNodeAttributes", () => {
  it("writes the geometry, then the tone, then the outline", () => {
    const node: IllustrationNode = {
      tag: "path",
      tone: "main",
      stroke: 6,
      attrs: { d: "M0 0h10", opacity: 0.5 },
    };
    expect(illustrationNodeAttributes(node)).toEqual({
      d: "M0 0h10",
      opacity: "0.5",
      "data-ok-tone": "main",
      "data-ok-stroke": "",
      "stroke-width": "6",
    });
  });

  it("keeps every allowed tone", () => {
    for (const tone of illustrationTones)
      expect(illustrationNodeAttributes({ tag: "circle", tone })["data-ok-tone"]).toBe(tone);
  });

  it("drops unknown attributes, tones, unsafe values and invalid outlines", () => {
    const node = {
      tag: "rect",
      tone: "url(#x)",
      stroke: Number.NaN,
      attrs: {
        x: 1,
        href: "javascript:alert(1)",
        onload: "alert(1)",
        style: "fill:red",
        transform: "url(#evil)",
        d: HOSTILE,
        y: "2",
      },
    } as unknown as IllustrationNode;
    expect(illustrationNodeAttributes(node)).toEqual({ x: "1", y: "2" });
    expect(illustrationNodeAttributes({ tag: "path", tone: "main", stroke: -2 })).toEqual({
      "data-ok-tone": "main",
    });
    expect(illustrationNodeAttributes({ tag: "path", tone: "main", stroke: 0 })).not.toHaveProperty(
      "data-ok-stroke",
    );
  });

  it("never writes a tone or an outline on groups", () => {
    const group = { tag: "g", tone: "main", stroke: 2, attrs: { transform: "rotate(10 5 5)" } };
    expect(illustrationNodeAttributes(group as IllustrationNode)).toEqual({
      transform: "rotate(10 5 5)",
    });
  });
});

describe("illustration helpers", () => {
  it("skips elements outside the allowlist", () => {
    const nodes = [
      { tag: "path", tone: "main" },
      { tag: "script" },
      { tag: "foreignObject" },
      { tag: "use" },
      { tag: "image" },
    ] as unknown as IllustrationNode[];
    expect(illustrationChildren(nodes).map((node) => node.tag)).toEqual(["path"]);
    expect(illustrationChildren(undefined)).toEqual([]);
    expect(isIllustrationTag("g")).toBe(true);
    expect(isIllustrationTag("text")).toBe(false);
  });

  it("turns a valid size into a private width; invalid sizes write nothing", () => {
    expect(illustrationStyle(240)).toEqual({ "--_ok-illustration-size": "240px" });
    expect(illustrationStyle("20rem")).toEqual({ "--_ok-illustration-size": "20rem" });
    expect(illustrationStyle(" 120 ")).toEqual({ "--_ok-illustration-size": "120px" });
    for (const invalid of [undefined, null, -1, "calc(1px)", HOSTILE, "1e999", Number.NaN])
      expect(illustrationStyle(invalid)).toEqual({});
  });

  it("is decorative unless named", () => {
    expect(illustrationAria(false)).toEqual({ "aria-hidden": "true" });
    expect(illustrationAria(true)).toEqual({ role: "img" });
    expect(illustrationAria(false, "Page not found")).toEqual({
      role: "img",
      "aria-label": "Page not found",
    });
  });

  it("writes the name, the color (primary by default) and a valid size", () => {
    expect(illustrationAttributes("error-404")).toEqual({
      "data-ok-illustration": "error-404",
      "data-ok-color": "primary",
    });
    expect(illustrationAttributes("upload", { color: "error", size: 200 })).toEqual({
      "data-ok-illustration": "upload",
      "data-ok-color": "error",
      "data-ok-size": "200",
    });
    expect(
      illustrationAttributes("upload", { color: HOSTILE as never, size: HOSTILE as never }),
    ).toEqual({ "data-ok-illustration": "upload", "data-ok-color": "primary" });
    expect(illustrationColors).toEqual(illustrationOptions.options.color.values);
  });
});
