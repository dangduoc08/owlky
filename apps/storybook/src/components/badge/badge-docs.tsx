import { badgeOptions } from "@owlky/core";
import badgeApi from "@owlky/docs-content/api/badge.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Avatar, Badge } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { MailIcon, PEOPLE, portrait } from "../avatar/display-icons.js";

export const badgeSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A badge puts a small count, dot or status on the corner of something else: an icon, an avatar or text. Wrap the element in the badge, and the badge sits on its top-right corner. Badges need no JavaScript.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<span data-ok-badge data-ok-variant="standard" data-ok-color="error" data-ok-overlap="rectangular" data-ok-vertical="top" data-ok-horizontal="right">
  <span role="img" aria-label="4 new messages"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg></span>
  <span data-ok-badge-badge>4</span>
</span>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Badge } from "@owlky/react";
import { MailIcon } from "lucide-react";

export function Inbox() {
  return (
    <Badge color="error" badgeContent={4}>
      <span role="img" aria-label="4 new messages">
        <MailIcon />
      </span>
    </Badge>
  );
}`,
  },
  {
    id: "count",
    title: "Show a count",
    body: 'In React, pass a number as `badgeContent`. A count of 0 hides the badge unless you set `showZero`, and counts above `max` (default 99) show as "99+". In HTML, write the text you want in the badge part, and add `data-ok-invisible` to hide it.',
    html: `<span data-ok-badge-badge>99+</span>`,
    react: `import { Badge } from "@owlky/react";
import { MailIcon } from "lucide-react";

export function InboxBadge() {
  return (
    <Badge color="error" badgeContent={120} max={99}>
      <MailIcon role="img" aria-label="120 new messages" />
    </Badge>
  );
}`,
  },
  {
    id: "dot",
    title: "Show a dot or a status",
    body: 'Set `variant` to `dot` for a small dot without text. For a person\'s presence, use `online`, `always`, `busy`, `offline` or `invisible` on an avatar, with `overlap="circular"` and the bottom-right corner.',
    html: `<span data-ok-badge data-ok-variant="online" data-ok-color="default" data-ok-overlap="circular" data-ok-vertical="bottom" data-ok-horizontal="right">
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default"><img src="/people/deja.jpg" alt="Deja Brady"></span>
  <span data-ok-badge-badge></span>
</span>`,
    react: `import { Avatar, Badge } from "@owlky/react";

export function OnlineAvatar() {
  return (
    <Badge variant="online" overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
      <Avatar src="/people/deja.jpg" alt="Deja Brady" />
    </Badge>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. In React, the corner is the `anchorOrigin` object; in HTML, it's two attributes. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Badges have no events or methods. Change the text or `data-ok-invisible` to update them; the badge shrinks away when it hides.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Badges don't take focus. The element inside keeps its own keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The badge's text is read with the element it decorates, which may not say what it counts. Name the element with the full meaning, such as \`aria-label="4 new messages"\`.
- Dots and statuses are visual only. Say the status in text too, for example in the avatar's name ("Deja Brady, online").
- Grey badges use dark text; palette colors follow the design.`,
  },
  apiReferenceSection(badgeApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Badge color="error" badgeContent={4}>
        <span role="img" aria-label="4 new messages">
          <MailIcon />
        </span>
      </Badge>
    </Preview>
  ),
  count: () => (
    <Preview>
      <Badge color="error" badgeContent={120}>
        <span role="img" aria-label="120 new messages">
          <MailIcon />
        </span>
      </Badge>
    </Preview>
  ),
  dot: () => (
    <Preview>
      <Badge
        variant="online"
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Avatar src={portrait(3)} alt={`${PEOPLE[2]}, online`} />
      </Badge>
      <Badge variant="dot" color="info">
        <span>Updates</span>
      </Badge>
    </Preview>
  ),
  options: () => <OptionsTable schema={badgeOptions} />,
  props: () => (
    <PropsTable
      label="Badge content props"
      rows={[
        {
          react: "badgeContent",
          html: "data-ok-badge-badge",
          type: "ReactNode",
          description: "The count or text of a standard badge.",
        },
        {
          react: "max",
          type: "number",
          description: "Counts above it show as `max+`. Default 99.",
        },
        { react: "showZero", type: "boolean", description: "Show a count of 0." },
        {
          react: "anchorOrigin",
          html: "data-ok-vertical, data-ok-horizontal",
          type: "{ vertical, horizontal }",
          description: "The corner. Default top right.",
        },
        {
          react: "children",
          html: "first child",
          type: "ReactNode",
          description: "The element the badge decorates.",
        },
      ]}
    />
  ),
};

/** Badge docs page (ADR-0019). */
export function BadgeDocs() {
  return <GuideDocs sections={badgeSections} previews={PREVIEWS} />;
}
