import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TOGGLE_CONTROLS, TOGGLE_FILES } from "./toggle-button-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/toggle-button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["toggle-button.css"], true);
const story = (name: string, label?: string): StoryObj => ({
  ...snippetStory(snippets, name, TOGGLE_FILES[name] ?? [], SETUP, TOGGLE_CONTROLS),
  ...(label ? { name: label } : {}),
});

const meta = { title: "HTML/Button/Toggle button" } satisfies Meta;
export default meta;

export const Exclusive: StoryObj = story("exclusive", "Exclusive selection");
export const Multiple: StoryObj = story("multiple", "Multiple selection");
export const Sizes: StoryObj = story("sizes");
export const Disabled: StoryObj = story("disabled");
export const Colors: StoryObj = story("colors");
export const Vertical: StoryObj = story("vertical", "Vertical & standalone");
