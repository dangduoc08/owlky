import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, htmlSetup, snippetStory } from "../shared/snippets.js";
import { AnchorOriginDemo, CustomDemo, DefaultDemo, StatusDemo } from "./snackbar-demos.js";
import source from "./snackbar-demos.tsx?raw";
import { SnackbarDocs } from "./snackbar-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/snackbar/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const files = (title: string): GroupFiles => [[title, "group"]];
const css = ["button.css", "circular-progress.css", "snackbar.css"];

const meta = {
  title: "Components/Snackbar",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SnackbarDocs,
      description: {
        component: "Snackbars show brief messages about an app process at the edge of the screen.",
      },
    },
  },
} satisfies Meta;
export default meta;

const story = (name: string, title: string, demo: JSX.Element): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, name, files(title), htmlSetup(css, true)),
    react: reactGroupsStory([{ title, content: demo }], undefined, source),
  });

export const Default: StoryObj = story("default", "Default", <DefaultDemo />);
export const Status: StoryObj = story("status", "Status", <StatusDemo />);
export const Custom: StoryObj = story("custom", "Custom", <CustomDemo />);
export const AnchorOrigin: StoryObj = {
  ...story("anchor-origin", "Anchor origin", <AnchorOriginDemo />),
  name: "Anchor origin",
};
