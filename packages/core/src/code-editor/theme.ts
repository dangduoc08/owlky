import type * as MonacoApi from "monaco-editor";
import { THEME_ATTRIBUTES } from "../theme/attributes.js";
import type { Monaco } from "./loader.js";

type ThemeData = MonacoApi.editor.IStandaloneThemeData;
export type CodeEditorScheme = "light" | "dark";

/** Owlky's Monaco themes, built from the `--ok-*` tokens of the editor's scope. */
export const OWLKY_THEMES = { light: "owlky-light", dark: "owlky-dark" } as const;

/** `"auto"` (default) follows the scope's `data-ok-theme`; any other name goes to Monaco as is. */
export type CodeEditorTheme = "auto" | (string & {});

const TOKENS = {
  background: "--ok-bg-paper",
  foreground: "--ok-text-primary",
  secondary: "--ok-text-secondary",
  disabled: "--ok-text-disabled",
  grey: "--ok-palette-grey-500",
  primary: "--ok-palette-primary-main",
  primaryText: "--ok-palette-primary-text",
  secondaryText: "--ok-palette-secondary-text",
  infoText: "--ok-palette-info-text",
  successText: "--ok-palette-success-text",
  warningText: "--ok-palette-warning-text",
  errorText: "--ok-palette-error-text",
  success: "--ok-palette-success-main",
  error: "--ok-palette-error-main",
  warning: "--ok-palette-warning-main",
  info: "--ok-palette-info-main",
} as const;
type Palette = Record<keyof typeof TOKENS, string>;

const hex2 = (value: number) =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");

/**
 * `#RRGGBB` (or `#RRGGBBAA`) of a computed color: `rgb()`, `rgba()` or `color(srgb …)` (engines
 * serialize `color-mix()` that way). Anything else → `null`.
 */
export function toHex(color: string): string | null {
  const srgb =
    /^color\(srgb\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)(?:\s*\/\s*([\d.e+-]+))?\)$/i.exec(
      color.trim(),
    );
  const rgb =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
      color.trim(),
    );
  let channels: number[];
  let alpha: number;
  if (srgb) {
    channels = [srgb[1], srgb[2], srgb[3]].map((each) => Number(each) * 255);
    alpha = srgb[4] === undefined ? 1 : Number(srgb[4]);
  } else if (rgb) {
    channels = [rgb[1], rgb[2], rgb[3]].map(Number);
    const a = rgb[4];
    alpha = a === undefined ? 1 : a.endsWith("%") ? Number(a.slice(0, -1)) / 100 : Number(a);
  } else return null;
  if (channels.some((each) => !Number.isFinite(each)) || !Number.isFinite(alpha)) return null;
  const base = `#${channels.map(hex2).join("")}`;
  return alpha >= 1 ? base : `${base}${hex2(alpha * 255)}`;
}

/** `#RRGGBB` + alpha (0–1) as `#RRGGBBAA`. */
const alpha = (hex: string, amount: number) => `${hex.slice(0, 7)}${hex2(amount * 255)}`;

/**
 * Reads the palette of `element`'s scope for one scheme: a probe child with `data-ok-theme`
 * resolves the tokens there (token overrides and nested scopes included), through CSSOM only.
 */
function readPalette(element: Element, scheme: CodeEditorScheme): Palette {
  const probe = document.createElement("span");
  probe.setAttribute("data-ok-theme", scheme);
  probe.setAttribute("aria-hidden", "true");
  probe.style.setProperty("display", "none");
  element.append(probe);
  const palette = {} as Palette;
  for (const [key, token] of Object.entries(TOKENS) as [keyof Palette, string][]) {
    probe.style.setProperty("color", `var(${token})`);
    // Engines compute every token used here (plain colors) to `rgb()`.
    palette[key] = toHex(getComputedStyle(probe).color) as string;
  }
  probe.remove();
  return palette;
}

