/*
 * Theme settings (ADR-0070 § 2): the mode and the root font size, applied as `data-ok-theme` and
 * the root `font-size`. Framework-free, shared by React and HTML. Nothing is stored unless the app
 * passes a storage. A brand color or font is a token override or a `createTheme()` theme.
 */
import { fontSizeRange } from "@owlky/tokens";

export const themeModes = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof themeModes)[number];

export interface ThemeSettings {
  mode: ThemeMode;
  /** Root font size in px (12–20); every size is in rem, so the whole page scales. */
  fontSize: number;
}

export const defaultThemeSettings: Readonly<ThemeSettings> = Object.freeze({
  mode: "light",
  fontSize: fontSizeRange.default,
});

/** Storage key used when the app passes a storage. */
export const THEME_SETTINGS_KEY = "owlky:theme-settings";

export type ThemeSettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface ThemeSettingsOptions {
  /** Element that gets the attributes. Default: `document.documentElement`. */
  target?: HTMLElement | undefined;
  /** Where to keep the settings (e.g. `localStorage`). Default: nothing is stored. */
  storage?: ThemeSettingsStorage | null | undefined;
  /** Storage key. Default `THEME_SETTINGS_KEY`. */
  key?: string | undefined;
}

const pick = <V extends string>(values: readonly V[], value: unknown, fallback: V): V =>
  values.includes(value as V) ? (value as V) : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Valid settings from untrusted input (stored JSON, a query string…): unknown values → default. */
export function normalizeThemeSettings(input: unknown): ThemeSettings {
  const source = isRecord(input) ? input : {};
  const size = Number(source["fontSize"]);
  return {
    mode: pick(themeModes, source["mode"], defaultThemeSettings.mode),
    fontSize:
      Number.isInteger(size) && size >= fontSizeRange.min && size <= fontSizeRange.max
        ? size
        : defaultThemeSettings.fontSize,
  };
}

const root = () => document.documentElement;

/** The settings currently applied to `target` (attributes) and the page (font size). */
function fromDom(target: HTMLElement): ThemeSettings {
  return normalizeThemeSettings({
    mode: target.getAttribute("data-ok-theme"),
    fontSize: Number.parseFloat(root().style.fontSize) || undefined,
  });
}

function stored(options: ThemeSettingsOptions): unknown {
  try {
    const raw = options.storage?.getItem(options.key ?? THEME_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined; // storage blocked or invalid JSON
  }
}

/** Settings from the storage when one is given and holds a value, otherwise from the DOM. */
export function readThemeSettings(options: ThemeSettingsOptions = {}): ThemeSettings {
  const saved = stored(options);
  return saved === undefined ? fromDom(options.target ?? root()) : normalizeThemeSettings(saved);
}

/**
 * Applies (and stores, when a storage is given) the settings. Missing keys keep their current
 * value; invalid ones fall back to the default. The mode is always explicit; the default font size
 * removes the root style. Returns the applied settings.
 */
export function applyThemeSettings(
  settings: Partial<ThemeSettings> = {},
  options: ThemeSettingsOptions = {},
): ThemeSettings {
  const target = options.target ?? root();
  const next = normalizeThemeSettings({ ...fromDom(target), ...settings });
  target.setAttribute("data-ok-theme", next.mode);
  // CSSOM, not a style attribute string: works under a strict CSP.
  root().style.fontSize =
    next.fontSize === defaultThemeSettings.fontSize ? "" : `${next.fontSize}px`;
  try {
    options.storage?.setItem(options.key ?? THEME_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the settings still apply to the page.
  }
  return next;
}

/** Back to the defaults; forgets the stored settings. */
export function resetThemeSettings(options: ThemeSettingsOptions = {}): ThemeSettings {
  try {
    options.storage?.removeItem(options.key ?? THEME_SETTINGS_KEY);
  } catch {
    // Storage blocked: nothing to forget.
  }
  return applyThemeSettings(defaultThemeSettings, { ...options, storage: null });
}
