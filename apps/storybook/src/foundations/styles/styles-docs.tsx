import { type StyleName, styleNames, styles } from "@owlky/tokens";
import { CDN, codeList, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import {
  AllStyles,
  fontLink,
  STYLE_SUMMARIES,
  StyleAxes,
  StyleSample,
  StyleScope,
} from "./style-samples.js";

const optIn = styleNames.filter((id) => id !== "soft");

const styleList = styleNames
  .map((id) => `- **${styles[id].name}** (\`${id}\`): ${STYLE_SUMMARIES[id]}`)
  .join("\n");

const fontList = styleNames
  .map((id: StyleName) => {
    const families = [
      ...new Set(styles[id].fontLinks.map((family) => family.split(":")[0]?.replaceAll("+", " "))),
    ];
    return `- **${styles[id].name}:** ${families.join(", ")}.`;
  })
  .join("\n");

const FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontLink("nordic")}">`;

export const stylesSections: GuideSection[] = [
  {
    id: "overview",
    title: "Design styles",
    body: `A style is a complete look for every component: the palette, the fonts, the corner radius, the border widths, how surfaces show depth, the case of labels and the weight of headings. Components keep the same markup and API in every style. A style only changes the values of the design tokens, the \`--ok-*\` CSS variables.

Owlky has nine styles:

${styleList}

A page without a style looks **Soft**. Its tokens are part of the main stylesheet. The other eight styles are opt-in stylesheets of about 2 to 3 kB each (gzip), so a page loads only the styles it uses. Pick one in the **Style** menu in the toolbar to see every story in it.`,
  },
  {
    id: "load",
    title: "Use a style",
    body: `Load the style's stylesheet after Owlky's main stylesheet, then set \`data-ok-style\` on the \`<html>\` element. The style's stylesheet must come after the main one, because it overrides the main stylesheet's tokens.

- **HTML:** link \`owlky-style-<id>.css\` from the CDN, such as \`owlky-style-nordic.css\`.
- **Bundlers and React:** import \`@owlky/styles/styles/<id>.css\`, such as \`@owlky/styles/styles/nordic.css\`.

The ids of the opt-in styles are ${codeList(optIn)}. Soft has no stylesheet of its own. You can also set the style from code with \`applyThemeSettings({ style })\`, which can save the choice (see **Settings**).`,
    html: `<!doctype html>
<html lang="en" data-ok-style="nordic">
  <head>
    <link rel="stylesheet" href="${CDN}/owlky.css">
    <link rel="stylesheet" href="${CDN}/owlky-style-nordic.css">
  </head>
  <body>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Export</span></button>
  </body>
</html>`,
    react: `// Load once, in your app's entry file: the main stylesheet first
import "@owlky/styles/owlky.css";
import "@owlky/styles/styles/nordic.css";
import { applyThemeSettings, Button } from "@owlky/react";

// Or set data-ok-style="nordic" on <html> in your page template.
applyThemeSettings({ style: "nordic" });

export function ExportButton() {
  return (
    <Button variant="contained" color="primary">
      Export
    </Button>
  );
}`,
  },
  {
    id: "loader",
    title: "Let the script load style sheets",
    body: `In HTML, \`owlky.js\` can load a style's stylesheet for you. When an element in the page has \`data-ok-style\`, in the markup or set later by \`applyThemeSettings()\`, the script adds the style's stylesheet right after \`owlky.css\`, from the same folder, once.

A stylesheet added by the script arrives after the first paint, so the page shows Soft for a moment. For the style of the whole page, link its stylesheet yourself, as in **Use a style**. The script never adds a stylesheet that the page already links.

- **\`data-ok-styles\`** on the script tag serves the stylesheets from another folder. Set it to \`none\` to turn this off.
- **\`data-ok-preload\`** loads a stylesheet before any element needs it, such as \`data-ok-preload="style:nordic"\`. In JavaScript, call \`Owlky.load("style:nordic")\`.`,
    html: `<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" data-ok-preload="style:editorial" defer></script>

<!-- The script loads owlky-style-editorial.css for this section -->
<section data-ok-style="editorial">
  <h2 data-ok-typography data-ok-variant="h4">Editor's picks</h2>
</section>`,
    react: `// With a bundler, import every style the app can show: nothing loads them later.
import "@owlky/styles/owlky.css";
import "@owlky/styles/styles/editorial.css";
import { Typography } from "@owlky/react";

export function Picks() {
  return (
    <section data-ok-style="editorial">
      <Typography variant="h4" component="h2">
        Editor's picks
      </Typography>
    </section>
  );
}`,
  },
  {
    id: "scope",
    title: "Apply a style to part of a page",
    body: "`data-ok-style` works on any element, and styles nest. The nearest element with the attribute decides the style of everything inside it, so a section can use another style than the page around it. Use `soft` to bring back the default inside another style.",
    html: `<html lang="en" data-ok-style="swiss">
  <body>
    <!-- Swiss -->
    <aside data-ok-style="soft">
      <!-- Soft again -->
    </aside>
  </body>
</html>`,
    react: `import type { ReactNode } from "react";

export function Sidebar({ children }: { children: ReactNode }) {
  // The page uses Swiss; this sidebar uses Soft.
  return <aside data-ok-style="soft">{children}</aside>;
}`,
  },
  {
    id: "axes",
    title: "Combine a style with the other settings",
    body: `Four more attributes change the tokens of every style. Each one works on any element and nests on its own, so a dark, compact section inside a light page keeps the page's style.

- **Mode** (\`data-ok-theme\`): ${codeList(["light", "dark", "system"])}. \`system\` follows the operating system.
- **Density** (\`data-ok-density\`): ${codeList(["comfortable", "compact"])}. Compact makes controls, rows and cells smaller, such as 32px buttons instead of 36px. Spacing between elements stays the same.
- **Surface** (\`data-ok-surface\`): ${codeList(["default", "contrast"])}. \`contrast\` sets the page background one step away from cards and other surfaces, so they stand out without shadows.
- **Contrast** (\`data-ok-contrast\`): ${codeList(["default", "high", "system"])}. \`high\` raises text to a contrast ratio of at least 7:1 and graphics, borders and focus rings to 4.5:1, with wider focus rings and icon strokes. \`system\` follows the operating system's contrast preference.

The **Theme**, **Density**, **Surface** and **Contrast** menus in the toolbar set the same attributes for every story.`,
    html: `<html lang="en" data-ok-style="corporate" data-ok-theme="system" data-ok-contrast="system">
  <body>
    <!-- A dense table area inside the page -->
    <section data-ok-density="compact" data-ok-surface="contrast">
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Filter</span></button>
    </section>
  </body>
</html>`,
    react: `import { applyThemeSettings, Button } from "@owlky/react";

applyThemeSettings({ style: "corporate", mode: "system", contrast: "system" });

export function Toolbar() {
  return (
    <section data-ok-density="compact" data-ok-surface="contrast">
      <Button variant="outlined" color="primary">
        Filter
      </Button>
    </section>
  );
}`,
  },
  {
    id: "fonts",
    title: "Load the fonts",
    body: `Owlky doesn't bundle fonts. Each style names its fonts in the font tokens, so load them yourself, before Owlky's stylesheet, for example from Google Fonts or Fontsource. Without them, text falls back to the system fonts. The styles use these families:

${fontList}

Every family has tabular figures, which keep numbers aligned in tables, pickers and counters. To use another font, override the family tokens (\`--ok-font-family\`, \`--ok-font-family-heading\`, \`--ok-font-family-label\` and \`--ok-font-family-mono\`), or pass \`fonts\` to \`createTheme()\`.`,
    html: `<!-- Nordic uses Manrope -->
${FONT_LINKS}
<link rel="stylesheet" href="${CDN}/owlky.css">
<link rel="stylesheet" href="${CDN}/owlky-style-nordic.css">`,
    react: `// In index.html, before your app's styles:
// <link rel="stylesheet" href="${fontLink("nordic")}">
import "@owlky/styles/owlky.css";
import "@owlky/styles/styles/nordic.css";
import { Typography } from "@owlky/react";

export function Heading() {
  return <Typography variant="h3">Quarterly review</Typography>;
}`,
  },
  {
    id: "brand",
    title: "Use your brand colors",
    body: `\`createTheme({ style, brand })\` from \`@owlky/tokens\` builds a style with your colors. Pass a \`primary\` color, and optionally \`secondary\` and \`neutral\`, as \`#RRGGBB\`. Owlky turns each one into a scale of shades and derives every color role from it: text tones, fills, borders and focus rings, in light and dark mode, on both surfaces and at both contrast levels. Each role meets the same contrast targets as the built-in styles.

Write the result as CSS at build time:

- **\`styleSheetCss(theme)\`** writes an opt-in style's stylesheet, such as a Nordic with your primary color. Load it instead of the published \`nordic.css\`.
- **\`themeToCss(theme)\`** writes the tokens of the default style, Soft, with your colors. Load it after \`owlky.css\`.

Overriding a color token in your own CSS, such as \`--ok-palette-primary-main\`, changes only that value: the other shades, dark mode and high contrast aren't derived from it, and you need to check contrast yourself.`,
    html: `<!doctype html>
<html lang="en" data-ok-style="nordic">
  <head>
    <link rel="stylesheet" href="${CDN}/owlky.css">
    <!-- Written at build time, in place of owlky-style-nordic.css:
         styleSheetCss(createTheme({ style: "nordic", brand: { primary: "#0E7490" } })) -->
    <link rel="stylesheet" href="/nordic-brand.css">
  </head>
  <body>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Export</span></button>
  </body>
</html>`,
    react: `// build-theme.ts: run at build time, then import the file it writes.
import { writeFileSync } from "node:fs";
import { createTheme, styleSheetCss } from "@owlky/tokens";

const theme = createTheme({ style: "nordic", brand: { primary: "#0E7490" } });
writeFileSync("src/nordic-brand.css", styleSheetCss(theme));`,
  },
  {
    id: "brand-runtime",
    title: "Change brand colors at run time",
    body: "To let users pick a color, or to brand each customer of your app, call `applyThemeBrand()` from `@owlky/core/theme-brand`. It runs the same color derivation in the browser and writes the results on an element as inline custom properties, so it works with a strict Content Security Policy. Pass `null` to remove the colors. The module includes the color generator, so import it only on pages that need it.",
    html: `<script type="module">
  // With a bundler
  import { applyThemeBrand } from "@owlky/core/theme-brand";

  applyThemeBrand({ primary: "#0E7490" });
</script>`,
    react: `import { applyThemeBrand } from "@owlky/core/theme-brand";
import { useEffect } from "react";

export function useBrand(primary: string) {
  useEffect(() => {
    applyThemeBrand({ primary });
    return () => {
      applyThemeBrand(null);
    };
  }, [primary]);
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- **Every style meets WCAG 2.2 AA.** Text, secondary text and colored text reach a contrast ratio of at least 4.5:1 on the page, on surfaces and on hovered or selected rows. Field borders, focus rings, selected indicators and chart colors reach 3:1. This holds in all nine styles, in light and dark mode, on both surfaces and at both contrast levels.
- **High contrast keeps the colors.** With \`data-ok-contrast="high"\`, text reaches 7:1 and graphics 4.5:1. Each color keeps its hue and only gets lighter or darker. Offer \`system\` so people who ask for more contrast in their operating system get it.
- **Brand colors stay accessible.** Colors passed to \`createTheme({ brand })\` or \`applyThemeBrand()\` go through the same derivation. Colors you override in CSS don't, so check them yourself.
- **Uppercase labels** (Bauhaus, Editorial) are a visual case only: the text in the markup keeps its own case, so screen readers read words, not letters.
- **Fonts:** if a style's font doesn't load, text falls back to system fonts and stays readable.`,
  },
];

function OverviewPreview() {
  return (
    <Preview className="block!">
      <AllStyles />
    </Preview>
  );
}

function ScopePreview() {
  return (
    <Preview className="block!">
      <StyleScope id="swiss">
        <StyleSample id="swiss" title="Swiss page" />
        <StyleScope id="soft">
          <StyleSample id="soft" title="Soft section" />
        </StyleScope>
      </StyleScope>
    </Preview>
  );
}

function AxesPreview() {
  return (
    <Preview className="block!">
      <StyleAxes id="corporate" />
    </Preview>
  );
}

const PREVIEWS = { overview: OverviewPreview, scope: ScopePreview, axes: AxesPreview };

/** Styles docs page. */
export function StylesDocs() {
  return <GuideDocs sections={stylesSections} previews={PREVIEWS} />;
}
