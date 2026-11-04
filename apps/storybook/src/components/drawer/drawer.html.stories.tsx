import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ANCHOR_FILES } from "./drawer-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/drawer/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = { title: "HTML/Drawer" } satisfies Meta;
export default meta;

export const Anchor: StoryObj = snippetStory(
  snippets,
  "anchor",
  ANCHOR_FILES,
  htmlSetup(["button.css", "drawer.css"], true),
);
