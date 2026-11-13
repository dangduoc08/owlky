import { defaultTheme, themeToCss } from "@owlky/tokens";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyThemeSettings,
  defaultThemeSettings,
  normalizeThemeSettings,
  readThemeSettings,
  resetThemeSettings,
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

describe("normalizeThemeSettings", () => {
  it("keeps valid values and replaces anything else with the default", () => {
    expect(normalizeThemeSettings({ mode: "dark", fontSize: 14 })).toEqual({
      mode: "dark",
      fontSize: 14,
    });
    expect(normalizeThemeSettings({ mode: "x", fontSize: 30 })).toEqual(defaultThemeSettings);
    expect(normalizeThemeSettings({ fontSize: 13.5 }).fontSize).toBe(16);
    expect(normalizeThemeSettings("nope")).toEqual(defaultThemeSettings);
    expect(normalizeThemeSettings(null)).toEqual(defaultThemeSettings);
  });

  it("ignores prototype keys and removed settings (S5)", () => {
    const result = normalizeThemeSettings(
      JSON.parse('{"__proto__":{"polluted":1},"mode":"system","preset":"blue","font":"inter"}'),
    );
    expect(result.mode).toBe("system");
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(Object.keys(result)).toEqual(["mode", "fontSize"]);
  });
});

describe("applyThemeSettings", () => {
  it("sets the mode and the root font size; the default size removes it; returns the settings", () => {
    const applied = applyThemeSettings({ mode: "dark", fontSize: 18 });
    expect(applied).toEqual({ mode: "dark", fontSize: 18 });
    expect(html.dataset["okTheme"]).toBe("dark");
    expect(html.style.fontSize).toBe("18px");
    expect(getComputedStyle(html).fontSize).toBe("18px");
    // Partial updates keep the rest.
    expect(applyThemeSettings({ fontSize: 16 })).toEqual({ mode: "dark", fontSize: 16 });
    expect(html.style.fontSize).toBe("");
    applyThemeSettings({ mode: "light" });
    expect(html.dataset["okTheme"]).toBe("light");
  });

  it("targets a nested scope; the font size always applies to the page", () => {
    const scope = document.createElement("div");
    document.body.append(scope);
    applyThemeSettings({ mode: "dark", fontSize: 12 }, { target: scope });
    expect(scope.dataset["okTheme"]).toBe("dark");
    expect(html.hasAttribute("data-ok-theme")).toBe(false);
    expect(html.style.fontSize).toBe("12px");
    expect(readThemeSettings({ target: scope })).toEqual({ mode: "dark", fontSize: 12 });
    scope.remove();
  });

  it("stores only when a storage is given; reads it back; reset forgets it", () => {
    const storage = memoryStorage();
    applyThemeSettings({ mode: "dark" });
    expect(storage.data.size).toBe(0);
    applyThemeSettings({ mode: "system" }, { storage });
    expect(JSON.parse(storage.data.get(THEME_SETTINGS_KEY) as string)).toMatchObject({
      mode: "system",
    });
    html.setAttribute("data-ok-theme", "light");
    expect(readThemeSettings({ storage }).mode).toBe("system");
    applyThemeSettings({ fontSize: 14 }, { storage, key: "custom" });
    expect(storage.data.has("custom")).toBe(true);
    expect(resetThemeSettings({ storage })).toEqual(defaultThemeSettings);
    expect(storage.data.has(THEME_SETTINGS_KEY)).toBe(false);
    expect(html.dataset["okTheme"]).toBe("light");
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
    expect(readThemeSettings({ storage: broken })).toEqual({ mode: "dark", fontSize: 16 });
  });
});

describe("scheme tokens resolve against the nearest scheme", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.replaceChildren();
  });

  /** Computed `color` of `value` on the innermost element. */
  function color(html: string, value: string): number[] {
    style.textContent = themeToCss(defaultTheme);
    document.head.append(style);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const probe = host.querySelector("#probe") as HTMLElement;
    probe.style.color = value;
    const computed = getComputedStyle(probe).color;
    // color-mix() may serialize as color(srgb …): compare the channels.
    const channels = computed.match(/[\d.]+/g)?.map(Number) ?? [];
    const rgb = computed.startsWith("color(") ? channels.map((c) => Math.round(c * 255)) : channels;
    return rgb.slice(0, 3);
  }

  it.each([
    ["light", '<span id="probe"></span>', [0, 120, 103], [28, 37, 46]],
    [
      "dark",
      '<div data-ok-theme="dark"><span id="probe"></span></div>',
      [91, 228, 155],
      [255, 255, 255],
    ],
    [
      "light inside dark",
      '<div data-ok-theme="dark"><div data-ok-theme="light"><span id="probe"></span></div></div>',
      [0, 120, 103],
      [28, 37, 46],
    ],
  ])("%s: primary text tone and focus ring", (_, html, text, ring) => {
    expect(color(html, "var(--ok-palette-primary-text)")).toEqual(text);
    expect(color(html, "var(--ok-focus-ring-color)")).toEqual(ring);
    expect(color(html, "var(--ok-focus-ring-color-brand)")).toEqual([0, 167, 111]);
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
    expect(plain).toContain("rgb(0, 167, 111)");
    const lightPaper = image('<span id="probe"></span>', "var(--ok-gradient-paper)");
    const darkPaper = image(
      '<div data-ok-theme="dark"><span id="probe"></span></div>',
      "var(--ok-gradient-paper)",
    );
    expect(lightPaper).toMatch(/radial-gradient/);
    expect(lightPaper).not.toBe(darkPaper);
  });
});