/** Monaco theme data for one scheme, from the tokens of `element`'s scope. */
export function owlkyTheme(element: Element, scheme: CodeEditorScheme): ThemeData {
  const p = readPalette(element, scheme);
  const strip = (hex: string) => hex.slice(1, 7);
  const rules: ThemeData["rules"] = [
    { token: "", foreground: strip(p.foreground), background: strip(p.background) },
    { token: "comment", foreground: strip(p.secondary), fontStyle: "italic" },
    { token: "keyword", foreground: strip(p.secondaryText) },
    { token: "storage", foreground: strip(p.secondaryText) },
    { token: "string", foreground: strip(p.successText) },
    { token: "string.escape", foreground: strip(p.warningText) },
    { token: "regexp", foreground: strip(p.errorText) },
    { token: "number", foreground: strip(p.warningText) },
    { token: "constant", foreground: strip(p.warningText) },
    { token: "type", foreground: strip(p.infoText) },
    { token: "class", foreground: strip(p.infoText) },
    { token: "function", foreground: strip(p.primaryText) },
    { token: "variable", foreground: strip(p.foreground) },
    { token: "variable.predefined", foreground: strip(p.infoText) },
    { token: "tag", foreground: strip(p.errorText) },
    { token: "metatag", foreground: strip(p.errorText) },
    { token: "attribute.name", foreground: strip(p.warningText) },
    { token: "attribute.value", foreground: strip(p.successText) },
    { token: "key", foreground: strip(p.infoText) },
    { token: "string.key.json", foreground: strip(p.infoText) },
    { token: "string.value.json", foreground: strip(p.successText) },
    { token: "delimiter", foreground: strip(p.secondary) },
    { token: "operator", foreground: strip(p.secondary) },
    { token: "annotation", foreground: strip(p.primaryText) },
    { token: "invalid", foreground: strip(p.errorText) },
  ];
  return {
    base: scheme === "dark" ? "vs-dark" : "vs",
    inherit: true,
    rules,
    colors: {
      foreground: p.foreground,
      focusBorder: p.primary,
      "editor.background": p.background,
      "editor.foreground": p.foreground,
      "editorLineNumber.foreground": p.secondary,
      "editorLineNumber.activeForeground": p.foreground,
      "editorLineNumber.dimmedForeground": p.secondary,
      "editorCursor.foreground": p.primary,
      "editor.selectionBackground": alpha(p.primary, 0.24),
      "editor.inactiveSelectionBackground": alpha(p.grey, 0.16),
      "editor.lineHighlightBackground": alpha(p.grey, 0.08),
      "editor.lineHighlightBorder": alpha(p.grey, 0),
      "editorIndentGuide.background1": alpha(p.grey, 0.2),
      "editorIndentGuide.activeBackground1": alpha(p.grey, 0.48),
      "editorWhitespace.foreground": alpha(p.grey, 0.48),
      "editorWidget.background": p.background,
      "editorWidget.border": alpha(p.grey, 0.2),
      "editorHoverWidget.background": p.background,
      "editorHoverWidget.border": alpha(p.grey, 0.2),
      "editorSuggestWidget.background": p.background,
      "editorSuggestWidget.border": alpha(p.grey, 0.2),
      "editorSuggestWidget.foreground": p.foreground,
      "editorSuggestWidget.selectedBackground": alpha(p.grey, 0.16),
      "editorSuggestWidget.selectedForeground": p.foreground,
      "editorSuggestWidget.highlightForeground": p.primaryText,
      "editorSuggestWidget.focusHighlightForeground": p.primaryText,
      "list.hoverBackground": alpha(p.grey, 0.08),
      "list.activeSelectionBackground": alpha(p.grey, 0.16),
      "list.activeSelectionForeground": p.foreground,
      "list.inactiveSelectionBackground": alpha(p.grey, 0.16),
      "list.inactiveSelectionForeground": p.foreground,
      "list.focusBackground": alpha(p.grey, 0.16),
      "list.focusForeground": p.foreground,
      "list.highlightForeground": p.primaryText,
      "input.background": p.background,
      "input.foreground": p.foreground,
      "input.border": alpha(p.grey, 0.32),
      "inputOption.activeBorder": p.primary,
      "editorOverviewRuler.border": alpha(p.grey, 0),
      "scrollbarSlider.background": alpha(p.grey, 0.32),
      "scrollbarSlider.hoverBackground": alpha(p.grey, 0.48),
      "scrollbarSlider.activeBackground": alpha(p.grey, 0.64),
      "editorError.foreground": p.error,
      "editorWarning.foreground": p.warning,
      "editorInfo.foreground": p.info,
      "minimap.background": p.background,
      "editorGutter.background": p.background,
      "diffEditor.insertedTextBackground": alpha(p.success, 0.24),
      "diffEditor.removedTextBackground": alpha(p.error, 0.24),
      "diffEditor.insertedLineBackground": alpha(p.success, 0.12),
      "diffEditor.removedLineBackground": alpha(p.error, 0.12),
    },
  };
}

/** The color scheme of `element`'s scope (`data-ok-theme`, nested scopes, the system setting). */
export function schemeOf(element: Element): CodeEditorScheme {
  return getComputedStyle(element).getPropertyValue("--_ok-dark").trim() === "1" ? "dark" : "light";
}

/**
 * The Monaco theme name for `theme` at `element`: `"auto"` → `owlky-light` / `owlky-dark` for the
 * scope's scheme (defining both Owlky themes from its tokens); other names unchanged.
 */
export function applyTheme(monaco: Monaco, element: Element, theme: CodeEditorTheme): string {
  const name = theme === "auto" ? OWLKY_THEMES[schemeOf(element)] : theme;
  if (name === OWLKY_THEMES.light || name === OWLKY_THEMES.dark) {
    monaco.editor.defineTheme(OWLKY_THEMES.light, owlkyTheme(element, "light"));
    monaco.editor.defineTheme(OWLKY_THEMES.dark, owlkyTheme(element, "dark"));
  }
  monaco.editor.setTheme(name);
  return name;
}

interface ThemeClient {
  readonly element: Element;
  readonly monaco: Monaco;
  theme(): CodeEditorTheme;
}

/*
 * Monaco has one theme per page. The editor used last (focused, mounted or given a new theme)
 * picks it; a change of `data-ok-theme` / the system scheme re-applies it.
 */
const clients = new Set<ThemeClient>();
let current: ThemeClient | null = null;
let observers: { disconnect(): void } | null = null;
let scheduled = false;

function refresh() {
  scheduled = false;
  if (current) applyTheme(current.monaco, current.element, current.theme());
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(refresh);
}

function watch() {
  const scopes = new MutationObserver(schedule);
  scopes.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: [...THEME_ATTRIBUTES],
  });
  // `.dark` (Tailwind's convention) is read on the root elements only: classes change constantly.
  const classes = new MutationObserver(schedule);
  classes.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  classes.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", schedule);
  observers = {
    disconnect() {
      scopes.disconnect();
      classes.disconnect();
      media.removeEventListener("change", schedule);
    },
  };
}

/** Registers an editor with the page's theme: returns `use()` (make it current) and `release()`. */
export function themeClient(client: ThemeClient): { use(): void; release(): void } {
  clients.add(client);
  if (!observers) watch();
  return {
    use() {
      current = client;
      refresh();
    },
    release() {
      clients.delete(client);
      if (current === client) current = [...clients].at(-1) ?? null;
      if (clients.size === 0) {
        observers?.disconnect();
        observers = null;
      }
    },
  };
}
