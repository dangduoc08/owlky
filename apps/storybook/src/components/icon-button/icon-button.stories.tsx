import { IconButton } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { IconButtonDocs } from "./icon-button-docs.js";
import {
  ICON_BUTTON_CONTROLS,
  ICON_BUTTON_FILES,
  iconButtonStories,
} from "./icon-button-examples.js";

const controls: StoryControls = { ...ICON_BUTTON_CONTROLS, target: IconButton };

const reactStory = (name: string) => reactGroupsStory(iconButtonStories[name] ?? [], controls);

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/icon-button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["icon-button.css"]);

const htmlStory = (name: string) =>
  snippetStory(snippets, name, ICON_BUTTON_FILES[name] ?? [], SETUP, ICON_BUTTON_CONTROLS);

const meta = {
  title: "Components/Button/Icon button",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: IconButtonDocs,
      description: {
        component:
          "Icon buttons are actions shown only as an icon, for toolbars, table rows and cards. They need a name, because they have no visible label.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Base: StoryObj = frameworkStory({
  html: htmlStory("base"),
  react: reactStory("base"),
});

export const Colors: StoryObj = frameworkStory({
  html: htmlStory("colors"),
  react: reactStory("colors"),
});

export const Sizes: StoryObj = frameworkStory({
  html: htmlStory("sizes"),
  react: reactStory("sizes"),
});

export const WithAnimate: StoryObj = frameworkStory({
  html: { ...htmlStory("animate"), name: "With animate" },
  react: { ...reactStory("animate"), name: "With animate" },
});
