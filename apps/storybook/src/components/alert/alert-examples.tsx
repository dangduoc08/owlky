import { type AlertSeverity, alertOptions } from "@owlky/core";
import { Alert, AlertTitle, Button } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

const SEVERITIES: [AlertSeverity, string][] = [
  ["info", "This is an info alert — check it out!"],
  ["success", "This is a success alert — check it out!"],
  ["warning", "This is a warning alert — check it out!"],
  ["error", "This is an error alert — check it out!"],
];

const bySeverity = (variant: "standard" | "filled" | "outlined") =>
  SEVERITIES.map(([severity, text]) => (
    <Alert key={severity} severity={severity} variant={variant}>
      {text}
    </Alert>
  ));

/**
 * Severity stories — the same markup, in the same order, as
 * `packages/html/src/components/alert/examples/<variant>-group.html`.
 */
export const standardGroups: ReactGroup[] = [
  { title: "Standard", content: bySeverity("standard") },
];
export const filledGroups: ReactGroup[] = [{ title: "Filled", content: bySeverity("filled") }];
export const outlinedGroups: ReactGroup[] = [
  { title: "Outlined", content: bySeverity("outlined") },
];
/** One group per story: `<story>-group.html`. */
export const groupFiles = (title: string): GroupFiles => [[title, "group"]];

export const descriptionGroups: ReactGroup[] = [
  {
    title: "Description",
    content: SEVERITIES.map(([severity, text]) => (
      <Alert key={severity} severity={severity}>
        <AlertTitle>{severity[0]?.toUpperCase() + severity.slice(1)}</AlertTitle>
        {text}
      </Alert>
    )),
  },
];

const noop = () => {};

/** Close button (`onClose`; the HTML runtime hides the alert) and custom actions. */
export const actionGroups: ReactGroup[] = [
  {
    title: "Close",
    content: [
      <Alert key="close" severity="info" onClose={noop}>
        This is an info alert — check it out!
      </Alert>,
      <Alert key="filled" severity="info" variant="filled" onClose={noop}>
        This is an info alert — check it out!
      </Alert>,
    ],
  },
  {
    title: "Actions",
    content: [
      <Alert
        key="undo"
        severity="success"
        action={
          <Button color="inherit" size="sm">
            Undo
          </Button>
        }
      >
        This is a success alert — check it out!
      </Alert>,
      <Alert
        key="both"
        severity="warning"
        variant="outlined"
        action={[
          <Button key="undo" color="inherit" size="sm">
            Undo
          </Button>,
          <Button key="action" color="warning" variant="contained" size="sm">
            Action
          </Button>,
        ]}
      >
        This is a warning alert — check it out!
      </Alert>,
    ],
  },
];

export const ACTION_FILES: GroupFiles = [
  ["Close", "close"],
  ["Actions", "actions"],
];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const ALERT_CONTROLS = {
  schema: alertOptions,
  keys: ["variant", "color"],
} as const;
