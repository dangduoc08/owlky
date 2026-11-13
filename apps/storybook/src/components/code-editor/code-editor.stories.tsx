import { DiffEditor } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { snippetStory } from "../shared/snippets.js";
import { CodeEditorDemo } from "./code-editor-demo.js";
import editorSource from "./code-editor-demo.tsx?raw";
import { CodeEditorDocs } from "./code-editor-docs.js";
import {
  diffScript,
  EDITOR_SCRIPT_SOURCE,
  editorScript,
  MULTI_MODEL_SCRIPT_SOURCE,
  multiModelScript,
  VALIDATION_SCRIPT_SOURCE,
  validationScript,
} from "./code-editor-script.js";
import { DIFF_EDITOR_CONTROLS, DiffExample } from "./code-editor-snippets.js";
import { MultiModelDemo } from "./multi-model-demo.js";
import multiModelSource from "./multi-model-demo.tsx?raw";
import { ValidationDemo } from "./validation-demo.js";
import validationSource from "./validation-demo.tsx?raw";
import "./monaco-workers.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/code-editor/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
const SETUP = [
  "<!-- Once per page (CDN): owlky.js loads the code editor when the page holds one, and Monaco from the monaco/ folder next to it. -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky-all.css" and "@owlky/html/auto", then "@owlky/html/code-editor". -->',
].join("\n");

const meta = {
  title: "Components/Code editor",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: CodeEditorDocs,
      description: {
        component: "A code editor with syntax highlighting, IntelliSense, validation and diffs.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Editor: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "code-editor", [["Editor", "editor"]], SETUP, undefined, {
      editor: { script: editorScript, scriptSource: EDITOR_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Editor", content: <CodeEditorDemo /> }],
      undefined,
      editorSource,
    ),
  }),
  name: "Editor",
};

export const Diff: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "code-editor",
      [["Diff editor", "diff"]],
      SETUP,
      DIFF_EDITOR_CONTROLS,
      { diff: { script: diffScript } },
    ),
    react: reactGroupsStory([{ title: "Diff editor", content: <DiffExample /> }], {
      ...DIFF_EDITOR_CONTROLS,
      target: DiffEditor,
    }),
  }),
  name: "Diff editor",
};

export const MultiModel: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "code-editor",
      [["Multi-model editor", "multi-model"]],
      SETUP,
      undefined,
      { "multi-model": { script: multiModelScript, scriptSource: MULTI_MODEL_SCRIPT_SOURCE } },
    ),
    react: reactGroupsStory(
      [{ title: "Multi-model editor", content: <MultiModelDemo /> }],
      undefined,
      multiModelSource,
    ),
  }),
  name: "Multi-model editor",
};

export const Validation: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "code-editor", [["Validation", "validation"]], SETUP, undefined, {
      validation: { script: validationScript, scriptSource: VALIDATION_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Validation", content: <ValidationDemo /> }],
      undefined,
      validationSource,
    ),
  }),
  name: "Validation",
};
