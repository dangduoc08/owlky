import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { CustomizedDemo } from "./customized-demo.js";
import customizedSource from "./customized-demo.tsx?raw";
import { HorizontalDemo } from "./horizontal-demo.js";
import horizontalSource from "./horizontal-demo.tsx?raw";
import { MobileDemo } from "./mobile-demo.js";
import mobileSource from "./mobile-demo.tsx?raw";
import { StepperDocs } from "./stepper-docs.js";
import { VerticalDemo } from "./vertical-demo.js";
import verticalSource from "./vertical-demo.tsx?raw";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/stepper/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["stepper.css", "button.css"], true);
const MOBILE_SETUP = htmlSetup(["stepper.css", "button.css", "linear-progress.css"], true);

const meta = {
  title: "Components/Stepper",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: StepperDocs,
      description: {
        component:
          "Steppers show progress through a sequence of numbered steps, such as a checkout or a setup wizard.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Horizontal: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "horizontal", [["Horizontal linear stepper", "group"]], SETUP),
    react: reactGroupsStory(
      [{ title: "Horizontal linear stepper", content: <HorizontalDemo /> }],
      undefined,
      horizontalSource,
    ),
  }),
  name: "Horizontal linear stepper",
};

export const AlternativeLabel: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "alternative-label",
      [["Linear alternative label", "group"]],
      SETUP,
    ),
    react: reactGroupsStory(
      [{ title: "Linear alternative label", content: <HorizontalDemo alternativeLabel /> }],
      undefined,
      horizontalSource,
    ),
  }),
  name: "Linear alternative label",
};

export const Vertical: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "vertical", [["Vertical linear stepper", "group"]], SETUP),
    react: reactGroupsStory(
      [{ title: "Vertical linear stepper", content: <VerticalDemo /> }],
      undefined,
      verticalSource,
    ),
  }),
  name: "Vertical linear stepper",
};

export const Customized: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "customized", [["Customized stepper", "group"]], SETUP),
    react: reactGroupsStory(
      [{ title: "Customized stepper", content: <CustomizedDemo /> }],
      undefined,
      customizedSource,
    ),
  }),
  name: "Customized stepper",
};

export const Mobile: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "mobile",
      [
        ["Text", "text"],
        ["Dots", "dots"],
        ["Progress", "progress"],
      ],
      MOBILE_SETUP,
    ),
    react: reactGroupsStory(
      [
        { title: "Text", content: <MobileDemo variant="text" /> },
        { title: "Dots", content: <MobileDemo variant="dots" /> },
        { title: "Progress", content: <MobileDemo variant="progress" /> },
      ],
      undefined,
      mobileSource,
    ),
  }),
  name: "Mobile stepper",
};
