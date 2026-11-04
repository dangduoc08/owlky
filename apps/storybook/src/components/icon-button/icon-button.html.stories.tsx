import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ICON_BUTTON_CONTROLS, ICON_BUTTON_FILES } from "./icon-button-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/icon-button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["icon-button.css"]);
const story = (name: string) =>
  snippetStory(snippets, name, ICON_BUTTON_FILES[name] ?? [], SETUP, ICON_BUTTON_CONTROLS);

const meta = { title: "HTML/Button/Icon button" } satisfies Meta;
export default meta;

export const Base: StoryObj = story("base");
export const Colors: StoryObj = story("colors");
export const Sizes: StoryObj = story("sizes");
export const WithAnimate: StoryObj = { ...story("animate"), name: "With animate" };
