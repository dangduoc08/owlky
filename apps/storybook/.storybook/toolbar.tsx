/** @jsxRuntime classic */
import { fontSizeRange } from "@owlky/tokens";
// The manager provides React (classic JSX): a bundled jsx-runtime would be a second React copy.
// biome-ignore lint/correctness/noUnusedImports: classic JSX compiles to React.createElement.
import React from "react";
import { Select } from "storybook/internal/components";
import { addons, types, useGlobals } from "storybook/manager-api";

/*
 * Toolbar tools: Framework (ADR-0018) and the theme settings (ADR-0070: Theme, Font size), with
 * icons and explicit labels. The globals are declared in preview.tsx (`globalTypes`, no default toolbar).
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

/** Framework logos (brand colors), drawn inline. */
const ReactLogo = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="-11.5 -10.23 23 20.46">
    <circle r="2.05" fill="#61DAFB" />
    <g fill="none" stroke="#61DAFB" strokeWidth="1">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const HtmlLogo = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
    <path fill="#E34F26" d="M3 2h18l-1.64 18.36L12 22l-7.36-1.64z" />
    <path fill="#EF652A" d="M12 3.5v16.94l5.95-1.65L19.36 3.5z" />
    <path
      fill="#FFFFFF"
      d="M7.2 6.2h9.6l-.18 2H9.33l.17 2.1h6.94l-.53 5.97L12 17.3l-3.9-1.03-.27-3h1.97l.13 1.5 2.07.56 2.08-.56.22-2.5H7.75z"
    />
  </svg>
);

const FRAMEWORKS = [
  { value: "react", title: "React", icon: <ReactLogo /> },
  { value: "html", title: "HTML", icon: <HtmlLogo /> },
];

const THEMES = [
  { value: "light", title: "Light", icon: <Svg d={SUN} /> },
  { value: "dark", title: "Dark", icon: <Svg d={MOON} /> },
];

const SIZES = Array.from(
  { length: fontSizeRange.max - fontSizeRange.min + 1 },
  (_, i) => fontSizeRange.min + i,
).map((size) => ({ value: String(size), title: `${size}px` }));

/** Which implementation component stories show (ADR-0018). */
function FrameworkTool() {
  const [globals, updateGlobals] = useGlobals();
  const value = globals["framework"] === "html" ? "html" : "react";
  return (
    <Select
      ariaLabel="Framework"
      padding="small"
      options={FRAMEWORKS}
      defaultOptions={value}
      icon={value === "html" ? <HtmlLogo /> : <ReactLogo />}
      onSelect={(framework) => updateGlobals({ framework })}
    >
      Framework
    </Select>
  );
}

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
  addons.add("owlky/framework", {
    type: types.TOOL,
    title: "Framework",
    match: inStory,
    render: FrameworkTool,
  });
  addons.add("owlky/theme", {
    type: types.TOOL,
    title: "Theme",
    match: inStory,
    render: ThemeTool,
  });
  addons.add("owlky/font-size", {
    type: types.TOOL,
    title: "Font size",
    match: inStory,
    render: FontSizeTool,
  });
});
