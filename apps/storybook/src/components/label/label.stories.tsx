import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { LabelDocs } from "./label-docs.js";
import { files, iconGroups, variantGroups } from "./label-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/label/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["label.css"]);
const story = (name: string, title: string, groups: Parameters<typeof reactGroupsStory>[0]) =>
  frameworkStory({
    html: snippetStory(snippets, name, files(title), setup),
    react: reactGroupsStory(groups),
  });

const meta = {
  title: "Components/Label",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: LabelDocs,
      description: {
        component:
          "Labels are small tags that show a status or a category, such as Paid or Pending.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Filled: StoryObj = story("filled", "Filled", variantGroups("filled", "Filled"));
export const Outlined: StoryObj = story(
  "outlined",
  "Outlined",
  variantGroups("outlined", "Outlined"),
);
export const Soft: StoryObj = story("soft", "Soft", variantGroups("soft", "Soft"));
export const Inverted: StoryObj = story(
  "inverted",
  "Inverted",
  variantGroups("inverted", "Inverted"),
);
export const WithIcon: StoryObj = {
  ...story("with-icon", "With icon", iconGroups),
  name: "With icon",
};
