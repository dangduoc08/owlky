import { paletteColorNames, primaryPresetNames } from "@owlky/tokens";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import illustrationCss from "../../../styles/dist/components/illustration.css?raw";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import {
  type IllustrationNode,
  illustrationAttributeNames,
  illustrationNodeAttributes,
  illustrationTags,
  illustrationTones,
} from "../illustration/illustration.js";
import * as entry from "./index.js";
import { illustrations } from "./index.js";

const walk = (nodes: readonly IllustrationNode[], visit: (node: IllustrationNode) => void) => {
  for (const node of nodes) {
    visit(node);
    if (node.children) walk(node.children, visit);
  }
};

describe("illustration set", () => {
  it("exports every illustration once, and lists them all", () => {
    const exported = Object.entries(entry).filter(([name]) => name !== "illustrations");
    expect(exported).toHaveLength(illustrations.length);
    for (const [, value] of exported) expect(illustrations).toContain(value);
    expect(illustrations.length).toBeGreaterThanOrEqual(16);
  });

  it("has unique kebab-case names and consistent viewBoxes", () => {
    const names = illustrations.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
    for (const item of illustrations) {
      expect(item.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(item.viewBox).toMatch(/^0 0 \d+ \d+$/);
      // Scenes share one canvas so they line up on a page; shapes (avatar-shape) have their own.
      if (!item.name.endsWith("-shape")) expect(item.viewBox).toBe("0 0 480 360");
    }
  });

  it.each(illustrations.map((item) => [item.name, item] as const))(
    "%s: only allowed elements, attributes and tones",
    (_, item) => {
      let shapes = 0;
      walk(item.nodes, (node) => {
        expect(illustrationTags).toContain(node.tag);
        for (const name of Object.keys(node.attrs ?? {}))
          expect(illustrationAttributeNames).toContain(name);
        // Nothing is dropped when rendered: every value passes the safety filter.
        const written = illustrationNodeAttributes(node);
        for (const name of Object.keys(node.attrs ?? {})) expect(written).toHaveProperty(name);
        if (node.tag === "g") {
          expect(node.tone).toBeUndefined();
          expect(node.stroke).toBeUndefined();
          expect(node.children?.length).toBeGreaterThan(0);
        } else {
          shapes++;
          expect(illustrationTones).toContain(node.tone);
          expect(node.children).toBeUndefined();
          if (node.stroke !== undefined) expect(node.stroke).toBeGreaterThan(0);
        }
      });
      expect(shapes).toBeGreaterThan(0);
      // No references, scripts, foreign content, ids, inline styles or colors in the data.
      expect(JSON.stringify(item)).not.toMatch(
        /href|script|foreignObject|url\(|"id"|style|#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i,
      );
    },
  );
});

/* Every tone resolves to a defined token color, in every scheme, preset and `color`. */
const SVG = "http://www.w3.org/2000/svg";
let style: HTMLStyleElement;
let host: HTMLDivElement;
beforeAll(() => {
  style = document.createElement("style");
  style.textContent = `${tokensCss}\n${illustrationCss}`;
  document.head.append(style);
  host = document.createElement("div");
  document.body.append(host);
});
afterAll(() => {
  style.remove();
  host.remove();
});

/** A scope (theme, preset) holding an illustration with one shape per tone and a token probe. */
function scene(scope: Record<string, string>, color: string) {
  host.replaceChildren();
  const root = document.createElement("div");
  for (const [name, value] of Object.entries(scope)) root.setAttribute(name, value);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("data-ok-illustration", "test");
  svg.setAttribute("data-ok-color", color);
  const shapes = new Map<string, SVGElement>();
  for (const tone of illustrationTones) {
    const shape = document.createElementNS(SVG, "rect");
    shape.setAttribute("data-ok-tone", tone);
    svg.append(shape);
    shapes.set(tone, shape);
  }
  const outline = document.createElementNS(SVG, "path");
  outline.setAttribute("data-ok-tone", "main");
  outline.setAttribute("data-ok-stroke", "");
  svg.append(outline);
  const probe = document.createElement("span");
  root.append(svg, probe);
  host.append(root);
  /** The computed color of a token in this scope. */
  const token = (value: string) => {
    probe.style.color = value;
    return getComputedStyle(probe).color;
  };
  return { shapes, outline, token };
}

const fillOf = (element: Element) => getComputedStyle(element).fill;
const COLOR = /^(rgba?\(|color\()/;

describe("tones", () => {
  for (const theme of ["light", "dark"] as const)
    for (const preset of primaryPresetNames)
      it(`resolve to tokens (${theme}, preset ${preset})`, () => {
        for (const color of paletteColorNames) {
          const { shapes, outline, token } = scene(
            { "data-ok-theme": theme, "data-ok-preset": preset },
            color,
          );
          for (const [tone, shape] of shapes) expect(fillOf(shape), tone).toMatch(COLOR);
          for (const shade of ["lighter", "light", "main", "dark", "darker"])
            expect(fillOf(shapes.get(shade) as Element), `${color} ${shade}`).toBe(
              token(`var(--ok-palette-${color}-${shade})`),
            );
          expect(fillOf(shapes.get("paper") as Element)).toBe(token("var(--ok-bg-paper)"));
          expect(fillOf(shapes.get("neutral") as Element)).toBe(token("var(--ok-bg-neutral)"));
          expect(fillOf(shapes.get("accent-main") as Element)).toBe(
            token("var(--ok-palette-warning-main)"),
          );
          expect(fillOf(shapes.get("skin-deep") as Element)).toBe(
            token("var(--ok-illustration-skin-deep)"),
          );
          // Outlines paint the stroke only.
          expect(getComputedStyle(outline).fill).toBe("none");
          expect(getComputedStyle(outline).stroke).toBe(token(`var(--ok-palette-${color}-main)`));
        }
      });

  it("follows the preset of the nearest scope", () => {
    const cyan = scene({ "data-ok-preset": "cyan" }, "primary");
    const cyanMain = fillOf(cyan.shapes.get("main") as Element);
    const red = scene({ "data-ok-preset": "red" }, "primary");
    expect(fillOf(red.shapes.get("main") as Element)).not.toBe(cyanMain);
  });

  it("lifts ink on dark surfaces (when light-dark() is supported)", () => {
    const light = scene({ "data-ok-theme": "light" }, "primary");
    expect(fillOf(light.shapes.get("ink") as Element)).toBe(
      light.token("var(--ok-palette-grey-800)"),
    );
    const dark = scene({ "data-ok-theme": "dark" }, "primary");
    const expected = CSS.supports("color", "light-dark(#000, #fff)")
      ? "var(--ok-palette-grey-600)"
      : "var(--ok-palette-grey-800)";
    expect(fillOf(dark.shapes.get("ink") as Element)).toBe(dark.token(expected));
  });
});
