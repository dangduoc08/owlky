import {
  type TimelineDotColor,
  type TimelineDotVariant,
  type TimelinePosition,
  timelineAttributes,
  timelineDotAttributes,
  timelineItemAttributes,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes } from "react";

export interface TimelineProps extends HTMLAttributes<HTMLUListElement> {
  /** Side of the content: `"right"` (default), `"left"`, `"alternate"`, `"alternate-reverse"`. */
  position?: TimelinePosition | undefined;
}

/**
 * Timeline — spec: specs/components/timeline.md. A list of events along a line (`ul`). CSS only.
 */
export const Timeline = forwardRef<HTMLUListElement, TimelineProps>(function Timeline(
  { position, ...props },
  ref,
) {
  return <ul ref={ref} {...timelineAttributes({ position })} {...props} />;
});

export interface TimelineItemProps extends HTMLAttributes<HTMLLIElement> {
  /** Overrides the timeline's side for this item. */
  position?: "right" | "left" | undefined;
}

/** TimelineItem — one event: opposite content?, a separator, the content. */
export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(function TimelineItem(
  { position, ...props },
  ref,
) {
  return <li ref={ref} {...timelineItemAttributes({ position })} {...props} />;
});

/** TimelineSeparator — holds the dot and the connector. */
export const TimelineSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function TimelineSeparator(props, ref) {
    return <div ref={ref} data-ok-timeline-separator="" {...props} />;
  },
);

export interface TimelineDotProps extends HTMLAttributes<HTMLSpanElement> {
  /** `"filled"` (default) or `"outlined"`. */
  variant?: TimelineDotVariant | undefined;
  /** `"grey"` (default), `"inherit"` or a palette color. */
  color?: TimelineDotColor | undefined;
}

/** TimelineDot — the marker of an event; may hold an icon (decorative `svg`). */
export const TimelineDot = forwardRef<HTMLSpanElement, TimelineDotProps>(function TimelineDot(
  { variant, color, ...props },
  ref,
) {
  return <span ref={ref} {...timelineDotAttributes({ variant, color })} {...props} />;
});

/** TimelineConnector — the line to the next event (leave it out on the last one). */
export const TimelineConnector = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function TimelineConnector(props, ref) {
    return <span ref={ref} data-ok-timeline-connector="" {...props} />;
  },
);

/** TimelineContent — what happened. */
export const TimelineContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function TimelineContent(props, ref) {
    return <div ref={ref} data-ok-timeline-content="" {...props} />;
  },
);

/** TimelineOppositeContent — on the other side of the line, such as the time. */
export const TimelineOppositeContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function TimelineOppositeContent(props, ref) {
    return <div ref={ref} data-ok-timeline-opposite-content="" {...props} />;
  },
);
