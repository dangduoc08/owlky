import { Tooltip } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TooltipDocs } from "./tooltip-docs.js";
import {
  arrowGroups,
  files,
  followCursorGroups,
  positionedGroups,
  simpleGroups,
  TOOLTIP_CONTROLS,
  transitionGroups,
  widthGroups,
} from "./tooltip-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/tooltip/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["button.css", "icon-button.css", "fab.css", "tooltip.css"], true);
const controls = { ...TOOLTIP_CONTROLS, target: Tooltip };
const story = (name: string, title: string, groups: Parameters<typeof reactGroupsStory>[0]) =>
  frameworkStory({
    html: snippetStory(snippets, name, files(title), setup, TOOLTIP_CONTROLS),
    react: reactGroupsStory(groups, controls),
  });

const meta = {
  title: "Components/Tooltip",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TooltipDocs,
      description: {
        component: "Tooltips show a short text label when you hover over or focus an element.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Simple: StoryObj = story("simple", "Simple", simpleGroups);
export const Arrow: StoryObj = story("arrow", "Arrow", arrowGroups);
export const VariableWidth: StoryObj = {
  ...story("variable-width", "Variable width", widthGroups),
  name: "Variable width",
};
export const Transitions: StoryObj = story("transitions", "Transitions", transitionGroups);
export const Positioned: StoryObj = story("positioned", "Positioned", positionedGroups);
export const FollowCursor: StoryObj = {
  ...story("follow-cursor", "Follow cursor", followCursorGroups),
  name: "Follow cursor",
};
