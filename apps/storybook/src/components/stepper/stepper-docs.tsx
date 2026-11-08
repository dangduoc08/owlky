import { mobileStepperOptions, stepLabelOptions, stepOptions, stepperOptions } from "@owlky/core";
import { MobileStepper, Step, StepLabel, Stepper } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { HorizontalDemo } from "./horizontal-demo.js";
import { MobileDemo } from "./mobile-demo.js";
import { VerticalDemo } from "./vertical-demo.js";

const STEPS = ["Choose a plan", "Add details", "Review and confirm"];

export const stepperSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A stepper shows progress through a sequence of steps, such as a checkout or a setup wizard. Each step has a numbered icon and a title. Steps before the active one are completed and show a check, steps after it are not reached yet. The stepper only shows progress: your app owns the active step and changes it from its Back and Next buttons. For views that people visit in any order, use **Tabs** instead.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<ol id="setup" data-ok-stepper data-ok-orientation="horizontal" data-ok-variant="standard" data-ok-active-step="0" aria-label="Project setup">
  <li data-ok-step>
    <span data-ok-step-label>
      <span data-ok-step-icon aria-hidden="true">
        <span data-ok-step-icon-text>1</span>
        <svg data-ok-step-icon-check aria-hidden="true" viewBox="0 0 24 24">…</svg>
        <svg data-ok-step-icon-error aria-hidden="true" viewBox="0 0 24 24">…</svg>
      </span>
      <span data-ok-step-label-text><span data-ok-step-label-title>Choose a plan</span></span>
    </span>
  </li>
  <li data-ok-step>
    <div data-ok-step-connector aria-hidden="true"><span data-ok-step-connector-line></span></div>
    …
  </li>
</ol>
<button type="button" data-ok-button data-ok-stepper-back="setup">…Back…</button>
<button type="button" data-ok-button data-ok-stepper-next="setup">…Next…</button>`,
    react: `import { Button, Step, StepLabel, Stepper } from "@owlky/react";
import { useState } from "react";

const steps = ["Choose a plan", "Add details", "Review and confirm"];

export function Setup() {
  const [active, setActive] = useState(0);
  return (
    <>
      <Stepper activeStep={active} aria-label="Project setup">
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Button disabled={active === 0} onClick={() => setActive(active - 1)}>
        Back
      </Button>
      <Button onClick={() => setActive(active + 1)}>Next</Button>
    </>
  );
}`,
  },
  {
    id: "state",
    title: "Move between steps",
    body: "In React, pass `activeStep` (0-based) and change it from your buttons. Each `Step` gets its state from it: the active step, completed steps before it, not reached steps after it. Set `active`, `completed` or `disabled` on a `Step` to override the state, for example to leave a skipped step uncompleted. Once `activeStep` equals the number of steps, every step is completed. In HTML, the runtime keeps every step's state in line with `data-ok-active-step`. Buttons with `data-ok-stepper-next`, `data-ok-stepper-back` or `data-ok-stepper-reset` move the stepper they name. Back buttons are disabled on the first step.",
    html: `<!-- The panel at the active step shows, the others get hidden -->
<p data-ok-stepper-panel="setup">Pick the plan that suits your team.</p>
<p data-ok-stepper-panel="setup" hidden>Invite the people who will work on it.</p>
<!-- A panel for one step only -->
<div data-ok-stepper-panel="setup" data-ok-stepper-panel-step="3" hidden>All steps completed.</div>`,
    react: `<Stepper activeStep={active}>
  <Step>
    <StepLabel>Choose a plan</StepLabel>
  </Step>
  {/* Skipped: not completed although it comes before the active step */}
  <Step completed={false}>
    <StepLabel optional="Optional">Add details</StepLabel>
  </Step>
</Stepper>`,
  },
  {
    id: "labels",
    title: "Write step labels",
    body: 'Keep titles short, two or three words. `optional` adds a second line, such as "Optional". Set `error` on a `StepLabel` to show that a step failed: the icon turns into an exclamation mark and the text takes the error color. `icon` replaces the number with other text, or with any node such as an `svg`.',
    react: `<StepLabel optional="Optional">Add details</StepLabel>
<StepLabel error optional="Card declined">Payment</StepLabel>
<StepLabel icon={<SettingsIcon />}>Choose a plan</StepLabel>`,
    html: `<span data-ok-step-label data-ok-error>…</span>
<span data-ok-step-label-optional>Card declined</span>`,
  },
  {
    id: "layout",
    title: "Lay out the steps",
    body: "Steps sit in a row, joined by lines. Set `alternativeLabel` to put the labels below the icons, and the steps share the width. Set `orientation` to `vertical` to stack the steps. In a vertical stepper, `StepContent` holds what the active step shows below its title, such as a form and its buttons. On narrow screens, the titles wrap inside their steps so the row never overflows. A vertical stepper or a mobile stepper reads better on phones.",
    html: `<ol data-ok-stepper data-ok-orientation="vertical" data-ok-active-step="0">
  <li data-ok-step>
    <span data-ok-step-label>…</span>
    <div data-ok-step-content>…</div>
  </li>
</ol>`,
    react: `<Stepper activeStep={active} orientation="vertical">
  <Step>
    <StepLabel>Choose a plan</StepLabel>
    <StepContent>…</StepContent>
  </Step>
