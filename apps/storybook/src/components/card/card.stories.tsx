import { Card } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { frameworkStory, type HtmlGroup, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ActiveStateDemo } from "./active-state-demo.js";
import activeStateSource from "./active-state-demo.tsx?raw";
import { CardDocs } from "./card-docs.js";
import { CARD_CONTROLS, CARD_FILES, cardStories } from "./card-examples.js";
import {
  CHOICES_SCRIPT_SOURCE,
  choicesScript,
  EXPAND_SCRIPT_SOURCE,
  expandScript,
} from "./card-scripts.js";
import { ComplexInteractionDemo } from "./complex-interaction-demo.js";
import complexInteractionSource from "./complex-interaction-demo.tsx?raw";

const controls = { ...CARD_CONTROLS, target: Card };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/card/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Every stylesheet the card examples use (Card is built on Paper and composes Typography). */
const CSS = ["paper.css", "typography.css", "card.css", "button.css", "icon-button.css"];

/** Stateless examples: the same Controls in both frameworks. */
const story = (name: string, css = CSS, runtime = false): StoryObj =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      CARD_FILES[name] ?? [],
      htmlSetup(css, runtime),
      CARD_CONTROLS,
    ),
    react: reactGroupsStory(cardStories[name] ?? [], controls),
  });

/** Examples with state: the demo's source is the React code, a page script in HTML. */
const demoStory = (
  name: string,
  title: string,
  demo: JSX.Element,
  source: string,
  script: Pick<HtmlGroup, "script" | "scriptSource">,
  css = CSS,
): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, name, [[title, "group"]], htmlSetup(css), undefined, {
      group: script,
    }),
    react: reactGroupsStory([{ title, content: demo }], undefined, source),
  });

const meta = {
  title: "Components/Card",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: CardDocs,
      description: {
        component: "Cards contain content and actions about a single subject.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basics: StoryObj = story("basics");
export const Outlined: StoryObj = { ...story("outlined"), name: "Outlined card" };
export const ComplexInteraction: StoryObj = {
  ...demoStory(
    "complex-interaction",
    "Complex interaction",
    <ComplexInteractionDemo />,
    complexInteractionSource,
    { script: expandScript, scriptSource: EXPAND_SCRIPT_SOURCE },
    [...CSS, "avatar.css"],
  ),
  name: "Complex interaction",
};
export const Media: StoryObj = story("media", [...CSS, "image.css"], true);
export const PrimaryAction: StoryObj = { ...story("primary-action"), name: "Primary action" };
export const UiControls: StoryObj = { ...story("ui-controls"), name: "UI controls" };
export const ActiveState: StoryObj = {
  ...demoStory("active-state", "Active state styles", <ActiveStateDemo />, activeStateSource, {
    script: choicesScript,
    scriptSource: CHOICES_SCRIPT_SOURCE,
  }),
  name: "Active state styles",
};
