import { accordionOptions } from "@owlky/core";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
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
        <AccordionSummary>Accordion 1</AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>,
      <Accordion key="2">
        <AccordionSummary>Accordion 2</AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>,
      <Accordion key="actions" defaultExpanded>
        <AccordionSummary>Accordion actions</AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
        <AccordionActions>
          <Button color="inherit">Cancel</Button>
          <Button color="inherit">Agree</Button>
        </AccordionActions>
      </Accordion>,
      <Accordion key="disabled" disabled>
        <AccordionSummary>Disabled accordion</AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>,
    ],
  },
];

export const SIMPLE_FILES: GroupFiles = [["Simple", "group"]];

const PANELS = ["General settings", "Users", "Advanced settings", "Personal data"];

/**
 * The "Controlled" story: one item open at a time. React keeps the open item in state; HTML uses
 * `<details name>` (`controlled-group.html`).
 */
function ControlledExample() {
  const [expanded, setExpanded] = useState<string | false>(false);
  return PANELS.map((panel) => (
    <Accordion
      key={panel}
      name="controlled"
      expanded={expanded === panel}
      onChange={(open) => setExpanded(open ? panel : false)}
    >
      <AccordionSummary>{panel}</AccordionSummary>
      <AccordionDetails>{TEXT}</AccordionDetails>
    </Accordion>
  ));
}

export const controlledGroups: ReactGroup[] = [
  { title: "One open at a time", content: <ControlledExample /> },
];

export const CONTROLLED_FILES: GroupFiles = [["One open at a time", "group"]];

/** Source shown in the Code panel (the example has state, so `jsxSource` can't expand it). */
export const CONTROLLED_CODE = `import { Accordion, AccordionDetails, AccordionSummary } from "@owlky/react";
import { useState } from "react";

const PANELS = ${JSON.stringify(PANELS)};

export function ControlledExample() {
  const [expanded, setExpanded] = useState<string | false>(false);
  return PANELS.map((panel) => (
    <Accordion
      key={panel}
      name="controlled"
      expanded={expanded === panel}
      onChange={(open) => setExpanded(open ? panel : false)}
    >
      <AccordionSummary>{panel}</AccordionSummary>
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
        <AccordionSummary>{title}</AccordionSummary>
        <AccordionDetails>{TEXT}</AccordionDetails>
      </Accordion>
    )),
  },
  {
    title: "Soft",
    content: ["Accordion 1", "Accordion 2", "Accordion 3"].map((title) => (
      <Accordion key={title} variant="soft">
        <AccordionSummary expandIcon={<DemoIcon name="chevronDown" />}>{title}</AccordionSummary>
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
