/** @jsxRuntime classic */
import {
  fontSizeRange,
  type PrimaryPreset,
  primaryPresetNames,
  primaryPresets,
} from "@owlky/tokens";
// The manager provides React (classic JSX): a bundled jsx-runtime would be a second React copy.
// biome-ignore lint/correctness/noUnusedImports: classic JSX compiles to React.createElement.
import React from "react";
import { Select } from "storybook/internal/components";
import { addons, types, useGlobals } from "storybook/manager-api";

/*
 * Toolbar tools for the theme settings (ADR-0017): Theme, Preset and Font size, with icons and
 * explicit labels. The globals are declared in preview.tsx (`globalTypes`, no default toolbar).
 */

const Svg = ({ d }: { d: string }) => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const SUN =
  "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4";
const MOON = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z";
const TEXT = "M4 7V4h16v3M9 20h6M12 4v16";

const THEMES = [
  { value: "light", title: "Light", icon: <Svg d={SUN} /> },
  { value: "dark", title: "Dark", icon: <Svg d={MOON} /> },
];

const presetTitle = (name: PrimaryPreset) => name[0]?.toUpperCase() + name.slice(1);

const Swatch = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: 12,
      height: 12,
      borderRadius: "50%",
      backgroundColor: color,
    }}
  />
);

const PRESETS = primaryPresetNames.map((name) => ({
  value: name,
  title: presetTitle(name),
  icon: <Swatch color={primaryPresets[name].main} />,
}));

const SIZES = Array.from(
  { length: fontSizeRange.max - fontSizeRange.min + 1 },
  (_, i) => fontSizeRange.min + i,
).map((size) => ({ value: String(size), title: `${size}px` }));

function ThemeTool() {
  const [globals, updateGlobals] = useGlobals();
  const value = globals["theme"] === "dark" ? "dark" : "light";
  return (
    <Select
      ariaLabel="Theme"
      padding="small"
      options={THEMES}
      defaultOptions={value}
      icon={THEMES.find((theme) => theme.value === value)?.icon}
      onSelect={(theme) => updateGlobals({ theme })}
    >
      Theme
    </Select>
  );
}

function PresetTool() {
  const [globals, updateGlobals] = useGlobals();
  const value = (globals["preset"] as PrimaryPreset | undefined) ?? "default";
  return (
    <Select
      ariaLabel="Primary color preset"
      padding="small"
      options={PRESETS}
      defaultOptions={value}
      icon={<Swatch color={primaryPresets[value]?.main ?? primaryPresets.default.main} />}
      onSelect={(preset) => updateGlobals({ preset })}
    >
      Preset
    </Select>
  );
}

function FontSizeTool() {
  const [globals, updateGlobals] = useGlobals();
  const value = String(globals["fontSize"] ?? fontSizeRange.default);
  return (
    <Select
      ariaLabel="Root font size"
      padding="small"
      options={SIZES}
      defaultOptions={value}
      icon={<Svg d={TEXT} />}
      showSelectedOptionTitle={false}
      onSelect={(fontSize) => updateGlobals({ fontSize })}
    >
      {`Font size: ${value}px`}
    </Select>
  );
}

const inStory = ({ viewMode }: { viewMode?: string | undefined }) =>
  viewMode === "story" || viewMode === "docs";

addons.register("owlky/theme-settings", () => {
  addons.add("owlky/theme", {
    type: types.TOOL,
    title: "Theme",
    match: inStory,
    render: ThemeTool,
  });
  addons.add("owlky/preset", {
    type: types.TOOL,
    title: "Preset",
    match: inStory,
    render: PresetTool,
  });
  addons.add("owlky/font-size", {
    type: types.TOOL,
    title: "Font size",
    match: inStory,
    render: FontSizeTool,
  });
});
