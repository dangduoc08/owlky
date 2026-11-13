import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { snippetStory } from "../shared/snippets.js";
import { BubbleMenuDemo } from "./bubble-menu-demo.js";
import bubbleSource from "./bubble-menu-demo.tsx?raw";
import { EditorDemo } from "./editor-demo.js";
import editorSource from "./editor-demo.tsx?raw";
import { EditorDocs } from "./editor-docs.js";
import {
  EDITOR_SCRIPT_SOURCE,
  editorScript,
  PLAIN_EDITOR_SCRIPT_SOURCE,
  plainEditorScript,
} from "./editor-script.js";
import { MentionsDemo } from "./mentions-demo.js";
import mentionsSource from "./mentions-demo.tsx?raw";
import { TableDemo } from "./table-demo.js";
import tableSource from "./table-demo.tsx?raw";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/editor/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
const SETUP = [
  "<!-- Once per page (CDN): owlky.js loads the editor and Markdown when the page holds them. -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky-all.css" and "@owlky/html/auto", then "@owlky/html/editor" and "@owlky/html/markdown" (or register createEditor() and createMarkdown() yourself, as below). -->',
].join("\n");

const meta = {
  title: "Components/Editor",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: EditorDocs,
      description: { component: "A rich text editor with a formatting toolbar." },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "editor", [["Editor", "group"]], SETUP, undefined, {
      group: { script: editorScript, scriptSource: EDITOR_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Editor", content: <EditorDemo /> }],
      undefined,
      editorSource,
    ),
  }),
  name: "Editor",
};

const PLAIN_SETUP = [
  "<!-- Once per page (CDN): owlky.js loads the editor when the page holds one. -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky-all.css", "@owlky/html/auto" and "@owlky/html/editor" (or register the editor yourself, as below). -->',
].join("\n");

/** A story of one Tiptap feature (Tiptap's demos): one editor, no Controls. */
const featureStory = (
  name: string,
  title: string,
  demo: () => React.JSX.Element,
  source: string,
): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, [[title, "group"]], PLAIN_SETUP, undefined, {
      group: { script: plainEditorScript, scriptSource: PLAIN_EDITOR_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory([{ title, content: demo() }], undefined, source),
  }),
  name: title,
});

export const BubbleMenu: StoryObj = featureStory(
  "bubble-menu",
  "Bubble menu",
  BubbleMenuDemo,
  bubbleSource,
);
export const Tables: StoryObj = featureStory("table", "Table", TableDemo, tableSource);
export const Mentions: StoryObj = featureStory(
  "mentions",
  "Mentions",
  MentionsDemo,
  mentionsSource,
);
