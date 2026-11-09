import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { CollapseDemo } from "./collapse-demo.js";
import source from "./collapse-demo.tsx?raw";
import { CollapseDocs } from "./collapse-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/collapse/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const css = ["form-control-label.css", "switch.css", "collapse.css"];

const meta = {
  title: "Components/Collapse",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: CollapseDocs,
      description: {
        component:
          "A collapse shows or hides its content by animating its height, or its width, from a collapsed size.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const SimpleCollapse: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "collapse", [["Collapse", "group"]], htmlSetup(css, true)),
    react: reactGroupsStory([{ title: "Collapse", content: <CollapseDemo /> }], undefined, source),
  }),
  name: "Collapse",
};
