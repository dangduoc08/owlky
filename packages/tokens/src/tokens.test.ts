import { describe, expect, it } from "vitest";
import {
  type ColorScheme,
  createTheme,
  defaultTheme,
  paletteColorNames,
  themeToCss,
  themeToCssVariables,
} from "./index.js";

// --- WCAG 2.2 relative luminance / contrast ---------------------------------------------------
type Rgb = [number, number, number];
const hex = (value: string): Rgb => {
  const m = /^#([0-9a-f]{6})$/i.exec(value);
  if (!m?.[1]) throw new Error(`Expected #RRGGBB, got ${value}`);
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** sRGB blend, matching `color-mix(in srgb, fg p%, transparent)` painted over `bg`. */
const over = (fg: Rgb, percent: number, bg: Rgb): Rgb =>
  fg.map((c, i) => Math.round((c * percent + (bg[i] ?? 0) * (100 - percent)) / 100)) as Rgb;

const AA = 4.5;
const schemes = Object.entries(defaultTheme.schemes) as [string, ColorScheme][];

describe("color contrast (WCAG 2.2 AA)", () => {
  it.each(paletteColorNames)("%s contrastText on main (contained)", (name) => {
    const { main, contrastText } = defaultTheme.palette[name];
    expect(contrast(hex(contrastText), hex(main))).toBeGreaterThanOrEqual(AA);
  });

  describe.each(schemes)("%s scheme", (_, scheme) => {
    const surfaces = [scheme.background.paper, scheme.background.default].map(hex);

    it.each(paletteColorNames)("%s text on surfaces (text/outlined)", (name) => {
      for (const surface of surfaces) {
        expect(contrast(hex(scheme.paletteText[name]), surface)).toBeGreaterThanOrEqual(AA);
      }
    });

    it.each(paletteColorNames)("%s text on 16%% tint (soft)", (name) => {
      const tint = over(hex(defaultTheme.palette[name].main), 16, hex(scheme.background.paper));
      expect(contrast(hex(scheme.paletteText[name]), tint)).toBeGreaterThanOrEqual(AA);
    });

    it("primary and secondary text on surfaces", () => {
      for (const surface of surfaces) {
        expect(contrast(hex(scheme.text.primary), surface)).toBeGreaterThanOrEqual(AA);
        expect(contrast(hex(scheme.text.secondary), surface)).toBeGreaterThanOrEqual(AA);
      }
    });

    it("inherit contrast on inherit main and hover", () => {
      expect(contrast(hex(scheme.inherit.contrast), hex(scheme.inherit.main))).toBeGreaterThan(AA);
      expect(contrast(hex(scheme.inherit.contrast), hex(scheme.inherit.hover))).toBeGreaterThan(AA);
    });
  });
});

describe("themeToCss", () => {
  const css = themeToCss(defaultTheme);

  it("declares the layer order before anything else", () => {
    expect(css.startsWith("@layer theme, base, components, utilities;")).toBe(true);
  });

  it("emits light, dark, system and nested-light scopes", () => {
    expect(css).toContain(":root {");
    expect(css).toContain('[data-mt-theme="dark"], .dark {');
    expect(css).toContain('[data-mt-theme="light"] {');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s+\[data-mt-theme="system"\]/);
  });

  it("registers color bindings as non-inheriting", () => {
    expect(css).toContain('[data-mt-color="primary"] {');
    expect(css).toMatch(/@property --mt-c-main \{\s+syntax: "\*";\s+inherits: false;/);
  });

  it("can omit color bindings", () => {
    expect(themeToCss(defaultTheme, { colorBindings: false })).not.toContain("@property");
  });

  it("prefixes every variable with --mt-", () => {
    const { root, light, dark } = themeToCssVariables(defaultTheme);
    for (const key of Object.keys({ ...root, ...light, ...dark })) {
      expect(key).toMatch(/^--mt-[a-z0-9-]+$/);
    }
  });

  it("declares the same keys for light and dark", () => {
    const { light, dark } = themeToCssVariables(defaultTheme);
    expect(Object.keys(dark)).toEqual(Object.keys(light));
  });
});

describe("createTheme", () => {
  it("deep-merges overrides without mutating the default theme", () => {
    const theme = createTheme({
      palette: { primary: { main: "#0055FF" } },
      radius: { md: "10px" },
    });
    expect(theme.palette.primary.main).toBe("#0055FF");
    expect(theme.palette.primary.dark).toBe(defaultTheme.palette.primary.dark);
    expect(theme.radius.md).toBe("10px");
    expect(defaultTheme.palette.primary.main).toBe("#00A76F");
  });

  it("replaces arrays instead of merging them", () => {
    const layer = { x: 0, y: 2, blur: 4, spread: 0, alpha: 10 };
    expect(createTheme({ shadows: { z1: [layer] } }).shadows.z1).toEqual([layer]);
  });
});
