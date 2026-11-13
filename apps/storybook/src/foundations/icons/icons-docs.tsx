import { Button, IconButton, Link } from "@owlky/react";
import { styles } from "@owlky/tokens";
import type { CSSProperties } from "react";
import { Caption, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { SolarIcon, solarImports, solarMarkup } from "../../helpers/solar-icons.js";
import { SOLAR_VARIANTS } from "./icon-demos.js";
import { IconifyGlyph } from "./iconify.js";

const MAIL = solarMarkup("letter-linear");
const MAIL_20 = solarMarkup("letter-linear", { size: 20 });

/** The icon stroke of each style, as `--ok-icon-stroke` sets it. */
const strokes = Object.values(styles)
  .map((style) => `- **${style.name}:** ${style.iconStroke}`)
  .join("\n");

export const iconsSections: GuideSection[] = [
  {
    id: "overview",
    title: "Icons in Owlky",
    body: `Owlky's components draw their icons from **Solar**, an open-source set by 480 Design with more than 7,000 icons in six variants. Component icons, such as the arrows of a Select or the close button of a Dialog, use the Linear variant. They are inline SVG, so they need no icon font, no request and no script.

You can use Solar for your own icons too, so they match the components. Components accept any SVG icon, so another set or your own SVG files work as well.

Solar is licensed under CC BY 4.0, which requires attribution. Owlky credits it in the third-party notices of \`@owlky/core\`. When your app shows Solar icons of its own, credit "Solar by 480 Design" in your app's notices too.`,
  },
  {
    id: "variants",
    title: "Choose a variant for your style",
    body: `Each Solar icon comes in six variants. Pick the one that suits the style of your page, so your icons and the components look like one design:

${SOLAR_VARIANTS.map(([, name, use]) => `- **${name}:** ${use}.`).join("\n")}

The variant is part of the icon's name, such as \`letter-linear\` or \`letter-bold-duotone\`. Browse every icon and variant on [Iconify](https://icon-sets.iconify.design/solar/).`,
  },
  {
    id: "stroke",
    title: "Icon stroke width",
    body: `Component icons draw their lines with the \`--ok-icon-stroke\` token, so every style sets its own weight:

${strokes}

With \`data-ok-contrast="high"\`, the stroke is at least 1.75 in every style, so thin lines stay visible. To give your own Linear icons the same weight, read the token in your CSS.`,
    html: `<style>
  /* Solar's Linear icons set the stroke on their group. */
  .app-icon g {
    stroke-width: var(--ok-icon-stroke);
  }
</style>

<span class="app-icon">${solarMarkup("letter-linear", { size: 24 })}</span>`,
    react: `${solarImports("letter-linear")}

// In your CSS: .app-icon g { stroke-width: var(--ok-icon-stroke); }
export function MailIcon() {
  return (
    <span className="app-icon">
      <Icon icon={letterLinear} aria-hidden="true" width={24} height={24} />
    </span>
  );
}`,
  },
  {
    id: "components",
    title: "Add an icon to a component",
    body: "In HTML, place the SVG inside the component's icon part, such as `data-ok-button-icon`. In React, pass the icon as a prop, such as `startIcon`, or as the child of an icon button. Components size and color the icon for you.\n\nThe React examples draw Solar icons with Iconify's offline component: install `@iconify/react` and `@iconify-icons/solar`, then import each icon you use. The offline component never requests icons from a server, and your bundle holds only the icons you import.",
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md">
  <span data-ok-button-icon="start" aria-hidden="true">
    ${MAIL}
  </span>
  <span data-ok-button-label>Send</span>
</button>

<button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="md" aria-label="Send">
  ${MAIL}
</button>`,
    react: `import { Button, IconButton } from "@owlky/react";
${solarImports("letter-linear")}

export function SendActions() {
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Icon icon={letterLinear} aria-hidden="true" />}
      >
        Send
      </Button>
      <IconButton aria-label="Send">
        <Icon icon={letterLinear} aria-hidden="true" />
      </IconButton>
    </>
  );
}`,
  },
  {
    id: "size",
    title: "Choose a size",
    body: `Solar icons are drawn on a 24 × 24 grid. Display them at one of these sizes:

- **16px:** dense interfaces and next to caption text.
- **20px:** inside buttons, inputs and menus.
- **24px:** standalone icons and icon buttons.
- **32px:** empty states and feature highlights.

Inside components, the size is set for you. For your own icons, set \`width\` and \`height\`.`,
    html: MAIL_20,
    react: `${solarImports("letter-linear")}

export function IconsSize() {
  return <Icon icon={letterLinear} aria-hidden="true" width={20} height={20} />;
}`,
  },
  {
    id: "color",
    title: "Color an icon",
    body: "Solar icons draw with `currentColor`. They then take the text color of their parent, so they follow the theme and component colors automatically. To color an icon yourself, set `color` on the icon or its parent. Use a text tone, such as `--ok-palette-success-text`, which keeps a contrast ratio of at least 4.5:1 with the page in every style and theme.",
    html: `<span style="color: var(--ok-palette-success-text)">
  ${solarMarkup("letter-linear", { size: 24 })}
</span>`,
    react: `${solarImports("letter-linear")}

export function IconsColor() {
  return (
    <Icon
      icon={letterLinear}
      aria-hidden="true"
      width={24}
      height={24}
      style={{ color: "var(--ok-palette-success-text)" }}
    />
  );
}`,
  },
  {
    id: "flags",
    title: "Show country flags",
    body: "Flags aren't icons in Owlky. The Phone input shows each country's flag as an emoji by default, which costs no bytes. Windows shows flag emoji as two letters, so the Phone input also has an opt-in image mode that loads Circle Flags (MIT) one file at a time, from a folder you can host yourself. See the Phone input page for the option.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- **Decorative icons** sit next to visible text that says the same thing. Hide them from assistive technology with \`aria-hidden="true"\`.
- **Meaningful icons** stand alone and carry information. Give them a name with \`role="img"\` and \`aria-label\`.
- **Icon-only buttons** need a name on the button, not on the icon: set \`aria-label\` on the button and hide the icon.
- Make sure an icon that conveys meaning has a contrast ratio of at least 3:1 with its background (WCAG 2.2, success criterion 1.4.11). The text tones and \`--ok-text-secondary\` meet it in every style.`,
    html: `<!-- Decorative: next to visible text -->
<span>${MAIL_20} Messages</span>

<!-- Meaningful on its own: give it a name -->
${solarMarkup("letter-linear", { size: 24, label: "3 new messages" })}`,
    react: `${solarImports("letter-linear")}

export function MessageIcons() {
  return (
    <>
      {/* Decorative: next to visible text */}
      <span>
        <Icon icon={letterLinear} aria-hidden="true" width={20} height={20} /> Messages
      </span>
      {/* Meaningful on its own: give it a name */}
      <Icon icon={letterLinear} role="img" aria-label="3 new messages" width={24} height={24} />
    </>
  );
}`,
  },
];

