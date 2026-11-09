import { Lightbox } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { LightboxDocs } from "./lightbox-docs.js";
import {
  INLINE_CONTROLS,
  InlineDemo,
  LIGHTBOX_CONTROLS,
  LightboxDemo,
  TOOLBAR_CONTROLS,
  ToolbarDemo,
} from "./lightbox-examples.js";
import source from "./lightbox-examples.tsx?raw";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/lightbox/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["carousel.css", "icon-button.css", "lightbox.css"], true);

/** The examples have no state of their own: the same Controls in both frameworks. */
const story = (
  name: string,
  title: string,
  demo: () => React.JSX.Element,
  controls: Omit<StoryControls, "target">,
): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, [[title, "example"]], SETUP, controls),
    react: reactGroupsStory(
      [{ title, content: demo() }],
      { ...controls, target: Lightbox },
      source,
    ),
  }),
  name: title,
});

const meta = {
  title: "Components/Lightbox",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: LightboxDocs,
      description: {
        component:
          "A lightbox shows images and videos over the page, one at a time, with zoom, a slideshow, thumbnails and captions.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = story("lightbox", "Lightbox", LightboxDemo, LIGHTBOX_CONTROLS);
export const Inline: StoryObj = story("inline", "Inline", InlineDemo, INLINE_CONTROLS);
export const Toolbar: StoryObj = story("toolbar", "Toolbar", ToolbarDemo, TOOLBAR_CONTROLS);
