import { describe, expect, it } from "vitest";
import {
  type ColorScheme,
  componentColorNames,
  contrastRatio,
  createTheme,
  defaultTheme,
  getContrastText,
  hexToRgb,
  paletteColorNames,
  type RgbChannels,
  skinToneNames,
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
  // Fills follow the reference look (ADR-0014): white text, dark text on warning only.
  it("contrastText matches the reference: white, except dark text on warning", () => {
    for (const name of paletteColorNames) {
      const expected = name === "warning" ? defaultTheme.grey[800] : defaultTheme.common.white;
      expect(defaultTheme.palette[name].contrastText).toBe(expected);
    }
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
    expect(css).toContain('[data-ok-theme="dark"], .dark {');
    expect(css).toContain('[data-ok-theme="light"] {');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s+\[data-ok-theme="system"\]/);
  });

  it("registers color bindings as non-inheriting", () => {
    expect(css).toContain('[data-ok-color="primary"] {');
    expect(css).toMatch(/@property --ok-c-main \{\s+syntax: "\*";\s+inherits: false;/);
  });

  it("declares each scheme once and every shadow once", () => {
    const count = (needle: string) => css.split(needle).length - 1;
    expect(count("--ok-text-primary:")).toBe(3); // light, dark, system
    expect(count("--ok-elevation-24:")).toBe(1);
    expect(count("--ok-shadow-card:")).toBe(1);
    expect(css).toContain(':where(:root), [data-ok-theme="light"] {');
    expect(css).toContain(":root, [data-ok-theme], .dark {");
    expect(css.indexOf('[data-ok-theme="dark"], .dark {')).toBeLessThan(
      css.indexOf(':where(:root), [data-ok-theme="light"] {'),
    );
  });

  it("can omit color bindings", () => {
    expect(themeToCss(defaultTheme, { colorBindings: false })).not.toContain("@property");
  });

  it("prefixes every variable with --ok- (public) or --_ok- (private plumbing)", () => {
    const { root, light, dark } = themeToCssVariables(defaultTheme);
    for (const key of Object.keys({ ...root, ...light, ...dark })) {
      expect(key).toMatch(/^--_?ok-[a-z0-9-]+$/);
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
      /@media \(min-width: 600px\) \{\s+:root \{[^}]*--ok-typography-h1-font-size: 3\.25rem;/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1200px\) \{\s+:root \{[^}]*--ok-typography-h1-font-size: 4rem;/,
    );
    expect(css.indexOf("min-width: 600px")).toBeLessThan(css.indexOf("min-width: 900px"));
  });

  it("uses the display font for h1–h3 only", () => {
    const { root } = themeToCssVariables(defaultTheme);
    expect(root["--ok-typography-h1-font-family"]).toBe("var(--ok-font-family-secondary)");
    expect(root["--ok-typography-h3-font-family"]).toBe("var(--ok-font-family-secondary)");
    expect(root["--ok-typography-h4-font-family"]).toBe("var(--ok-font-family)");
  });

  it("defines 24 three-layer system elevations per scheme", () => {
    const { light, dark } = themeToCssVariables(defaultTheme);
    expect(defaultTheme.elevation).toHaveLength(24);
    expect(light["--ok-elevation-1"]).toBe(
      "0px 2px 1px -1px color-mix(in srgb, var(--ok-shadow-color) 20%, transparent), " +
        "0px 1px 1px 0px color-mix(in srgb, var(--ok-shadow-color) 14%, transparent), " +
        "0px 1px 3px 0px color-mix(in srgb, var(--ok-shadow-color) 12%, transparent)",
    );
    expect(dark["--ok-elevation-24"]).toBeDefined();
  });
});

describe("button foundations", () => {
  it("exposes an RGB channel for every palette, grey and common color", () => {
    const { root } = themeToCssVariables(defaultTheme);
    expect(root["--ok-palette-primary-main-channel"]).toBe("0 167 111");
    expect(root["--ok-palette-error-dark-channel"]).toBe("183 29 24");
    expect(root["--ok-palette-grey-500-channel"]).toBe("145 158 171");
    expect(root["--ok-palette-common-black-channel"]).toBe("0 0 0");
    expect(root["--ok-palette-common-white-channel"]).toBe("255 255 255");
  });

  it("exposes the illustrations' skin tones (ADR-0040), customizable with createTheme", () => {
    const { root } = themeToCssVariables(defaultTheme);
    for (const name of skinToneNames)
      expect(root[`--ok-illustration-skin-${name}`]).toBe(defaultTheme.illustration.skin[name]);
    const custom = createTheme({ illustration: { skin: { deep: "#5A3825" } } });
    expect(custom.illustration.skin).toEqual({
      ...defaultTheme.illustration.skin,
      deep: "#5A3825",
    });
  });

  it("exposes a font-size scale", () => {
    const { root } = themeToCssVariables(defaultTheme);
    expect(root["--ok-font-size-sm"]).toBe("0.8125rem");
    expect(root["--ok-font-size-lg"]).toBe("0.9375rem");
  });

  it("binds every component color, including black and white, with a channel", () => {
    const css = themeToCss(defaultTheme);
    for (const name of componentColorNames) {
      expect(css).toContain(`[data-ok-color="${name}"] {`);
    }
    expect(css).toMatch(
      /\[data-ok-color="black"\] \{[^}]*--ok-c-channel: var\(--ok-palette-common-black-channel\);/,
    );
    expect(css).toMatch(/@property --ok-c-channel \{\s+syntax: "\*";\s+inherits: false;/);
  });

  it("black and white contained colors meet AA", () => {
    const { black, white } = defaultTheme.common;
    expect(contrastRatio(white, black)).toBeGreaterThanOrEqual(AA);
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
