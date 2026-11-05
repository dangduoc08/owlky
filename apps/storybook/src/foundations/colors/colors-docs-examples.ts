import { componentColorNames, greyShades, paletteColorNames } from "@owlky/tokens";
import { CDN, codeList, type GuideSection } from "../shared/guide.js";

/*
 * Content of the Colors docs page: prose (Markdown) and HTML / React examples. Every `--ok-*`
 * variable and Tailwind color class used here is checked against the built CSS
 * (e2e/tests/foundations.spec.ts). Writing style: AGENTS.md → "Writing documentation".
 */

const list = codeList;

export const SHADES = ["lighter", "light", "main", "dark", "darker", "contrast-text"] as const;

export const colorsDocsSections: GuideSection[] = [
  {
    id: "palette",
    title: "Palette",
    body: `Owlky has six palette colors: ${list(paletteColorNames)}. Each color comes in five shades, from \`lighter\` to \`darker\`. The \`main\` shade is the color itself, and \`contrast-text\` is the text color to use on top of it.

Each color also has a \`text\` tone. Use it for colored text on the page background: it stays readable in both light and dark themes.

For neutral colors, use the \`grey\` scale (${list(greyShades)}), \`common-black\` and \`common-white\`.

The stories in the sidebar show each palette in detail. Select a swatch to copy its hex value. The \`primary\` color follows the **Preset** menu in the toolbar.`,
  },
  {
    id: "tokens",
    title: "Token reference",
    body: `All colors are CSS custom properties that start with \`--ok-\`.

- **Palette shades:** \`--ok-palette-<color>-<shade>\`. For example, \`--ok-palette-primary-main\` or \`--ok-palette-grey-200\`.
- **Colored text:** \`--ok-palette-<color>-text\`.
- **Neutral text:** \`--ok-text-primary\`, \`--ok-text-secondary\` and \`--ok-text-disabled\`.
- **Backgrounds:** \`--ok-bg-default\` for the page, \`--ok-bg-paper\` for cards and menus, and \`--ok-bg-neutral\` for subtle fills.
- **Lines:** \`--ok-divider\`.
- **Interaction states:** \`--ok-action-hover\`, \`--ok-action-selected\`, \`--ok-action-focus\`, \`--ok-action-disabled\` and \`--ok-action-disabled-bg\`.
- **Transparency:** each palette shade has a matching \`-channel\` variable that holds its RGB values, such as \`0 167 111\`.

Text, background, line and state colors change with the theme. Palette shades stay the same in every theme.`,
  },
  {
    id: "css",
    title: "Use colors in CSS",
    body: `Load the Owlky stylesheet once per page. You can then use the variables in any CSS rule, in both HTML and React projects.

To make a color transparent, combine its \`-channel\` variable with an alpha value: \`rgb(var(--ok-palette-primary-main-channel) / 0.16)\`. This works in every supported browser, unlike some \`color-mix()\` fallbacks that drop the transparency.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<style>
  .badge {
    padding: 2px 8px;
    border-radius: 6px;
    color: var(--ok-palette-primary-text);
    background-color: rgb(var(--ok-palette-primary-main-channel) / 0.16);
  }
</style>

<span class="badge">New</span>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";

export function Badge() {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 6,
        color: "var(--ok-palette-primary-text)",
        backgroundColor: "rgb(var(--ok-palette-primary-main-channel) / 0.16)",
      }}
    >
      New
    </span>
  );
}`,
  },
  {
    id: "components",
    title: "Set a component's color",
    body: `Most components have a color option. In HTML, set the \`data-ok-color\` attribute. In React, set the \`color\` prop.

The available colors are ${list(["inherit", ...componentColorNames])}. A few components add their own values, such as \`default\` for Icon button. Component colors come from the palette, so they follow the active theme and preset automatically.`,
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="success" data-ok-size="md">
  <span data-ok-button-label>Save</span>
</button>

<div role="alert" data-ok-alert data-ok-severity="warning" data-ok-variant="outlined" data-ok-color="warning">
  <div data-ok-alert-message>Your trial ends in 3 days.</div>
</div>`,
    react: `import { Alert, Button } from "@owlky/react";

export function TrialNotice() {
  return (
    <>
      <Button variant="contained" color="success">Save</Button>
      <Alert severity="warning" variant="outlined" icon={false}>
        Your trial ends in 3 days.
      </Alert>
    </>
  );
}`,
  },
  {
    id: "semantic",
    title: "Build surfaces that follow the theme",
    body: "For your own cards and panels, use the text, background and line colors instead of fixed palette shades. They change with the theme, so the same card works in light and dark mode without extra code.",
    html: `<style>
  .card {
    padding: 24px;
    border: 1px solid var(--ok-divider);
    border-radius: 16px;
    background-color: var(--ok-bg-paper);
    color: var(--ok-text-primary);
  }
  .card p {
    color: var(--ok-text-secondary);
  }
</style>

<article class="card">
  <h3>Storage</h3>
  <p>12 GB of 20 GB used</p>
</article>`,
    react: `const card = {
  padding: 24,
  border: "1px solid var(--ok-divider)",
  borderRadius: 16,
  backgroundColor: "var(--ok-bg-paper)",
  color: "var(--ok-text-primary)",
};

export function StorageCard() {
  return (
    <article style={card}>
      <h3>Storage</h3>
      <p style={{ color: "var(--ok-text-secondary)" }}>12 GB of 20 GB used</p>
    </article>
  );
}`,
  },
  {
    id: "tailwind",
    title: "Use Tailwind CSS utilities",
    body: "If your project uses Tailwind CSS v4, import the Owlky theme after Tailwind. Every palette shade and theme color then becomes a utility class, such as `bg-primary`, `text-primary-dark`, `bg-grey-200`, `text-text-secondary`, `bg-paper` and `border-divider`.",
    html: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

<!-- In your HTML -->
<p class="rounded-md bg-primary-lighter px-2 text-primary-darker">Tailwind + Owlky colors</p>`,
    react: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

// In your component
<p className="rounded-md bg-primary-lighter px-2 text-primary-darker">Tailwind + Owlky colors</p>`,
  },
  {
    id: "javascript",
    title: "Read colors in JavaScript",
    body: `Some code needs color values directly, for example to draw a chart on a canvas. You have two options:

- **Read the CSS variable** to get the color that is on screen now. This value follows the active theme and preset.
- **Import the default values** from \`@owlky/tokens\`. These values are fixed: they don't change with the theme or preset.`,
    html: `<script type="module">
  // The default value (bare imports need a bundler or an import map)
  import { defaultTheme } from "@owlky/tokens";

  const brand = defaultTheme.palette.primary.main; // "#00A76F"

  // The color on screen now (follows the theme and preset)
  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue("--ok-palette-primary-main").trim();
</script>`,
    react: `import { defaultTheme } from "@owlky/tokens";
import { useEffect, useState } from "react";

export function usePrimaryColor() {
  // The default value, until the page is rendered
  const [color, setColor] = useState(defaultTheme.palette.primary.main);
  useEffect(() => {
    // The color on screen now (follows the theme and preset)
    const styles = getComputedStyle(document.documentElement);
    setColor(styles.getPropertyValue("--ok-palette-primary-main").trim());
  }, []);
  return color;
}`,
  },
  {
    id: "themes",
    title: "Switch themes and presets",
    body: `Two attributes control the colors of a page or a part of it:

- \`data-ok-theme\` sets the theme: \`light\` or \`dark\`.
- \`data-ok-preset\` changes the primary color, for example to \`cyan\`.

Put them on the \`<html>\` element to style the whole page, or on any element to style only its content. You can nest them, for example to show a light panel inside a dark page.

To change them from code, call \`applyThemeSettings()\`. Pass a storage, such as \`localStorage\`, to remember the user's choice.`,
    html: `<html data-ok-theme="dark" data-ok-preset="cyan">
  <body>
    <!-- A light panel inside the dark page -->
    <section data-ok-theme="light">…</section>
  </body>
</html>

<script type="module">
  import { applyThemeSettings } from "@owlky/html";

  applyThemeSettings({ mode: "dark", preset: "cyan" }, { storage: localStorage });
</script>`,
    react: `import { applyThemeSettings } from "@owlky/react";

// For example, in the click handler of a theme switch
applyThemeSettings({ mode: "dark", preset: "cyan" }, { storage: localStorage });

// A light panel with its own primary color
export function Panel() {
  return <section data-ok-theme="light" data-ok-preset="purple">…</section>;
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Neutral text colors and the \`text\` tone of each palette color meet WCAG 2.2 level AA (a contrast ratio of at least 4.5:1) on the theme backgrounds, in light and dark mode.
- Filled components use \`contrast-text\` on the \`main\` shade. Some of these brand combinations are below 4.5:1, so avoid them for long text.
- To check your own color pairs, use \`contrastRatio(foreground, background)\` from \`@owlky/tokens\`.
- To place text on any color, let \`getContrastText(color, ["#FFFFFF", "#000000"])\` choose between white and black. The result always has a contrast ratio of at least 4.58:1.
- Don't rely on color alone to convey meaning. Add text or an icon, as Alert does.`,
  },
];
