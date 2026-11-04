import basic from "@snippets/switch/examples/basic.html?raw";
import colors from "@snippets/switch/examples/colors.html?raw";
import sizes from "@snippets/switch/examples/sizes.html?raw";
import states from "@snippets/switch/examples/states.html?raw";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlStory } from "../../helpers/html-story.js";

const meta = { title: "HTML/Switch" } satisfies Meta;
export default meta;

export const Basic: StoryObj = htmlStory(basic);
export const Colors: StoryObj = htmlStory(colors);
export const Sizes: StoryObj = htmlStory(sizes);
export const States: StoryObj = htmlStory(
  states,
  "Without a visible label, give the input an `aria-label`.",
);
