import { describe, expect, it } from "vitest";
import {
  componentColorNames,
  contrastRatio,
  createTheme,
  defaultTheme,
  densityNames,
  getContrastText,
  hexToRgb,
  SCOPE_SELECTOR,
  skinToneNames,
  soft,
  themeToCss,
  themeToCssVariables,
} from "./index.js";

const css = themeToCss(defaultTheme);
const count = (needle: string) => css.split(needle).length - 1;

describe("themeToCss: scopes and switches (ADR-0070 § 3, ADR-0072)", () => {
  it("declares the layer order before anything else", () => {
    expect(css.startsWith("@layer theme, base, components, utilities;")).toBe(true);
  });

  it("puts Soft's literals on the root and on data-ok-style=soft, with no inputs", () => {
    expect(css).toContain(':where(:root), [data-ok-style="soft"] {');
    const scope = css.slice(css.indexOf(':where(:root), [data-ok-style="soft"]'));
    const block = scope.slice(0, scope.indexOf("  }"));
    expect(block).toContain("--ok-radius-control: 10px;");
    expect(block).not.toMatch(/--_ok-t[a-z0-9]+-(l|d|h|dh|s|ds):/);
  });

  it("emits a pair of space toggles per axis value", () => {
    expect(css).toMatch(
      /\[data-ok-theme="dark"\], \.dark \{\s+color-scheme: dark;\s+--_ok-dark: 1;\s+--_ok-d1: initial;\s+--_ok-d0: {2};/,
    );
    expect(css).toContain(':where(:root), [data-ok-theme="light"] {');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s+\[data-ok-theme="system"\]/);
    expect(css).toMatch(/\[data-ok-contrast="high"\] \{\s+--_ok-h1: initial;\s+--_ok-h0: {2};/);
    expect(css).toMatch(/@media \(prefers-contrast: more\) \{\s+\[data-ok-contrast="system"\]/);
    expect(css).toContain(":where(:root), [data-ok-contrast] {");
    expect(css).toContain(":where(:root), [data-ok-surface] {");
    expect(css).toMatch(/\[data-ok-surface="contrast"\] \{\s+--_ok-s1: initial;\s+--_ok-s0: {2};/);
    // Dark first, light after: an explicit light scope beats `.dark` on the same element.
    expect(css.indexOf('[data-ok-theme="dark"], .dark {')).toBeLessThan(
      css.indexOf(':where(:root), [data-ok-theme="light"] {'),
    );
  });

  it("density scopes declare the sizes themselves", () => {
    expect(css).toMatch(/\[data-ok-density="compact"\] \{[^}]*--ok-control-height-md: 2rem;/);
    expect(css).toMatch(
      /:where\(:root\), \[data-ok-density\] \{[^}]*--ok-control-height-md: 2\.25rem;/,
    );
    for (const name of densityNames) {
      expect(defaultTheme.density[name]).toMatch(/rem$/);
      expect(defaultTheme.densityCompact[name]).toMatch(/rem$/);
    }
  });

  it("resolves every axis token once, on every scope element", () => {
    expect(css).toContain(`${SCOPE_SELECTOR} {`);
    expect(count("--ok-text-primary:")).toBe(1);
    expect(count("--ok-elevation-24:")).toBe(1);
    expect(count("--ok-palette-primary-main:")).toBe(1);
    expect(css).toMatch(
      /--ok-text-primary: var\(--_ok-d1, var\(--_ok-h1, var\(--_ok-t[0-9a-z]+-dh, #FFFFFF\)\) var\(--_ok-h0, var\(--_ok-t[0-9a-z]+-d, #FAFAFA\)\)\) var\(--_ok-d0, var\(--_ok-h1, var\(--_ok-t[0-9a-z]+-h, #09090B\)\) var\(--_ok-h0, var\(--_ok-t[0-9a-z]+-l, #18181B\)\)\);/,
    );
    expect(css).toMatch(/--ok-bg-default: var\(--_ok-d1, var\(--_ok-s1, /);
  });

  it("registers color bindings as non-inheriting", () => {
    expect(css).toContain('[data-ok-color="primary"] {');
    expect(css).toMatch(/@property --ok-c-main \{\s+syntax: "\*";\s+inherits: false;/);
    expect(themeToCss(defaultTheme, { colorBindings: false })).not.toContain("@property");
  });

  it("writes a style scope with every input, and a reset for other styles nested inside", () => {
    const sheet = themeToCss(defaultTheme, {
      selector: '[data-ok-style="demo"]',
      reset: '[data-ok-style="demo"]',
    });
    expect(sheet).toContain('[data-ok-style="demo"] {');
    expect(sheet).toMatch(/--_ok-t[0-9a-z]+-l: #18181B;/);
    expect(sheet).toMatch(/--_ok-t[0-9a-z]+-dh: #FFFFFF;/);
    expect(sheet).toMatch(
      /:where\(\[data-ok-style\]:not\(\[data-ok-style="demo"\]\)\) \{\s+--_ok-t0-l: initial;/,
    );
    expect(sheet).not.toContain("--_ok-d1: initial");
    expect(sheet).not.toContain("@property");
  });

  it("prefixes every variable with --ok- (public) or --_ok- (private plumbing)", () => {
    const { root, light, dark } = themeToCssVariables(defaultTheme);
    for (const key of Object.keys({ ...root, ...light, ...dark })) {
      expect(key).toMatch(/^--_?ok-[a-z0-9-]+$/);
    }
    expect(Object.keys(dark)).toEqual(Object.keys(light));
  });
});

describe("typography, shape and shadows", () => {
  const { root, light, dark } = themeToCssVariables(defaultTheme);

  it("emits responsive font sizes as min-width overrides, smallest first", () => {
    expect(css).toMatch(
      /@media \(min-width: 600px\) \{\s+:root \{[^}]*--ok-typography-h1-font-size: 3\.25rem;/,
    );
    expect(css.indexOf("min-width: 600px")).toBeLessThan(css.indexOf("min-width: 900px"));
  });

  it("uses the heading family for h1–h6 and the label family for overline and button", () => {
    for (const h of ["h1", "h4", "h6"])
      expect(root[`--ok-typography-${h}-font-family`]).toBe("var(--ok-font-family-heading)");
    expect(root["--ok-typography-body1-font-family"]).toBe("var(--ok-font-family)");
    expect(root["--ok-typography-button-font-family"]).toBe("var(--ok-font-family-label)");
    expect(root["--ok-font-family-label"]).toBe(soft.fonts.label);
    expect(root["--ok-typography-h1-font-weight"]).toBe("800");
    expect(root["--ok-typography-h6-font-weight"]).toBe("700");
    expect(root["--ok-label-text-transform"]).toBe("none");
  });

  it("declares Soft's style tokens (ADR-0070 § 4)", () => {
    expect(root).toMatchObject({
      "--ok-radius-2xs": "2px",
      "--ok-radius-control": "10px",
      "--ok-radius-control-sm": "6px",
      "--ok-radius-inner": "4px",
      "--ok-radius-surface": "18px",
      "--ok-radius-surface-md": "14px",
      "--ok-radius-surface-sm": "10px",
      "--ok-radius-chip": "9999px",
      "--ok-border-width": "1px",
      "--ok-surface-border-width": "0px",
      "--ok-surface-border-style": "none",
      "--ok-focus-ring-width": "2px",
      "--ok-focus-ring-offset": "2px",
      "--ok-focus-ring-color": "var(--ok-text-primary)",
      "--ok-focus-ring-color-brand": "var(--ok-palette-primary-text)",
      "--ok-control-height-md": "2.25rem",
      "--ok-icon-stroke": "1.5",
      "--ok-duration-spin": "0.8s",
    });
    expect(light["--ok-surface-border-color"]).toBe("transparent");
  });

  it("reads the scope's shadow color in each shadow, as two soft layers", () => {
    expect(root["--ok-shadow-z8"]).toBe(
      "0 1px 3px 0 var(--_ok-sc10), 0 8px 20px 0 var(--_ok-sc12)",
    );
    expect(root["--_ok-sc10"]).toBe("color-mix(in srgb, var(--ok-shadow-color) 10%, transparent)");
    expect(light["--ok-shadow-color"]).toBe(defaultTheme.schemes.light.shadowColor);
    expect(dark["--ok-shadow-color"]).toBe("#000000");
    expect(root["--ok-drop-shadow-z1"]).toMatch(/^drop-shadow\(0 1px 2px var\(--_ok-sc10\)\)/);
    expect(root["--ok-shadow-primary"]).toContain("var(--ok-palette-primary-main) 28%");
    expect(defaultTheme.elevation).toHaveLength(24);
    // Elevations alias the nearest named shadow (ADR-0073).
    expect(root["--ok-elevation-1"]).toBe("var(--ok-shadow-z1)");
    expect(root["--ok-elevation-6"]).toBe("var(--ok-shadow-z8)");
    expect(root["--ok-elevation-24"]).toBe("var(--ok-shadow-z24)");
    for (const name of ["z1", "z4", "z8"] as const) {
      expect(defaultTheme.shadows[name].every((layer) => layer.spread === 0)).toBe(true);
    }
  });

  it("follows a custom theme's shadow layers", () => {
    const layer = { x: 0, y: 2, blur: 6, spread: 0, alpha: 30 };
    const { root: custom } = themeToCssVariables(createTheme({ shadows: { z4: [layer] } }));
    expect(custom["--ok-drop-shadow-z4"]).toBe("drop-shadow(0 2px 6px var(--_ok-sc30))");
  });
});

describe("foundations", () => {
  const { root } = themeToCssVariables(defaultTheme);

  it("exposes an RGB channel for every palette, grey and common color", () => {
    const main = defaultTheme.palette.primary.main;
    expect(root["--ok-palette-primary-main-channel"]).toBe(hexToRgb(main).join(" "));
    expect(root["--ok-palette-grey-500-channel"]).toBe(hexToRgb(defaultTheme.grey[500]).join(" "));
    // Channels only for colors components tint (ADR-0072).
    expect(root["--ok-palette-grey-950-channel"]).toBeUndefined();
    expect(root["--ok-palette-primary-light-channel"]).toBeUndefined();
    expect(root["--ok-palette-common-black-channel"]).toBe("0 0 0");
  });

  it("exposes the illustrations' skin tones (ADR-0041), customizable with createTheme", () => {
    for (const name of skinToneNames)
      expect(root[`--ok-illustration-skin-${name}`]).toBe(defaultTheme.illustration.skin[name]);
    const custom = createTheme({ illustration: { skin: { deep: "#5A3825" } } });
    expect(custom.illustration.skin.deep).toBe("#5A3825");
  });

  it("binds every component color, including black and white, with a channel", () => {
    for (const name of componentColorNames) expect(css).toContain(`[data-ok-color="${name}"] {`);
    expect(css).toMatch(
      /\[data-ok-color="black"\] \{[^}]*--ok-c-channel: var\(--ok-palette-common-black-channel\);/,
    );
  });
});

describe("createTheme", () => {
  it("starts from a style and deep-merges overrides without mutating the default theme", () => {
    const before = defaultTheme.palette.primary.main;
    const theme = createTheme({
      style: "soft",
      palette: { primary: { main: "#0055FF" } },
      radius: { md: "10px" },
    });
    expect(theme.palette.primary.main).toBe("#0055FF");
    expect(theme.palette.primary.dark).toBe(defaultTheme.palette.primary.dark);
    expect(theme.radius.md).toBe("10px");
    expect(theme.style).toBe("soft");
    expect(defaultTheme.palette.primary.main).toBe(before);
    expect(createTheme({ style: soft })).toEqual(defaultTheme);
  });

  it("ignores prototype keys in overrides (no prototype pollution)", () => {
    const hostile = JSON.parse(
      '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":2}},"palette":{"__proto__":{"x":3},"primary":{"main":"#0055FF"}}}',
    );
    const theme = createTheme(hostile);
    expect(Object.getPrototypeOf(theme)).toBe(Object.prototype);
    expect((theme as unknown as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect((theme.palette as unknown as Record<string, unknown>)["x"]).toBeUndefined();
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
    expect(getContrastText("#C8FAD6", ["#FFFFFF", "#000000"])).toBe("#000000");
  });
});
