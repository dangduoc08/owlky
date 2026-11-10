import buttonApi from "../../api/button.json" with { type: "json" };
import { apiReferenceSection } from "../../guide/api-data.js";
import type { KeyboardRow, PropRow } from "../../guide/tables-data.js";
import { CDN, capitalize, type GuideSection } from "../../guide/text.js";

/*
 * Content of the Button docs page (ADR-0019): prose (Markdown) and HTML / React examples, plus
 * the rows of its reference tables. The previews are in button-docs.tsx.
 * Writing style: AGENTS.md → "Writing documentation".
 */

export const MAIL_SVG = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>`;

export const VARIANTS = ["contained", "outlined", "text", "soft"] as const;
export const COLORS = ["primary", "secondary", "info", "success", "warning", "error"] as const;

const htmlButton = (attrs: string, label: string, extra = "") =>
  `<button type="button" data-ok-button ${attrs}>\n${extra}  <span data-ok-button-label>${label}</span>\n</button>`;

export const buttonSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A button starts an action, such as saving a form or opening a dialog. When it should take the user to another page instead, render it as a link: it keeps the button's look and gets link behavior.

Use one **contained** button for the main action of a view. Use **outlined**, **soft** or **text** buttons for secondary and less important actions, so the main action stands out.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

${htmlButton('data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"', "Save")}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Button } from "@owlky/react";

export function SaveButton() {
  return (
    <Button variant="contained" color="primary">
      Save
    </Button>
  );
}`,
  },
  {
    id: "variants",
    title: "Choose a variant",
    body: "The variant sets how much a button stands out. From strongest to lightest: `contained`, `soft`, `outlined` and `text`. The default is `text`.",
    html: VARIANTS.map((variant) =>
      htmlButton(
        `data-ok-variant="${variant}" data-ok-color="primary" data-ok-size="md"`,
        capitalize(variant),
      ),
    ).join("\n"),
    react: `import { Button } from "@owlky/react";

export function ButtonVariants() {
  return (
    <>
      <Button variant="contained" color="primary">
        Contained
      </Button>
      <Button variant="outlined" color="primary">
        Outlined
      </Button>
      <Button variant="text" color="primary">
        Text
      </Button>
      <Button variant="soft" color="primary">
        Soft
      </Button>
    </>
  );
}`,
  },
  {
    id: "colors",
    title: "Pick a color",
    body: "Use `primary` for the main action and the status colors to match the meaning of an action, for example `error` for a destructive one. The default, `inherit`, is a neutral color that suits most secondary actions. Use `black` or `white` on light or dark surfaces, such as images.",
    html: htmlButton(
      'data-ok-variant="contained" data-ok-color="error" data-ok-size="md"',
      "Delete",
    ),
    react: `import { Button } from "@owlky/react";

export function ButtonColors() {
  return (
    <Button variant="contained" color="error">
      Delete
    </Button>
  );
}`,
  },
  {
    id: "sizes",
    title: "Set the size",
    body: "Four sizes are available: `sm` (30px), `md` (36px, the default), `lg` (48px) and `xl` (56px). Use `fullWidth` to make a button fill its container, for example for the main action on a phone.",
    html: `${htmlButton('data-ok-variant="contained" data-ok-color="primary" data-ok-size="lg"', "Large")}
${htmlButton('data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-full-width', "Full width")}`,
    react: `import { Button } from "@owlky/react";

export function ButtonSizes() {
  return (
    <>
      <Button variant="contained" color="primary" size="lg">
        Large
      </Button>
      <Button variant="contained" color="primary" fullWidth>
        Full width
      </Button>
    </>
  );
}`,
  },
  {
    id: "icons",
    title: "Add an icon",
    body: "An icon before or after the label helps people recognize an action. In React, pass it as `startIcon` or `endIcon`. In HTML, wrap it in `data-ok-button-icon`. The icon is decorative: the label stays the button's name.",
    html: htmlButton(
      'data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"',
      "Send",
      `  <span data-ok-button-icon="start" aria-hidden="true">${MAIL_SVG}</span>\n`,
    ),
    react: `import { Button } from "@owlky/react";
import { MailIcon } from "lucide-react";

export function ButtonIcons() {
  return (
    <Button variant="contained" color="primary" startIcon={<MailIcon />}>
      Send
    </Button>
  );
}`,
  },
  {
    id: "loading",
    title: "Show that an action is in progress",
    body: "Set `loading` while an action runs, such as a form submission. The button shows a spinner, is disabled and tells assistive technology that it's busy. With `loadingPosition`, the spinner replaces the start or end icon instead of covering the label.",
    html: `<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-loading data-ok-loading-position="start" aria-busy="true" disabled>
  <span data-ok-button-icon="start" aria-hidden="true">${MAIL_SVG}</span>
  <span data-ok-button-loader aria-hidden="true"><span role="progressbar" data-ok-circular-progress data-ok-variant="indeterminate" data-ok-color="inherit" data-ok-button-spinner><svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg></span></span>
  <span data-ok-button-label>Sending</span>
</button>`,
    react: `import { Button } from "@owlky/react";
import { MailIcon } from "lucide-react";

export function ButtonLoading() {
  return (
    <Button
      variant="contained"
      color="primary"
      loading
      loadingPosition="start"
      startIcon={<MailIcon />}
    >
      Sending
    </Button>
  );
}`,
  },
  {
    id: "link",
    title: "Use a button as a link",
    body: "When a button navigates, render it as a link. In React, pass `href`; in HTML, use an `<a>` element with the same attributes. The URL is passed through untouched.",
    html: `<a href="/docs" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md">
  <span data-ok-button-label>Read the docs</span>
</a>`,
    react: `import { Button } from "@owlky/react";

export function ButtonLink() {
  return (
    <Button variant="outlined" href="/docs">
      Read the docs
    </Button>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Buttons and links are native elements, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The label text is the button's name. Icons and the loader are hidden from assistive technology.
- Buttons with only an icon need a name: use an **Icon button** with \`aria-label\`.
- While loading, the button is disabled and marked busy (\`aria-busy="true"\`). It leaves the tab order until the action ends, so move focus to the result when it's ready.
- Focus is shown with a 2px outline.
- Every size is at least 24 × 24px, so buttons are easy to hit on touch screens.
- Brand-colored buttons use white text on the main color. Some of these combinations are below a contrast ratio of 4.5:1, so keep labels short. Soft buttons use the accessible \`text\` tone.`,
  },
  apiReferenceSection(buttonApi),
];

/** Props and markup that aren't options (the "Content and behavior" table). */
export const buttonPropRows: PropRow[] = [
  {
    react: "startIcon",
    html: 'data-ok-button-icon="start"',
    type: "ReactNode",
    description: "Decorative icon before the label.",
  },
  {
    react: "endIcon",
    html: 'data-ok-button-icon="end"',
    type: "ReactNode",
    description: "Decorative icon after the label.",
  },
  {
    react: "loadingIndicator",
    html: "data-ok-button-loader",
    type: "ReactNode",
    description: "Replaces the spinner, for example with the text “Loading…”.",
  },
  {
    react: "href",
    html: "<a href>",
    type: "string",
    description:
      "Renders a link. A disabled or loading link loses its href and gets aria-disabled.",
  },
  {
    react: "ref",
    type: "HTMLButtonElement | HTMLAnchorElement",
    description: "Forwarded to the button or link. Every native attribute is passed through.",
  },
];

/** The "Keyboard" table. */
export const buttonKeyboardRows: KeyboardRow[] = [
  ["Tab", "Moves focus to the button. Disabled and loading buttons are skipped."],
  ["Enter / Space", "Activates a button."],
  ["Enter", "Follows a link button."],
];
