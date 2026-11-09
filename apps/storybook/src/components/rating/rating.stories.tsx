import { Rating } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { HoverDemo } from "./hover-demo.js";
import hoverSource from "./hover-demo.tsx?raw";
import { RatingDocs } from "./rating-docs.js";
import { RATING_CONTROLS, RATING_FILES, ratingStories } from "./rating-examples.js";

const controls: StoryControls = { ...RATING_CONTROLS, target: Rating };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/rating/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["rating.css", "typography.css"], true);

const story = (name: string, label?: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, RATING_FILES[name] ?? [], SETUP, RATING_CONTROLS),
    react: reactGroupsStory(ratingStories[name] ?? [], controls),
  }),
  ...(label ? { name: label } : {}),
});

const meta = {
  title: "Components/Rating",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: RatingDocs,
      description: {
        component: "Ratings let people give a score, and show a score as a row of icons.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Controlled: StoryObj = story("controlled");
export const ReadOnly: StoryObj = story("read-only", "Read only");
export const Disabled: StoryObj = story("disabled");
export const Custom: StoryObj = story("custom", "Custom icon and color");
export const TenStars: StoryObj = story("ten-stars", "10 stars");
export const Hover: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "hover", RATING_FILES["hover"] ?? [], SETUP),
    react: reactGroupsStory(
      [{ title: "Hover feedback", content: <HoverDemo /> }],
      undefined,
      hoverSource,
    ),
  }),
  name: "Hover feedback",
};
export const Half: StoryObj = story("half", "Half ratings");
export const Sizes: StoryObj = story("sizes");
