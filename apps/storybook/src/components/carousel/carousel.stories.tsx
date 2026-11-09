import { Carousel } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { CarouselDocs } from "./carousel-docs.js";
import { CAROUSEL_CONTROLS, CAROUSEL_FILES, carouselStories } from "./carousel-examples.js";

const controls: StoryControls = { ...CAROUSEL_CONTROLS, target: Carousel };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/carousel/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["carousel.css", "icon-button.css", "button.css"], true);

/** Every story's example has no state: the same Controls in both frameworks. */
const story = (name: string, label: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, CAROUSEL_FILES[name] ?? [], SETUP, CAROUSEL_CONTROLS),
    react: reactGroupsStory(carouselStories[name] ?? [], controls),
  }),
  name: label,
});

const meta = {
  title: "Components/Carousel",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: CarouselDocs,
      description: {
        component:
          "A carousel shows a set of slides one view at a time and lets people swipe, scroll or step through them.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Align: StoryObj = story("align", "Align");
export const Progress: StoryObj = story("progress", "Progress");
export const Opacity: StoryObj = story("opacity", "Opacity");
export const Scale: StoryObj = story("scale", "Scale");
export const Fade: StoryObj = story("fade", "Fade");
export const Parallax: StoryObj = story("parallax", "Parallax");
export const Autoplay: StoryObj = story("autoplay", "Autoplay");
export const AutoScroll: StoryObj = story("auto-scroll", "Auto Scroll");
export const ThumbsX: StoryObj = story("thumbs-x", "Thumbs-x");
export const ThumbsY: StoryObj = story("thumbs-y", "Thumbs-y");
export const VariableWidths: StoryObj = story("variable-widths", "Variable widths");
export const AutoHeight: StoryObj = story("auto-height", "Auto height");
export const YAxis: StoryObj = story("y-axis", "Y-axis");
export const DotsNumber: StoryObj = story("dots-number", "Dots number");
export const Animation: StoryObj = story("animation", "Animation");
export const Custom: StoryObj = story("custom", "Custom");
export const DragFree: StoryObj = story("drag-free", "Drag free");
export const SlidesToScroll: StoryObj = story("slides-to-scroll", "Slides to scroll");
export const RightToLeft: StoryObj = story("right-to-left", "Right to left");
