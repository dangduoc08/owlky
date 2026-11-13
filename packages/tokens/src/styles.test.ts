/*
 * Every style definition and its opt-in sheet (ADR-0070, ADR-0073). Color roles are checked for
 * every style by `roles.test.ts` (it reads `styleNames`); this file checks the definition's shape,
 * fonts, lines and shadows, and the sheet `themeToCss()` writes for it. A new style adds one row
 * to `EXPECTED`.
 */
import { describe, expect, it } from "vitest";
import { themeToCss } from "./css.js";
import { treatmentShadows } from "./shadows.js";
import { defaultStyleName, type StyleName, styleNames, styles } from "./styles.js";
import { styleTheme } from "./theme.js";
import { type ShadowTreatment, shadowNames } from "./types.js";

interface Expected {
  /** The first family of the text, heading and label stacks. */
  fonts: { text: string; heading: string; label: string };
  heading: { weight: number; letterSpacing: string; textTransform: string };
  label: { textTransform: string; letterSpacing: string };
  /** `--ok-radius-control` / `--ok-radius-surface` / `--ok-radius-chip`. */
  radius: [control: string, surface: string, chip: string];
  /** `--ok-surface-border-width` and whether its color is the ink. */
  surfaceBorder: [width: string, ink: boolean];
  borderWidth: string;
  shadows: ShadowTreatment;
  iconStroke: number;
}

const EXPECTED: Record<StyleName, Expected> = {
  soft: {
    fonts: { text: "Nunito", heading: "Nunito", label: "Nunito" },
    heading: { weight: 800, letterSpacing: "normal", textTransform: "none" },
    label: { textTransform: "none", letterSpacing: "normal" },
    radius: ["10px", "18px", "9999px"],
    surfaceBorder: ["0px", false],
    borderWidth: "1px",
    shadows: "soft",
    iconStroke: 1.5,
  },
  swiss: {
    fonts: { text: "Inter", heading: "Inter", label: "Inter" },
    heading: { weight: 800, letterSpacing: "-0.03em", textTransform: "none" },
    label: { textTransform: "none", letterSpacing: "normal" },
    radius: ["0px", "0px", "0px"],
    surfaceBorder: ["1px", true],
    borderWidth: "1px",
    shadows: "flat",
    iconStroke: 1.5,
  },
  "neo-brutalism": {
    fonts: { text: "Space Grotesk", heading: "Space Grotesk", label: "Space Grotesk" },
    heading: { weight: 700, letterSpacing: "-0.01em", textTransform: "none" },
    label: { textTransform: "none", letterSpacing: "normal" },
    radius: ["8px", "12px", "9999px"],
    surfaceBorder: ["2px", true],
    borderWidth: "2px",
    shadows: "hard",
    iconStroke: 2,
  },
  corporate: {
    fonts: { text: "IBM Plex Sans", heading: "IBM Plex Sans", label: "IBM Plex Sans" },
    heading: { weight: 700, letterSpacing: "normal", textTransform: "none" },
    label: { textTransform: "none", letterSpacing: "normal" },
    radius: ["4px", "8px", "4px"],
    surfaceBorder: ["0px", false],
    borderWidth: "1px",
    shadows: "subtle",
    iconStroke: 1.5,
  },
  nordic: {
    fonts: { text: "Manrope", heading: "Manrope", label: "Manrope" },
    heading: { weight: 800, letterSpacing: "-0.01em", textTransform: "none" },
    label: { textTransform: "none", letterSpacing: "normal" },
    radius: ["10px", "16px", "9999px"],
    surfaceBorder: ["0px", false],
    borderWidth: "1px",
    shadows: "soft",
    iconStroke: 1.5,
  },
};

const firstFamily = (stack: string) => stack.match(/^"([^"]+?)(?: Variable)?"/)?.[1];

/** `name: value` declarations of the block whose selector is exactly `selector`. */
function declarations(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`  ${selector} {\n`);
  if (start < 0) return {};
  const body = css.slice(start, css.indexOf("\n  }", start));
  const result: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/^ {4}(--[\w-]+): (.*);$/gm))
    result[name as string] = value as string;
  return result;
}

it("lists every style once, the default first, with an expectation row", () => {
  expect(styleNames[0]).toBe(defaultStyleName);
  expect(new Set(styleNames).size).toBe(styleNames.length);
  expect(Object.keys(styles).sort()).toEqual([...styleNames].sort());
  expect(Object.keys(EXPECTED).sort()).toEqual([...styleNames].sort());
  for (const name of styleNames) expect(styles[name].id).toBe(name);
});

