import { List } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ListDocs } from "./list-docs.js";
import {
  controlsGroups,
  files,
  folderGroups,
  LIST_CONTROLS,
  nestedGroups,
  selectedGroups,
  simpleGroups,
  switchGroups,
} from "./list-examples.js";
import nestedSource from "./nested-demo.tsx?raw";

const controls = { ...LIST_CONTROLS, target: List };

/** Every list demo sits in a Card (built on Paper). */
const CARD_CSS = ["paper.css", "card.css"];

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/list/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const story = (
  name: string,
  title: string,
  groups: Parameters<typeof reactGroupsStory>[0],
  css: string[],
) =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      files(title),
      htmlSetup([...CARD_CSS, ...css]),
      LIST_CONTROLS,
    ),
    react: reactGroupsStory(groups, controls),
  });

const meta = {
  title: "Components/List",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ListDocs,
      description: {
        component: "Lists are continuous, vertical indexes of text or images.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Simple: StoryObj = story("simple", "Simple", simpleGroups, [
  "list.css",
  "divider.css",
]);
export const Nested: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "nested",
    files("Nested"),
    htmlSetup([...CARD_CSS, "list.css"], true),
  ),
  react: reactGroupsStory(nestedGroups, undefined, nestedSource),
});
export const Folder: StoryObj = story("folder", "Folder", folderGroups, ["list.css", "avatar.css"]);
export const Selected: StoryObj = story("selected", "Selected", selectedGroups, [
  "list.css",
  "divider.css",
]);
export const Controls: StoryObj = story("controls", "Controls", controlsGroups, [
  "list.css",
  "checkbox.css",
  "icon-button.css",
]);
export const Switch: StoryObj = story("switch", "Switch", switchGroups, ["list.css", "switch.css"]);
