import { Button, IconButton } from "@owlky/react";
import { Caption, GuideDocs, type GuideSection, Preview } from "../shared/guide.js";

const MAIL_PATHS = `<rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />`;
const SVG_ATTRS = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

export const iconsSections: GuideSection[] = [
  {
    id: "overview",
    title: "Icons in Owlky",
    body: `Owlky doesn't include an icon set. Components accept any SVG icon, so you can use the library you already have, such as Iconify, Lucide or Material Symbols, or your own SVG files.

The stories in the sidebar show open-source sets from Iconify, with recommended sizes and colors.`,
  },
  {
    id: "components",
    title: "Add an icon to a component",
    body: "In HTML, place the SVG inside the component's icon part, such as `data-ok-button-icon`. In React, pass the icon as a prop, such as `startIcon`, or as the child of an icon button. Components size and color the icon for you.",
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md">
  <span data-ok-button-icon="start" aria-hidden="true">
    <svg aria-hidden="true" ${SVG_ATTRS}>${MAIL_PATHS}</svg>
  </span>
  <span data-ok-button-label>Send</span>
</button>

<button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="md" aria-label="Send">
  <svg aria-hidden="true" ${SVG_ATTRS}>${MAIL_PATHS}</svg>
</button>`,
    react: `import { Button, IconButton } from "@owlky/react";
import { Mail } from "lucide-react"; // or any icon component

export function SendActions() {
  return (
    <>
      <Button variant="contained" color="primary" startIcon={<Mail aria-hidden="true" />}>
        Send
      </Button>
      <IconButton aria-label="Send">
        <Mail aria-hidden="true" />
      </IconButton>
    </>
  );
}`,
  },
  {
    id: "size",
    title: "Choose a size",
    body: `Draw icons on a 24 × 24 grid and display them at one of these sizes:

- **16px:** dense interfaces and next to caption text.
- **20px:** inside buttons, inputs and menus.
- **24px:** standalone icons and icon buttons.
- **32px:** empty states and feature highlights.

Inside components, the size is set for you. For your own icons, set \`width\` and \`height\`.`,
    html: `<svg aria-hidden="true" width="20" height="20" ${SVG_ATTRS}>${MAIL_PATHS}</svg>`,
    react: `<Mail aria-hidden="true" width={20} height={20} />`,
  },
  {
    id: "color",
    title: "Color an icon",
    body: "Draw icons with `currentColor`. They then take the text color of their parent, so they follow the theme and component colors automatically. To color an icon yourself, set `color` on the icon or its parent.",
    html: `<span style="color: var(--ok-palette-success-main)">
  <svg aria-hidden="true" width="24" height="24" ${SVG_ATTRS}>${MAIL_PATHS}</svg>
</span>`,
    react: `<Mail aria-hidden="true" style={{ color: "var(--ok-palette-success-main)" }} />`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- **Decorative icons** sit next to visible text that says the same thing. Hide them from assistive technology with \`aria-hidden="true"\`.
- **Meaningful icons** stand alone and carry information. Give them a name with \`role="img"\` and \`aria-label\`.
- **Icon-only buttons** need a name on the button, not on the icon: set \`aria-label\` on the button and hide the icon.
- Make sure an icon that conveys meaning has a contrast ratio of at least 3:1 with its background (WCAG 2.2, success criterion 1.4.11).`,
    html: `<!-- Decorative: next to visible text -->
<svg aria-hidden="true" width="20" height="20" ${SVG_ATTRS}>${MAIL_PATHS}</svg> Messages

<!-- Meaningful on its own: give it a name -->
<svg role="img" aria-label="3 new messages" width="24" height="24" ${SVG_ATTRS}>${MAIL_PATHS}</svg>`,
    react: `{/* Decorative: next to visible text */}
<Mail aria-hidden="true" width={20} height={20} /> Messages

{/* Meaningful on its own: give it a name */}
<Mail role="img" aria-label="3 new messages" width={24} height={24} />`,
  },
];

function Mail({ size = 24 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ComponentsPreview() {
  return (
    <Preview>
      <Button variant="contained" color="primary" startIcon={<Mail />}>
        Send
      </Button>
      <IconButton aria-label="Send">
        <Mail />
      </IconButton>
    </Preview>
  );
}

function SizePreview() {
  return (
    <Preview className="gap-8!">
      {[16, 20, 24, 32].map((size) => (
        <span key={size} className="flex flex-col items-center gap-2">
          <Mail size={size} />
          <Caption>{size}px</Caption>
        </span>
      ))}
    </Preview>
  );
}

function ColorPreview() {
  return (
    <Preview className="gap-6!">
      {["text-primary", "palette-primary-main", "palette-success-main", "palette-error-main"].map(
        (token) => (
          <span
            key={token}
            className="flex flex-col items-center gap-2"
            style={{ color: `var(--ok-${token})` }}
          >
            <Mail />
            <Caption>{token}</Caption>
          </span>
        ),
      )}
    </Preview>
  );
}

const PREVIEWS = { components: ComponentsPreview, size: SizePreview, color: ColorPreview };

/** Icons docs page. */
export function IconsDocs() {
  return <GuideDocs sections={iconsSections} previews={PREVIEWS} />;
}
