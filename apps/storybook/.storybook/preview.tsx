// Each style's fonts (ADR-0070 § 1; Owlky itself doesn't bundle fonts): Soft, the default, uses
// Nunito, Swiss Inter, Bauhaus Montserrat, Brutalism IBM Plex Mono (no variable build: one file
// per weight), Neo-Brutalism Space Grotesk, Editorial Noto Serif Display / Source Serif 4 / Archivo,
// Minimal Mono Inter, Corporate IBM Plex Sans, Nordic Manrope. A browser only downloads the fonts a
// page renders.
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource-variable/archivo";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/noto-serif-display";
import "@fontsource-variable/nunito";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/space-grotesk";
import "./preview.css";
import { applyThemeSettings, fontSizeRange, themeStyles } from "@owlky/core";
import { components, getRuntime, illustration } from "@owlky/html";
import type { Preview } from "@storybook/react-vite";
import { trackFrameworkGlobal } from "../src/helpers/framework-global.js";
import { DEFAULT_FRAMEWORK } from "../src/helpers/groups.js";

// The real HTML runtime runs in every story (started explicitly, as an npm user would). React
// components opt out via data-ok-runtime="off", so both implementations coexist on one page.
// The Illustration runtime is opt-in (`@owlky/html/illustrations`, ADR-0041): registered here too.
getRuntime()
  .register(...components, illustration)
  .start();
trackFrameworkGlobal();

// The opt-in style sheets (ADR-0073) must come after the core tokens of preview.css, as an app
// links them after owlky.css: their shadow switch wins by source order. A bundled CSS import may
// land before preview.css in the build, so they are appended to <head> as <style> elements.
// Built by `pnpm build`; a new style needs no change here.
const styleSheets = import.meta.glob<string>(
  ["../../../packages/styles/dist/styles/*.css", "!../../../packages/styles/dist/styles/*.min.css"],
  { eager: true, query: "?inline", import: "default" },
);
for (const css of Object.values(styleSheets)) {
  const element = document.createElement("style");
  element.textContent = css;
  document.head.append(element);
}

const isStyle = (value: unknown): value is (typeof themeStyles)[number] =>
  typeof value === "string" && (themeStyles as readonly string[]).includes(value);

const preview: Preview = {
  // Theme and theme settings (ADR-0070), applied to <html> like an app would. Toolbar: Theme and
  // Font size are custom tools (.storybook/toolbar.tsx).
  globalTypes: {
    framework: { description: "Implementation shown by component stories (ADR-0018)" },
    theme: { description: "Color scheme (data-ok-theme)" },
    fontSize: { description: "Root font size (rem scale)" },
    // No toolbar menu until ST5: set it in the URL (`&globals=style:swiss`), or per story with
    // `parameters: { style: "swiss" }`, which wins.
    style: { description: "Design style (data-ok-style)" },
  },
  initialGlobals: {
    framework: DEFAULT_FRAMEWORK,
    theme: "light",
    fontSize: String(fontSizeRange.default),
    style: "soft",
  },
  decorators: [
    (Story, { globals, parameters }) => {
      document.documentElement.dataset["okTheme"] = globals["theme"] === "dark" ? "dark" : "light";
      const style = [parameters["style"], globals["style"]].find(isStyle) ?? "soft";
      applyThemeSettings({ fontSize: Number(globals["fontSize"]), style });
      return <Story />;
    },
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
      // Sections in a fixed order; components (and the ones grouped in a folder) alphabetically;
      // a component's stories keep their file order (the reference page's sections).
      // Self-contained: Storybook serializes this function.
      storySort: (a, b) => {
        const sections = ["Introduction", "Foundations", "Components"];
        const foundations = ["Colors", "Typography", "Shadows", "Grid", "Icons", "Settings"];
        const [sectionA = "", nameA = ""] = a.title.split("/");
        const [sectionB = "", nameB = ""] = b.title.split("/");
        const bySection = sections.indexOf(sectionA) - sections.indexOf(sectionB);
        if (bySection !== 0) return bySection;
        if (sectionA === "Foundations")
          return foundations.indexOf(nameA) - foundations.indexOf(nameB);
        return a.title.localeCompare(b.title, "en", { sensitivity: "base" });
      },
    },
  },
};

export default preview;
