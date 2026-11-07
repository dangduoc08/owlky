import { dividerOptions } from "@owlky/core";
import { Divider } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const dividerSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A divider is a thin line that groups content: between sections of a menu, rows of a list or groups of buttons. It is a native `<hr>`, so assistive technology announces a separator. It needs no JavaScript.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<hr data-ok-divider data-ok-variant="fullWidth" data-ok-orientation="horizontal">`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Divider } from "@owlky/react";

export function Sections() {
  return (
    <>
      <p>Account</p>
      <Divider />
      <p>Billing</p>
    </>
  );
}`,
  },
  {
    id: "variants",
    title: "Inset or shorten the line",
    body: "By default the line spans its container (`fullWidth`). Use `inset` in lists whose rows start with an avatar or an icon: the line starts 72px in, under the text. Use `middle` to leave 16px on both sides.",
    html: `<hr data-ok-divider data-ok-variant="inset" data-ok-orientation="horizontal">`,
    react: `<Divider variant="inset" />`,
  },
  {
    id: "vertical",
    title: "Separate items in a row",
    body: 'Set `orientation` to `vertical` for a line between items side by side; in HTML, also write `aria-orientation="vertical"`. In a flex row, add `flexItem` so the line takes the row\'s height.',
    html: `<hr data-ok-divider data-ok-variant="middle" data-ok-orientation="vertical" data-ok-flex-item aria-orientation="vertical">`,
    react: `<Divider orientation="vertical" variant="middle" flexItem />`,
  },
  {
    id: "text",
    title: "Put text on the line",
    body: 'Pass children to show text, or a chip, on the line, such as "or" between two sign-in options. Set `textAlign` to `left` or `right` to move it. With children, the divider is a `div` with `role="separator"` and the text in a `data-ok-divider-text` span.',
    html: `<div role="separator" aria-orientation="horizontal" data-ok-divider data-ok-variant="fullWidth" data-ok-orientation="horizontal">
  <span data-ok-divider-text>or</span>
</div>`,
    react: `<Divider>or</Divider>`,
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
    body: "Dividers have no events or methods.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Dividers don't take focus.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A divider is announced as a separator. Use one where the content really changes; for space alone, use margins.
- A purely decorative line between items that are already grouped can be hidden with \`aria-hidden="true"\`.
- Text on a divider uses the secondary text color, with a contrast ratio of at least 4.5:1. The line itself is decorative and lighter.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview className="flex-col items-stretch!">
      <span>Account</span>
      <Divider />
      <span>Billing</span>
    </Preview>
  ),
  variants: () => (
    <Preview className="flex-col items-stretch!">
      <Divider variant="inset" />
      <Divider variant="middle" />
    </Preview>
  ),
  vertical: () => (
    <Preview>
      <span>Inbox</span>
      <Divider orientation="vertical" variant="middle" flexItem />
      <span>Drafts</span>
    </Preview>
  ),
  text: () => (
    <Preview className="block!">
      <Divider>or</Divider>
    </Preview>
  ),
  options: () => <OptionsTable schema={dividerOptions} />,
  props: () => (
    <PropsTable
      label="Divider content props"
      rows={[
        {
          react: "children",
          html: "data-ok-divider-text",
          type: "ReactNode",
          description: 'Text or a chip on the line (the divider becomes a `div role="separator"`).',
        },
        {
          react: "ref",
          type: "HTMLElement",
          description: "The `hr` (or the `div` with children).",
        },
      ]}
    />
  ),
};

/** Divider docs page (ADR-0019). */
export function DividerDocs() {
  return <GuideDocs sections={dividerSections} previews={PREVIEWS} />;
}
