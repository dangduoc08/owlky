import { defaultTheme, fontFamilyPresetNames, typographyVariants } from "@owlky/tokens";

const { breakpoints } = defaultTheme;

import { useEffect, useRef, useState } from "react";
import { Caption, CDN, codeList, GuideDocs, type GuideSection, Preview } from "../shared/guide.js";

const v = (variant: string, property: string) => `var(--ok-typography-${variant}-${property})`;
const styleOf = (variant: string) => ({
  margin: 0,
  fontFamily: v(variant, "font-family"),
  fontSize: v(variant, "font-size"),
  fontWeight: v(variant, "font-weight"),
  lineHeight: v(variant, "line-height"),
  textTransform: v(variant, "text-transform") as "none",
});

export const typographySections: GuideSection[] = [
  {
    id: "scale",
    title: "Type scale",
    body: `Owlky has ${typographyVariants.length} text styles, called variants: ${codeList(typographyVariants)}. Each variant sets a font family, size, weight, line height and text transform.

The \`h1\`, \`h2\` and \`h3\` headings use the display font, Barlow. All other variants use the main font, Public Sans by default. Sizes are in \`rem\`, so text scales with the root font size.

The stories in the sidebar show each variant in detail.`,
  },
  {
    id: "tokens",
    title: "Token reference",
    body: `- **Variants:** \`--ok-typography-<variant>-<property>\`, where the property is \`font-family\`, \`font-size\`, \`font-weight\`, \`line-height\` or \`text-transform\`. For example, \`--ok-typography-h3-font-size\`.
- **Font families:** \`--ok-font-family\` for text, \`--ok-font-family-secondary\` for display headings and \`--ok-font-family-mono\` for code.
- **Font weights:** \`--ok-font-weight-regular\`, \`--ok-font-weight-medium\`, \`--ok-font-weight-semibold\`, \`--ok-font-weight-bold\` and \`--ok-font-weight-extrabold\`.
- **Small sizes for components:** \`--ok-font-size-xs\` to \`--ok-font-size-xl\`.`,
  },
  {
    id: "css",
    title: "Style text with CSS",
    body: "Load the Owlky stylesheet once, then apply the variables of a variant to your own elements. Using all of a variant's properties keeps the text consistent with Owlky components.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<style>
  .page-title {
    margin: 0;
    font-family: var(--ok-typography-h3-font-family);
    font-size: var(--ok-typography-h3-font-size);
    font-weight: var(--ok-typography-h3-font-weight);
    line-height: var(--ok-typography-h3-line-height);
  }
</style>

<h1 class="page-title">Monthly report</h1>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";

const pageTitle = {
  margin: 0,
  fontFamily: "var(--ok-typography-h3-font-family)",
  fontSize: "var(--ok-typography-h3-font-size)",
  fontWeight: "var(--ok-typography-h3-font-weight)",
  lineHeight: "var(--ok-typography-h3-line-height)",
};

export function PageTitle() {
  return <h1 style={pageTitle}>Monthly report</h1>;
}`,
  },
  {
    id: "tailwind",
    title: "Use Tailwind CSS utilities",
    body: "With the Owlky theme for Tailwind CSS v4, each variant from `h1` to `caption` is a `text-<variant>` utility that sets the size, weight and line height. Add `font-display` for the display font. The `overline` and `button` variants have no utility: use their CSS variables instead.",
    html: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

<!-- In your HTML -->
<h1 class="font-display text-h3">Monthly report</h1>
<p class="text-body2 text-text-secondary">Updated 5 minutes ago</p>`,
    react: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

// In your component
<h1 className="font-display text-h3">Monthly report</h1>
<p className="text-body2 text-text-secondary">Updated 5 minutes ago</p>`,
  },
  {
    id: "responsive",
    title: "Responsive headings",
    body: `Headings grow on larger screens, at ${codeList([`${breakpoints.sm}px`, `${breakpoints.md}px`, `${breakpoints.lg}px`])}. For example, \`h1\` goes from 2.5rem (40px) on phones to 4rem (64px) on desktops. The variables change by themselves, so you don't need media queries. Resize the window to see the current \`h1\` size below.`,
  },
  {
    id: "fonts",
    title: "Change the font and text size",
    body: `To use another font, set \`data-ok-font\` to ${codeList(fontFamilyPresetNames)}. To make all text larger or smaller, change the root font size: every size is in \`rem\`. Load the fonts yourself, for example from Fontsource. The **Settings** page explains both options.`,
    html: `<html data-ok-font="inter" style="font-size: 18px">
  …
</html>`,
    react: `import "@fontsource-variable/inter";
import { applyThemeSettings } from "@owlky/react";

applyThemeSettings({ font: "inter", fontSize: 18 });`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Choose the heading element by the page structure, and the variant by the look you need. For example, a section title can be an \`<h2>\` styled as \`h4\`.
- Sizes are in \`rem\`, so text follows the user's browser font size and zoom.
- Body text has a line height of at least 1.5, as WCAG 2.2 recommends for readability.
- Don't set text in all capitals for long content: the \`overline\` and \`button\` variants are meant for short labels.`,
  },
];

const SAMPLE = "The quick brown fox jumps over the lazy dog";

function ScalePreview() {
  return (
    <Preview className="flex-col items-stretch! gap-3!">
      {typographyVariants.map((variant) => (
        <div key={variant} className="flex min-w-0 items-baseline gap-4">
          <span className="w-20 shrink-0">
            <Caption>{variant}</Caption>
          </span>
          <p className="min-w-0 truncate" style={styleOf(variant)}>
            {SAMPLE}
          </p>
        </div>
      ))}
    </Preview>
  );
}

function CssPreview() {
  return (
    <Preview>
      <h3 style={styleOf("h3")}>Monthly report</h3>
    </Preview>
  );
}

function TailwindPreview() {
  return (
    <Preview className="flex-col items-start!">
      <h3 className="m-0 font-display text-h3">Monthly report</h3>
      <p className="m-0 text-body2 text-text-secondary">Updated 5 minutes ago</p>
    </Preview>
  );
}

/** The current h1 size, measured live. */
function ResponsivePreview() {
  const ref = useRef<HTMLHeadingElement>(null);
  const [size, setSize] = useState("");
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const read = () => setSize(getComputedStyle(element).fontSize);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  return (
    <Preview className="flex-col items-start!">
      <Caption>h1 at this window width: {size}</Caption>
      <h3 ref={ref} style={styleOf("h1")}>
        Heading 1
      </h3>
    </Preview>
  );
}

function FontsPreview() {
  return (
    <Preview className="flex-col items-start!">
      <Caption>Use the Font and Font size menus in the toolbar to try them here.</Caption>
      <p style={styleOf("body1")}>{SAMPLE}</p>
    </Preview>
  );
}

const PREVIEWS = {
  scale: ScalePreview,
  css: CssPreview,
  tailwind: TailwindPreview,
  responsive: ResponsivePreview,
  fonts: FontsPreview,
};

/** Typography docs page. */
export function TypographyDocs() {
  return <GuideDocs sections={typographySections} previews={PREVIEWS} />;
}
