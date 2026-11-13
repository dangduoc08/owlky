import { Button } from "@owlky/react";
import { paletteColorNames } from "@owlky/tokens";
import {
  Caption,
  CDN,
  capitalize,
  codeList,
  GuideDocs,
  type GuideSection,
  Preview,
} from "../../helpers/guide.js";

export const shadowsSections: GuideSection[] = [
  {
    id: "levels",
    title: "Shadow levels",
    body: `Shadows show how far a surface sits above the page. Owlky has three kinds:

- **Elevation:** 24 levels, from \`--ok-elevation-1\` (almost flat) to \`--ok-elevation-24\` (floating). Each level uses the nearest shadow of the \`--ok-shadow-z1\` to \`--ok-shadow-z24\` scale, so levels change with the design style like every other shadow.
- **Named shadows:** shadows for common surfaces. Use \`--ok-shadow-card\` for cards, \`--ok-shadow-dropdown\` for menus and popovers, \`--ok-shadow-dialog\` for dialogs and \`--ok-shadow-dialog-start\` for drawers. The scale \`--ok-shadow-z1\` to \`--ok-shadow-z24\` covers everything in between.
- **Colored shadows:** one per palette color, such as \`--ok-shadow-primary\`, for filled buttons and highlighted elements.
- **Drop shadows:** \`--ok-drop-shadow-z1\`, \`--ok-drop-shadow-z4\` and \`--ok-drop-shadow-z8\` repeat \`--ok-shadow-z1\`, \`--ok-shadow-z4\` and \`--ok-shadow-z8\` as \`filter\` values, for shapes such as map pins and icons.

The stories in the sidebar show every shadow.`,
  },
  {
    id: "css",
    title: "Add a shadow with CSS",
    body: "Load the Owlky stylesheet once, then set `box-shadow` to a shadow variable. Pick the shadow by the role of the surface, not by how it looks: a card always uses the card shadow.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<style>
  .card {
    padding: 24px;
    border-radius: 16px;
    background-color: var(--ok-bg-paper);
    box-shadow: var(--ok-shadow-card);
  }
</style>

<article class="card">Weekly sales</article>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";

const card = {
  padding: 24,
  borderRadius: 16,
  backgroundColor: "var(--ok-bg-paper)",
  boxShadow: "var(--ok-shadow-card)",
};

export function SalesCard() {
  return <article style={card}>Weekly sales</article>;
}`,
  },
  {
    id: "tailwind",
    title: "Use Tailwind CSS utilities",
    body: "With the Owlky theme for Tailwind CSS v4, every shadow is a utility: `shadow-card`, `shadow-dropdown`, `shadow-dialog`, `shadow-dialog-start`, `shadow-z1` to `shadow-z24` and `shadow-elevation-1` to `shadow-elevation-24`.",
    html: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

<!-- In your HTML -->
<article class="rounded-2xl bg-paper p-6 shadow-card">Weekly sales</article>`,
    react: `// Set up Tailwind once, in your main CSS file:
//   @import "tailwindcss";
//   @import "@owlky/styles/owlky.css";
//   @import "@owlky/styles/theme.css";

export function WeeklySales() {
  return (
    <article className="rounded-2xl bg-paper p-6 shadow-card">Weekly sales</article>
  );
}`,
  },
  {
    id: "colored",
    title: "Use a colored shadow",
    body: `Colored shadows are tinted with a palette color: ${codeList(paletteColorNames.map((c) => `--ok-shadow-${c}`))}. Contained buttons already use them on hover. Use one for your own highlighted element, such as a featured plan.`,
    html: `<style>
  .featured {
    padding: 24px;
    border-radius: 16px;
    background-color: var(--ok-bg-paper);
    box-shadow: var(--ok-shadow-primary);
  }
</style>

<article class="featured">Pro plan</article>`,
    react: `export function FeaturedPlan() {
  return (
    <article
      style={{
        padding: 24,
        borderRadius: 16,
        backgroundColor: "var(--ok-bg-paper)",
        boxShadow: "var(--ok-shadow-primary)",
      }}
    >
      Pro plan
    </article>
  );
}`,
  },
  {
    id: "shapes",
    title: "Shadow a shape with a filter",
    body: "A `box-shadow` follows the element's box, so an icon or a pin gets a rectangular shadow. Set `filter` to a drop shadow variable instead: the shadow then follows the shape. Drop shadows use the same offsets, blur and color as the shadow levels, so a pin and a card at the same level look alike.",
    html: `<style>
  .pin {
    width: 26px;
    height: 26px;
    color: var(--ok-palette-primary-main);
    filter: var(--ok-drop-shadow-z4);
  }
</style>

<svg class="pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z" />
</svg>`,
    react: `import { MapPin } from "lucide-react";

export function Pin() {
  return (
    <MapPin
      aria-hidden="true"
      size={26}
      style={{ color: "var(--ok-palette-primary-main)", filter: "var(--ok-drop-shadow-z4)" }}
    />
  );
}`,
  },
  {
    id: "themes",
    title: "Shadows in dark mode",
    body: "Shadows follow the theme. In the light theme they use a soft grey; in the dark theme they use black, so surfaces still stand out from a dark page. `--ok-shadow-primary` follows the active preset. You don't need any extra code.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A shadow alone isn't a strong enough boundary for everyone. When a surface must stand out clearly, such as an input or a selected card, add a border with \`--ok-divider\` or a stronger color.
- Don't use a shadow as the only sign of focus or selection: use an outline or a color change as well.`,
  },
];

