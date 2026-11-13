import { createTheme, defaultTheme, hexToRgb, themeToCss } from "@owlky/tokens";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyThemeSettings,
  defaultThemeSettings,
  normalizeThemeSettings,
  readThemeSettings,
  resetThemeSettings,
  THEME_ATTRIBUTES,
  THEME_SETTINGS_KEY,
} from "./theme-settings.js";

/** In-memory storage; `fail` makes every call throw (blocked / full storage). */
function memoryStorage(fail = false) {
  const data = new Map<string, string>();
  const guard = () => {
    if (fail) throw new Error("blocked");
  };
  return {
    data,
    getItem(key: string) {
      guard();
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      guard();
      data.set(key, value);
    },
    removeItem(key: string) {
      guard();
      data.delete(key);
    },
  };
}

const html = document.documentElement;
afterEach(() => {
  html.removeAttribute("data-ok-theme");
  html.style.fontSize = "";
});

const AXES = [
  "data-ok-theme",
  "data-ok-style",
  "data-ok-density",
  "data-ok-surface",
  "data-ok-contrast",
];
afterEach(() => {
  for (const name of AXES) html.removeAttribute(name);
});

describe("normalizeThemeSettings", () => {
  it("keeps valid values and replaces anything else with the default", () => {
    const all = {
      mode: "dark",
      style: "soft",
      density: "compact",
      surface: "contrast",
      contrast: "high",
      fontSize: 14,
    };
    expect(normalizeThemeSettings(all)).toEqual(all);
    expect(
      normalizeThemeSettings({
        mode: "x",
        style: "nope",
        density: 1,
        contrast: "max",
        fontSize: 30,
      }),
    ).toEqual(defaultThemeSettings);
    expect(normalizeThemeSettings({ fontSize: 13.5 }).fontSize).toBe(16);
    expect(normalizeThemeSettings("nope")).toEqual(defaultThemeSettings);
    expect(normalizeThemeSettings(null)).toEqual(defaultThemeSettings);
  });

  it("ignores prototype keys and removed settings", () => {
    const result = normalizeThemeSettings(
      JSON.parse('{"__proto__":{"polluted":1},"mode":"system","preset":"blue","font":"inter"}'),
    );
    expect(result.mode).toBe("system");
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(Object.keys(result)).toEqual([
      "mode",
      "style",
      "density",
      "surface",
      "contrast",
      "fontSize",
    ]);
  });

  it("lists every axis attribute for runtimes that watch theme changes", () => {
    expect(THEME_ATTRIBUTES).toEqual(AXES);
  });
});

