import { iconButtonOptions } from "@owlky/core";
import { IconButton, type IconButtonColor } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const COLORS: IconButtonColor[] = [
  "inherit",
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const SIZES = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
] as const;

/**
 * Story groups — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/icon-button/examples/<story>-<file>.html`.
 */
export const iconButtonStories: Record<string, ReactGroup[]> = {
  base: [
    {
      title: "Base",
      content: (
        <>
          <IconButton color="inherit" aria-label="Inherit">
            <SolarIcon name="letter-linear" />
          </IconButton>
          <IconButton aria-label="Default">
            <SolarIcon name="letter-linear" />
          </IconButton>
          <IconButton color="primary" aria-label="Primary">
            <SolarIcon name="letter-linear" />
          </IconButton>
          <IconButton color="secondary" aria-label="Secondary">
            <SolarIcon name="letter-linear" />
          </IconButton>
          <IconButton aria-label="Disabled" disabled>
            <SolarIcon name="letter-linear" />
          </IconButton>
        </>
      ),
    },
  ],
  colors: [
    {
      title: "Colors",
      content: COLORS.map((color) => (
        <IconButton key={color} color={color} aria-label={capitalize(color)}>
          <SolarIcon name="letter-linear" />
        </IconButton>
      )),
    },
  ],
  sizes: [
    {
      title: "Sizes",
      content: SIZES.map(([size, label]) => (
        <IconButton key={size} color="info" size={size} aria-label={label}>
          <SolarIcon name="letter-linear" />
        </IconButton>
      )),
    },
  ],
  animate: [
    {
      title: "With animate",
      content: SIZES.map(([size, label]) => (
        <IconButton key={size} color="error" size={size} animate aria-label={label}>
          <SolarIcon name="letter-linear" />
        </IconButton>
      )),
    },
  ],
};

export const ICON_BUTTON_FILES: Record<string, GroupFiles> = {
  base: [["Base", "group"]],
  colors: [["Colors", "group"]],
  sizes: [["Sizes", "group"]],
  animate: [["With animate", "group"]],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const ICON_BUTTON_CONTROLS = {
  schema: iconButtonOptions,
  keys: ["size", "edge", "disabled", "animate"],
} as const;
