import { labelOptions } from "@owlky/core";
import labelApi from "@owlky/docs-content/api/label.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Label } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { MailIcon } from "../avatar/display-icons.js";

export const labelSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A label is a small tag that shows a status or a category, such as Paid, Pending or Draft, in tables, cards and lists. Labels are text, not controls, and need no JavaScript. For something people can click or remove, use a **Chip**.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<span data-ok-label data-ok-variant="soft" data-ok-color="success">Paid</span>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Label } from "@owlky/react";

export function InvoiceStatus() {
  return <Label color="success">Paid</Label>;
}`,
  },
  {
    id: "variants",
    title: "Choose a variant and color",
    body: "The default `soft` variant tints the background. Use `filled` for strong emphasis, `outlined` for a light one, and `inverted` for a pale background with dark text. Pick the color from what the status means: `success` for done, `warning` for pending, `error` for failed.",
    html: `<span data-ok-label data-ok-variant="inverted" data-ok-color="warning">Pending</span>`,
    react: `import { Label } from "@owlky/react";

export function PendingLabel() {
  return (
    <Label variant="inverted" color="warning">
      Pending
    </Label>
  );
}`,
  },
  {
    id: "icons",
    title: "Add an icon",
    body: "Pass `startIcon` or `endIcon`. Icons are 16px and decorative: the text says what the label means.",
    html: `<span data-ok-label data-ok-variant="filled" data-ok-color="primary">
  <span data-ok-label-icon="start" aria-hidden="true"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg></span>
  Sent
</span>`,
    react: `import { Label } from "@owlky/react";
import { MailIcon } from "lucide-react";

export function SentLabel() {
  return (
    <Label variant="filled" color="primary" startIcon={<MailIcon />}>
      Sent
    </Label>
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
    body: "These props set the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Labels have no events or methods.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Labels don't take focus.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The text is the label's meaning: don't rely on its color alone.
- Soft and inverted labels meet a contrast ratio of at least 4.5:1. Filled and outlined brand colors follow the design, so light colors such as \`warning\` are lower.
- White labels are meant for dark surfaces.`,
  },
  apiReferenceSection(labelApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Label color="success">Paid</Label>
    </Preview>
  ),
  variants: () => (
    <Preview>
      {(["soft", "filled", "outlined", "inverted"] as const).map((variant) => (
        <Label key={variant} variant={variant} color="warning">
          Pending
        </Label>
      ))}
    </Preview>
  ),
  icons: () => (
    <Preview>
      <Label variant="filled" color="primary" startIcon={<MailIcon />}>
        Sent
      </Label>
    </Preview>
  ),
  options: () => <OptionsTable schema={labelOptions} />,
  props: () => (
    <PropsTable
      label="Label content props"
      rows={[
        { react: "children", html: "text", type: "ReactNode", description: "The label's text." },
        {
          react: "startIcon / endIcon",
          html: 'data-ok-label-icon="start | end"',
          type: "ReactNode",
          description: "A decorative 16px icon.",
        },
        { react: "ref", type: "HTMLSpanElement", description: "The label element." },
      ]}
    />
  ),
};

/** Label docs page (ADR-0019). */
export function LabelDocs() {
  return <GuideDocs sections={labelSections} previews={PREVIEWS} />;
}
