import { Alert } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { AlertDocs } from "./alert-docs.js";
import {
  ACTION_FILES,
  ALERT_CONTROLS,
  actionGroups,
  descriptionGroups,
  filledGroups,
  groupFiles,
  outlinedGroups,
  standardGroups,
} from "./alert-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/alert/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["alert.css"]);

const withButtons = htmlSetup(["button.css", "icon-button.css", "alert.css"], true);

const meta = {
  title: "Components/Alert",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: AlertDocs,
      description: {
        component:
          "Alerts show a short, important message with a severity: success, info, warning or error.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Standard: StoryObj = frameworkStory({
  html: snippetStory(snippets, "standard", groupFiles("Standard"), setup, ALERT_CONTROLS),
  react: reactGroupsStory(standardGroups, {
    ...ALERT_CONTROLS,
    target: Alert,
  }),
});

export const Filled: StoryObj = frameworkStory({
  html: snippetStory(snippets, "filled", groupFiles("Filled"), setup),
  react: reactGroupsStory(filledGroups),
});

export const Outlined: StoryObj = frameworkStory({
  html: snippetStory(snippets, "outlined", groupFiles("Outlined"), setup),
  react: reactGroupsStory(outlinedGroups),
});

export const Description: StoryObj = frameworkStory({
  html: snippetStory(snippets, "description", groupFiles("Description"), setup),
  react: reactGroupsStory(descriptionGroups),
});

export const Actions: StoryObj = frameworkStory({
  html: snippetStory(snippets, "actions", ACTION_FILES, withButtons),
  react: reactGroupsStory(actionGroups),
});
