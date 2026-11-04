import { IconButton } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { ICON_BUTTON_CONTROLS, iconButtonStories } from "./icon-button-examples.js";

const controls: StoryControls = { ...ICON_BUTTON_CONTROLS, target: IconButton };

const story = (name: string) => reactGroupsStory(iconButtonStories[name] ?? [], controls);

const meta = { title: "React/Button/Icon button" } satisfies Meta;
export default meta;

export const Base: StoryObj = story("base");
export const Colors: StoryObj = story("colors");
export const Sizes: StoryObj = story("sizes");
export const WithAnimate: StoryObj = { ...story("animate"), name: "With animate" };