</Stepper>`,
  },
  {
    id: "variants",
    title: "Change the look",
    body: "`variant` sets how the steps look. `standard` shows numbered icons. `dot` shows small dots and thicker lines in the primary color. `circle` shows large circles that hold an icon (pass one per step with `icon`), with a gradient on the active and completed steps. To draw a line of your own, pass `connector`, or `null` for no line.",
    html: `<ol data-ok-stepper data-ok-variant="dot" data-ok-alternative-label …>…</ol>`,
    react: `<Stepper activeStep={active} alternativeLabel variant="circle">
  <Step>
    <StepLabel icon={<SettingsIcon />}>Choose a plan</StepLabel>
  </Step>
</Stepper>`,
  },
  {
    id: "mobile",
    title: "Use a mobile stepper",
    body: '`MobileStepper` is a compact bar for small screens: a Back button, the progress, and a Next button. The progress is a text such as "2 / 3" (`text`), a row of dots (`dots`, the default) or a bar (`progress`). By default the bar is fixed to the bottom of the viewport. Set `position` to `top`, or to `static` to keep it in the page. In HTML, Back and Next buttons inside the bar move it, and the runtime disables them at the ends.',
    html: `<div data-ok-mobile-stepper data-ok-variant="dots" data-ok-position="static" data-ok-steps="3" data-ok-active-step="0">
  <button type="button" data-ok-button data-ok-mobile-stepper-back>…Back…</button>
  <span data-ok-mobile-stepper-dots role="img" aria-label="Step 1 of 3">
    <span data-ok-mobile-stepper-dot data-ok-active></span><span data-ok-mobile-stepper-dot></span><span data-ok-mobile-stepper-dot></span>
  </span>
  <button type="button" data-ok-button data-ok-mobile-stepper-next>…Next…</button>
</div>`,
    react: `<MobileStepper
  steps={3}
  activeStep={active}
  position="static"
  backButton={<Button onClick={() => setActive(active - 1)} disabled={active === 0}>Back</Button>}
  nextButton={<Button onClick={() => setActive(active + 1)} disabled={active === 2}>Next</Button>}
/>`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't valid fall back to the default. The tables list the options of `Stepper`, `Step`, `StepLabel` and `MobileStepper`.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:stepper:change\`** (cancelable) fires on the stepper before it moves, with \`detail.activeStep\` and \`detail.previous\`.
- **\`ok:mobile-stepper:change\`** (cancelable) fires the same way on a mobile stepper.
- **Instances:** \`runtime.get(element, "stepper")\` and \`runtime.get(element, "mobile-stepper")\` return \`{ activeStep, setActiveStep(step), go(step) }\`. \`setActiveStep\` doesn't fire the event.
- **React:** steppers report nothing. Change \`activeStep\` from your own buttons.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Steps aren't interactive, so they aren't in the tab order. People move with your Back and Next buttons, which are native buttons.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The stepper is an ordered list, so screen readers announce the number of steps. Name it with \`aria-label\`.
- The active step carries \`aria-current="step"\`.
- Step icons are decorative. The title says what the step is, so keep it meaningful without the number.
- The dots and the bar of a mobile stepper are named "Step 2 of 3". Pass \`getStepLabel\` (React) or \`data-ok-label-step\` (HTML, with \`{step}\` and \`{steps}\`) to translate it.
- Numbers on steps that aren't reached use a darker grey than the line, so they keep a contrast ratio of at least 4.5:1.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <HorizontalDemo />
    </Preview>
  ),
  labels: () => (
    <Preview>
      <Stepper activeStep={1} aria-label="Checkout">
        <Step>
          <StepLabel>Cart</StepLabel>
        </Step>
        <Step>
          <StepLabel error optional="Card declined">
            Payment
          </StepLabel>
        </Step>
        <Step>
          <StepLabel>Confirm</StepLabel>
        </Step>
      </Stepper>
    </Preview>
  ),
  layout: () => (
    <Preview>
      <VerticalDemo />
    </Preview>
  ),
  variants: () => (
    <Preview>
      <Stepper activeStep={1} alternativeLabel variant="dot" aria-label="Dots">
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Preview>
  ),
  mobile: () => (
    <Preview>
      <MobileDemo variant="dots" />
      <MobileStepper steps={3} activeStep={1} variant="text" position="static" />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={stepperOptions} />
      <OptionsTable schema={stepOptions} />
      <OptionsTable schema={stepLabelOptions} />
      <OptionsTable schema={mobileStepperOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Stepper content props"
      rows={[
        {
          react: "Stepper connector",
          html: "div[data-ok-step-connector] in each step after the first",
          type: "ReactNode",
          description: "The line before each step. `null` draws none.",
        },
        {
          react: "StepLabel children",
          html: "span[data-ok-step-label-title]",
          type: "ReactNode",
          description: "The step's title.",
        },
        {
          react: "StepLabel optional",
          html: "span[data-ok-step-label-optional]",
          type: "ReactNode",
          description: 'A second line, such as "Optional".',
        },
        {
          react: "StepLabel icon",
          html: "span[data-ok-step-icon] content",
          type: "ReactNode",
          description: "Replaces the number. A node needs `data-ok-custom` on the icon in HTML.",
        },
        {
          react: "StepContent",
          html: "div[data-ok-step-content]",
          type: "component",
          description: "Vertical steppers: shown below the active step's title.",
        },
        {
          react: "MobileStepper backButton / nextButton",
          html: "data-ok-mobile-stepper-back / -next",
          type: "ReactNode",
          description: "The Back and Next controls.",
        },
        {
          react: "MobileStepper getStepLabel",
          html: "data-ok-label-step",
          type: "(step, steps) => string",
          description: 'Name of the dots and the bar. Default "Step 1 of 3".',
        },
      ]}
    />
  ),
};

/** Stepper docs page (ADR-0019). */
export function StepperDocs() {
  return <GuideDocs sections={stepperSections} previews={PREVIEWS} />;
}
