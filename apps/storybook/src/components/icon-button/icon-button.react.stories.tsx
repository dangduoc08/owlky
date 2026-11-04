import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import { iconButtonStories } from "./icon-button-examples.js";

const story = (name: string) => reactGroupsStory(iconButtonStories[name] ?? []);

const meta = { title: "React/Button/Icon button" } satisfies Meta;
export default meta;

export const Base: StoryObj = story("base");
export const Colors: StoryObj = story("colors");
export const Sizes: StoryObj = story("sizes");
export const WithAnimate: StoryObj = { ...story("animate"), name: "With animate" };
