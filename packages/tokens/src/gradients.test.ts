import { describe, expect, it } from "vitest";
import { createTheme } from "./create-theme.js";
import { themeToCss, themeToCssVariables } from "./css.js";
import { defaultTheme } from "./theme.js";
import { paletteColorNames } from "./types.js";

describe("gradient tokens", () => {
  const { root } = themeToCssVariables(defaultTheme);

  it.each(paletteColorNames)("--ok-gradient-%s: light to main, from the palette", (name) => {
    expect(root[`--ok-gradient-${name}`]).toBe(
      `linear-gradient(135deg, var(--ok-palette-${name}-light), var(--ok-palette-${name}-main))`,
    );
  });

  it.each(paletteColorNames)("--ok-gradient-%s-text: away from the scheme's surface", (name) => {
    expect(root[`--ok-gradient-${name}-text`]).toBe(
      `linear-gradient(90deg, var(--ok-palette-${name}-text), var(--_ok-d1, var(--ok-palette-${name}-lighter)) var(--_ok-d0, var(--ok-palette-${name}-darker)))`,
    );
  });

  it("are declared once, in the resolver on every scope element", () => {
    expect(root["--ok-gradient-paper"]).toContain("var(--ok-bg-paper-channel) / 0.9");
    const css = themeToCss(defaultTheme);
    for (const name of [
      "--ok-gradient-paper:",
      "--ok-gradient-primary:",
      "--ok-gradient-primary-text:",
    ])
      expect(css.split(name).length - 1).toBe(1);
  });

  it("createTheme: the gradients follow a custom palette", () => {
    const theme = createTheme({ palette: { info: { light: "#123456" } } });
    expect(themeToCss(theme)).toContain("--ok-palette-info-light: #123456;");
  });
});
