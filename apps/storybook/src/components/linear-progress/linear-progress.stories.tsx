import { LinearProgress } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { LinearProgressDocs } from "./linear-progress-docs.js";
import {
  bufferGroups,
  determinateGroups,
  files,
  indeterminateGroups,
  LINEAR_PROGRESS_BUFFER_CONTROLS,
  LINEAR_PROGRESS_VALUE_CONTROLS,
  queryGroups,
} from "./linear-progress-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/linear-progress/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// The runtime moves the bars to the values (CSSOM, so it works under a strict CSP).
const setup = htmlSetup(["linear-progress.css"], true);

const meta = {
  title: "Components/Progress/Linear progress",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: LinearProgressDocs,
      description: {
        component:
          "Linear progress indicators show that something is loading, or how far a task has got, as a thin bar.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Indeterminate: StoryObj = frameworkStory({
  html: snippetStory(snippets, "indeterminate", files("Indeterminate"), setup),
  react: reactGroupsStory(indeterminateGroups),
});

export const Determinate: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "determinate",
    files("Determinate"),
    setup,
    LINEAR_PROGRESS_VALUE_CONTROLS,
  ),
  react: reactGroupsStory(determinateGroups, {
    ...LINEAR_PROGRESS_VALUE_CONTROLS,
    target: LinearProgress,
  }),
});

export const Buffer: StoryObj = frameworkStory({
  html: snippetStory(snippets, "buffer", files("Buffer"), setup, LINEAR_PROGRESS_BUFFER_CONTROLS),
  react: reactGroupsStory(bufferGroups, {
    ...LINEAR_PROGRESS_BUFFER_CONTROLS,
    target: LinearProgress,
  }),
});

export const Query: StoryObj = frameworkStory({
  html: snippetStory(snippets, "query", files("Query"), setup),
  react: reactGroupsStory(queryGroups),
});
