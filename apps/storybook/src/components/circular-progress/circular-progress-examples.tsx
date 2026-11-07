import { circularProgressOptions, type ProgressColor } from "@owlky/core";
import { CircularProgress } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/** Colors in the order of the examples (`inherit` first). */
export const PROGRESS_COLORS: ProgressColor[] = [
  "inherit",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];

/**
 * The same markup, in the same order, as
 * `packages/html/src/components/circular-progress/examples/<story>-group.html`.
 */
export const indeterminateGroups: ReactGroup[] = [
  {
    title: "Indeterminate",
    content: PROGRESS_COLORS.map((color) => (
      <CircularProgress key={color} color={color} aria-label="Loading" />
    )),
  },
];

export const determinateGroups: ReactGroup[] = [
  {
    title: "Determinate",
    content: [25, 50, 75, 100].map((value) => (
      <CircularProgress
        key={value}
        variant="determinate"
        color="info"
        value={value}
        aria-label="Progress"
      />
    )),
  },
];

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: [48, 40, 32, 24].map((size) => (
      <CircularProgress key={size} color="info" size={size} aria-label="Loading" />
    )),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const CIRCULAR_PROGRESS_CONTROLS = {
  schema: circularProgressOptions,
  keys: ["thickness", "enableTrackSlot", "disableShrink"],
} as const;
