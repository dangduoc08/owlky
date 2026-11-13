import { componentColorNames, greyShades, paletteColorNames } from "@owlky/tokens";
import { CDN, codeList, type GuideSection } from "../../guide/text.js";

/*
 * Content of the Colors docs page: prose (Markdown) and HTML / React examples. Every `--ok-*`
 * variable and Tailwind color class used here is checked against the built CSS
 * (e2e/tests/foundations.spec.ts). Writing style: AGENTS.md → "Writing documentation".
 */

const list = codeList;

export const SHADES = ["lighter", "light", "main", "dark", "darker", "contrast-text"] as const;

const PALETTE_BODY = `Owlky has six palette colors: ${list(paletteColorNames)}. Each color comes in five shades, from \`lighter\` to \`darker\`. The \`main\` shade is the color itself, and \`contrast-text\` is the text color to use on top of it.

Each color also has a \`text\` tone. Use it for colored text on the page background: it stays readable in both light and dark themes.

For neutral colors, use the \`grey\` scale (${list(greyShades)}), \`common-black\` and \`common-white\`.`;

export const colorsDocsSections: GuideSection[] = [
  {
    id: "palette",
    title: "Palette",
    body: `${PALETTE_BODY}

The stories in the sidebar show each palette in detail. Select a swatch to copy its hex value.`,
    bodyByHost: {
      website: PALETTE_BODY,
    },
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
- **Gradients:** \`--ok-gradient-<color>\` for fills, \`--ok-gradient-<color>-text\` for text and \`--ok-gradient-paper\` for translucent paper.

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
    id: "gradient-text",
    title: "Add gradient text and borders",
    body: `Each palette color has two gradients. They are \`background-image\` values, so you can use them anywhere CSS takes an image.

- **Text:** \`--ok-gradient-<color>-text\` runs from the color's \`text\` tone to a deeper shade: \`darker\` in the light theme and \`lighter\` in the dark theme. Every point of it reaches a contrast ratio of at least 4.5:1 on the theme's backgrounds. Clip it to the text with \`background-clip: text\` and make the text color transparent.
- **Fill:** \`--ok-gradient-<color>\` runs from the \`light\` shade to the \`main\` shade. For a gradient border, paint the paper color on the padding box and the gradient on the border box, under a transparent border.

The gradients follow the palette, and the text gradients follow the theme, like the palette colors they come from.`,
    html: `<style>
  .gradient-title {
    color: transparent;
    background-image: var(--ok-gradient-primary-text);
    -webkit-background-clip: text;
    background-clip: text;
  }
  .gradient-border {
    padding: 24px;
    border: 2px solid transparent;
    border-radius: 16px;
    background:
      linear-gradient(var(--ok-bg-paper), var(--ok-bg-paper)) padding-box,
      var(--ok-gradient-secondary) border-box;
  }
</style>

<h2 data-ok-typography data-ok-variant="h3" class="gradient-title">Owlky UI</h2>
<div class="gradient-border">
  <p data-ok-typography data-ok-variant="body2">A card with a gradient border.</p>
</div>`,
    react: `import { Typography } from "@owlky/react";

const title = {
  color: "transparent",
  backgroundImage: "var(--ok-gradient-primary-text)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
};

const border = {
  padding: 24,
  border: "2px solid transparent",
  borderRadius: 16,
  background:
    "linear-gradient(var(--ok-bg-paper), var(--ok-bg-paper)) padding-box, var(--ok-gradient-secondary) border-box",
};

export function GradientTitle() {
  return (
    <>
      <Typography variant="h3" component="h2" style={title}>
        Owlky UI
      </Typography>
      <div style={border}>
        <Typography variant="body2">A card with a gradient border.</Typography>
      </div>
    </>
  );
}`,
  },
  {
    id: "gradient-background",
    title: "Fill backgrounds and paper with gradients",
    body: `Use \`--ok-gradient-<color>\` as the background of decorative surfaces, such as a banner or a cover. Its \`light\` shade is pale, so don't put text on it: put the text on the paper next to it.

\`--ok-gradient-paper\` is the theme's paper color at 90% opacity, with soft \`info\` and \`error\` glows in two corners. Add a \`backdrop-filter\` to blur what is behind it, like the menus and popovers of Owlky. It follows the theme, so the same paper works in light and dark mode.`,
    html: `<style>
  .glass {
    overflow: hidden;
    background: var(--ok-gradient-paper);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
  }
  .cover {
    height: 96px;
    background-image: var(--ok-gradient-info);
  }
  .glass-content {
    padding: 24px;
  }
</style>

<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="0" class="glass">
  <div class="cover"></div>
  <div class="glass-content">
    <h3 data-ok-typography data-ok-variant="h6">Weekly report</h3>
    <p data-ok-typography data-ok-variant="body2" data-ok-color="textSecondary">Glass paper over the page.</p>
  </div>
</div>`,
    react: `import { Paper, Typography } from "@owlky/react";

const glass = {
  overflow: "hidden",
  background: "var(--ok-gradient-paper)",
  WebkitBackdropFilter: "blur(20px)",
  backdropFilter: "blur(20px)",
};

const cover = {
  height: 96,
  backgroundImage: "var(--ok-gradient-info)",
};

export function WeeklyReport() {
  return (
    <Paper elevation={0} style={glass}>
      <div style={cover} />
      <div style={{ padding: 24 }}>
        <Typography variant="h6" component="h3">
          Weekly report
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Glass paper over the page.
        </Typography>
      </div>
    </Paper>
  );
}`,
  },
  {
    id: "tailwind",
    title: "Use Tailwind CSS utilities",
    body: "If your project uses Tailwind CSS v4, import the Owlky theme after Tailwind. Every palette shade and theme color then becomes a utility class, such as `bg-primary`, `text-primary-dark`, `bg-grey-200`, `text-text-secondary`, `bg-paper` and `border-divider`. Gradients have no utility of their own: use an arbitrary value, such as `bg-(image:--ok-gradient-primary)`.",
    html: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

<!-- In your HTML -->
<p class="rounded-md bg-primary-lighter px-2 text-primary-darker">Tailwind + Owlky colors</p>`,
    react: `// Set up Tailwind once, in your main CSS file:
//   @import "tailwindcss";
//   @import "@owlky/styles/owlky.css";
//   @import "@owlky/styles/theme.css";

export function ColorTag() {
  return (
    <p className="rounded-md bg-primary-lighter px-2 text-primary-darker">Tailwind + Owlky colors</p>
  );
}`,
  },
  {
    id: "javascript",
    title: "Read colors in JavaScript",
    body: `Some code needs color values directly, for example to draw a chart on a canvas. You have two options:

- **Read the CSS variable** to get the color that is on screen now. This value follows the active theme and your token overrides.
- **Import the default values** from \`@owlky/tokens\`. These values are fixed: they don't change with the theme.`,
    html: `<script type="module">
  // The default value (bare imports need a bundler or an import map)
  import { defaultTheme } from "@owlky/tokens";

  const brand = defaultTheme.palette.primary.main; // "#00A76F"

  // The color on screen now (follows the theme)
  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue("--ok-palette-primary-main").trim();
</script>`,
    react: `import { defaultTheme } from "@owlky/tokens";
import { useEffect, useState } from "react";

export function usePrimaryColor() {
  // The default value, until the page is rendered
  const [color, setColor] = useState(defaultTheme.palette.primary.main);
  useEffect(() => {
    // The color on screen now (follows the theme)
    const styles = getComputedStyle(document.documentElement);
    setColor(styles.getPropertyValue("--ok-palette-primary-main").trim());
  }, []);
  return color;
}`,
  },
  {
    id: "themes",
    title: "Switch themes and brand colors",
    body: `\`data-ok-theme\` sets the theme of a page or a part of it: \`light\` or \`dark\`. Put it on the \`<html>\` element to style the whole page, or on any element to style only its content. You can nest it, for example to show a light panel inside a dark page.

To change the theme from code, call \`applyThemeSettings()\`. Pass a storage, such as \`localStorage\`, to remember the user's choice.

To use your brand color, override the \`--ok-palette-primary-*\` tokens in your CSS, on \`:root\` or on any element. Check the contrast of text on your colors, because overridden colors aren't adjusted for you.`,
    html: `<html data-ok-theme="dark">
  <body>
    <!-- A light panel inside the dark page -->
    <section data-ok-theme="light">
      <h2>Light panel</h2>
      <p>This panel keeps the light colors on a dark page.</p>
    </section>
  </body>
</html>

<script type="module">
  import { applyThemeSettings } from "@owlky/html";

  applyThemeSettings({ mode: "dark" }, { storage: localStorage });
</script>`,
    react: `import { applyThemeSettings, Button } from "@owlky/react";

// A switch to the dark theme, and a light panel
export function ThemedPage() {
  return (
    <>
      <Button onClick={() => applyThemeSettings({ mode: "dark" }, { storage: localStorage })}>
        Use the dark theme
      </Button>
      <section data-ok-theme="light">
        <h2>Light panel</h2>
        <p>This panel keeps the light colors on a dark page.</p>
      </section>
    </>
  );
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Neutral text colors and the \`text\` tone of each palette color meet WCAG 2.2 level AA (a contrast ratio of at least 4.5:1) on the theme backgrounds, in light and dark mode.
- Filled components use \`contrast-text\` on the \`main\` shade. Some of these brand combinations are below 4.5:1, so avoid them for long text.
- To check your own color pairs, use \`contrastRatio(foreground, background)\` from \`@owlky/tokens\`.
- Gradient text uses \`--ok-gradient-<color>-text\`: every point of it meets AA on the theme's backgrounds. The fills of \`--ok-gradient-<color>\` start on a pale shade, so keep text off them.
- To place text on any color, let \`getContrastText(color, ["#FFFFFF", "#000000"])\` choose between white and black. The result always has a contrast ratio of at least 4.58:1.
- Don't rely on color alone to convey meaning. Add text or an icon, as Alert does.`,
  },
];
