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
  for (const name of ["data-ok-theme", "data-ok-preset", "data-ok-font"])
    html.removeAttribute(name);
  html.style.fontSize = "";
});

describe("normalizeThemeSettings", () => {
  it("keeps valid values and replaces anything else with the default", () => {
    expect(
      normalizeThemeSettings({ mode: "dark", preset: "red", font: "inter", fontSize: 14 }),
    ).toEqual({
      mode: "dark",
      preset: "red",
      font: "inter",
      fontSize: 14,
    });
    expect(normalizeThemeSettings({ mode: "x", preset: '"><img>', font: 1, fontSize: 30 })).toEqual(
      defaultThemeSettings,
    );
    expect(normalizeThemeSettings({ fontSize: 13.5 }).fontSize).toBe(16);
    expect(normalizeThemeSettings("nope")).toEqual(defaultThemeSettings);
    expect(normalizeThemeSettings(null)).toEqual(defaultThemeSettings);
  });

  it("ignores prototype keys (S5)", () => {
    const result = normalizeThemeSettings(
      JSON.parse('{"__proto__":{"polluted":1},"preset":"blue"}'),
    );
    expect(result.preset).toBe("blue");
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(Object.keys(result)).toEqual(["mode", "preset", "font", "fontSize"]);
  });
});

describe("applyThemeSettings", () => {
  it("sets attributes and the root font size; defaults remove them; returns the settings", () => {
    const applied = applyThemeSettings({
      mode: "dark",
      preset: "purple",
      font: "dm-sans",
      fontSize: 18,
    });
    expect(applied).toEqual({ mode: "dark", preset: "purple", font: "dm-sans", fontSize: 18 });
    expect(html.dataset).toMatchObject({ okTheme: "dark", okPreset: "purple", okFont: "dm-sans" });
    expect(html.style.fontSize).toBe("18px");
    expect(getComputedStyle(html).fontSize).toBe("18px");
    // Partial updates keep the rest.
    expect(applyThemeSettings({ preset: "default" })).toMatchObject({
      mode: "dark",
      font: "dm-sans",
    });
    expect(html.hasAttribute("data-ok-preset")).toBe(false);
    applyThemeSettings({ font: "public-sans", fontSize: 16, mode: "light" });
    expect(html.hasAttribute("data-ok-font")).toBe(false);
    expect(html.style.fontSize).toBe("");
    expect(html.dataset["okTheme"]).toBe("light");
  });

  it("targets a nested scope; the font size always applies to the page", () => {
    const scope = document.createElement("div");
    document.body.append(scope);
    applyThemeSettings({ preset: "orange", fontSize: 12 }, { target: scope });
    expect(scope.dataset["okPreset"]).toBe("orange");
    expect(html.hasAttribute("data-ok-preset")).toBe(false);
    expect(html.style.fontSize).toBe("12px");
    expect(readThemeSettings({ target: scope })).toMatchObject({ preset: "orange", fontSize: 12 });
    scope.remove();
  });

  it("stores only when a storage is given; reads it back; reset forgets it", () => {
    const storage = memoryStorage();
    applyThemeSettings({ preset: "cyan" });
    expect(storage.data.size).toBe(0);
    applyThemeSettings({ preset: "blue" }, { storage });
    expect(JSON.parse(storage.data.get(THEME_SETTINGS_KEY) as string)).toMatchObject({
      preset: "blue",
    });
    html.removeAttribute("data-ok-preset");
    expect(readThemeSettings({ storage }).preset).toBe("blue");
    applyThemeSettings({ preset: "red" }, { storage, key: "custom" });
    expect(storage.data.has("custom")).toBe(true);
    expect(resetThemeSettings({ storage })).toEqual(defaultThemeSettings);
    expect(storage.data.has(THEME_SETTINGS_KEY)).toBe(false);
    expect(html.hasAttribute("data-ok-preset")).toBe(false);
  });

  it("survives blocked storage and invalid stored JSON", () => {
    const blocked = memoryStorage(true);
    expect(applyThemeSettings({ preset: "red" }, { storage: blocked }).preset).toBe("red");
    expect(readThemeSettings({ storage: blocked }).preset).toBe("red"); // from the DOM
    expect(resetThemeSettings({ storage: blocked })).toEqual(defaultThemeSettings);
    const broken = memoryStorage();
    broken.data.set(THEME_SETTINGS_KEY, "{oops");
    expect(readThemeSettings({ storage: broken })).toEqual(defaultThemeSettings);
    broken.data.set(THEME_SETTINGS_KEY, '{"preset":"nope","mode":"dark"}');
    expect(readThemeSettings({ storage: broken })).toMatchObject({
      preset: "default",
      mode: "dark",
    });
  });
});

describe("preset scopes resolve against the nearest preset and scheme", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.replaceChildren();
  });

  /** Computed `color` of `var(--ok-palette-primary-text)` on the innermost element. */
  function textColor(html: string): string {
    style.textContent = themeToCss(defaultTheme);
    document.head.append(style);
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const probe = host.querySelector("#probe") as HTMLElement;
    probe.style.color = "var(--ok-palette-primary-text)";
    return getComputedStyle(probe).color;
  }

  it.each([
    ["default light", '<span id="probe"></span>', "rgb(0, 120, 103)"],
    ["preset", '<div data-ok-preset="cyan"><span id="probe"></span></div>', "rgb(3, 81, 171)"],
    [
      "preset inside dark",
      '<div data-ok-theme="dark"><div data-ok-preset="cyan"><span id="probe"></span></div></div>',
      "rgb(104, 205, 249)",
    ],
    [
      "dark inside preset",
      '<div data-ok-preset="cyan"><div data-ok-theme="dark"><span id="probe"></span></div></div>',
      "rgb(104, 205, 249)",
    ],
    [
      "preset and dark on one element",
      '<div data-ok-preset="red" data-ok-theme="dark"><span id="probe"></span></div>',
      "rgb(255, 193, 172)",
    ],
    [
      "default preset resets inside another",
      '<div data-ok-preset="red"><div data-ok-preset="default"><span id="probe"></span></div></div>',
      "rgb(0, 120, 103)",
    ],
  ])("%s", (_, html, expected) => {
    const color = textColor(html);
    // color-mix() may serialize as color(srgb …): compare the channels.
    const channels = color.match(/[\d.]+/g)?.map(Number) ?? [];
    const rgb = color.startsWith("color(") ? channels.map((c) => Math.round(c * 255)) : channels;
    expect(rgb.slice(0, 3)).toEqual(expected.match(/\d+/g)?.map(Number));
  });
});
