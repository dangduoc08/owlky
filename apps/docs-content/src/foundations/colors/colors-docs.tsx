"use client";

import { Alert, Button, Paper, Typography } from "@owlky/react";
import {
  contrastRatio,
  defaultTheme,
  getContrastText,
  greyShades,
  type PrimaryPreset,
  paletteColorNames,
  primaryPresetNames,
} from "@owlky/tokens";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Dot, GuideSections, Preview } from "../../guide/guide.js";
import { capitalize } from "../../guide/text.js";
import { colorsDocsSections, SHADES } from "./colors-docs-examples.js";

/** Every palette as a strip of its five shades, the main shade larger. */
function PalettePreview() {
  return (
    <Preview className="grid! grid-cols-1 gap-3! sm:grid-cols-2">
      {paletteColorNames.map((name) => (
        <div key={name} className="flex items-center gap-3">
          <span className="w-20 text-[0.8125rem] font-semibold text-text-secondary">
            {capitalize(name)}
          </span>
          <span className="flex items-center gap-1">
            {SHADES.filter((s) => s !== "contrast-text").map((shade) => (
              <Dot
                key={shade}
                color={`var(--ok-palette-${name}-${shade})`}
                size={shade === "main" ? 32 : 22}
                label={`${name} ${shade}`}
              />
            ))}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <span className="w-20 text-[0.8125rem] font-semibold text-text-secondary">Grey</span>
        <span className="flex flex-wrap items-center gap-1">
          {greyShades.map((shade) => (
            <Dot
              key={shade}
              color={`var(--ok-palette-grey-${shade})`}
              size={22}
              label={`grey ${shade}`}
            />
          ))}
        </span>
      </div>
    </Preview>
  );
}

const SEMANTIC: { token: string; kind: "text" | "fill" | "line" }[] = [
  { token: "--ok-text-primary", kind: "text" },
  { token: "--ok-text-secondary", kind: "text" },
  { token: "--ok-text-disabled", kind: "text" },
  { token: "--ok-palette-primary-text", kind: "text" },
  { token: "--ok-bg-default", kind: "fill" },
  { token: "--ok-bg-paper", kind: "fill" },
  { token: "--ok-bg-neutral", kind: "fill" },
  { token: "--ok-divider", kind: "line" },
  { token: "--ok-action-hover", kind: "fill" },
  { token: "--ok-action-selected", kind: "fill" },
];

/** The theme-aware tokens, live: they change with the theme. */
function SemanticPreview() {
  return (
    <Preview className="grid! grid-cols-1 gap-2! sm:grid-cols-2">
      {SEMANTIC.map(({ token, kind }) => (
        <div key={token} className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            data-demo-disabled={token === "--ok-text-disabled" ? "" : undefined}
            className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-divider font-bold"
            style={{
              color: kind === "text" ? `var(${token})` : undefined,
              backgroundColor: kind === "fill" ? `var(${token})` : undefined,
              borderColor: kind === "line" ? `var(${token})` : undefined,
              borderWidth: kind === "line" ? 3 : undefined,
            }}
          >
            {kind === "text" ? "Aa" : null}
          </span>
          <code className="min-w-0 break-all text-[0.8125rem]">{token}</code>
        </div>
      ))}
    </Preview>
  );
}

const badge = {
  padding: "2px 8px",
  borderRadius: 6,
  color: "var(--ok-palette-primary-text)",
  backgroundColor: "rgb(var(--ok-palette-primary-main-channel) / 0.16)",
};

function CssPreview() {
  return (
    <Preview>
      <span style={badge}>New</span>
      {paletteColorNames
        .filter((name) => name !== "primary")
        .map((name) => (
          <span
            key={name}
            style={{
              ...badge,
              color: `var(--ok-palette-${name}-text)`,
              backgroundColor: `rgb(var(--ok-palette-${name}-main-channel) / 0.16)`,
            }}
          >
            {capitalize(name)}
          </span>
        ))}
    </Preview>
  );
}

function ComponentsPreview() {
  return (
    <Preview className="flex-col items-stretch!">
      <div className="flex flex-wrap gap-3">
        {paletteColorNames.map((color) => (
          <Button key={color} variant="contained" color={color}>
            {capitalize(color)}
          </Button>
        ))}
      </div>
      <Alert severity="warning" variant="outlined" icon={false}>
        Your trial ends in 3 days.
      </Alert>
    </Preview>
  );
}

function SemanticCardPreview() {
  return (
    <Preview className="bg-neutral!">
      {(["light", "dark"] as const).map((theme) => (
        <article
          key={theme}
          data-ok-theme={theme}
          className="min-w-[12rem] flex-1 rounded-2xl border border-solid p-6"
          style={{
            borderColor: "var(--ok-divider)",
            backgroundColor: "var(--ok-bg-paper)",
            color: "var(--ok-text-primary)",
          }}
        >
          <h3 className="m-0 text-base">Storage · {theme}</h3>
          <p className="mb-0" style={{ color: "var(--ok-text-secondary)" }}>
            12 GB of 20 GB used
          </p>
        </article>
      ))}
    </Preview>
  );
}

const gradientTitle = {
  color: "transparent",
  backgroundImage: "var(--ok-gradient-primary-text)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
};

const gradientBorder = {
  padding: 24,
  border: "2px solid transparent",
  borderRadius: 16,
  background:
    "linear-gradient(var(--ok-bg-paper), var(--ok-bg-paper)) padding-box, var(--ok-gradient-secondary) border-box",
};

/** Gradient text in every palette color, and a gradient border, in both themes. */
function GradientTextPreview() {
  return (
    <Preview className="bg-neutral! items-stretch!">
      {(["light", "dark"] as const).map((theme) => (
        <div
          key={theme}
          data-ok-theme={theme}
          className="flex min-w-[14rem] flex-1 flex-col gap-3 rounded-2xl p-5"
          style={{ backgroundColor: "var(--ok-bg-paper)", color: "var(--ok-text-primary)" }}
        >
          <Typography variant="h3" component="p" style={gradientTitle}>
            Owlky UI
          </Typography>
          <div className="flex flex-wrap gap-x-3">
            {paletteColorNames
              .filter((name) => name !== "primary")
              .map((name) => (
                <Typography
                  key={name}
                  variant="subtitle1"
                  component="span"
                  style={{ ...gradientTitle, backgroundImage: `var(--ok-gradient-${name}-text)` }}
                >
                  {capitalize(name)}
                </Typography>
              ))}
          </div>
          <div style={gradientBorder}>
            <Typography variant="body2">A card with a gradient border.</Typography>
          </div>
        </div>
      ))}
    </Preview>
  );
}

/** Gradient fills (decorative) and the glass paper over a colorful backdrop. */
function GradientBackgroundPreview() {
  return (
    <Preview className="flex-col items-stretch!">
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {paletteColorNames.map((name) => (
          <span
            key={name}
            className="h-12 w-20 rounded-xl"
            style={{ backgroundImage: `var(--ok-gradient-${name})` }}
          />
        ))}
      </div>
      <div className="relative flex flex-wrap gap-4 p-4">
        <span
          aria-hidden="true"
          className="absolute top-2 left-6 size-24 rounded-full"
          style={{ backgroundImage: "var(--ok-gradient-warning)" }}
        />
        <span
          aria-hidden="true"
          className="absolute right-6 bottom-2 size-20 rounded-full"
          style={{ backgroundImage: "var(--ok-gradient-secondary)" }}
        />
        {(["light", "dark"] as const).map((theme) => (
          <div key={theme} data-ok-theme={theme} className="min-w-[12rem] flex-1">
            <Paper
              elevation={0}
              style={{
                overflow: "hidden",
                background: "var(--ok-gradient-paper)",
                WebkitBackdropFilter: "blur(20px)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ height: 64, backgroundImage: "var(--ok-gradient-info)" }} />
              <div style={{ padding: 24 }}>
                <Typography variant="h6" component="p">
                  Weekly report
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Glass paper over the page.
                </Typography>
              </div>
            </Paper>
          </div>
        ))}
      </div>
    </Preview>
  );
}

function TailwindPreview() {
  return (
    <Preview>
      <p className="m-0 rounded-md bg-primary-lighter px-2 text-primary-darker">
        Tailwind + Owlky colors
      </p>
      <p className="m-0 rounded-md bg-grey-200 px-2 text-grey-800">bg-grey-200</p>
      <p className="m-0 rounded-md border border-solid border-divider bg-paper px-2">bg-paper</p>
      <span aria-hidden="true" className="h-6 w-16 rounded-md bg-(image:--ok-gradient-primary)" />
    </Preview>
  );
}

/** Reads the active primary from the CSS variable (follows Preset and Theme). */
function JavaScriptPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  useEffect(() => {
    const read = () => {
      if (ref.current)
        setValue(
          getComputedStyle(ref.current).getPropertyValue("--ok-palette-primary-main").trim(),
        );
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  const brand = defaultTheme.palette.primary.main;
  return (
    <Preview>
      <div ref={ref} className="flex items-center gap-3">
        <Dot color="var(--ok-palette-primary-main)" size={40} />
        <div>
          <div className="text-[0.8125rem] text-text-secondary">
            Current value of --ok-palette-primary-main
          </div>
          <code>{value || "…"}</code>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 items-center rounded-lg px-3 font-semibold"
          style={{ backgroundColor: brand, color: getContrastText(brand, ["#FFFFFF", "#000000"]) }}
        >
          Aa
        </span>
        <div>
          <div className="text-[0.8125rem] text-text-secondary">
            Default value from @owlky/tokens
          </div>
          <code>{brand}</code>
        </div>
      </div>
    </Preview>
  );
}

function ThemesPreview() {
  const presets = primaryPresetNames.filter((name): name is PrimaryPreset => name !== "default");
  return (
    <Preview className="items-stretch!">
      <div
        data-ok-theme="dark"
        data-ok-preset="cyan"
        className="flex min-w-[14rem] flex-1 flex-col gap-3 rounded-2xl p-5"
        style={{ backgroundColor: "var(--ok-bg-default)", color: "var(--ok-text-primary)" }}
      >
        <span className="text-[0.8125rem]">Dark theme, cyan preset</span>
        <Button variant="contained" color="primary">
          Primary
        </Button>
        <div
          data-ok-theme="light"
          className="flex flex-col gap-2 rounded-xl p-4"
          style={{ backgroundColor: "var(--ok-bg-paper)", color: "var(--ok-text-primary)" }}
        >
          <span className="text-[0.8125rem]">Nested light theme</span>
          <Button variant="soft" color="primary">
            Primary
          </Button>
        </div>
      </div>
      <div className="flex min-w-[12rem] flex-1 flex-wrap content-start gap-2">
        {presets.map((preset) => (
          <span key={preset} data-ok-preset={preset}>
            <Button variant="contained" color="primary" size="sm">
              {capitalize(preset)}
            </Button>
          </span>
        ))}
      </div>
    </Preview>
  );
}

const PAIRS: { label: string; fg: string; bg: string }[] = [
  {
    label: "Text primary on paper",
    fg: defaultTheme.schemes.light.text.primary,
    bg: defaultTheme.schemes.light.background.paper,
  },
  {
    label: "Text secondary on paper",
    fg: defaultTheme.schemes.light.text.secondary,
    bg: defaultTheme.schemes.light.background.paper,
  },
  {
    label: "Contrast text on primary",
    fg: defaultTheme.palette.primary.contrastText,
    bg: defaultTheme.palette.primary.main,
  },
  {
    label: "Primary dark on paper",
    fg: defaultTheme.palette.primary.dark,
    bg: defaultTheme.schemes.light.background.paper,
  },
];

function AccessibilityPreview() {
  return (
    <Preview className="grid! grid-cols-1 gap-3! sm:grid-cols-2">
      {PAIRS.map(({ label, fg, bg }) => {
        const ratio = contrastRatio(fg, bg);
        const pass = ratio >= 4.5;
        return (
          <div key={label} className="flex items-center gap-3">
            <span
              data-demo-disabled={pass ? undefined : ""}
              className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-solid border-divider text-lg font-bold"
              style={{ color: fg, backgroundColor: bg }}
            >
              Aa
            </span>
            <div className="min-w-0">
              <div className="text-[0.8125rem]">{label}</div>
              <div className="text-[0.8125rem] text-text-secondary">
                {ratio.toFixed(2)}:1 · {pass ? "Meets AA" : "Large text only"}
              </div>
            </div>
          </div>
        );
      })}
    </Preview>
  );
}

export const colorsPreviews: Record<string, () => ReactNode> = {
  palette: PalettePreview,
  tokens: SemanticPreview,
  css: CssPreview,
  components: ComponentsPreview,
  semantic: SemanticCardPreview,
  tailwind: TailwindPreview,
  javascript: JavaScriptPreview,
  "gradient-text": GradientTextPreview,
  "gradient-background": GradientBackgroundPreview,
  themes: ThemesPreview,
  accessibility: AccessibilityPreview,
};

/** The Colors usage guide: its sections with live previews (the host adds the page title). */
export function ColorsGuide() {
  return <GuideSections sections={colorsDocsSections} previews={colorsPreviews} />;
}
