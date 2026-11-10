import { scrollbarOptions } from "@owlky/core";
import scrollbarApi from "@owlky/docs-content/api/scrollbar.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Scrollbar } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import text from "./scrollbar-text.json" with { type: "json" };

export const scrollbarSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A scrollbar area keeps long content inside a fixed frame, with a thin scrollbar that matches the theme. Use it for any region that scrolls on its own: a panel, a list, a table or the content of a drawer. The browser does the scrolling, so touch momentum, wheel scrolling and find-in-page keep working.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<section data-ok-scrollbar aria-label="Release notes" tabindex="0" style="max-height: 320px">
  …
</section>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Scrollbar } from "@owlky/react";

export function ReleaseNotes() {
  return (
    <Scrollbar aria-label="Release notes" style={{ maxHeight: 320 }}>
      …
    </Scrollbar>
  );
}`,
  },
  {
    id: "visibility",
    title: "Keep the scrollbar visible",
    body: "By default, the scrollbar appears when the pointer rests on the area or when focus is inside it. On touch screens it's always visible. Set `autoHide` to `false` to always show it, for example when people might not notice that the area scrolls.",
    html: `<section data-ok-scrollbar data-ok-auto-hide="false" aria-label="Release notes" tabindex="0">
  …
</section>`,
    react: `<Scrollbar autoHide={false} aria-label="Release notes">…</Scrollbar>`,
  },
  {
    id: "compose",
    title: "Scroll other components",
    body: "Other components scroll by wrapping their content in a scrollbar area. Put a **Table** inside one within its `TableContainer`, place one inside a **Drawer**'s content, or wrap a **Sortable** list. The component around it stops scrolling by itself, and the scrollbar area takes over.",
    html: `<section data-ok-table-container>
  <section data-ok-scrollbar aria-label="Orders" tabindex="0">
    <table data-ok-table data-ok-size="medium" data-ok-padding="normal">…</table>
  </section>
</section>`,
    react: `<TableContainer>
  <Scrollbar aria-label="Orders">
    <Table>…</Table>
  </Scrollbar>
</TableContainer>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props name the area and make it reachable with the keyboard.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The area takes focus, then the browser scrolls it with the usual keys.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The area is a named region that keyboard users can reach with Tab and scroll. Give it a name that says what's inside, such as "Release notes"; the default is "scrollable content".
- The scrollbar shows while focus is inside, so keyboard users can see where they are.
- On Windows and Linux, the scrollbar takes a little space next to the content; on macOS, iOS and Android, the system's overlay scrollbars are used.`,
  },
  apiReferenceSection(scrollbarApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <Scrollbar aria-label="Release notes" style={{ maxHeight: 200 }}>
        {[...text, ...text].map((paragraph, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static demo text repeats.
          <p key={i} className="mt-0 mb-4 mr-2">
            {paragraph}
          </p>
        ))}
      </Scrollbar>
    </Preview>
  ),
  visibility: () => (
    <Preview className="block!">
      <Scrollbar
        autoHide={false}
        aria-label="Release notes, always visible"
        style={{ maxHeight: 160 }}
      >
        {text.map((paragraph) => (
          <p key={paragraph} className="mt-0 mb-4 mr-2">
            {paragraph}
          </p>
        ))}
      </Scrollbar>
    </Preview>
  ),
  options: () => <OptionsTable schema={scrollbarOptions} />,
  props: () => (
    <PropsTable
      label="Scrollbar content props"
      rows={[
        {
          react: "aria-label",
          html: "aria-label",
          type: "string",
          description: 'Name of the region. Default "scrollable content".',
        },
        {
          react: "tabIndex",
          html: "tabindex",
          type: "number",
          description: "Default 0, so the area can take focus and be scrolled with the keyboard.",
        },
        {
          react: "ref",
          type: "HTMLElement",
          description: "The scrolling element itself, for example to read `scrollTop`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the area."],
        ["Arrow keys", "Scroll a little."],
        ["Page Up / Page Down / Space", "Scroll by a screen."],
        ["Home / End", "Scroll to the start or the end."],
      ]}
    />
  ),
};

/** Scrollbar docs page (ADR-0019). */
export function ScrollbarDocs() {
  return <GuideDocs sections={scrollbarSections} previews={PREVIEWS} />;
}
