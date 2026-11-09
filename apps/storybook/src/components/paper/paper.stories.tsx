import { Paper } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { PaperDocs } from "./paper-docs.js";
import {
  basicGroups,
  cornerGroups,
  elevationGroups,
  files,
  PAPER_CONTROLS,
  variantGroups,
} from "./paper-examples.js";

const controls = { ...PAPER_CONTROLS, target: Paper };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/paper/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["typography.css", "paper.css"]);
const story = (
  name: string,
  title: string,
  groups: Parameters<typeof reactGroupsStory>[0],
  withControls = false,
) =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      files(title),
      setup,
      withControls ? PAPER_CONTROLS : undefined,
    ),
    react: reactGroupsStory(groups, withControls ? controls : undefined),
  });

const meta = {
  title: "Components/Paper",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: PaperDocs,
      description: {
        component: "Paper is a surface for content, raised with a shadow or framed by an outline.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = story("basic", "Basic", basicGroups, true);
export const Elevation: StoryObj = story("elevation", "Elevation", elevationGroups);
export const Variants: StoryObj = story("variants", "Variants", variantGroups);
export const Corners: StoryObj = story("corners", "Corners", cornerGroups);
