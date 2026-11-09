import { Slider } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { RangeDemo } from "./range-demo.js";
import rangeSource from "./range-demo.tsx?raw";
import { SliderDocs } from "./slider-docs.js";
import { SLIDER_CONTROLS, SLIDER_FILES, sliderStories } from "./slider-examples.js";

const controls: StoryControls = { ...SLIDER_CONTROLS, target: Slider };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/slider/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["slider.css", "typography.css"], true);

const story = (name: string, label?: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, SLIDER_FILES[name] ?? [], SETUP, SLIDER_CONTROLS),
    react: reactGroupsStory(sliderStories[name] ?? [], controls),
  }),
  ...(label ? { name: label } : {}),
});

const meta = {
  title: "Components/Slider",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SliderDocs,
      description: {
        component: "Sliders let people pick a value, or a range of values, along a track.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Volume: StoryObj = story("volume");
export const Disabled: StoryObj = story("disabled");
export const Temperature: StoryObj = story("temperature");
export const Sizes: StoryObj = story("sizes");
export const SmallSteps: StoryObj = story("small-steps", "Small steps");
export const CustomMarks: StoryObj = story("custom-marks", "Custom marks");
export const Restricted: StoryObj = story("restricted", "Restricted values");
export const Range: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "range", SLIDER_FILES["range"] ?? [], SETUP),
    react: reactGroupsStory([{ title: "Range", content: <RangeDemo /> }], undefined, rangeSource),
  }),
  name: "Range",
};
export const Vertical: StoryObj = story("vertical");
export const Colors: StoryObj = story("colors");
