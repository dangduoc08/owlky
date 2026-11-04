import { Alert } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import {
  ALERT_CONTROLS,
  actionGroups,
  descriptionGroups,
  filledGroups,
  outlinedGroups,
  standardGroups,
} from "./alert-examples.js";

const meta = { title: "React/Alert" } satisfies Meta;
export default meta;

export const Standard: StoryObj = reactGroupsStory(standardGroups, {
  ...ALERT_CONTROLS,
  target: Alert,
});
export const Filled: StoryObj = reactGroupsStory(filledGroups);
export const Outlined: StoryObj = reactGroupsStory(outlinedGroups);
export const Description: StoryObj = reactGroupsStory(descriptionGroups);
export const Actions: StoryObj = reactGroupsStory(actionGroups);
