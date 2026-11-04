import "@fontsource-variable/public-sans";
import "@fontsource-variable/inter";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/nunito-sans";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow/800.css";
import "./preview.css";
import {
  applyThemeSettings,
  fontFamilyPresetNames,
  fontSizeRange,
  primaryPresetNames,
} from "@owlky/core";
import { components, getRuntime } from "@owlky/html";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";

// The real HTML runtime runs in every story (started explicitly, as an npm user would). React
// components opt out via data-ok-runtime="off", so both implementations coexist on one page.
getRuntime()
  .register(...components)
  .start();

const label = (value: string) =>
  value.replace(
    /(^|-)([a-z])/g,
    (_, dash: string, c: string) => `${dash ? " " : ""}${c.toUpperCase()}`,
  );
const sizes = Array.from(
  { length: fontSizeRange.max - fontSizeRange.min + 1 },
  (_, i) => fontSizeRange.min + i,
);

const preview: Preview = {
  // Theme settings (ADR-0017) next to the theme switcher: applied to <html> like an app would.
  globalTypes: {
    preset: {
      description: "Primary color preset (data-ok-preset)",
      toolbar: {
        title: "Preset",
        icon: "paintbrush",
        items: primaryPresetNames.map((value) => ({ value, title: label(value) })),
        dynamicTitle: true,
      },
    },
    font: {
      description: "Font family (data-ok-font)",
      toolbar: {
        title: "Font",
        icon: "paragraph",
        items: fontFamilyPresetNames.map((value) => ({ value, title: label(value) })),
        dynamicTitle: true,
      },
    },
    fontSize: {
      description: "Root font size (rem scale)",
      toolbar: {
        title: "Size",
        icon: "zoom",
        items: sizes.map((value) => ({ value: String(value), title: `${value}px` })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    preset: "default",
    font: "public-sans",
    fontSize: String(fontSizeRange.default),
  },
  decorators: [
    (Story, { globals }) => {
      applyThemeSettings({
        preset: globals["preset"],
        font: globals["font"],
        fontSize: Number(globals["fontSize"]),
      });
      return <Story />;
    },
    withThemeByDataAttribute({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-ok-theme",
      parentSelector: "html",
    }),
  ],
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    a11y: { test: "error" },
    // "Code" panel under every story: the example's source (with imports) and a copy button.
    docs: { codePanel: true },
    // Controls show each prop's description and type, not only its control.
    controls: { expanded: true },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Foundations",
          ["Colors", "Typography", "Shadows", "Grid", "Icons", "Settings"],
          "React",
          "HTML",
        ],
      },
    },
  },
};

export default preview;
