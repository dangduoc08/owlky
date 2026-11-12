import { paletteColorNames } from "@owlky/tokens";
import { type DataAttributes, defineOptions, optionAttributes, style } from "../options/define.js";

// --- Timeline -----------------------------------------------------------------------------------

export const timelinePositions = ["right", "left", "alternate", "alternate-reverse"] as const;
export const timelineDotVariants = ["filled", "outlined"] as const;
export const timelineDotColors = ["grey", "inherit", ...paletteColorNames] as const;

export type TimelinePosition = (typeof timelinePositions)[number];
export type TimelineDotVariant = (typeof timelineDotVariants)[number];
export type TimelineDotColor = (typeof timelineDotColors)[number];

export const timelineOptions = defineOptions("timeline", "data-ok-timeline", {
  position: style(
    "data-ok-position",
    timelinePositions,
    "right",
    "Side of the content: `right`, `left`, or alternating from item to item.",
  ),
});

export interface TimelineAnatomyOptions {
  position?: TimelinePosition | undefined;
}

/** `data-ok-*` attributes of a timeline (`ul`). */
export const timelineAttributes = (options: TimelineAnatomyOptions = {}): DataAttributes =>
  optionAttributes(timelineOptions, { ...options });

export const timelineItemOptions = defineOptions("timeline-item", "data-ok-timeline-item", {
  position: style(
    "data-ok-position",
    ["right", "left"] as const,
    "right",
    "Overrides the timeline's side for this item.",
    { optional: true },
  ),
});

/** `data-ok-*` attributes of a timeline item (`li`). */
export const timelineItemAttributes = (
  options: { position?: "right" | "left" | undefined } = {},
): DataAttributes => optionAttributes(timelineItemOptions, { ...options });

export const timelineDotOptions = defineOptions("timeline-dot", "data-ok-timeline-dot", {
  variant: style("data-ok-variant", timelineDotVariants, "filled", "A filled dot, or a ring."),
  color: style(
    "data-ok-color",
    timelineDotColors,
    "grey",
    "`grey` (default), `inherit` (text color) or a palette color.",
  ),
});

export interface TimelineDotAnatomyOptions {
  variant?: TimelineDotVariant | undefined;
  color?: TimelineDotColor | undefined;
}

/** `data-ok-*` attributes of a timeline dot. */
export const timelineDotAttributes = (options: TimelineDotAnatomyOptions = {}): DataAttributes =>
  optionAttributes(timelineDotOptions, { ...options });
