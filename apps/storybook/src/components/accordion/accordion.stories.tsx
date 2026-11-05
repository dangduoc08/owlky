import { Accordion } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { AccordionDocs } from "./accordion-docs.js";
import {
  ACCORDION_CONTROLS,
  CONTROLLED_CODE,
  CONTROLLED_FILES,
  controlledGroups,
  SIMPLE_FILES,
  simpleGroups,
  VARIANT_FILES,
  variantGroups,
} from "./accordion-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/accordion/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["button.css", "accordion.css"], true);

const meta = {
  title: "Components/Accordion",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: AccordionDocs,
      description: {
        component:
          "Accordions show sections that people expand and collapse in place, such as a FAQ. They are native details elements, so they work without JavaScript.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Simple: StoryObj = frameworkStory({
  html: snippetStory(snippets, "simple", SIMPLE_FILES, setup, ACCORDION_CONTROLS),
  react: reactGroupsStory(simpleGroups, {
    ...ACCORDION_CONTROLS,
    target: Accordion,
  }),
});

export const Controlled: StoryObj = frameworkStory({
  html: snippetStory(snippets, "controlled", CONTROLLED_FILES, setup),
  react: reactGroupsStory(controlledGroups, undefined, CONTROLLED_CODE),
});

export const CustomStyles: StoryObj = frameworkStory({
  html: {
    ...snippetStory(snippets, "variants", VARIANT_FILES, setup),
    name: "Custom styles",
  },
  react: {
    ...reactGroupsStory(variantGroups),
    name: "Custom styles",
  },
});
