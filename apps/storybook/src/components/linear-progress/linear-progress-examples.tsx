import { type LinearProgressVariant, linearProgressOptions } from "@owlky/core";
import { LinearProgress } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { PROGRESS_COLORS } from "../circular-progress/circular-progress-examples.js";
import type { GroupFiles } from "../shared/snippets.js";

/** Values of the determinate and buffer examples. */
const VALUE = 25;
const BUFFER = 30;

const byColor = (variant: LinearProgressVariant, label: string) =>
  PROGRESS_COLORS.map((color) => (
    <LinearProgress
      key={color}
      variant={variant}
      color={color}
      {...(variant === "determinate" || variant === "buffer" ? { value: VALUE } : {})}
      {...(variant === "buffer" ? { valueBuffer: BUFFER } : {})}
      aria-label={label}
    />
  ));

/**
 * The same markup, in the same order, as
 * `packages/html/src/components/linear-progress/examples/<story>-group.html`.
 */
export const indeterminateGroups: ReactGroup[] = [
  { title: "Indeterminate", content: byColor("indeterminate", "Loading") },
];
export const determinateGroups: ReactGroup[] = [
  { title: "Determinate", content: byColor("determinate", "Progress") },
];
export const bufferGroups: ReactGroup[] = [
  { title: "Buffer", content: byColor("buffer", "Progress") },
];
export const queryGroups: ReactGroup[] = [{ title: "Query", content: byColor("query", "Loading") }];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): the value, for the stories whose examples all show one. */
export const LINEAR_PROGRESS_VALUE_CONTROLS = {
  schema: linearProgressOptions,
  keys: ["value"],
} as const;
export const LINEAR_PROGRESS_BUFFER_CONTROLS = {
  schema: linearProgressOptions,
  keys: ["value", "valueBuffer"],
} as const;
