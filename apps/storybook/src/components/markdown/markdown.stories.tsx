import { Markdown } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { snippetStory } from "../shared/snippets.js";
import { HtmlContentDemo, MarkdownContentDemo } from "./markdown-demos.js";
import demoSource from "./markdown-demos.tsx?raw";
import { MarkdownDocs } from "./markdown-docs.js";
import { MARKDOWN_CONTROLS, MARKDOWN_SCRIPT_SOURCE, markdownScript } from "./markdown-script.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/markdown/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const controls: StoryControls = { ...MARKDOWN_CONTROLS, target: Markdown };

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
const SETUP = [
  "<!-- Once per page (CDN): -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  `<script src="${CDN}/owlky-markdown.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky.css" and "@owlky/html/auto", then "@owlky/html/markdown" (or register createMarkdown() yourself, as below). -->',
].join("\n");

/** The React source of one demo: the shared imports plus that demo's function. */
const reactSource = (name: string) => {
  const [head = "", ...demos] = demoSource.split(/\n(?=\/\*\* )/);
  return [head.trim(), demos.find((demo) => demo.includes(`function ${name}(`))?.trim()].join(
    "\n\n",
  );
};

const meta = {
  title: "Components/Markdown",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: MarkdownDocs,
      description: {
        component: "Renders Markdown, with GitHub Flavored Markdown and optional HTML, as content.",
      },
    },
  },
} satisfies Meta;
export default meta;

const story = (file: string, title: string, demo: ReactElement, name: string): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, "markdown", [[title, file]], SETUP, MARKDOWN_CONTROLS, {
      [file]: { script: markdownScript, scriptSource: MARKDOWN_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory([{ title, content: demo }], controls, reactSource(name)),
  });

export const HtmlContent: StoryObj = {
  ...story("html-content", "Html content", <HtmlContentDemo />, "HtmlContentDemo"),
  name: "Html content",
};

export const MarkdownContent: StoryObj = {
  ...story("markdown-content", "Markdown content", <MarkdownContentDemo />, "MarkdownContentDemo"),
  name: "Markdown content",
};
