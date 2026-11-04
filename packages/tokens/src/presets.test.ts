import { describe, expect, it } from "vitest";
import { contrastRatio } from "./color.js";
import { fontPresetVariables, primaryPresetVariables, themeToCss } from "./css.js";
import { defaultTheme } from "./default-theme.js";
import {
  fontFamilyPresetNames,
  fontFamilyPresets,
  fontSizeRange,
  paletteTextFor,
  primaryPresetNames,
  primaryPresets,
} from "./presets.js";

const AA = 4.5;
const { light, dark } = defaultTheme.schemes;

describe("primary presets", () => {
  it("has the reference presets with full palettes; contrast text follows the reference", () => {
    expect(primaryPresetNames).toEqual(["default", "cyan", "purple", "blue", "orange", "red"]);
    expect(primaryPresets.default).toBe(defaultTheme.palette.primary);
    for (const name of primaryPresetNames) {
      const color = primaryPresets[name];
      for (const value of Object.values(color)) expect(value).toMatch(/^#[0-9A-F]{6}$/);
      expect(color.contrastText).toBe(name === "orange" ? "#1C252E" : "#FFFFFF");
    }
  });

  it.each(primaryPresetNames)(
    "%s: the chosen text tone meets AA on surfaces and the soft tint",
    (name) => {
      const color = primaryPresets[name];
      for (const [scheme, isDark] of [
        [light, false],
        [dark, true],
      ] as const) {
        const text = paletteTextFor(color, scheme, isDark);
        expect(contrastRatio(text, scheme.background.paper)).toBeGreaterThanOrEqual(AA);
        expect(contrastRatio(text, scheme.background.default)).toBeGreaterThanOrEqual(AA);
      }
    },
  );

  it("the default preset keeps today's text tones; a failing tone falls back", () => {
    expect(paletteTextFor(primaryPresets.default, light, false)).toBe(light.paletteText.primary);
    expect(paletteTextFor(primaryPresets.default, dark, true)).toBe(dark.paletteText.primary);
    expect(paletteTextFor(primaryPresets.orange, light, false)).toBe(primaryPresets.orange.darker);
    const pale = { ...primaryPresets.cyan, dark: "#EEEEEE", darker: "#DDDDDD" };
    expect(paletteTextFor(pale, light, false)).toBe("#DDDDDD");
  });

  it("scope variables: shades, channels, shadow and the scheme-aware text", () => {
    const vars = primaryPresetVariables(primaryPresets.cyan, defaultTheme);
    expect(vars["--ok-palette-primary-main"]).toBe("#078DEE");
    expect(vars["--ok-palette-primary-main-channel"]).toBe("7 141 238");
    expect(vars["--ok-palette-primary-contrast-text"]).toBe("#FFFFFF");
    expect(vars["--ok-shadow-primary"]).toContain("var(--ok-palette-primary-main)");
    expect(vars["--_ok-primary-text-light"]).toBe("#0351AB");
    expect(vars["--_ok-primary-text-dark"]).toBe("#68CDF9");
    expect(vars["--ok-palette-primary-text"]).toContain("var(--_ok-dark)");
  });
});

describe("font presets", () => {
  it("are stacks that end with system fonts; variants on the main family follow", () => {
    expect(fontFamilyPresetNames).toEqual(["public-sans", "inter", "dm-sans", "nunito-sans"]);
    for (const name of fontFamilyPresetNames)
      expect(fontFamilyPresets[name]).toMatch(/sans-serif$/);
    const vars = fontPresetVariables(fontFamilyPresets.inter, defaultTheme);
    expect(vars["--ok-font-family"]).toContain('"Inter Variable"');
    expect(vars["--ok-typography-body1-font-family"]).toBe("var(--ok-font-family)");
    // h1–h3 use the secondary family in the reference: untouched.
    const secondary = Object.entries(defaultTheme.typography.variants).filter(
      ([, v]) => v.fontFamily === "secondary",
    );
    for (const [variant] of secondary)
      expect(vars[`--ok-typography-${variant}-font-family` as `--ok-${string}`]).toBeUndefined();
    expect(fontSizeRange).toEqual({ min: 12, max: 20, step: 1, default: 16 });
  });
});

describe("preset CSS", () => {
  it("emits one scope per preset and font, after the scheme scopes; presets: false omits them", () => {
    const css = themeToCss(defaultTheme);
    for (const name of primaryPresetNames) expect(css).toContain(`[data-ok-preset="${name}"] {`);
    for (const name of fontFamilyPresetNames) expect(css).toContain(`[data-ok-font="${name}"] {`);
    expect(css.indexOf('[data-ok-preset="cyan"]')).toBeGreaterThan(
      css.indexOf("color-scheme: light"),
    );
    expect(themeToCss(defaultTheme, { presets: false })).not.toContain("data-ok-preset");
  });
});
