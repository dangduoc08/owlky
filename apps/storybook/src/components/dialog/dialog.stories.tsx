import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, htmlSetup, snippetStory } from "../shared/snippets.js";
import {
  AlertDialogDemo,
  FormDialogDemo,
  FullScreenDialogDemo,
  MaxWidthDialogDemo,
  ScrollDialogDemo,
  SimpleDialogDemo,
  TransitionsDialogDemo,
} from "./dialog-demos.js";
import source from "./dialog-demos.tsx?raw";
import { DialogDocs } from "./dialog-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/dialog/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const files = (title: string): GroupFiles => [[title, "group"]];
const css = [
  "button.css",
  "icon-button.css",
  "list.css",
  "avatar.css",
  "text-field.css",
  "dialog.css",
  "motion.css",
];

const meta = {
  title: "Components/Dialog",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: DialogDocs,
      description: {
        component:
          "Dialogs ask for a decision or show information that needs attention, over the page.",
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

export const Simple: StoryObj = story("simple", "Simple", <SimpleDialogDemo />);
export const Alerts: StoryObj = story("alerts", "Alerts", <AlertDialogDemo />);
export const Transitions: StoryObj = story("transitions", "Transitions", <TransitionsDialogDemo />);
export const Form: StoryObj = story("form", "Form", <FormDialogDemo />);
export const FullScreen: StoryObj = {
  ...story("full-screen", "Full-screen", <FullScreenDialogDemo />),
  name: "Full-screen",
};
export const MaxWidth: StoryObj = {
  ...story("max-width", "Max width", <MaxWidthDialogDemo />),
  name: "Max width",
};
export const ScrollingContent: StoryObj = {
  ...story("scrolling-content", "Scrolling content", <ScrollDialogDemo />),
  name: "Scrolling content",
};
