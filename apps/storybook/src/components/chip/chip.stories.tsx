import { Chip } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ChipDocs } from "./chip-docs.js";
import {
  CHIP_CONTROLS,
  CHIP_LINK_CONTROLS,
  GROUP_FILES,
  LINK_GROUP_FILES,
  linkGroups,
  variantGroups,
} from "./chip-examples.js";

const controls = { ...CHIP_CONTROLS, target: Chip };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/chip/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// The runtime handles the delete buttons (ok:chip:delete) and sizes the avatars.
const setup = htmlSetup(["avatar.css", "chip.css"], true);
const story = (variant: "filled" | "outlined" | "soft") =>
  frameworkStory({
    html: snippetStory(snippets, variant, GROUP_FILES, setup, CHIP_CONTROLS),
    react: reactGroupsStory(variantGroups(variant), controls),
  });

const meta = {
  title: "Components/Chip",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ChipDocs,
      description: {
        component: "Chips are compact elements for an attribute, a filter, a choice or an action.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Filled: StoryObj = story("filled");
export const Outlined: StoryObj = story("outlined");
export const Soft: StoryObj = story("soft");
export const ClickableLink: StoryObj = {
  name: "Clickable link",
  ...frameworkStory({
    html: snippetStory(snippets, "link", LINK_GROUP_FILES, setup, CHIP_LINK_CONTROLS),
    react: reactGroupsStory(linkGroups(), { ...CHIP_LINK_CONTROLS, target: Chip }),
  }),
};
