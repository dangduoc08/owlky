import { TransferList } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TransferListDocs } from "./transfer-list-docs.js";
import {
  TRANSFER_LIST_CONTROLS,
  TRANSFER_LIST_FILES,
  transferListStories,
} from "./transfer-list-examples.js";

const controls: StoryControls = { ...TRANSFER_LIST_CONTROLS, target: TransferList };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/transfer-list/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(
  ["transfer-list.css", "scrollbar.css", "list.css", "checkbox.css", "button.css"],
  true,
);

const story = (name: string): StoryObj =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      TRANSFER_LIST_FILES[name] ?? [],
      SETUP,
      TRANSFER_LIST_CONTROLS,
    ),
    react: reactGroupsStory(transferListStories[name] ?? [], controls),
  });

const meta = {
  title: "Components/Transfer list",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TransferListDocs,
      description: {
        component:
          "A transfer list moves items between two lists, such as available and chosen options.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Simple: StoryObj = story("simple");
export const Enhanced: StoryObj = story("enhanced");
