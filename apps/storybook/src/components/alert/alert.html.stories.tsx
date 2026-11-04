import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ACTION_FILES, ALERT_CONTROLS, groupFiles } from "./alert-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/alert/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = { title: "HTML/Alert" } satisfies Meta;
export default meta;

const setup = htmlSetup(["alert.css"]);
const withButtons = htmlSetup(["button.css", "icon-button.css", "alert.css"], true);

export const Standard: StoryObj = snippetStory(
  snippets,
  "standard",
  groupFiles("Standard"),
  setup,
  ALERT_CONTROLS,
);
export const Filled: StoryObj = snippetStory(snippets, "filled", groupFiles("Filled"), setup);
export const Outlined: StoryObj = snippetStory(snippets, "outlined", groupFiles("Outlined"), setup);
export const Description: StoryObj = snippetStory(
  snippets,
  "description",
  groupFiles("Description"),
  setup,
);
export const Actions: StoryObj = snippetStory(snippets, "actions", ACTION_FILES, withButtons);
