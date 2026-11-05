import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { files, SCROLLBAR_CONTROLS } from "./scrollbar-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/scrollbar/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = { title: "HTML/Scrollbar" } satisfies Meta;
export default meta;

const setup = htmlSetup(["scrollbar.css"]);

export const Vertical: StoryObj = snippetStory(
  snippets,
  "vertical",
  files("Vertical"),
  setup,
  SCROLLBAR_CONTROLS,
);
export const Horizontal: StoryObj = snippetStory(
  snippets,
  "horizontal",
  files("Horizontal"),
  setup,
  SCROLLBAR_CONTROLS,
);
export const Layout: StoryObj = snippetStory(
  snippets,
  "layout",
  files("Layout"),
  htmlSetup(["alert.css", "scrollbar.css"]),
  SCROLLBAR_CONTROLS,
);
