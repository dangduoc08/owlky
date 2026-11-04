import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import {
  ACCORDION_CONTROLS,
  CONTROLLED_FILES,
  SIMPLE_FILES,
  VARIANT_FILES,
} from "./accordion-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/accordion/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = { title: "HTML/Accordion" } satisfies Meta;
export default meta;

const setup = htmlSetup(["button.css", "accordion.css"], true);

export const Simple: StoryObj = snippetStory(
  snippets,
  "simple",
  SIMPLE_FILES,
  setup,
  ACCORDION_CONTROLS,
);

export const Controlled: StoryObj = snippetStory(snippets, "controlled", CONTROLLED_FILES, setup);

export const CustomStyles: StoryObj = {
  ...snippetStory(snippets, "variants", VARIANT_FILES, setup),
  name: "Custom styles",
};