function VariantsPreview() {
  return (
    <Preview className="gap-6!">
      {SOLAR_VARIANTS.map(([variant, name]) => (
        <span key={variant} className="flex flex-col items-center gap-2">
          <IconifyGlyph icon={`solar:letter-${variant}`} size={32} />
          <Caption>{name}</Caption>
        </span>
      ))}
    </Preview>
  );
}

const STROKE_CSS = ".sb-stroke-demo g { stroke-width: var(--ok-icon-stroke); }";

function StrokePreview() {
  return (
    <Preview className="gap-6!">
      <style>{STROKE_CSS}</style>
      {[1.25, 1.5, 2].map((stroke) => (
        <span key={stroke} className="flex flex-col items-center gap-2">
          <span className="sb-stroke-demo" style={{ "--ok-icon-stroke": stroke } as CSSProperties}>
            <SolarIcon name="letter-linear" size={32} />
          </span>
          <Caption>{stroke}</Caption>
        </span>
      ))}
    </Preview>
  );
}

function ComponentsPreview() {
  return (
    <Preview>
      <Button variant="contained" color="primary" startIcon={<SolarIcon name="letter-linear" />}>
        Send
      </Button>
      <IconButton aria-label="Send">
        <SolarIcon name="letter-linear" />
      </IconButton>
    </Preview>
  );
}

function SizePreview() {
  return (
    <Preview className="gap-8!">
      {[16, 20, 24, 32].map((size) => (
        <span key={size} className="flex flex-col items-center gap-2">
          <SolarIcon name="letter-linear" size={size} />
          <Caption>{size}px</Caption>
        </span>
      ))}
    </Preview>
  );
}

function ColorPreview() {
  return (
    <Preview className="gap-6!">
      {["text-primary", "palette-primary-text", "palette-success-text", "palette-error-text"].map(
        (token) => (
          <span
            key={token}
            className="flex flex-col items-center gap-2"
            style={{ color: `var(--ok-${token})` }}
          >
            <SolarIcon name="letter-linear" size={24} />
            <Caption>{token}</Caption>
          </span>
        ),
      )}
    </Preview>
  );
}

function OverviewPreview() {
  return (
    <Preview>
      <Link
        href="https://github.com/480-Design/Solar-Icon-Set"
        target="_blank"
        rel="noreferrer"
        underline="always"
      >
        Solar by 480 Design (CC BY 4.0)
      </Link>
    </Preview>
  );
}

const PREVIEWS = {
  overview: OverviewPreview,
  variants: VariantsPreview,
  stroke: StrokePreview,
  components: ComponentsPreview,
  size: SizePreview,
  color: ColorPreview,
};

/** Icons docs page. */
export function IconsDocs() {
  return <GuideDocs sections={iconsSections} previews={PREVIEWS} />;
}