describe.each(styleNames)("style %s", (name) => {
  const style = styles[name];
  const theme = styleTheme(style);
  const expected = EXPECTED[name];

  it("fonts, headings and the label role", () => {
    const { typography } = theme;
    expect(firstFamily(typography.fontFamily)).toBe(expected.fonts.text);
    expect(firstFamily(typography.fontFamilyHeading)).toBe(expected.fonts.heading);
    expect(firstFamily(typography.fontFamilyLabel)).toBe(expected.fonts.label);
    expect(typography.variants.h1.fontWeight).toBe(expected.heading.weight);
    expect(typography.heading.letterSpacing).toBe(expected.heading.letterSpacing);
    expect(typography.heading.textTransform).toBe(expected.heading.textTransform);
    expect(typography.label).toEqual(expected.label);
    // Every font the stacks name is linked (the docs and Storybook load it).
    for (const family of new Set(Object.values(expected.fonts)))
      expect(style.fontLinks.some((link) => link.replace(/\+/g, " ").startsWith(family))).toBe(
        true,
      );
    // A weight the font lacks would be synthesized: headings stay within the scale.
    expect(typography.variants.h1.fontWeight).toBeLessThanOrEqual(typography.fontWeight.extrabold);
  });

  it("shape, lines and icon stroke", () => {
    expect([theme.radiusRole.control, theme.radiusRole.surface, theme.radiusRole.chip]).toEqual(
      expected.radius,
    );
    expect(theme.surface.borderWidth).toBe(expected.surfaceBorder[0]);
    const ink = expected.surfaceBorder[1];
    expect(theme.schemes.light.surfaceBorder).toBe(
      ink ? theme.schemes.light.text.primary : "transparent",
    );
    expect(theme.schemes.dark.surfaceBorder).toBe(
      ink ? theme.schemes.dark.text.primary : "transparent",
    );
    expect(theme.borderWidth.default).toBe(expected.borderWidth);
    expect(theme.icon.stroke).toBe(String(expected.iconStroke));
  });

  it("shadows follow the treatment; elevations alias named shadows", () => {
    expect(theme.shadowTreatment).toBe(expected.shadows);
    expect(theme.shadows).toEqual(treatmentShadows(expected.shadows).shadows);
    expect(theme.elevation).toHaveLength(24);
    for (const alias of theme.elevation) expect(shadowNames).toContain(alias);
    if (expected.shadows === "flat")
      for (const n of shadowNames) expect(theme.shadows[n]).toEqual([]);
    if (expected.shadows === "hard") {
      for (const n of shadowNames)
        for (const layer of theme.shadows[n]) expect([layer.blur, layer.alpha]).toEqual([0, 100]);
      // Ink, like the surface edge, in both schemes.
      expect(theme.schemes.light.shadowColor).toBe(theme.schemes.light.text.primary);
      expect(theme.schemes.dark.shadowColor).toBe(theme.schemes.dark.text.primary);
    }
  });

  if (name === defaultStyleName) return;

  describe("opt-in sheet", () => {
    const scope = `[data-ok-style="${name}"]`;
    const css = themeToCss(theme, { selector: scope, reset: scope });
    const own = declarations(css, scope);
    const reset = declarations(css, `:where([data-ok-style]:not(${scope}))`);

    it("declares literals and every input on the style scope, in @layer theme", () => {
      expect(css).toMatch(/^@layer theme, base, components, utilities;\n\n@layer theme \{/);
      expect(own["--ok-radius-control"]).toBe(expected.radius[0]);
      expect(own["--ok-surface-border-width"]).toBe(expected.surfaceBorder[0]);
      expect(own["--ok-icon-stroke"]).toBeUndefined();
      const inputs = Object.keys(own).filter((k) => k.startsWith("--_ok-t"));
      expect(inputs.length).toBeGreaterThan(100);
      // No core plumbing: switches, density and the resolver stay in the core sheet.
      expect(css).not.toContain("--_ok-d1: initial");
      expect(css).not.toContain("[data-ok-density");
      expect(css).not.toContain("@property");
    });

    it("resets its inputs on any other style scope nested inside", () => {
      for (const input of Object.keys(own).filter((k) => k.startsWith("--_ok-t")))
        expect(reset[input]).toBe("initial");
    });

    it("switches the shadow treatment on its scope only", () => {
      const toggles = ["--_ok-ws", "--_ok-wu", "--_ok-wf", "--_ok-wh"];
      if (expected.shadows === "soft") {
        for (const toggle of toggles) expect(css).not.toContain(`${toggle}:`);
        return;
      }
      const active = { soft: "--_ok-ws", subtle: "--_ok-wu", flat: "--_ok-wf", hard: "--_ok-wh" }[
        expected.shadows
      ];
      for (const toggle of toggles) {
        expect(own[toggle]).toBe(toggle === active ? "initial" : " ");
        expect(reset[toggle]).toBe(toggle === "--_ok-ws" ? "initial" : " ");
        expect(declarations(css, ":where(:root)")[toggle]).toBe(reset[toggle]);
      }
      const shadows = declarations(
        css,
        `:root, [data-ok-style], [data-ok-theme], .dark, [data-ok-surface], [data-ok-contrast], ${scope}`,
      );
      expect(shadows["--ok-shadow-z8"]).toMatch(/^var\(--_ok-ws, .*\) var\(--_ok-wh, .*\)$/);
      expect(Object.keys(shadows)).toEqual(
        expect.arrayContaining(["--ok-shadow-card", "--ok-drop-shadow-z1", "--ok-shadow-primary"]),
      );
    });
  });
});

it("every sheet with a shadow switch writes the same switch (two sheets never undo each other)", () => {
  const switches = styleNames
    .filter((name) => styles[name].shadows !== "soft")
    .map((name) => {
      const scope = `[data-ok-style="${name}"]`;
      const css = themeToCss(styleTheme(styles[name]), { selector: scope, reset: scope });
      const body = declarations(
        css,
        `:root, [data-ok-style], [data-ok-theme], .dark, [data-ok-surface], [data-ok-contrast], ${scope}`,
      );
      return JSON.stringify(body);
    });
  expect(new Set(switches).size).toBeLessThanOrEqual(1);
});
