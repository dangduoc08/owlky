import { Badge } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { BadgeDocs } from "./badge-docs.js";
import {
  BADGE_CONTROLS,
  dotGroups,
  files,
  maximumGroups,
  overlapGroups,
  standardGroups,
  statusGroups,
} from "./badge-examples.js";

const controls = { ...BADGE_CONTROLS, target: Badge };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/badge/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["badge.css"]);
const withAvatar = htmlSetup(["avatar.css", "badge.css"], true);
const story = (
  name: string,
  title: string,
  groups: Parameters<typeof reactGroupsStory>[0],
  css = setup,
) =>
  frameworkStory({
    html: snippetStory(snippets, name, files(title), css, BADGE_CONTROLS),
    react: reactGroupsStory(groups, controls),
  });

const meta = {
  title: "Components/Badge",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: BadgeDocs,
      description: {
        component:
          "Badges put a count, a dot or a status on the corner of an icon, avatar or text.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Standard: StoryObj = story("standard", "Standard", standardGroups);
export const Dot: StoryObj = story("dot", "Dot", dotGroups);
export const Status: StoryObj = story("status", "Status", statusGroups, withAvatar);
export const MaximumValue: StoryObj = {
  ...story("maximum-value", "Maximum value", maximumGroups),
  name: "Maximum value",
};
export const BadgeOverlap: StoryObj = {
  ...story("badge-overlap", "Badge overlap", overlapGroups, withAvatar),
  name: "Badge overlap",
};