describe("applyThemeSettings", () => {
  it("writes every axis and the root font size; the default size removes it", () => {
    const applied = applyThemeSettings({ mode: "dark", density: "compact", fontSize: 18 });
    expect(applied).toEqual({
      ...defaultThemeSettings,
      mode: "dark",
      density: "compact",
      fontSize: 18,
    });
    expect(html.dataset["okTheme"]).toBe("dark");
    expect(html.dataset["okStyle"]).toBe("soft");
    expect(html.dataset["okDensity"]).toBe("compact");
    expect(html.dataset["okSurface"]).toBe("default");
    expect(html.dataset["okContrast"]).toBe("default");
    expect(getComputedStyle(html).fontSize).toBe("18px");
    // Partial updates keep the rest.
    expect(applyThemeSettings({ fontSize: 16, contrast: "high" })).toMatchObject({
      mode: "dark",
      density: "compact",
      contrast: "high",
      fontSize: 16,
    });
    expect(html.style.fontSize).toBe("");
  });

  it("targets a nested scope; the font size always applies to the page", () => {
    const scope = document.createElement("div");
    document.body.append(scope);
    applyThemeSettings({ mode: "dark", surface: "contrast", fontSize: 12 }, { target: scope });
    expect(scope.dataset["okTheme"]).toBe("dark");
    expect(scope.dataset["okSurface"]).toBe("contrast");
    expect(html.hasAttribute("data-ok-theme")).toBe(false);
    expect(html.style.fontSize).toBe("12px");
    expect(readThemeSettings({ target: scope })).toEqual({
      ...defaultThemeSettings,
      mode: "dark",
      surface: "contrast",
      fontSize: 12,
    });
    scope.remove();
  });

  it("stores only when a storage is given; reads it back; reset forgets it", () => {
    const storage = memoryStorage();
    applyThemeSettings({ mode: "dark" });
    expect(storage.data.size).toBe(0);
    applyThemeSettings({ mode: "system", contrast: "system" }, { storage });
    expect(JSON.parse(storage.data.get(THEME_SETTINGS_KEY) as string)).toMatchObject({
      mode: "system",
      contrast: "system",
    });
    html.setAttribute("data-ok-theme", "light");
    expect(readThemeSettings({ storage }).mode).toBe("system");
    applyThemeSettings({ fontSize: 14 }, { storage, key: "custom" });
    expect(storage.data.has("custom")).toBe(true);
    expect(resetThemeSettings({ storage })).toEqual(defaultThemeSettings);
    expect(storage.data.has(THEME_SETTINGS_KEY)).toBe(false);
    expect(html.dataset["okTheme"]).toBe("light");
    expect(html.dataset["okContrast"]).toBe("default");
  });

  it("survives blocked storage and invalid stored JSON", () => {
    const blocked = memoryStorage(true);
    expect(applyThemeSettings({ mode: "dark" }, { storage: blocked }).mode).toBe("dark");
    expect(readThemeSettings({ storage: blocked }).mode).toBe("dark"); // from the DOM
    expect(resetThemeSettings({ storage: blocked })).toEqual(defaultThemeSettings);
    const broken = memoryStorage();
    broken.data.set(THEME_SETTINGS_KEY, "{oops");
    expect(readThemeSettings({ storage: broken })).toEqual(defaultThemeSettings);
    broken.data.set(THEME_SETTINGS_KEY, '{"mode":"dark","fontSize":"big"}');
    expect(readThemeSettings({ storage: broken })).toEqual({
      ...defaultThemeSettings,
      mode: "dark",
    });
  });
});

/** `#RRGGBB` → `rgb(r, g, b)`, as engines serialize computed colors. */
const rgb = (hex: string) => `rgb(${hexToRgb(hex).join(", ")})`;

