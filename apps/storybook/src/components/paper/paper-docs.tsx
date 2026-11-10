import { paperOptions } from "@owlky/core";
import paperApi from "@owlky/docs-content/api/paper.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Paper } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const paperSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Paper is a surface for content. It paints the paper background and the primary text color of the current theme, rounds its corners and raises itself with a shadow. Other surfaces, such as cards, are built on it. Paper needs no JavaScript, and it has no size or padding of its own: your layout decides them.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="1">
  <p>Your content</p>
</div>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Paper } from "@owlky/react";

export function Summary() {
  return (
    <Paper>
      <p>Your content</p>
    </Paper>
  );
}`,
  },
  {
    id: "elevation",
    title: "Raise a surface",
    body: "Set `elevation` to a level from 0 to 24. The default is 1. A higher level casts a larger shadow, so the surface looks further away from the page. Level 0 has no shadow. Each level uses the matching `--ok-elevation-<level>` shadow, and the shadows follow the light and dark themes.",
    html: `<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="0">Level 0</div>
<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="8">Level 8</div>
<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="24">Level 24</div>`,
    react: `import { Paper } from "@owlky/react";

export function Levels() {
  return (
    <>
      <Paper elevation={0}>Level 0</Paper>
      <Paper elevation={8}>Level 8</Paper>
      <Paper elevation={24}>Level 24</Paper>
    </>
  );
}`,
  },
  {
    id: "variants",
    title: "Outline a flat surface",
    body: "Set `variant` to `outlined` for a flat surface with a thin outline and no shadow. Use it inside another surface, where a second shadow would look heavy. The outlined variant ignores `elevation`.",
    html: `<div data-ok-paper data-ok-variant="outlined" data-ok-elevation="1">Outlined</div>`,
    react: `import { Paper } from "@owlky/react";

export function Outlined() {
  return <Paper variant="outlined">Outlined</Paper>;
}`,
  },
  {
    id: "corners",
    title: "Square the corners",
    body: "Add `square` for corners without a radius, such as a surface that runs to the edges of the screen.",
    html: `<div data-ok-paper data-ok-variant="elevation" data-ok-elevation="1" data-ok-square>Square</div>`,
    react: `import { Paper } from "@owlky/react";

export function Square() {
  return <Paper square>Square</Paper>;
}`,
  },
  {
    id: "element",
    title: "Choose the element",
    body: "Paper renders a `div` by default. Pick the element that describes the content, such as `section`, `article` or `li`: in React with the `component` prop, in HTML by writing the attributes on that element. Paper adds no role, so the element's own meaning is what assistive technology announces.",
    html: `<ul>
  <li data-ok-paper data-ok-variant="outlined" data-ok-elevation="1">First item</li>
  <li data-ok-paper data-ok-variant="outlined" data-ok-elevation="1">Second item</li>
</ul>`,
    react: `import { Paper } from "@owlky/react";

export function Items() {
  return (
    <ul>
      <Paper component="li" variant="outlined">
        First item
      </Paper>
      <Paper component="li" variant="outlined">
        Second item
      </Paper>
    </ul>
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
    body: "These props set the content and the element. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Paper has no events or methods.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Paper doesn't take focus. Interactive content inside it keeps its own keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Paper is a visual surface only. To make it a landmark or a group, use an element with that meaning, such as \`section\` with a heading.
- Text on paper uses the primary text color, with a contrast ratio of at least 4.5:1 in the light and dark themes.
- Shadows and outlines are decorative. Don't use the elevation level alone to show which surface is selected or important.`,
  },
  apiReferenceSection(paperApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Paper className="p-6">Your content</Paper>
    </Preview>
  ),
  elevation: () => (
    <Preview>
      <Paper className="p-6" elevation={0}>
        Level 0
      </Paper>
      <Paper className="p-6" elevation={8}>
        Level 8
      </Paper>
      <Paper className="p-6" elevation={24}>
        Level 24
      </Paper>
    </Preview>
  ),
  variants: () => (
    <Preview>
      <Paper className="p-6" variant="outlined">
        Outlined
      </Paper>
    </Preview>
  ),
  corners: () => (
    <Preview>
      <Paper className="p-6" square>
        Square
      </Paper>
    </Preview>
  ),
  element: () => (
    <Preview>
      <ul className="m-0 flex list-none gap-4 p-0">
        <Paper component="li" className="p-6" variant="outlined">
          First item
        </Paper>
        <Paper component="li" className="p-6" variant="outlined">
          Second item
        </Paper>
      </ul>
    </Preview>
  ),
  options: () => <OptionsTable schema={paperOptions} />,
  props: () => (
    <PropsTable
      label="Paper content props"
      rows={[
        {
          react: "component",
          html: "the element",
          type: "ElementType",
          description: "The element to render, such as `section` or `li`. Default `div`.",
        },
        {
          react: "children",
          html: "the element's content",
          type: "ReactNode",
          description: "The content of the surface.",
        },
        {
          react: "ref",
          type: "HTMLElement",
          description: "The rendered element.",
        },
      ]}
    />
  ),
};

/** Paper docs page (ADR-0019). */
export function PaperDocs() {
  return <GuideDocs sections={paperSections} previews={PREVIEWS} />;
}
