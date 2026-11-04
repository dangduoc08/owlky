import colors from "@snippets/button/examples/colors.html?raw";
import icons from "@snippets/button/examples/icons.html?raw";
import sizes from "@snippets/button/examples/sizes.html?raw";
import states from "@snippets/button/examples/states.html?raw";
import variants from "@snippets/button/examples/variants.html?raw";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlStory } from "../../helpers/html-story.js";

const meta = { title: "HTML/Button" } satisfies Meta;
export default meta;

export const Variants: StoryObj = htmlStory(variants);
export const Colors: StoryObj = htmlStory(colors);
export const Sizes: StoryObj = htmlStory(sizes);
export const Icons: StoryObj = htmlStory(
  icons,
  'Icons are decorative: wrap them in `data-mt-button-icon` with `aria-hidden="true"`.',
);
export const States: StoryObj = htmlStory(
  states,
  '`disabled` removes the button from the tab order; `aria-disabled="true"` keeps it focusable (prevent the action yourself). Any element — such as a link — can carry the button anatomy.',
);