describe("every axis nests on its own (ADR-0070 § 3)", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.replaceChildren();
  });

  /** Computed `property: value` on `#probe` inside `markup`, with the given sheets. */
  function probe(
    markup: string,
    property: string,
    value: string,
    sheets = themeToCss(defaultTheme),
  ): string {
    style.textContent = sheets;
    document.head.append(style);
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.replaceChildren(host);
    const element = host.querySelector("#probe") as HTMLElement;
    element.style.setProperty(property, value);
    return getComputedStyle(element).getPropertyValue(property).trim();
  }

  const light = defaultTheme.schemes.light;
  const dark = defaultTheme.schemes.dark;
  const hcLight = defaultTheme.highContrast.schemes.light;
  const hcDark = defaultTheme.highContrast.schemes.dark;
  const P = '<span id="probe"></span>';
  const wrap = (attrs: string, inner: string) => `<div ${attrs}>${inner}</div>`;
  const theme = (mode: string, inner: string) => wrap(`data-ok-theme="${mode}"`, inner);
  const contrast = (value: string, inner: string) => wrap(`data-ok-contrast="${value}"`, inner);
  const surface = (value: string, inner: string) => wrap(`data-ok-surface="${value}"`, inner);

  it.each([
    ["the root", P, light.text.primary],
    ["dark", theme("dark", P), dark.text.primary],
    ["light inside dark", theme("dark", theme("light", P)), light.text.primary],
    ["high contrast", contrast("high", P), hcLight.text.primary],
    ["high contrast inside dark", theme("dark", contrast("high", P)), hcDark.text.primary],
    ["dark inside high contrast", contrast("high", theme("dark", P)), hcDark.text.primary],
    ["default inside high", contrast("high", contrast("default", P)), light.text.primary],
    ["system contrast without the preference", contrast("system", P), light.text.primary],
    [
      "a style scope inside dark",
      theme("dark", wrap('data-ok-style="soft"', P)),
      dark.text.primary,
    ],
  ])("text color on %s", (_, markup, expected) => {
    expect(probe(markup, "color", "var(--ok-text-primary)")).toBe(rgb(expected));
  });

  it.each([
    ["default", P, light.background.default, light.background.paper],
    ["contrast", surface("contrast", P), light.background.contrast, light.background.paper],
    [
      "contrast inside dark",
      theme("dark", surface("contrast", P)),
      dark.background.contrast,
      dark.background.paper,
    ],
    [
      "dark inside contrast",
      surface("contrast", theme("dark", P)),
      dark.background.contrast,
      dark.background.paper,
    ],
    [
      "default inside contrast",
      surface("contrast", surface("default", P)),
      light.background.default,
      light.background.paper,
    ],
  ])("page background: %s surface", (_, markup, page, paper) => {
    expect(probe(markup, "background-color", "var(--ok-bg-default)")).toBe(rgb(page));
    expect(probe(markup, "color", "var(--ok-bg-paper)")).toBe(rgb(paper));
  });

  it("density changes control sizes and nests; spacing never changes", () => {
    const compact = (inner: string) => wrap('data-ok-density="compact"', inner);
    const height = "var(--ok-control-height-md)";
    expect(probe(P, "height", height)).toBe("36px");
    expect(probe(compact(P), "height", height)).toBe("32px");
    expect(probe(compact(wrap('data-ok-density="comfortable"', P)), "height", height)).toBe("36px");
    expect(probe(compact(P), "width", "calc(var(--ok-spacing) * 9)")).toBe("36px");
  });

  it("high contrast moves palette fills and widens focus rings and icon strokes", () => {
    const main = "var(--ok-palette-primary-main)";
    expect(probe(contrast("high", P), "color", main)).toBe(
      rgb(defaultTheme.highContrast.palette.primary.main),
    );
    expect(probe(P, "color", main)).toBe(rgb(defaultTheme.palette.primary.main));
    expect(probe(contrast("high", P), "--x", "var(--ok-focus-ring-width)")).toBe("3px");
    expect(
      Number(probe(contrast("high", P), "--x", "var(--ok-icon-stroke)")),
    ).toBeGreaterThanOrEqual(1.75);
  });

  it("a nested style scope keeps the other axes; another style nested inside resets it", () => {
    const brand = createTheme({ brand: { primary: "#E11D48" } });
    const sheets = [
      themeToCss(defaultTheme),
      themeToCss(brand, { selector: '[data-ok-style="demo"]', reset: '[data-ok-style="demo"]' }),
    ].join("\n");
    const demo = (inner: string) => wrap('data-ok-style="demo"', inner);
    const main = "var(--ok-palette-primary-main)";
    expect(probe(demo(P), "color", main, sheets)).toBe(rgb(brand.palette.primary.main));
    expect(probe(theme("dark", demo(P)), "color", "var(--ok-palette-primary-text)", sheets)).toBe(
      rgb(brand.schemes.dark.paletteText.primary),
    );
    expect(probe(demo(contrast("high", P)), "color", main, sheets)).toBe(
      rgb(brand.highContrast.palette.primary.main),
    );
    expect(probe(demo(wrap('data-ok-style="soft"', P)), "color", main, sheets)).toBe(
      rgb(defaultTheme.palette.primary.main),
    );
  });
});

describe("focus ring colors follow the nearest scheme", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.replaceChildren();
  });

  it.each([
    ["light", '<span id="probe"></span>', defaultTheme.schemes.light],
    ["dark", '<div data-ok-theme="dark"><span id="probe"></span></div>', defaultTheme.schemes.dark],
  ])("%s", (_, markup, scheme) => {
    style.textContent = themeToCss(defaultTheme);
    document.head.append(style);
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
    const element = host.querySelector("#probe") as HTMLElement;
    element.style.color = "var(--ok-focus-ring-color)";
    element.style.backgroundColor = "var(--ok-focus-ring-color-brand)";
    const computed = getComputedStyle(element);
    expect(computed.color).toBe(rgb(scheme.text.primary));
    expect(computed.backgroundColor).toBe(rgb(scheme.paletteText.primary));
  });
});

