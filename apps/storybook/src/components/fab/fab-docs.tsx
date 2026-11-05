import { fabOptions } from "@owlky/core";
import { Fab } from "@owlky/react";
import { DocsIcon, iconMarkup } from "../../helpers/docs-icons.js";
import { CDN, capitalize, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const PLUS = iconMarkup("plus");

export const fabSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A floating action button (fab) holds the single most important action of a screen, such as creating a new item. It's round and shows an icon, or it's extended with an icon and a label. Use at most one fab per screen; for other actions, use a **Button**.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<button type="button" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" aria-label="Add">
  ${PLUS}
</button>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Fab } from "@owlky/react";

export function AddButton() {
  return (
    <Fab color="primary" aria-label="Add">
      <PlusIcon />
    </Fab>
  );
}`,
  },
  {
    id: "extended",
    title: "Add a label",
    body: "Set `extended` to show a label next to the icon. The label makes the action clearer and gives the fab its name, so you don't need `aria-label`.",
    html: `<button type="button" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-extended>
  ${PLUS}New project
</button>`,
    react: `<Fab color="primary" extended>
  <PlusIcon />
  New project
</Fab>`,
  },
  {
    id: "variants",
    title: "Choose a variant and color",
    body: "Three variants are available: `contained` (the default), `outlined` and `soft`. The default color is a light grey; use `primary` for the main action of most screens.",
    html: `<button type="button" data-ok-fab data-ok-variant="soft" data-ok-color="primary" data-ok-size="md" aria-label="Add">
  ${PLUS}
</button>`,
    react: `<Fab variant="soft" color="primary" aria-label="Add">
  <PlusIcon />
</Fab>`,
  },
  {
    id: "sizes",
    title: "Set the size",
    body: "Three sizes are available: `sm`, `md` (the default) and `lg`. Round fabs are 40, 48 and 56px wide; extended fabs are 36, 40 and 48px tall.",
    html: `<button type="button" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="lg" aria-label="Add">
  ${PLUS}
</button>`,
    react: `<Fab color="primary" size="lg" aria-label="Add">
  <PlusIcon />
</Fab>`,
  },
  {
    id: "position",
    title: "Position the fab",
    body: "The fab doesn't position itself. Place it with your own CSS, usually fixed to the bottom-right corner of the screen, with enough space so it doesn't cover content that people need.",
    html: `<style>
  .page-fab {
    position: fixed;
    right: 24px;
    bottom: 24px;
  }
</style>

<button type="button" class="page-fab" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" aria-label="Add">
  ${PLUS}
</button>`,
    react: `<Fab
  color="primary"
  aria-label="Add"
  style={{ position: "fixed", right: 24, bottom: 24 }}
>
  <PlusIcon />
</Fab>`,
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
    body: "Fabs are native buttons or links, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A round fab has no visible label, so give it a name with \`aria-label\`. An extended fab is named by its label.
- The icon is decorative and hidden from assistive technology.
- Focus is shown with a 2px outline, and every size is at least 24 × 24px.
- Brand-colored fabs use white text on the main color, which can be below a contrast ratio of 4.5:1. The \`soft\` variant uses the accessible \`text\` tone.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Fab color="primary" aria-label="Add">
        <DocsIcon name="plus" />
      </Fab>
      <Fab color="primary" extended>
        <DocsIcon name="plus" />
        New project
      </Fab>
    </Preview>
  ),
  extended: () => (
    <Preview>
      <Fab color="primary" extended>
        <DocsIcon name="plus" />
        New project
      </Fab>
    </Preview>
  ),
  variants: () => (
    <Preview>
      {(["contained", "outlined", "soft"] as const).map((variant) => (
        <Fab key={variant} variant={variant} color="primary" aria-label={`Add, ${variant}`}>
          <DocsIcon name="plus" />
        </Fab>
      ))}
      <Fab aria-label="Add, default color">
        <DocsIcon name="plus" />
      </Fab>
    </Preview>
  ),
  sizes: () => (
    <Preview>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Fab key={size} color="primary" size={size} aria-label={`Add, ${capitalize(size)}`}>
          <DocsIcon name="plus" />
        </Fab>
      ))}
    </Preview>
  ),
  options: () => <OptionsTable schema={fabOptions} />,
  props: () => (
    <PropsTable
      label="Fab content props"
      rows={[
        {
          react: "children",
          html: "<svg> and text inside",
          type: "ReactNode",
          description: "The icon, and the label when `extended`.",
        },
        {
          react: "href",
          html: "<a href>",
          type: "string",
          description: "Renders a link. A disabled link loses its href and gets aria-disabled.",
        },
        {
          react: "ref",
          type: "HTMLButtonElement | HTMLAnchorElement",
          description: "Forwarded to the button or link. Every native attribute is passed through.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the fab."],
        ["Enter / Space", "Activates a fab button."],
        ["Enter", "Follows a fab link."],
      ]}
    />
  ),
};

/** Fab docs page (ADR-0019). */
export function FabDocs() {
  return <GuideDocs sections={fabSections} previews={PREVIEWS} />;
}
