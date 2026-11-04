import { describe, expect, it } from "vitest";
import {
  type ColorScheme,
  contrastRatio,
  createTheme,
  defaultTheme,
  getContrastText,
  hexToRgb,
  paletteColorNames,
  type RgbChannels,
  themeToCss,
  themeToCssVariables,
} from "./index.js";

type Rgb = RgbChannels;
const hex = hexToRgb;
const contrast = contrastRatio;
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

  it("declares each scheme once and every shadow once", () => {
    const count = (needle: string) => css.split(needle).length - 1;
    expect(count("--mt-text-primary:")).toBe(3); // light, dark, system
    expect(count("--mt-elevation-24:")).toBe(1);
    expect(count("--mt-shadow-card:")).toBe(1);
    expect(css).toContain(':where(:root), [data-mt-theme="light"] {');
    expect(css).toContain(":root, [data-mt-theme], .dark {");
    expect(css.indexOf('[data-mt-theme="dark"], .dark {')).toBeLessThan(
      css.indexOf(':where(:root), [data-mt-theme="light"] {'),
    );
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

describe("typography and elevation", () => {
  it("emits responsive font sizes as min-width overrides, smallest first", () => {
    const css = themeToCss(defaultTheme);
    expect(css).toMatch(
      /@media \(min-width: 600px\) \{\s+:root \{[^}]*--mt-typography-h1-font-size: 3\.25rem;/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1200px\) \{\s+:root \{[^}]*--mt-typography-h1-font-size: 4rem;/,
    );
    expect(css.indexOf("min-width: 600px")).toBeLessThan(css.indexOf("min-width: 900px"));
  });

  it("uses the display font for h1–h3 only", () => {
    const { root } = themeToCssVariables(defaultTheme);
    expect(root["--mt-typography-h1-font-family"]).toBe("var(--mt-font-family-secondary)");
    expect(root["--mt-typography-h3-font-family"]).toBe("var(--mt-font-family-secondary)");
    expect(root["--mt-typography-h4-font-family"]).toBe("var(--mt-font-family)");
  });

  it("defines 24 three-layer system elevations per scheme", () => {
    const { light, dark } = themeToCssVariables(defaultTheme);
    expect(defaultTheme.elevation).toHaveLength(24);
    expect(light["--mt-elevation-1"]).toBe(
      "0px 2px 1px -1px color-mix(in srgb, var(--mt-shadow-color) 20%, transparent), " +
        "0px 1px 1px 0px color-mix(in srgb, var(--mt-shadow-color) 14%, transparent), " +
        "0px 1px 3px 0px color-mix(in srgb, var(--mt-shadow-color) 12%, transparent)",
    );
    expect(dark["--mt-elevation-24"]).toBeDefined();
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

  it("ignores prototype keys in overrides (no prototype pollution)", () => {
    const hostile = JSON.parse(
      '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":2}},"palette":{"__proto__":{"x":3},"primary":{"main":"#0055FF"}}}',
    );
    const theme = createTheme(hostile);
    expect(Object.getPrototypeOf(theme)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(theme.palette)).toBe(Object.prototype);
    expect((theme as unknown as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect((theme.palette as unknown as Record<string, unknown>)["x"]).toBeUndefined();
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(Object.hasOwn(theme, "constructor")).toBe(false);
    expect(theme.palette.primary.main).toBe("#0055FF");
  });

  it("replaces arrays instead of merging them", () => {
    const layer = { x: 0, y: 2, blur: 4, spread: 0, alpha: 10 };
    expect(createTheme({ shadows: { z1: [layer] } }).shadows.z1).toEqual([layer]);
  });
});

describe("color utilities", () => {
  it("parses #RGB and #RRGGBB", () => {
    expect(hexToRgb("#00A76F")).toEqual([0, 167, 111]);
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(() => hexToRgb("red")).toThrow(TypeError);
  });

  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("picks the more readable text color", () => {
    expect(getContrastText("#004B50")).toBe("#FFFFFF");
    expect(getContrastText("#C8FAD6")).toBe("#141A21");
    // White on the primary main is only 3.1:1, so dark text wins (AA).
    expect(getContrastText("#00A76F")).toBe("#141A21");
  });
});