const tile = "flex h-24 min-w-[8rem] flex-1 items-center justify-center rounded-xl bg-paper";

function LevelsPreview() {
  return (
    <Preview className="gap-6! bg-neutral!">
      {["--ok-elevation-1", "--ok-shadow-card", "--ok-shadow-dropdown", "--ok-shadow-dialog"].map(
        (token) => (
          <div key={token} className={tile} style={{ boxShadow: `var(${token})` }}>
            <Caption>{token.replace("--ok-", "")}</Caption>
          </div>
        ),
      )}
    </Preview>
  );
}

function CardPreview() {
  return (
    <Preview className="bg-neutral!">
      <article className="rounded-2xl bg-paper p-6 shadow-card">Weekly sales</article>
    </Preview>
  );
}

function ColoredPreview() {
  return (
    <Preview className="gap-6!">
      {paletteColorNames.map((color) => (
        <div
          key={color}
          className="flex h-20 min-w-[7rem] flex-1 items-center justify-center rounded-xl bg-paper"
          style={{ boxShadow: `var(--ok-shadow-${color})` }}
        >
          <Caption>{capitalize(color)}</Caption>
        </div>
      ))}
    </Preview>
  );
}

function ThemesPreview() {
  return (
    <Preview className="items-stretch! gap-6!">
      {(["light", "dark"] as const).map((theme) => (
        <div
          key={theme}
          data-ok-theme={theme}
          className="flex min-w-[12rem] flex-1 flex-col gap-4 rounded-2xl p-6"
          style={{ backgroundColor: "var(--ok-bg-default)", color: "var(--ok-text-primary)" }}
        >
          <Caption>{capitalize(theme)} theme</Caption>
          <div className={tile} style={{ boxShadow: "var(--ok-shadow-card)" }}>
            Card
          </div>
          <Button variant="contained" color="primary">
            Hover me
          </Button>
        </div>
      ))}
    </Preview>
  );
}

function ShapesPreview() {
  return (
    <Preview className="gap-8!">
      {["--ok-drop-shadow-z1", "--ok-drop-shadow-z4", "--ok-drop-shadow-z8"].map((token) => (
        <div key={token} className="flex flex-col items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="currentColor"
            aria-hidden="true"
            style={{ color: "var(--ok-palette-primary-main)", filter: `var(${token})` }}
          >
            <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Z" />
          </svg>
          <Caption>{token.replace("--ok-", "")}</Caption>
        </div>
      ))}
    </Preview>
  );
}

const PREVIEWS = {
  levels: LevelsPreview,
  css: CardPreview,
  tailwind: CardPreview,
  colored: ColoredPreview,
  shapes: ShapesPreview,
  themes: ThemesPreview,
};

/** Shadows docs page. */
export function ShadowsDocs() {
  return <GuideDocs sections={shadowsSections} previews={PREVIEWS} />;
}
