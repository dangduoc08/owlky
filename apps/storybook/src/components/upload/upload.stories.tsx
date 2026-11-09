import { Upload, UploadAvatar, UploadBox } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import multipleSource from "./multiple-demo.tsx?raw";
import { UploadDocs } from "./upload-docs.js";
import {
  MULTIPLE_CONTROLS,
  UPLOAD_CONTROLS,
  UPLOAD_FILES,
  uploadStories,
} from "./upload-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/upload/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["icon-button.css", "button.css", "upload.css"], true);

type Controls = Omit<StoryControls, "target">;

const story = (
  name: string,
  label: string,
  target: unknown,
  controls: Controls = UPLOAD_CONTROLS,
  code?: string,
): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, UPLOAD_FILES[name] ?? [], SETUP, controls),
    react: reactGroupsStory(uploadStories[name] ?? [], { ...controls, target }, code),
  }),
  name: label,
});

const AVATAR_CONTROLS: Controls = {
  schema: UPLOAD_CONTROLS.schema,
  keys: ["error", "disabled", "noClick", "noDrag", "noKeyboard", "maxSize"],
};

const meta = {
  title: "Components/Upload",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: UploadDocs,
      description: {
        component:
          "An upload lets people drop, pick or paste files, checks them and lists what they chose.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Single: StoryObj = story("single", "Upload single file", Upload);
export const Multiple: StoryObj = story(
  "multiple",
  "Upload multi file",
  Upload,
  MULTIPLE_CONTROLS,
  multipleSource,
);
export const Avatar: StoryObj = story("avatar", "Upload avatar", UploadAvatar, AVATAR_CONTROLS);
export const Box: StoryObj = story("box", "Upload box", UploadBox, AVATAR_CONTROLS);
export const Validation: StoryObj = story("validation", "Validation", Upload);
export const States: StoryObj = story("states", "Error and disabled", Upload);
export const OpenDialog: StoryObj = story("open-dialog", "Open the file dialog", Upload);
