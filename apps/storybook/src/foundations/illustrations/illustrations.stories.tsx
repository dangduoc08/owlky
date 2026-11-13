import { Illustration } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { snippetStory } from "../../components/shared/snippets.js";
import { frameworkStory, htmlGroupsStory, reactGroupsStory } from "../../helpers/groups.js";
import {
  ILLUSTRATION_ALL,
  ILLUSTRATION_CONTROLS,
  ILLUSTRATION_FILES,
  illustrationAll,
  illustrationStories,
} from "./illustration-examples.js";
import { IllustrationsDocs } from "./illustrations-docs.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/illustration/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
/** What a page loads before pasting the snippets (the script only for placeholders and `size`). */
const SETUP = [
  "<!-- Once per page (CDN): -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  '<!-- Optional: draws <svg data-ok-illustration="name"></svg> placeholders and applies data-ok-size. -->',
  `<script src="${CDN}/owlky.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky.css" (or tokens.css + components/illustration.css from @owlky/styles; the profile cover also uses paper.css, card.css and avatar.css); for the runtime, "@owlky/html/auto", then "@owlky/html/illustrations". -->',
].join("\n");

const story = (name: string, label: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(
      snippets,
      name,
      ILLUSTRATION_FILES[name] ?? [],
      SETUP,
      ILLUSTRATION_CONTROLS,
    ),
    react: reactGroupsStory(illustrationStories[name] ?? [], {
      ...ILLUSTRATION_CONTROLS,
      target: Illustration,
    }),
  }),
  name: label,
});

/** Every picture on one page, from the category stories' groups and snippets. */
const all: StoryObj = {
  ...frameworkStory({
    html: htmlGroupsStory(
      ILLUSTRATION_ALL.map(([story, index]) => {
        const [title = "", file = ""] = ILLUSTRATION_FILES[story]?.[index] ?? [];
        const html = Object.entries(snippets).find(([path]) =>
          path.endsWith(`/${story}-${file}.html`),
        )?.[1];
        if (html === undefined) throw new Error(`Missing snippet ${story}-${file}.html`);
        return { title, html };
      }),
      SETUP,
      ILLUSTRATION_CONTROLS,
    ),
    react: reactGroupsStory(illustrationAll, { ...ILLUSTRATION_CONTROLS, target: Illustration }),
  }),
  name: "All",
};

const meta = {
  title: "Foundations/Illustrations",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: IllustrationsDocs,
      description: {
        component:
          "Owlky includes a set of theme-aware illustrations for error pages, empty states and account flows. Learn how to add them in HTML and React, change their colors and make them accessible.",
      },
    },
  },
} satisfies Meta;

export default meta;

/** Every illustration: a contact sheet to check that the set looks consistent. */
export const All: StoryObj = all;
/** Error pages. */
export const Errors: StoryObj = story("errors", "Errors");
/** Empty, waiting and unavailable states. */
export const States: StoryObj = story("states", "States");
/** Sign-in, email and password flows. */
export const Account: StoryObj = story("account", "Account");
/** Dashboard welcome, upgrade, checkout and upload. */
export const Dashboard: StoryObj = story("dashboard", "Dashboard");
/** Decorative shapes. */
export const Shapes: StoryObj = story("shapes", "Shapes");
