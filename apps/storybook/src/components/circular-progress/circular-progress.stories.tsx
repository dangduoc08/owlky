import { CircularProgress } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { CircularProgressDocs } from "./circular-progress-docs.js";
import {
  CIRCULAR_PROGRESS_CONTROLS,
  determinateGroups,
  files,
  indeterminateGroups,
  sizeGroups,
} from "./circular-progress-examples.js";

const controls = { ...CIRCULAR_PROGRESS_CONTROLS, target: CircularProgress };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/circular-progress/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// The runtime draws determinate values and custom sizes (CSSOM, so it works under a strict CSP).
const setup = htmlSetup(["circular-progress.css"], true);

const story = (name: string, title: string) =>
  snippetStory(snippets, name, files(title), setup, CIRCULAR_PROGRESS_CONTROLS);

const meta = {
  title: "Components/Progress/Circular progress",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: CircularProgressDocs,
      description: {
        component:
          "Circular progress indicators show that something is loading, or how far a task has got.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Indeterminate: StoryObj = frameworkStory({
  html: story("indeterminate", "Indeterminate"),
  react: reactGroupsStory(indeterminateGroups, controls),
});

export const Determinate: StoryObj = frameworkStory({
  html: story("determinate", "Determinate"),
  react: reactGroupsStory(determinateGroups, controls),
});

export const Sizes: StoryObj = frameworkStory({
  html: story("sizes", "Sizes"),
  react: reactGroupsStory(sizeGroups, controls),
});
