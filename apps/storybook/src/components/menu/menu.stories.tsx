import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, htmlSetup, snippetStory } from "../shared/snippets.js";
import { MaxHeightMenuDemo } from "./max-height-demo.js";
import maxHeightSource from "./max-height-demo.tsx?raw";
import { MenuDocs } from "./menu-docs.js";
import { SelectedMenuDemo } from "./selected-demo.js";
import selectedSource from "./selected-demo.tsx?raw";
import { SimpleMenuDemo } from "./simple-demo.js";
import simpleSource from "./simple-demo.tsx?raw";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/menu/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const files = (title: string): GroupFiles => [[title, "group"]];
const css = ["button.css", "icon-button.css", "list.css", "popover.css", "menu.css"];

const meta = {
  title: "Components/Menu",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: MenuDocs,
      description: { component: "Menus show a list of choices on a temporary surface." },
    },
  },
} satisfies Meta;
export default meta;

const story = (name: string, title: string, demo: JSX.Element, source: string): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, name, files(title), htmlSetup(css, true)),
    react: reactGroupsStory([{ title, content: demo }], undefined, source),
  });

export const Simple: StoryObj = story("simple", "Simple", <SimpleMenuDemo />, simpleSource);
export const Selected: StoryObj = story(
  "selected",
  "Selected",
  <SelectedMenuDemo />,
  selectedSource,
);
export const MaxHeight: StoryObj = {
  ...story("max-height", "Max height", <MaxHeightMenuDemo />, maxHeightSource),
  name: "Max height",
};
