import { timelineOptions } from "@owlky/core";
import {
  Paper,
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  type TimelineDotColor,
  type TimelineDotVariant,
  TimelineItem,
  TimelineOppositeContent,
  type TimelinePosition,
  TimelineSeparator,
  Typography,
} from "@owlky/react";
import type { ReactNode } from "react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon, type SolarName } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const COLORS: TimelineDotColor[] = [
  "grey",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const LABELS: Record<string, string> = {
  grey: "Default",
  primary: "Primary",
  secondary: "Secondary",
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};
const TIMES = ["09:30 am", "10:00 am", "10:15 am", "10:30 am", "11:00 am", "11:30 am", "12:00 pm"];
const ICONS: SolarName[] = [
  "calendar-linear",
  "letter-linear",
  "star-linear",
  "gallery-linear",
  "rocket-linear",
  "sun-linear",
  "chat-round-line-linear",
];
const NOTES = [
  "Kickoff with the design team",
  "Brief sent to the client",
  "Moodboard approved",
  "First mockups shared",
  "Release candidate built",
  "Review of open issues",
  "Launch postponed",
];

interface Event {
  label: ReactNode;
  color?: TimelineDotColor;
  opposite?: ReactNode;
  icon?: SolarName;
}

/** A timeline of events; the last one has no connector. */
function Events({
  events,
  position,
  variant,
}: {
  events: Event[];
  position?: TimelinePosition;
  variant?: TimelineDotVariant;
}) {
  return (
    <Timeline position={position}>
      {events.map((event, index) => (
        <TimelineItem key={TIMES[index]}>
          {event.opposite !== undefined && (
            <TimelineOppositeContent>{event.opposite}</TimelineOppositeContent>
          )}
          <TimelineSeparator>
            <TimelineDot variant={variant} color={event.color}>
              {event.icon && <SolarIcon name={event.icon} />}
            </TimelineDot>
            {index < events.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>{event.label}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
Events.displayName = "Events";

const STATUS: Event[] = [{ label: "Success" }, { label: "Warning" }, { label: "Error" }];
const colored = (extra: (color: TimelineDotColor, index: number) => Partial<Event> = () => ({})) =>
  COLORS.map((color, index) => ({ label: LABELS[color], color, ...extra(color, index) }));

/**
 * Story groups — the same examples as `packages/html/src/components/timeline/examples/`. The
 * Customized cards are a flat Paper with Typography; `.sb-timeline-card` (story CSS) tints
 * and pads it, like the reference.
 */
export const timelineStories: Record<string, ReactGroup[]> = {
  left: [{ title: "Left", content: <Events events={STATUS} position="left" /> }],
  right: [{ title: "Right", content: <Events events={STATUS} /> }],
  alternating: [{ title: "Alternating", content: <Events events={STATUS} position="alternate" /> }],
  filled: [{ title: "Filled", content: <Events events={colored()} position="alternate" /> }],
  outlined: [
    {
      title: "Outlined",
      content: <Events events={colored()} position="alternate" variant="outlined" />,
    },
  ],
  opposite: [
    {
      title: "Opposite content",
      content: <Events events={colored((_, i) => ({ opposite: TIMES[i] }))} position="alternate" />,
    },
  ],
  customized: [
    {
      title: "Customized",
      content: (
        <Events
          position="alternate"
          events={colored((color, i) => ({
            opposite: TIMES[i],
            icon: ICONS[i] as SolarName,
            label: (
              <Paper className="sb-timeline-card" elevation={0}>
                <Typography variant="subtitle2">{LABELS[color]}</Typography>
                <Typography variant="body2">{NOTES[i]}</Typography>
              </Paper>
            ),
          }))}
        />
      ),
    },
  ],
};

export const TIMELINE_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.entries(timelineStories).map(([story, groups]) => [
    story,
    groups.map((group) => [group.title, "group"] as const),
  ]),
);

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const TIMELINE_CONTROLS = { schema: timelineOptions, keys: ["position"] } as const;
