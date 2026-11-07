import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ExampleBackdropDemo } from "./backdrop-demos.js";
import source from "./backdrop-demos.tsx?raw";
import { BackdropDocs } from "./backdrop-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/backdrop/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const css = ["button.css", "circular-progress.css", "backdrop.css"];

const meta = {
  title: "Components/Backdrop",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: BackdropDocs,
      description: {
        component: "A backdrop dims the page and shows content in front of it, such as a loader.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Example: StoryObj = frameworkStory({
  html: snippetStory(snippets, "example", [["Example", "group"]], htmlSetup(css, true)),
  react: reactGroupsStory(
    [{ title: "Example", content: <ExampleBackdropDemo /> }],
    undefined,
    source,
  ),
});
