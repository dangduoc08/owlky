import { Accordion } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import {
  ACCORDION_CONTROLS,
  CONTROLLED_CODE,
  controlledGroups,
  simpleGroups,
  variantGroups,
} from "./accordion-examples.js";

const meta = { title: "React/Accordion" } satisfies Meta;
export default meta;

export const Simple: StoryObj = reactGroupsStory(simpleGroups, {
  ...ACCORDION_CONTROLS,
  target: Accordion,
});

export const Controlled: StoryObj = reactGroupsStory(controlledGroups, undefined, CONTROLLED_CODE);

export const CustomStyles: StoryObj = {
  ...reactGroupsStory(variantGroups),
  name: "Custom styles",
};
