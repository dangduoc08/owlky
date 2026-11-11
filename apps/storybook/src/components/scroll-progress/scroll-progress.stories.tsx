import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, htmlSetup, snippetStory } from "../shared/snippets.js";
import { ContainerScrollXDemo } from "./container-x-demo.js";
import containerXSource from "./container-x-demo.tsx?raw";
import { ContainerScrollYDemo } from "./container-y-demo.js";
import containerYSource from "./container-y-demo.tsx?raw";
import { ScrollDocumentDemo } from "./document-demo.js";
import documentSource from "./document-demo.tsx?raw";
import { ScrollProgressDocs } from "./scroll-progress-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/scroll-progress/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const files = (title: string): GroupFiles => [[title, "group"]];
// The progress's own runtime and the scroll-progress runtime run side by side.
const setup = htmlSetup(
  [
    "paper.css",
    "typography.css",
    "card.css",
    "circular-progress.css",
    "linear-progress.css",
    "scrollbar.css",
    "scroll-progress.css",
  ],
  true,
);

const meta = {
  title: "Components/Scroll progress",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ScrollProgressDocs,
      description: {
        component:
          "Scroll progress shows how far a scroll area or the page has been scrolled, with a linear or circular progress indicator.",
      },
    },
  },
} satisfies Meta;
export default meta;

const story = (name: string, title: string, demo: JSX.Element, source: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, files(title), setup),
    react: reactGroupsStory([{ title, content: demo }], undefined, source),
  }),
  name: title,
});

export const ContainerScrollY: StoryObj = story(
  "container-scroll-y",
  "Container scroll-y",
  <ContainerScrollYDemo />,
  containerYSource,
);
export const ContainerScrollX: StoryObj = story(
  "container-scroll-x",
  "Container scroll-x",
  <ContainerScrollXDemo />,
  containerXSource,
);
export const ScrollDocument: StoryObj = story(
  "scroll-document",
  "Scroll document",
  <ScrollDocumentDemo />,
  documentSource,
);
