import { CountUp, Motion, MotionBorder, MotionText } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { CountdownDateDemo, CountdownSecondsDemo } from "./countdown-demo.js";
import countdownSource from "./countdown-demo.tsx?raw";
import { MotionDialogDemo } from "./dialog-demo.js";
import source from "./dialog-demo.tsx?raw";
import {
  GestureAxisDemo,
  GestureDragDemo,
  GestureHoverTapDemo,
  GestureSnapDemo,
} from "./gestures-demo.js";
import gesturesSource from "./gestures-demo.tsx?raw";
import { MotionDocs } from "./motion-docs.js";
import {
  COUNT_UP_CONTROLS,
  MOTION_BORDER_CONTROLS,
  MOTION_CONTROLS,
  MOTION_DRAW_CONTROLS,
  MOTION_FILES,
  MOTION_LOGO_CONTROLS,
  MOTION_LOOP_CONTROLS,
  MOTION_TEXT_CONTROLS,
  motionStories,
  OTHER_FILES,
  otherStories,
} from "./motion-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/motion/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["paper.css", "typography.css", "card.css", "motion.css"], true);
const SCROLL_SETUP = htmlSetup(
  ["paper.css", "typography.css", "card.css", "scrollbar.css", "motion.css"],
  true,
);
const DIALOG_SETUP = htmlSetup(["button.css", "dialog.css", "motion.css"], true);
/** Gestures (roadmap 5.3): drag, hover, tap and focus; one generated snippet per group. */
const GESTURE_SETUP = htmlSetup(
  ["paper.css", "typography.css", "card.css", "button.css", "motion.css"],
  true,
);
const GESTURE_GROUPS = [
  { title: "Drag", content: <GestureDragDemo /> },
  { title: "Axis and direction lock", content: <GestureAxisDemo /> },
  { title: "Elastic and snap back", content: <GestureSnapDemo /> },
  { title: "Hover, tap and focus", content: <GestureHoverTapDemo /> },
];
const GESTURE_FILES: [string, string][] = [
  ["Drag", "drag"],
  ["Axis and direction lock", "axis"],
  ["Elastic and snap back", "snap"],
  ["Hover, tap and focus", "hover-tap"],
];

type Controls = typeof MOTION_CONTROLS | typeof MOTION_LOOP_CONTROLS | typeof MOTION_TEXT_CONTROLS;

const story = (name: string, controls: Controls, setup = SETUP, label?: string): StoryObj => {
  const react: StoryControls = {
    ...controls,
    target: controls === MOTION_TEXT_CONTROLS ? MotionText : Motion,
  };
  return {
    ...frameworkStory({
      html: snippetStory(snippets, name, MOTION_FILES[name] ?? [], setup, controls),
      react: reactGroupsStory(motionStories[name] ?? [], react),
    }),
    ...(label ? { name: label } : {}),
  };
};

const meta = {
  title: "Components/Motion",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: MotionDocs,
      description: {
        component:
          "Motion animates content in and out: when it scrolls into view, when the page loads or when you show it.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const InView: StoryObj = story("in-view", MOTION_CONTROLS, SETUP, "In view");
export const Text: StoryObj = story("text", MOTION_TEXT_CONTROLS);
export const Scroll: StoryObj = story("scroll", MOTION_CONTROLS, SCROLL_SETUP);
export const DialogStory: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "dialog", [["Dialog", "group"]], DIALOG_SETUP),
    react: reactGroupsStory(
      [{ title: "Dialog", content: <MotionDialogDemo /> }],
      undefined,
      source,
    ),
  }),
  name: "Dialog",
};
export const Background: StoryObj = story("background", MOTION_LOOP_CONTROLS);

const other = (
  name: string,
  setup: string,
  controls?: StoryControls & { target: unknown },
  label?: string,
): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, OTHER_FILES[name] ?? [], setup, controls),
    react: reactGroupsStory(otherStories[name] ?? [], controls),
  }),
  ...(label ? { name: label } : {}),
});

export const TapHover: StoryObj = other(
  "tap-hover",
  htmlSetup(["button.css", "icon-button.css", "fab.css", "motion.css"]),
  undefined,
  "Tap & hover",
);
export const Path: StoryObj = other("path", SETUP, { ...MOTION_DRAW_CONTROLS, target: Motion });
export const CountUpStory: StoryObj = other(
  "count-up",
  htmlSetup(["typography.css", "count-up.css"], true),
  { ...COUNT_UP_CONTROLS, target: CountUp },
  "Count up",
);
export const CountdownStory: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "countdown",
      [
        ["Date", "date"],
        ["Seconds", "seconds"],
      ],
      htmlSetup(["button.css", "toggle-button.css", "countdown.css"], true),
    ),
    react: reactGroupsStory(
      [
        { title: "Date", content: <CountdownDateDemo /> },
        { title: "Seconds", content: <CountdownSecondsDemo /> },
      ],
      undefined,
      countdownSource,
    ),
  }),
  name: "Countdown",
};
const BORDER = { ...MOTION_BORDER_CONTROLS, target: MotionBorder };
export const Logo: StoryObj = other("logo", htmlSetup(["motion.css"], true), {
  ...MOTION_LOGO_CONTROLS,
  target: Motion,
});
export const AvatarStory: StoryObj = other(
  "avatar",
  htmlSetup(["avatar.css", "motion-border.css"], true),
  BORDER,
  "Avatar",
);
export const Gestures: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "gestures", GESTURE_FILES, GESTURE_SETUP),
    react: reactGroupsStory(GESTURE_GROUPS, undefined, gesturesSource),
  }),
};
export const Border: StoryObj = other(
  "border",
  htmlSetup(["button.css", "motion-border.css"], true),
  BORDER,
);
