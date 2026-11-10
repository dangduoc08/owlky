import { accordionActionsOptions, accordionOptions } from "@owlky/core";
import accordionApi from "@owlky/docs-content/api/accordion.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
} from "@owlky/react";
import { useState } from "react";
import { CDN, capitalize, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const PLUS = `<span data-ok-accordion-icon aria-hidden="true"><svg data-ok-accordion-plus aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg></span>`;

const htmlItem = (title: string, text: string, attrs = 'data-ok-variant="default"') =>
  `<details data-ok-accordion ${attrs}>
  <summary data-ok-accordion-summary>${title}${PLUS}</summary>
  <div data-ok-accordion-details>${text}</div>
</details>`;

const FAQ = [
  ["How do I reset my password?", "Open Settings, choose Security and select Reset password."],
  ["Can I change my plan later?", "Yes. You can upgrade or downgrade at any time from Billing."],
  ["Where can I download invoices?", "Every invoice is listed in Billing, under History."],
] as const;

export const accordionSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An accordion shows a list of sections that people can expand and collapse in place, such as a FAQ or groups of settings. It keeps long pages short while every answer stays on the page. Accordions are native `<details>` elements, so they open, close and work with find-in-page even without JavaScript.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

${htmlItem(FAQ[0][0], FAQ[0][1])}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
} from "@owlky/react";

export function PasswordFaq() {
  return (
    <Accordion>
      <AccordionSummary>How do I reset my password?</AccordionSummary>
      <AccordionDetails>Open Settings, choose Security and select Reset password.</AccordionDetails>
    </Accordion>
  );
}`,
  },
  {
    id: "variants",
    title: "Choose a variant",
    body: "Three variants are available. `default` turns the open item into a raised card, `outlined` draws one bordered list, and `soft` shows each item as a filled block. Set `disableGutters` to remove the space around the open item.",
    html: htmlItem(FAQ[0][0], FAQ[0][1], 'data-ok-variant="outlined"'),
    react: `import { Accordion, AccordionDetails, AccordionSummary } from "@owlky/react";

export function OutlinedAccordion() {
  return (
    <Accordion variant="outlined">
      <AccordionSummary>How do I reset my password?</AccordionSummary>
      <AccordionDetails>Open Settings, choose Security and select Reset password.</AccordionDetails>
    </Accordion>
  );
}`,
  },
  {
    id: "exclusive",
    title: "Open one item at a time",
    body: "Give every item in the group the same `name`. Opening one item then closes the others, as the browser does for `<details name>`. Where a browser doesn't support it yet, Owlky closes the others itself.",
    html: FAQ.map(([title, text]) =>
      htmlItem(title, text, 'data-ok-variant="default" name="faq"'),
    ).join("\n"),
    react: `import { Accordion, AccordionDetails, AccordionSummary } from "@owlky/react";

const faq = [
  { title: "How do I reset my password?", answer: "Open Settings, choose Security and select Reset password." },
  { title: "Can I change my plan later?", answer: "Yes. You can upgrade or downgrade at any time from Billing." },
];

