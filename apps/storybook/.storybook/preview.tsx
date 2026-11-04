import "@fontsource-variable/public-sans";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow/800.css";
import "./preview.css";
import { components, getRuntime } from "@minimal-tailwind/html";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";

// The real HTML runtime runs in every story (started explicitly, as an npm user would). React
// components opt out via data-mt-runtime="off", so both implementations coexist on one page.
getRuntime()
  .register(...components)
  .start();

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-mt-theme",
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
          ["Colors", "Typography", "Shadows", "Grid", "Icons"],
          "React",
          "HTML",
        ],
      },
    },
  },
};

export default preview;
