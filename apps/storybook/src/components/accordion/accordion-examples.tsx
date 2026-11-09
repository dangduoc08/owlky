import { accordionOptions } from "@owlky/core";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

const TEXT =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.";

/**
 * The "Simple" story — the same markup, in the same order, as
 * `packages/html/src/components/accordion/examples/simple-group.html`.
 */
export const simpleGroups: ReactGroup[] = [
  {
    title: "Simple",
    content: [
      <Accordion key="1">
        <AccordionSummary>
          <Typography variant="subtitle1" component="span">
            Accordion 1
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>,
      <Accordion key="2">
        <AccordionSummary>
          <Typography variant="subtitle1" component="span">
            Accordion 2
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>,
      <Accordion key="actions" defaultExpanded>
        <AccordionSummary>
          <Typography variant="subtitle1" component="span">
            Accordion actions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
        <AccordionActions>
          <Button color="inherit">Cancel</Button>
          <Button color="inherit">Agree</Button>
        </AccordionActions>
      </Accordion>,
      <Accordion key="disabled" disabled>
        <AccordionSummary>
          <Typography variant="subtitle1" component="span">
            Disabled accordion
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>,
    ],
  },
];

export const SIMPLE_FILES: GroupFiles = [["Simple", "group"]];

const PANELS = [
  ["General settings", "Notifications, language and time zone"],
  ["Users", "Who can see and edit this workspace"],
  ["Advanced settings", "Webhooks, exports and API keys"],
  ["Personal data", "Download or delete your data"],
] as const;

/**
 * The "Controlled" story: one item open at a time. React keeps the open item in state; HTML uses
 * `<details name>` (`controlled-group.html`).
 */
function ControlledExample() {
  const [expanded, setExpanded] = useState<string | false>(false);
  return PANELS.map(([panel, summary]) => (
    <Accordion
      key={panel}
      name="controlled"
      expanded={expanded === panel}
      onChange={(open) => setExpanded(open ? panel : false)}
    >
      <AccordionSummary>
        <Typography variant="subtitle1" component="span">
          {panel}
        </Typography>
        <Typography variant="body2" component="span" color="textSecondary">
          {summary}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{TEXT}</AccordionDetails>
    </Accordion>
  ));
}

export const controlledGroups: ReactGroup[] = [
  { title: "One open at a time", content: <ControlledExample /> },
];

export const CONTROLLED_FILES: GroupFiles = [["One open at a time", "group"]];

/** Source shown in the Code panel (the example has state, so `jsxSource` can't expand it). */
export const CONTROLLED_CODE = `import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@owlky/react";
import { useState } from "react";

const PANELS = ${JSON.stringify(PANELS)} as const;

export function ControlledExample() {
  const [expanded, setExpanded] = useState<string | false>(false);
  return PANELS.map(([panel, summary]) => (
    <Accordion
      key={panel}
      name="controlled"
      expanded={expanded === panel}
      onChange={(open) => setExpanded(open ? panel : false)}
    >
      <AccordionSummary>
        <Typography variant="subtitle1" component="span">
          {panel}
        </Typography>
        <Typography variant="body2" component="span" color="textSecondary">
          {summary}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>…</AccordionDetails>
    </Accordion>
  ));
}`;

/** "Custom styles": the reference's wrapper (outlined) and standalone (soft) accordions. */
export const variantGroups: ReactGroup[] = [
  {
    title: "Outlined",
    content: ["Accordion 1", "Accordion 2", "Accordion 3"].map((title) => (
      <Accordion key={title} variant="outlined">
        <AccordionSummary>
          <Typography variant="subtitle1" component="span">
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>
    )),
  },
  {
    title: "Soft",
    content: ["Accordion 1", "Accordion 2", "Accordion 3"].map((title) => (
      <Accordion key={title} variant="soft">
        <AccordionSummary expandIcon={<DemoIcon name="chevronDown" />}>
          <Typography variant="subtitle1" component="span">
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>
    )),
  },
];

export const VARIANT_FILES: GroupFiles = [
  ["Outlined", "outlined"],
  ["Soft", "soft"],
];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const ACCORDION_CONTROLS = {
  schema: accordionOptions,
  keys: ["variant", "disableGutters"],
} as const;
