import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, htmlSetup, snippetStory } from "../shared/snippets.js";
import { ClickHoverDemo } from "./click-hover-demo.js";
import clickHoverSource from "./click-hover-demo.tsx?raw";
import { CustomArrowDemo } from "./custom-arrow-demo.js";
import customArrowSource from "./custom-arrow-demo.tsx?raw";
import { PopoverDocs } from "./popover-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/popover/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["button.css", "popover.css", "typography.css"], true);
const files = (title: string): GroupFiles => [[title, "group"]];

const meta = {
  title: "Components/Popover",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: PopoverDocs,
      description: {
        component: "Popovers show content next to the element that opened them.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const ClickHover: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "click-hover", files("Click & hover"), setup),
    react: reactGroupsStory(
      [{ title: "Click & hover", content: <ClickHoverDemo /> }],
      undefined,
      clickHoverSource,
    ),
  }),
  name: "Click & hover",
};

export const CustomArrow: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "custom-arrow", files("Custom arrow"), setup),
    react: reactGroupsStory(
      [{ title: "Custom arrow", content: <CustomArrowDemo /> }],
      undefined,
      customArrowSource,
    ),
  }),
  name: "Custom arrow",
};
