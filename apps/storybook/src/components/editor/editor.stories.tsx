import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { snippetStory } from "../shared/snippets.js";
import { EditorDemo } from "./editor-demo.js";
import editorSource from "./editor-demo.tsx?raw";
import { EditorDocs } from "./editor-docs.js";
import { EDITOR_SCRIPT_SOURCE, editorScript } from "./editor-script.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/editor/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
const SETUP = [
  "<!-- Once per page (CDN): -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  `<script src="${CDN}/owlky-editor.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky.css" and "@owlky/html/auto", then "@owlky/html/editor" (or register createEditor() yourself, as below). -->',
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
