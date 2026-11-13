import { describe, expect, it } from "vitest";
import { contrastRatio, hexToOklch, oklchToHex } from "./color.js";
import { createTheme } from "./create-theme.js";
import {
  brandScale,
  CONTRAST_TARGETS,
  type ContrastLevel,
  hexScale,
  SOFT_TINT,
  shiftToContrast,
  tint,
} from "./roles.js";
import { soft, styleNames, styles } from "./styles.js";
import { tailwindPalette } from "./tailwind-palette.js";
import { styleTheme } from "./theme.js";
import { type ColorScheme, type PaletteColor, paletteColorNames, type Theme } from "./types.js";

const ratio = contrastRatio;

/** Every combination of ADR-0070 § 7: mode × surface × contrast. */
function matrix(theme: Theme) {
  const cases: {
    label: string;
    level: ContrastLevel;
    dark: boolean;
    scheme: ColorScheme;
    palette: Record<(typeof paletteColorNames)[number], PaletteColor>;
    surfaces: string[];
  }[] = [];
  for (const level of ["default", "high"] as const) {
    for (const dark of [false, true]) {
      const set = level === "high" ? theme.highContrast : theme;
      const scheme = dark ? set.schemes.dark : set.schemes.light;
      for (const surface of ["default", "contrast"] as const) {
        const page =
          surface === "contrast" ? scheme.background.contrast : scheme.background.default;
        cases.push({
          label: `${level} contrast, ${dark ? "dark" : "light"}, ${surface} surface`,
          level,
          dark,
          scheme,
          // Ink colors' fills switch with the scheme (ADR-0073 § 8).
          palette: dark ? { ...set.palette, ...set.darkPalette } : set.palette,
          // Text and graphics sit on paper, on the page background and on `neutral` fills.
          surfaces: [scheme.background.paper, page, scheme.background.neutral],
        });
      }
    }
  }
  return cases;
}

