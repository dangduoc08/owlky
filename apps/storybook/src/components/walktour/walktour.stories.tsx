import { Walktour } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { WalktourDocs } from "./walktour-docs.js";
import { BeaconsDemo, WALKTOUR_CONTROLS, WalktourDemo } from "./walktour-examples.js";
import source from "./walktour-examples.tsx?raw";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/walktour/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(
  [
    "paper.css",
    "typography.css",
    "card.css",
    "backdrop.css",
    "popover.css",
    "button.css",
    "icon-button.css",
    "linear-progress.css",
    "text-field.css",
    "switch.css",
    "form-control-label.css",
    "avatar.css",
    "image.css",
    "walktour.css",
  ],
  true,
);

/** The examples have no state of their own: the same Controls in both frameworks. */
const story = (name: string, title: string, demo: () => React.JSX.Element): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, [[title, "example"]], SETUP, WALKTOUR_CONTROLS),
    react: reactGroupsStory(
      [{ title, content: demo() }],
      { ...WALKTOUR_CONTROLS, target: Walktour },
      source,
    ),
  }),
  name: title,
});

const meta = {
  title: "Components/Walktour",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: WalktourDocs,
      description: {
        component:
          "A walktour guides people through a page, one step at a time: each step points at an element, over an overlay with a spotlight on it.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = story("walktour", "Walktour", WalktourDemo);
export const Beacons: StoryObj = story("beacons", "Beacons", BeaconsDemo);
