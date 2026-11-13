import set from "@iconify-json/solar/icons.json" with { type: "json" };
import { describe, expect, it } from "vitest";
import iconCss from "../../../styles/dist/components/icon.css?raw";
import tokensCss from "../../../tokens/dist/tokens.css?raw";
import { createIcon, type IconData, iconAttributes, iconTree } from "./icon.js";
import * as solar from "./solar.js";

const icons = Object.values(solar) as IconData[];
const PRESENTATION = ["fill", "stroke", "stroke-linecap", "stroke-linejoin"];
const GEOMETRY = ["d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "transform"];
const RULES = ["fill-rule", "clip-rule"];

interface SolarSet {
  icons: Record<string, { body: string }>;
  aliases?: Record<string, { parent: string }>;
}

/** The set's drawing of `name` (aliases resolve to their parent) as SVG elements. */
function drawing(name: string): Element[] {
  const { icons: bodies, aliases } = set as SolarSet;
  const body = bodies[name]?.body ?? bodies[aliases?.[name]?.parent ?? ""]?.body;
  if (!body) throw new Error(`Solar has no ${name}`);
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
    "image/svg+xml",
  );
  return [...doc.documentElement.children];
}

/** Numbers rounded to 2 decimals, as `scripts/icons.mjs` writes them. */
const round = (value: string | null) =>
  value?.replace(/-?\d*\.\d+/g, (number) =>
    String(Number(Number(number).toFixed(2))).replace(/^(-?)0\./, "$1."),
  ) ?? null;

/** A shape's value of `name`: its own, else its group's (presentation attributes inherit). */
const value = (shape: Element, name: string) =>
  shape.getAttribute(name) ??
  (shape.parentElement?.localName === "g" ? shape.parentElement.getAttribute(name) : null);

describe("Solar icons (generated from @iconify-json/solar)", () => {
  it("exports the component icons, each named after its Solar drawing", () => {
    expect(icons.length).toBeGreaterThan(70);
    for (const icon of icons) expect(icon.name).toMatch(/^[a-z0-9-]+-(linear|bold)$/);
    expect(new Set(icons.map((icon) => icon.name)).size).toBe(icons.length);
  });

  it.each(icons.map((icon) => [icon.name, icon] as const))("%s matches the set", (name, icon) => {
    const top = drawing(name);
    const shapes = top[0]?.localName === "g" ? [...(top[0] as Element).children] : top;
    expect(icon.nodes.map(([tag]) => tag)).toEqual(shapes.map((shape) => shape.localName));
    icon.nodes.forEach(([, attrs], index) => {
      const shape = shapes[index] as Element;
      for (const attr of GEOMETRY)
        expect(attrs[attr] ?? null, `${name} ${attr}`).toBe(round(shape.getAttribute(attr)));
      for (const attr of RULES)
        expect(attrs[attr] ?? null, `${name} ${attr}`).toBe(shape.getAttribute(attr));
      // Presentation attributes: the svg's, unless the shape sets its own.
      for (const attr of PRESENTATION)
        expect(attrs[attr] ?? icon.attrs[attr] ?? null, `${name} ${attr}`).toBe(value(shape, attr));
      // The stroke width is a token (`--ok-icon-stroke`): never in the data.
      expect(attrs["stroke-width"]).toBeUndefined();
    });
    expect(icon.attrs["stroke-width"]).toBeUndefined();
  });
});

describe("icon markup", () => {
  it("is decorative and names its drawing", () => {
    expect(iconAttributes(solar.closeLinear)).toEqual({
      "data-ok-icon": "close-linear",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      focusable: "false",
      fill: "none",
      stroke: "currentColor",
      "stroke-linecap": "round",
    });
  });

  it("builds the same element with DOM methods and as a node tree", () => {
    const svg = createIcon(solar.altArrowDownLinear, { "data-ok-select-icon": "" });
    expect(svg.getAttributeNames()[0]).toBe("data-ok-select-icon");
    expect(svg.getAttribute("data-ok-icon")).toBe("alt-arrow-down-linear");
    expect(svg.querySelector("path")?.getAttribute("d")).toBe("M19 9L12 15L5 9");
    const tree = iconTree(solar.altArrowDownLinear, { width: "20" });
    expect(tree.tag).toBe("svg");
    expect(tree.attrs).toMatchObject({ width: "20", "data-ok-icon": "alt-arrow-down-linear" });
    expect(tree.children).toEqual([{ tag: "path", attrs: { d: "M19 9L12 15L5 9" } }]);
  });

  it("takes its stroke width from --ok-icon-stroke (icon.css)", () => {
    const style = document.createElement("style");
    style.textContent = `${tokensCss}\n${iconCss}`;
    document.head.append(style);
    const host = document.createElement("div");
    const svg = createIcon(solar.closeLinear);
    host.append(svg);
    document.body.append(host);
    expect(getComputedStyle(svg).strokeWidth).toBe("1.5px");
    host.style.setProperty("--ok-icon-stroke", "1.75");
    expect(getComputedStyle(svg).strokeWidth).toBe("1.75px");
    host.remove();
    style.remove();
  });
});
