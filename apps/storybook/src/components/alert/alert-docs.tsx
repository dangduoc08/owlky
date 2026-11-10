import { alertOptions } from "@owlky/core";
import alertApi from "@owlky/docs-content/api/alert.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Alert, AlertTitle, Button } from "@owlky/react";
import { useState } from "react";
import { CDN, capitalize, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const SEVERITIES = ["success", "info", "warning", "error"] as const;
const INFO_ICON = `<div data-ok-alert-icon><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg></div>`;
const CLOSE = `<button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-alert-close aria-label="Close" title="Close"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg></button>`;

export const alertSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An alert shows a short, important message, such as the result of an action or a problem that needs attention. Its severity sets the icon and the color: `success`, `info`, `warning` or `error`. Keep the message brief, and add an action when people can fix the problem right away.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<div role="alert" data-ok-alert data-ok-severity="info" data-ok-variant="standard" data-ok-color="info">
  ${INFO_ICON}
  <div data-ok-alert-message>A new version is available.</div>
</div>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Alert } from "@owlky/react";

export function UpdateNotice() {
  return <Alert severity="info">A new version is available.</Alert>;
}`,
  },
  {
    id: "variants",
    title: "Choose a variant",
    body: "Three variants are available: `standard` (the default) is a soft tinted panel, `filled` uses the full color for urgent messages, and `outlined` adds a border. Set `color` to use a different color than the severity's.",
    html: `<div role="alert" data-ok-alert data-ok-severity="info" data-ok-variant="filled" data-ok-color="info">
  ${INFO_ICON}
  <div data-ok-alert-message>A new version is available.</div>
</div>`,
    react: `import { Alert } from "@owlky/react";

export function UpdateAlert() {
  return (
    <Alert severity="info" variant="filled">
      A new version is available.
    </Alert>
  );
}`,
  },
  {
    id: "title",
    title: "Add a title",
    body: "A title sums up the message when it needs more than one sentence. In React, use `AlertTitle`; in HTML, add a `data-ok-alert-title` element at the start of the message.",
    html: `<div role="alert" data-ok-alert data-ok-severity="info" data-ok-variant="standard" data-ok-color="info">
  ${INFO_ICON}
  <div data-ok-alert-message>
    <div data-ok-alert-title>Update available</div>Version 2.4 adds offline mode. Restart the app to install it.</div>
</div>`,
    react: `import { Alert, AlertTitle } from "@owlky/react";

export function UpdateAlert() {
  return (
    <Alert severity="info">
      <AlertTitle>Update available</AlertTitle>
      Version 2.4 adds offline mode. Restart the app to install it.
    </Alert>
  );
}`,
  },
  {
    id: "actions",
    title: "Add actions or a close button",
    body: "In React, pass buttons with `action`, or pass `onClose` to show a close button and remove the alert yourself. In HTML, put the buttons in `data-ok-alert-action`; a button with `data-ok-alert-close` closes the alert, with the script loaded.",
    html: `<script src="${CDN}/owlky.js" defer></script>

<div role="alert" data-ok-alert data-ok-severity="info" data-ok-variant="standard" data-ok-color="info">
  ${INFO_ICON}
  <div data-ok-alert-message>A new version is available.</div>
  <div data-ok-alert-action>
    ${CLOSE}
  </div>
</div>`,
    react: `import { Alert } from "@owlky/react";
import { useState } from "react";

export function UpdateNotice() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <Alert severity="info" onClose={() => setOpen(false)}>
      A new version is available.
    </Alert>
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
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:alert:close\`** (cancelable) fires when the close button is pressed. If you don't call \`preventDefault()\`, the alert is then hidden.
- **Instance:** \`runtime.get(element, "alert")\` returns \`{ close() }\`.
- **React:** \`onClose\` is called when the close button is pressed. Stop rendering the alert to remove it.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The alert itself doesn't take focus. Its buttons are native buttons.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- An alert has \`role="alert"\`, so screen readers announce it as soon as it appears. For messages that aren't urgent, set \`role="status"\` so the announcement waits politely.
- The icon is decorative. The close button is named by \`closeText\` ("Close" by default).
- Don't rely on color alone: the icon and the text should also say what kind of message it is.
- Filled and outlined alerts follow the brand colors; standard alerts meet a contrast ratio of at least 4.5:1.`,
  },
  apiReferenceSection(alertApi),
];

function ClosePreview() {
  const [open, setOpen] = useState(true);
  return (
    <Preview className="flex-col items-stretch!">
      {open ? (
        <Alert severity="info" onClose={() => setOpen(false)}>
          A new version is available.
        </Alert>
      ) : (
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Show the alert again
        </Button>
      )}
      <Alert
        severity="warning"
        action={
          <Button size="sm" color="inherit">
            Renew
          </Button>
        }
      >
        Your subscription ends in 3 days.
      </Alert>
    </Preview>
  );
}

const PREVIEWS = {
  overview: () => (
    <Preview className="flex-col items-stretch!">
      {SEVERITIES.map((severity) => (
        <Alert key={severity} severity={severity}>
          {capitalize(severity)}: a short message.
        </Alert>
      ))}
    </Preview>
  ),
  variants: () => (
    <Preview className="flex-col items-stretch!">
      {(["standard", "filled", "outlined"] as const).map((variant) => (
        <Alert key={variant} severity="info" variant={variant}>
          {capitalize(variant)}: a new version is available.
        </Alert>
      ))}
    </Preview>
  ),
  title: () => (
    <Preview className="flex-col items-stretch!">
      <Alert severity="info">
        <AlertTitle>Update available</AlertTitle>
        Version 2.4 adds offline mode. Restart the app to install it.
      </Alert>
    </Preview>
  ),
  actions: ClosePreview,
  options: () => <OptionsTable schema={alertOptions} />,
  props: () => (
    <PropsTable
      label="Alert content props"
      rows={[
        {
          react: "icon",
          html: "data-ok-alert-icon",
          type: "ReactNode | false",
          description: "Replaces the severity icon; `false` hides it.",
        },
        {
          react: "iconMapping",
          type: "Partial<Record<severity, ReactNode>>",
          description: "Icons to use for each severity.",
        },
        {
          react: "action",
          html: "data-ok-alert-action",
          type: "ReactNode",
          description: "Buttons at the end of the alert.",
        },
        {
          react: "onClose",
          html: "data-ok-alert-close",
          type: "() => void",
          description: "Shows a close button and is called when it's pressed.",
        },
        {
          react: "closeText",
          html: "aria-label",
          type: "string",
          description: 'Name of the close button. Default "Close".',
        },
        {
          react: "role",
          html: "role",
          type: "string",
          description: 'Default "alert"; use "status" for messages that aren\'t urgent.',
        },
        {
          react: "AlertTitle",
          html: "data-ok-alert-title",
          type: "component",
          description: "A title at the start of the message.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the alert's buttons."],
        ["Enter / Space", "Activates the focused button, such as Close."],
      ]}
    />
  ),
};

/** Alert docs page (ADR-0019). */
export function AlertDocs() {
  return <GuideDocs sections={alertSections} previews={PREVIEWS} />;
}
