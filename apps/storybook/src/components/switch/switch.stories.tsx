import { Switch } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { SwitchDocs } from "./switch-docs.js";
import {
  basicGroups,
  COLOR_FILES,
  colorGroups,
  files,
  placementGroups,
  SWITCH_CONTROLS,
  sizeGroups,
} from "./switch-examples.js";

const controls = { ...SWITCH_CONTROLS, target: Switch };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/switch/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["switch.css"]);
const labelled = htmlSetup(["switch.css", "form-control-label.css"]);

const meta = {
  title: "Components/Switch",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SwitchDocs,
      description: {
        component: "Switches turn a single setting on or off, with an effect that applies at once.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = frameworkStory({
  html: snippetStory(snippets, "basic", files("Basic"), setup, SWITCH_CONTROLS),
  react: reactGroupsStory(basicGroups, controls),
});

export const Sizes: StoryObj = frameworkStory({
  html: snippetStory(snippets, "sizes", files("Sizes"), labelled, SWITCH_CONTROLS),
  react: reactGroupsStory(sizeGroups, controls),
});

export const Placements: StoryObj = frameworkStory({
  html: snippetStory(snippets, "placements", files("Placements"), labelled, SWITCH_CONTROLS),
  react: reactGroupsStory(placementGroups, controls),
});

export const Colors: StoryObj = frameworkStory({
  html: snippetStory(snippets, "colors", COLOR_FILES, labelled, SWITCH_CONTROLS),
  react: reactGroupsStory(colorGroups, controls),
});
