import { Image } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ImageDocs } from "./image-docs.js";
import { IMAGE_CONTROLS, IMAGE_FILES, imageStories } from "./image-examples.js";

const controls: StoryControls = { ...IMAGE_CONTROLS, target: Image };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/image/examples/*.html",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const setup = htmlSetup(["image.css"], true);

/** One story per reference section; the same Controls in both frameworks. */
const story = (name: string, label?: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, IMAGE_FILES[name] ?? [], setup, IMAGE_CONTROLS),
    react: reactGroupsStory(imageStories[name] ?? [], controls),
  }),
  ...(label ? { name: label } : {}),
});

const meta = {
  title: "Components/Image",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ImageDocs,
      description: {
        component:
          "Image shows a picture that loads lazily behind a placeholder, crops it to an aspect ratio and can paint an overlay on it.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const List: StoryObj = story("list");
export const AspectRatio: StoryObj = story("aspect-ratio", "Aspect ratio");
export const Overlay: StoryObj = story("overlay");
export const FitAndPosition: StoryObj = story("fit-and-position", "Fit and position");
export const Loading: StoryObj = story("loading", "Loading and errors");