describe.each(styleNames)("style %s: every role pair (ADR-0070 § 7)", (name) => {
  const theme = styleTheme(styles[name]);

  describe.each(matrix(theme))("$label", ({ level, dark, scheme, palette, surfaces }) => {
    const { text: T, graphic: G } = CONTRAST_TARGETS[level];
    const atLeast = (fg: string, bg: string, min: number) =>
      expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(min);

    it("neutral text on every surface", () => {
      for (const surface of surfaces) {
        atLeast(scheme.text.primary, surface, T);
        atLeast(scheme.text.secondary, surface, T);
      }
    });

    it("neutral text on hovered, selected and focused rows (action overlays)", () => {
      // `color-mix(in srgb, <hex> N%, transparent)` over a surface is `tint(hex, N, surface)`.
      const over = (overlay: string, surface: string) => {
        const match = /^color-mix\(in srgb, (#[0-9A-F]{6}) (\d+)%, transparent\)$/i.exec(overlay);
        if (!match) throw new Error(`unexpected action color ${overlay}`);
        return tint(match[1] as string, Number(match[2]), surface);
      };
      const { hover, selected, focus } = scheme.action;
      for (const surface of surfaces) {
        for (const overlay of [hover, selected, focus]) {
          const bg = over(overlay, surface);
          atLeast(scheme.text.primary, bg, T);
          atLeast(scheme.text.secondary, bg, T);
        }
      }
    });

    it.each(paletteColorNames)(
      "%s: text tone on surfaces, the soft tint and the soft fill",
      (c) => {
        const tone = scheme.paletteText[c];
        for (const surface of surfaces) {
          atLeast(tone, surface, T);
          atLeast(tone, tint(palette[c].main, SOFT_TINT, surface), T);
        }
        atLeast(tone, dark ? palette[c].darker : palette[c].lighter, T);
      },
    );

    it.each(paletteColorNames)("%s: contrast text on main and on the hover shade", (c) => {
      atLeast(palette[c].contrastText, palette[c].main, T);
      atLeast(palette[c].contrastText, palette[c].dark, T);
    });

    it.each(paletteColorNames)("%s: gradient text stops", (c) => {
      for (const surface of surfaces) {
        atLeast(scheme.paletteText[c], surface, T);
        atLeast(dark ? palette[c].lighter : palette[c].darker, surface, T);
      }
    });

    it("inherit: contrast text on main and hover", () => {
      atLeast(scheme.inherit.contrast, scheme.inherit.main, T);
      atLeast(scheme.inherit.contrast, scheme.inherit.hover, T);
    });

    it("control borders, focus rings and chart series reach the graphics target", () => {
      for (const surface of surfaces) {
        atLeast(scheme.border, surface, G);
        atLeast(scheme.text.primary, surface, G);
        atLeast(scheme.paletteText.primary, surface, G);
        for (const series of scheme.chart) atLeast(series, surface, G);
      }
      expect(scheme.chart).toHaveLength(8);
    });

    it("dividers: decorative by default, 3:1 in high contrast", () => {
      if (level === "high") for (const surface of surfaces) atLeast(scheme.divider, surface, 3);
      else expect(scheme.divider).toMatch(/^color-mix\(/);
    });
  });

  it("high contrast keeps every hue (only lightness moves)", () => {
    const hue = (hex: string) => hexToOklch(hex);
    for (const c of paletteColorNames) {
      for (const [normal, high] of [
        [theme.palette[c].main, theme.highContrast.palette[c].main],
        [theme.schemes.light.paletteText[c], theme.highContrast.schemes.light.paletteText[c]],
        [theme.schemes.dark.paletteText[c], theme.highContrast.schemes.dark.paletteText[c]],
      ] as const) {
        const a = hue(normal);
        const b = hue(high);
        if (a.c < 0.03 || b.c < 0.03) continue;
        const delta = Math.abs(((a.h - b.h + 540) % 360) - 180);
        // Steps of one Tailwind hue drift a little (amber 400 → 200: about 15°).
        expect(delta, `${c}: ${normal} → ${high}`).toBeLessThan(20);
      }
    }
  });

  it("high contrast widens focus rings and icon strokes", () => {
    expect(theme.highContrast.focusRingWidth).toBe("3px");
    expect(Number(theme.highContrast.iconStroke)).toBeGreaterThanOrEqual(1.75);
  });
});

describe("Soft (the default style)", () => {
  const theme = styleTheme(soft);

  it("takes its palette from Tailwind hues: indigo primary, zinc neutrals", () => {
    const indigo = hexScale(tailwindPalette.indigo);
    const zinc = hexScale(tailwindPalette.zinc);
    expect(theme.palette.primary.lighter).toBe(indigo[100]);
    expect(theme.palette.primary.light).toBe(indigo[300]);
    expect(theme.palette.primary.darker).toBe(indigo[900]);
    expect(Object.values(indigo)).toContain(theme.palette.primary.main);
    expect(theme.grey[500]).toBe(zinc[500]);
    expect(theme.schemes.light.background.paper).toBe("#FFFFFF");
    expect(theme.schemes.light.background.contrast).toBe(zinc[100]);
    expect(theme.schemes.dark.background.paper).toBe(zinc[900]);
    expect(theme.schemes.dark.background.contrast).toBe(zinc[950]);
  });

  it("uses Nunito, rounded shapes, soft shadows and a 1.5 icon stroke", () => {
    expect(theme.typography.fontFamily).toMatch(/^"Nunito Variable", "Nunito", /);
    expect(theme.typography.fontFamilyHeading).toBe(theme.typography.fontFamily);
    expect(theme.typography.variants.h1.fontWeight).toBe(800);
    expect(theme.typography.variants.h4.fontFamily).toBe("heading");
    expect(theme.radiusRole.control).toBe("10px");
    expect(theme.radiusRole.surface).toBe("18px");
    expect(theme.radiusRole.chip).toBe("9999px");
    expect(theme.shadows.z8).toHaveLength(2);
    expect(theme.surface.borderWidth).toBe("0px");
    expect(theme.schemes.light.surfaceBorder).toBe("transparent");
    expect(theme.icon.stroke).toBe("1.5");
  });
});

describe("ink colors (Minimal Mono's primary, ADR-0073 § 8)", () => {
  const theme = styleTheme(styles["minimal-mono"]);
  const zinc = hexScale(tailwindPalette.zinc);
  const lightness = (hex: string) => hexToOklch(hex).l;

  it("fills near-black in light and near-white in dark, at every contrast level", () => {
    expect(theme.palette.primary.main).toBe(zinc[900]);
    expect(theme.palette.primary.contrastText).toBe("#FFFFFF");
    expect(theme.darkPalette?.primary?.main).toBe(zinc[100]);
    expect(theme.darkPalette?.primary?.contrastText).toBe(zinc[900]);
    expect(theme.highContrast.palette.primary.main).toBe(zinc[950]);
    expect(theme.highContrast.darkPalette?.primary?.main).toBe(zinc[50]);
    // At least as dark as Inherit's fill in light (never the mid grey), near-white in dark.
    expect(lightness(theme.palette.primary.main)).toBeLessThanOrEqual(
      lightness(theme.schemes.light.inherit.main),
    );
    expect(lightness(theme.darkPalette?.primary?.main ?? "")).toBeGreaterThan(0.9);
    expect(Object.keys(theme.darkPalette ?? {})).toEqual(["primary"]);
  });

  it("text tones follow the ink; the other colors keep their hue's fills", () => {
    expect(theme.schemes.light.paletteText.primary).toBe(zinc[900]);
    expect(theme.schemes.dark.paletteText.primary).toBe(zinc[100]);
    expect(theme.darkPalette?.secondary).toBeUndefined();
  });

  it("a brand color replaces the ink; no other style has ink colors", () => {
    const brand = createTheme({ style: "minimal-mono", brand: { primary: "#0E7490" } });
    expect(brand.darkPalette).toBeUndefined();
    for (const name of styleNames.filter((n) => n !== "minimal-mono")) {
      expect(styleTheme(styles[name]).darkPalette).toBeUndefined();
      expect(styleTheme(styles[name]).highContrast.darkPalette).toBeUndefined();
    }
  });
});

describe("generator", () => {
  it("shiftToContrast moves only lightness until the target is met", () => {
    const pale = oklchToHex("oklch(80% 0.1 250)");
    const out = shiftToContrast(pale, ["#FFFFFF"], 7);
    expect(ratio(out, "#FFFFFF")).toBeGreaterThanOrEqual(7);
    const a = hexToOklch(pale);
    const b = hexToOklch(out);
    expect(Math.abs(a.h - b.h)).toBeLessThan(6);
    expect(b.l).toBeLessThan(a.l);
    expect(shiftToContrast("#000000", ["#FFFFFF"], 7)).toBe("#000000");
    // Toward lighter on dark surfaces.
    const lifted = shiftToContrast("#333366", ["#111111"], 4.5);
    expect(hexToOklch(lifted).l).toBeGreaterThan(hexToOklch("#333366").l);
  });

  it("brandScale keeps the brand color and its hue on an 11-step ramp", () => {
    const scale = brandScale("#0E7490");
    expect(Object.values(scale)).toContain("#0E7490");
    const hue = hexToOklch("#0E7490").h;
    for (const step of [200, 400, 600, 800] as const) {
      expect(Math.abs(hexToOklch(scale[step]).h - hue)).toBeLessThan(8);
    }
    expect(hexToOklch(scale[50]).l).toBeGreaterThan(hexToOklch(scale[950]).l);
  });

  it.each(["#FF0080", "#FFD400", "#00FF66", "#3355FF", "#777777"])(
    "createTheme({ brand: { primary: %s } }) derives every role at AA",
    (primary) => {
      const theme = createTheme({ brand: { primary } });
      for (const { level, dark, scheme, palette, surfaces } of matrix(theme)) {
        const { text: T } = CONTRAST_TARGETS[level];
        expect(ratio(palette.primary.contrastText, palette.primary.main)).toBeGreaterThanOrEqual(T);
        for (const surface of surfaces) {
          expect(
            ratio(scheme.paletteText.primary, surface),
            `${level} ${dark} ${scheme.paletteText.primary} on ${surface}`,
          ).toBeGreaterThanOrEqual(T);
        }
      }
    },
  );

  it("createTheme({ brand: { neutral } }) derives the greys and surfaces", () => {
    const theme = createTheme({ brand: { neutral: "#64748B" } });
    expect(theme.grey[500]).not.toBe(styleTheme(soft).grey[500]);
    expect(
      ratio(theme.schemes.light.text.secondary, theme.schemes.light.background.contrast),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("createTheme({ fonts }) replaces families", () => {
    const theme = createTheme({ fonts: { heading: '"Display", serif' } });
    expect(theme.typography.fontFamilyHeading).toBe('"Display", serif');
    expect(theme.typography.fontFamily).toMatch(/"Nunito"/);
  });
});