export function Faq() {
  return (
    <>
      {faq.map((item) => (
        <Accordion key={item.title} name="faq">
          <AccordionSummary>{item.title}</AccordionSummary>
          <AccordionDetails>{item.answer}</AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}`,
  },
  {
    id: "controlled",
    title: "Control the open state",
    body: "In React, pass `expanded` and `onChange` to decide when an item opens, or `defaultExpanded` to only set the initial state. To refuse a change, don't update `expanded`. In HTML, listen to `ok:accordion:beforetoggle` and call `preventDefault()`.",
    html: `<script type="module">
  document.addEventListener("ok:accordion:beforetoggle", (event) => {
    if (event.detail.open && !userIsSignedIn) event.preventDefault();
  });
</script>`,
    react: `import { Accordion, AccordionDetails, AccordionSummary } from "@owlky/react";
import { useState } from "react";

export function BillingSection() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Accordion expanded={expanded} onChange={setExpanded}>
      <AccordionSummary>Billing</AccordionSummary>
      <AccordionDetails>Your plan renews on the first day of each month.</AccordionDetails>
    </Accordion>
  );
}`,
  },
  {
    id: "actions",
    title: "Add actions",
    body: "Put buttons for the open item in `AccordionActions`, after the details. The actions sit at the end of the row with 8px between them. Set `disableSpacing` to remove that space, for example when the buttons already have their own margins.",
    html: `<details data-ok-accordion data-ok-variant="default" open>
  <summary data-ok-accordion-summary>Terms of service${PLUS}</summary>
  <div data-ok-accordion-details>You agree to the terms when you create an account.</div>
  <div data-ok-accordion-actions data-ok-disable-spacing>
    <button data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" type="button">Cancel</button>
    <button data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" type="button">Agree</button>
  </div>
</details>`,
    react: `import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Button } from "@owlky/react";

export function TermsAccordion() {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary>Terms of service</AccordionSummary>
      <AccordionDetails>You agree to the terms when you create an account.</AccordionDetails>
      <AccordionActions disableSpacing>
        <Button variant="text">Cancel</Button>
        <Button variant="contained">Agree</Button>
      </AccordionActions>
    </Accordion>
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
    body: "These props and parts set the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:accordion:beforetoggle\`** (cancelable) fires when a summary is activated, with \`detail.open\`, the requested state.
- **\`ok:accordion:toggle\`** fires after the item opened or closed, with \`detail.open\`.
- **Instance:** \`runtime.get(element, "accordion")\` returns \`{ isOpen, toggle(open?) }\`.
- **React:** \`onChange(expanded)\`. A controlled accordion refuses a change by keeping \`expanded\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The summary is a native disclosure button, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The summary works as a disclosure button: assistive technology announces whether the item is expanded.
- Put a heading inside each summary, such as an \`<h3>\`, so the sections appear in the page outline.
- A disabled item is marked \`aria-disabled="true"\` and removed from the tab order.
- Content stays in the page when closed, so find-in-page can open the item that contains a match.`,
  },
  apiReferenceSection(accordionApi),
];

function FaqList({ variant, name }: { variant?: "default" | "outlined" | "soft"; name?: string }) {
  return (
    <div className="w-full">
      {FAQ.map(([title, text]) => (
        <Accordion key={title} variant={variant} name={name}>
          <AccordionSummary>{title}</AccordionSummary>
          <AccordionDetails>{text}</AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}

function ControlledPreview() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Preview className="flex-col items-stretch!">
      <Accordion expanded={expanded} onChange={setExpanded}>
        <AccordionSummary>Billing</AccordionSummary>
        <AccordionDetails>Your plan renews on the first day of every month.</AccordionDetails>
      </Accordion>
    </Preview>
  );
}

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <FaqList />
    </Preview>
  ),
  variants: () => (
    <Preview className="flex-col items-stretch! gap-6!">
      {(["outlined", "soft"] as const).map((variant) => (
        <div key={variant}>
          <p className="mt-0 mb-2 text-[0.8125rem] text-text-secondary">{capitalize(variant)}</p>
          <FaqList variant={variant} />
        </div>
      ))}
    </Preview>
  ),
  exclusive: () => (
    <Preview className="block!">
      <FaqList name="docs-faq" />
    </Preview>
  ),
  controlled: ControlledPreview,
  actions: () => (
    <Preview className="flex-col items-stretch!">
      <Accordion defaultExpanded>
        <AccordionSummary>Terms of service</AccordionSummary>
        <AccordionDetails>You agree to the terms when you create an account.</AccordionDetails>
        <AccordionActions disableSpacing>
          <Button variant="text">Cancel</Button>
          <Button variant="contained">Agree</Button>
        </AccordionActions>
      </Accordion>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={accordionOptions} />
      <OptionsTable schema={accordionActionsOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Accordion content props"
      rows={[
        {
          react: "name",
          html: "name",
          type: "string",
          description: "Items with the same name open one at a time.",
        },
        {
          react: "AccordionSummary",
          html: "summary[data-ok-accordion-summary]",
          type: "component",
          description: "The always-visible title that opens and closes the item.",
        },
        {
          react: "expandIcon",
          html: "data-ok-accordion-icon",
          type: "ReactNode | null",
          description: "Replaces the plus icon on `AccordionSummary`; `null` hides it.",
        },
        {
          react: "AccordionDetails",
          html: "div[data-ok-accordion-details]",
          type: "component",
          description: "The content shown when the item is open.",
        },
        {
          react: "AccordionActions",
          html: "div[data-ok-accordion-actions]",
          type: "component",
          description: "Optional row of buttons at the end of the content.",
        },
        {
          react: "defaultExpanded",
          html: "open",
          type: "boolean",
          description: "Opens the item initially.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the next summary. Disabled items are skipped."],
        ["Enter / Space", "Opens or closes the focused item."],
      ]}
    />
  ),
};

/** Accordion docs page (ADR-0019). */
export function AccordionDocs() {
  return <GuideDocs sections={accordionSections} previews={PREVIEWS} />;
}
