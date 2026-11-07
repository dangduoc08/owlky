import { Avatar } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { AvatarDocs } from "./avatar-docs.js";
import {
  AVATAR_CONTROLS,
  files,
  groupedGroups,
  iconGroups,
  imageGroups,
  letterGroups,
  sizeGroups,
  variantGroups,
  withBadgeGroups,
} from "./avatar-examples.js";

const controls = { ...AVATAR_CONTROLS, target: Avatar };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/avatar/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// The runtime sizes avatars (data-ok-size) and replaces broken images with a letter.
const setup = htmlSetup(["avatar.css"], true);
const story = (
  name: string,
  title: string,
  groups: Parameters<typeof reactGroupsStory>[0],
  css = setup,
) =>
  frameworkStory({
    html: snippetStory(snippets, name, files(title), css, AVATAR_CONTROLS),
    react: reactGroupsStory(groups, controls),
  });

const meta = {
  title: "Components/Avatar",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: AvatarDocs,
      description: {
        component: "Avatars show a person or an entity: a picture, initials or an icon.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Image: StoryObj = story("image", "Image", imageGroups);
export const Icon: StoryObj = story("icon", "Icon", iconGroups);
export const Letter: StoryObj = story("letter", "Letter", letterGroups);
export const Variant: StoryObj = story("variant", "Variant", variantGroups);
export const Grouped: StoryObj = story("grouped", "Grouped", groupedGroups);
export const WithBadge: StoryObj = {
  ...story(
    "with-badge",
    "With badge",
    withBadgeGroups,
    htmlSetup(["avatar.css", "badge.css"], true),
  ),
  name: "With badge",
};
export const Sizes: StoryObj = story("sizes", "Sizes", sizeGroups);
