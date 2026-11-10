import { timelineDotOptions, timelineItemOptions, timelineOptions } from "@owlky/core";
import timelineApi from "@owlky/docs-content/api/timeline.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@owlky/react";
import timelineSnippet from "../../../../../packages/html/src/components/timeline/examples/alternating-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const timelineSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A timeline lists events in order along a vertical line, such as the steps of an order or the history of a project. Each event has a dot on the line and its content beside it. The timeline is a list (`ul`), so screen readers announce how many events it has. It needs no JavaScript.",
    html: `<!-- Load once per page: the styles -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<ul data-ok-timeline data-ok-position="right">
  <li data-ok-timeline-item>
    <div data-ok-timeline-separator>
      <span data-ok-timeline-dot data-ok-variant="filled" data-ok-color="success"></span>
      <span data-ok-timeline-connector></span>
    </div>
    <div data-ok-timeline-content>Order placed</div>
  </li>
  <li data-ok-timeline-item>
    <div data-ok-timeline-separator>
      <span data-ok-timeline-dot data-ok-variant="filled" data-ok-color="grey"></span>
    </div>
    <div data-ok-timeline-content>Shipped</div>
  </li>
</ul>`,
    react: `import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@owlky/react";

export function OrderHistory() {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot color="success" />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>Order placed</TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineSeparator>
          <TimelineDot />
        </TimelineSeparator>
        <TimelineContent>Shipped</TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}`,
  },
  {
    id: "position",
    title: "Place the content",
    body: "`position` sets the side of the content: `right` (the default), `left`, or `alternate` and `alternate-reverse` to switch sides from one event to the next. Set `position` on a single item to override the timeline. Leave out the connector on the last event, so the line ends at its dot.",
    html: `${timelineSnippet}`,
    react: `import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@owlky/react";

export function TimelinePosition() {
  return (
    <Timeline position="alternate">
      {["Success", "Warning", "Error"].map((text, index, all) => (
        <TimelineItem key={text}>
          <TimelineSeparator>
            <TimelineDot />
            {index < all.length - 1 ? <TimelineConnector /> : null}
          </TimelineSeparator>
          <TimelineContent>{text}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}`,
  },
  {
    id: "dots",
    title: "Color the dots",
    body: '`TimelineDot` is grey by default. Set `color` to a palette color, or to `inherit` for the text color, and `variant` to `outlined` for a ring. A dot can hold a 24px icon. Add `aria-hidden="true"` to the icon: the content says what happened.',
    html: `<span data-ok-timeline-dot data-ok-variant="outlined" data-ok-color="primary"></span>`,
    react: `import { TimelineDot } from "@owlky/react";

export function TimelineDots() {
  return <TimelineDot variant="outlined" color="primary" />;
}`,
  },
  {
    id: "opposite",
    title: "Add opposite content",
    body: "`TimelineOppositeContent` goes on the other side of the line, for example the time of the event. Without it, the content still takes one half of the width, so the line stays in the middle.",
    html: `<li data-ok-timeline-item>
  <div data-ok-timeline-opposite-content>09:30 am</div>
  <div data-ok-timeline-separator><span data-ok-timeline-dot data-ok-variant="filled" data-ok-color="grey"></span><span data-ok-timeline-connector></span></div>
  <div data-ok-timeline-content>Kickoff</div>
</li>`,
    react: `import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@owlky/react";

export function TimelineOpposite() {
  return (
    <TimelineItem>
      <TimelineOppositeContent>09:30 am</TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>Kickoff</TimelineContent>
    </TimelineItem>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These parts hold the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "A timeline isn't interactive. Links and buttons in its content work as usual.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The timeline is a list. Each event is a list item, so screen readers announce the count and the position.
- Dots are decorative: the content and the opposite content carry the information. Don't rely on the dot color alone.
- Content text uses the primary text color, with a contrast ratio of at least 4.5:1 in both themes.
- On narrow screens, long words wrap inside their side instead of overflowing.`,
  },
  apiReferenceSection(timelineApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Timeline>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color="success" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Order placed</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot />
          </TimelineSeparator>
          <TimelineContent>Shipped</TimelineContent>
        </TimelineItem>
      </Timeline>
    </Preview>
  ),
  opposite: () => (
    <Preview>
      <Timeline position="alternate">
        <TimelineItem>
          <TimelineOppositeContent>09:30 am</TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot variant="outlined" color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Kickoff</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineOppositeContent>11:00 am</TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot variant="outlined" color="secondary" />
          </TimelineSeparator>
          <TimelineContent>Review</TimelineContent>
        </TimelineItem>
      </Timeline>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={timelineOptions} />
      <OptionsTable schema={timelineItemOptions} />
      <OptionsTable schema={timelineDotOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Timeline parts"
      rows={[
        {
          react: "TimelineItem",
          html: "li[data-ok-timeline-item]",
          type: "component",
          description: "One event.",
        },
        {
          react: "TimelineSeparator",
          html: "div[data-ok-timeline-separator]",
          type: "component",
          description: "Holds the dot and the connector.",
        },
        {
          react: "TimelineConnector",
          html: "span[data-ok-timeline-connector]",
          type: "component",
          description: "The line to the next event.",
        },
        {
          react: "TimelineContent / TimelineOppositeContent",
          html: "div[data-ok-timeline-content] / div[data-ok-timeline-opposite-content]",
          type: "component",
          description: "The two sides of the line.",
        },
      ]}
    />
  ),
};

/** Timeline docs page (ADR-0019). */
export function TimelineDocs() {
  return <GuideDocs sections={timelineSections} previews={PREVIEWS} />;
}
