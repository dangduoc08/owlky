import { Radio } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { SINGLE_COLOR_SCRIPT_SOURCE, singleColorScript } from "../shared/color-picker-scripts.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ColorPickerDemo } from "./color-picker-demo.js";
import colorPickerSource from "./color-picker-demo.tsx?raw";
import { RadioDocs } from "./radio-docs.js";
import {
  basicGroups,
  colorGroups,
  files,
  placementGroups,
  RADIO_CONTROLS,
  sizeGroups,
} from "./radio-examples.js";

const controls = { ...RADIO_CONTROLS, target: Radio };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/radio/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["radio.css"]);
const labelled = htmlSetup(["radio.css", "form-control-label.css"]);
const grouped = htmlSetup(["radio.css", "form-control-label.css", "form-control.css"]);

const meta = {
  title: "Components/Radio",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: RadioDocs,
      description: {
        component: "Radio buttons let people pick exactly one option from a short list.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = frameworkStory({
  html: snippetStory(snippets, "basic", files("Basic"), setup, RADIO_CONTROLS),
  react: reactGroupsStory(basicGroups, controls),
});

export const Sizes: StoryObj = frameworkStory({
  html: snippetStory(snippets, "sizes", files("Sizes"), labelled, RADIO_CONTROLS),
  react: reactGroupsStory(sizeGroups, controls),
});

export const Placement: StoryObj = frameworkStory({
  html: snippetStory(snippets, "placement", files("Placement"), labelled, RADIO_CONTROLS),
  react: reactGroupsStory(placementGroups, controls),
});

export const Colors: StoryObj = frameworkStory({
  html: snippetStory(snippets, "colors", files("Colors"), grouped, RADIO_CONTROLS),
  react: reactGroupsStory(colorGroups, controls),
});

export const ColorPicker: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "color-picker",
      [["Single", "group"]],
      // The runtime paints the swatches (data-ok-swatch).
      htmlSetup(["radio.css", "typography.css"], true),
      undefined,
      { group: { script: singleColorScript, scriptSource: SINGLE_COLOR_SCRIPT_SOURCE } },
    ),
    react: reactGroupsStory(
      [{ title: "Single", content: <ColorPickerDemo /> }],
      undefined,
      colorPickerSource,
    ),
  }),
  name: "Color picker",
};
