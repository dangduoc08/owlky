import { describe, expect, it } from "vitest";
import { contrastRatio } from "./color.js";
import { createTheme } from "./create-theme.js";
import { primaryPresetVariables, themeToCss, themeToCssVariables } from "./css.js";
import { defaultTheme } from "./default-theme.js";
import { paletteTextFor, primaryPresetNames, primaryPresets } from "./presets.js";
import { type ColorScheme, paletteColorNames } from "./types.js";

const AA = 4.5;
const { light, dark } = defaultTheme.schemes;

describe("gradient tokens", () => {
  const { root, light: lightVars, dark: darkVars } = themeToCssVariables(defaultTheme);

  it.each(paletteColorNames)("--ok-gradient-%s: light to main, from the palette", (name) => {
    expect(root[`--ok-gradient-${name}`]).toBe(
      `linear-gradient(135deg, var(--ok-palette-${name}-light), var(--ok-palette-${name}-main))`,
    );
  });

  it.each(paletteColorNames)("--ok-gradient-%s-text: per scheme, away from the surface", (name) => {
    expect(lightVars[`--ok-gradient-${name}-text`]).toBe(
      `linear-gradient(90deg, var(--ok-palette-${name}-text), var(--ok-palette-${name}-darker))`,
    );
    expect(darkVars[`--ok-gradient-${name}-text`]).toBe(
      `linear-gradient(90deg, var(--ok-palette-${name}-text), var(--ok-palette-${name}-lighter))`,
    );
  });

  it("--ok-gradient-paper reads the scheme's paper and is declared in every scheme scope", () => {
    expect(lightVars["--ok-gradient-paper"]).toContain("var(--ok-bg-paper-channel) / 0.9");
    expect(lightVars["--ok-gradient-paper"]).toContain("--ok-palette-info-main-channel");
    expect(lightVars["--ok-gradient-paper"]).toContain("--ok-palette-error-main-channel");
    expect(darkVars["--ok-gradient-paper"]).toBe(lightVars["--ok-gradient-paper"]);
    const css = themeToCss(defaultTheme);
    // light, dark, system
    expect(css.split("--ok-gradient-paper:").length - 1).toBe(3);
    expect(css.split("--ok-gradient-success-text:").length - 1).toBe(3);
    // the root, then each preset scope redeclares the primary gradients
    expect(css.split("--ok-gradient-primary:").length - 1).toBe(1 + primaryPresetNames.length);
    expect(css.split("--ok-gradient-primary-text:").length - 1).toBe(3 + primaryPresetNames.length);
  });

  it("preset scopes redeclare the primary gradients against the nearest scheme", () => {
    const vars = primaryPresetVariables(primaryPresets.cyan, defaultTheme);
    expect(vars["--ok-gradient-primary"]).toContain("var(--ok-palette-primary-light)");
    expect(vars["--ok-gradient-primary-text"]).toContain("var(--ok-palette-primary-text)");
    expect(vars["--ok-gradient-primary-text"]).toContain("calc(var(--_ok-dark) * 100%)");
  });

  it("createTheme: the gradients follow a custom palette", () => {
    const theme = createTheme({ palette: { info: { light: "#123456" } } });
    const css = themeToCss(theme);
    expect(css).toContain("--ok-palette-info-light: #123456;");
    expect(themeToCssVariables(theme).root["--ok-gradient-info"]).toContain(
      "var(--ok-palette-info-light)",
    );
  });
});

type Stops = (scheme: ColorScheme, isDark: boolean) => string[];

describe("gradient text contrast (WCAG 2.2 AA)", () => {
  // The first stop is `--ok-palette-<color>-text`: the scheme's tone for the default palette, the
  // computed one in preset scopes. The second is `darker` (light) or `lighter` (dark).
  const cases: [string, Stops][] = [
    ...paletteColorNames.map((name): [string, Stops] => {
      const color = defaultTheme.palette[name];
      return [
        name,
        (scheme, isDark) => [scheme.paletteText[name], isDark ? color.lighter : color.darker],
      ];
    }),
    ...primaryPresetNames.map((name): [string, Stops] => {
      const color = primaryPresets[name];
      return [
        `primary preset ${name}`,
        (scheme, isDark) => [
          paletteTextFor(color, scheme, isDark),
          isDark ? color.lighter : color.darker,
        ],
      ];
    }),
  ];

  it.each(cases)("%s: every stop meets AA on paper and default, light and dark", (_, stops) => {
    for (const [scheme, isDark] of [
      [light, false],
      [dark, true],
    ] as const) {
      for (const stop of stops(scheme, isDark)) {
        for (const surface of [scheme.background.paper, scheme.background.default])
          expect(contrastRatio(stop, surface)).toBeGreaterThanOrEqual(AA);
      }
    }
  });
});