describe("drop-shadow tokens follow the scheme's shadow color", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.replaceChildren();
  });

  /** Computed `filter` and `box-shadow` of the z1 tokens in a `data-ok-theme` scope. */
  function z1(theme: "light" | "dark") {
    style.textContent = themeToCss(defaultTheme);
    document.head.append(style);
    const scope = document.createElement("div");
    scope.setAttribute("data-ok-theme", theme);
    const probe = document.createElement("span");
    probe.style.filter = "var(--ok-drop-shadow-z1)";
    probe.style.boxShadow = "var(--ok-shadow-z1)";
    scope.append(probe);
    document.body.append(scope);
    const computed = getComputedStyle(probe);
    return { filter: computed.filter, boxShadow: computed.boxShadow };
  }

  it("resolves to a drop-shadow() that changes with the scheme, like the box shadow", () => {
    const light = z1("light");
    const dark = z1("dark");
    expect(light.filter).toMatch(/drop-shadow\(/);
    expect(dark.filter).toMatch(/drop-shadow\(/);
    expect(light.filter).not.toBe(dark.filter);
    expect(light.boxShadow).not.toBe(dark.boxShadow);
  });
});

describe("gradient tokens follow the nearest scheme", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.replaceChildren();
  });

  /** Computed `background-image` of `value` on `#probe` inside `html`. */
  function image(html: string, value: string): string {
    style.textContent = themeToCss(defaultTheme);
    document.head.append(style);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const probe = host.querySelector("#probe") as HTMLElement;
    probe.style.backgroundImage = value;
    const computed = getComputedStyle(probe).backgroundImage;
    host.remove();
    // color-mix() may serialize as color(srgb …): write every color as rgb() channels.
    return computed.replace(
      /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)\)/g,
      (_, r, g, b) => `rgb(${[r, g, b].map((c) => Math.round(Number(c) * 255)).join(", ")})`,
    );
  }

  const SCOPES: [name: string, html: string, dark: boolean][] = [
    ["default light", '<span id="probe"></span>', false],
    ["dark", '<div data-ok-theme="dark"><span id="probe"></span></div>', true],
    [
      "light inside dark",
      '<div data-ok-theme="dark"><div data-ok-theme="light"><span id="probe"></span></div></div>',
      false,
    ],
  ];

  it.each(SCOPES)("%s: the text gradient ends away from the surface", (_, html, isDark) => {
    const end = isDark ? "lighter" : "darker";
    expect(image(html, "var(--ok-gradient-primary-text)")).toBe(
      image(
        html,
        `linear-gradient(90deg, var(--ok-palette-primary-text), var(--ok-palette-primary-${end}))`,
      ),
    );
  });

  it.each(SCOPES)("%s: the fill gradient uses the scope's primary", (_, html) => {
    expect(image(html, "var(--ok-gradient-primary)")).toBe(
      image(
        html,
        "linear-gradient(135deg, var(--ok-palette-primary-light), var(--ok-palette-primary-main))",
      ),
    );
  });

  it("the primary gradient uses the palette; the paper gradient follows the scheme", () => {
    const plain = image('<span id="probe"></span>', "var(--ok-gradient-primary)");
    expect(plain).toContain(rgb(defaultTheme.palette.primary.main));
    const lightPaper = image('<span id="probe"></span>', "var(--ok-gradient-paper)");
    const darkPaper = image(
      '<div data-ok-theme="dark"><span id="probe"></span></div>',
      "var(--ok-gradient-paper)",
    );
    expect(lightPaper).toMatch(/radial-gradient/);
    expect(lightPaper).not.toBe(darkPaper);
  });
});
