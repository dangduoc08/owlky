import { type WalktourApi, walktourOptions, walktourStepOptions } from "@owlky/core";
import walktourApi from "@owlky/docs-content/api/walktour.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Button, Walktour, type WalktourStep } from "@owlky/react";
import { useRef } from "react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg>';

/** The markup of one step, as React renders it (`attributes`: its options and target). */
function htmlStep(
  number: number,
  total: number,
  attributes: string,
  title: string,
  content: string,
  continuous = false,
): string {
  const id = `tour-${number}`;
  const last = number === total;
  const label = continuous ? "Next" : "Close";
  return `<div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="bottom"
    ${attributes} role="dialog" aria-labelledby="${id}-title" aria-describedby="${id}-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="${id}-title">${title}</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close">${CLOSE_ICON}</button>
    </div>
    <div data-ok-walktour-content id="${id}-content">${content}</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="${Math.round((number / total) * 100)}" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="${last ? "primary" : "inherit"}" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>${last ? "Last" : `${label}<span data-ok-walktour-progress> (${number}/${total})</span>`}</span></button>
    </div>
  </div>`;
}

/** A whole tour: the overlay, the beacon, `steps` and the live region. */
const htmlTour = (
  rootAttributes: string,
  steps: string[],
) => `<div id="tour" data-ok-walktour ${rootAttributes}>
  <div data-ok-backdrop data-ok-invisible data-ok-walktour-overlay popover="manual" aria-hidden="true">
    <svg data-ok-walktour-spotlight aria-hidden="true" focusable="false">
      <path data-ok-walktour-mask fill-rule="evenodd"></path>
      <path data-ok-walktour-hole></path>
    </svg>
  </div>
  <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" aria-haspopup="dialog" hidden>
    <span data-ok-walktour-beacon-inner></span>
  </button>
  ${steps.join("\n  ")}
  <span data-ok-walktour-live aria-live="polite" aria-atomic="true" data-ok-format="Step {current} of {total}"></span>
</div>`;

export const walktourSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A walktour guides people through a page, one step at a time. Each step is a small dialog next to the element it explains. An overlay dims the rest of the page and leaves a spotlight on that element. People move on with **Next**, go back with **Back**, end the tour with **Skip**, and close a step with the close button or Escape. A progress bar and a step count show how far they are. Instead of opening a step at once, a tour can show a pulsing beacon on the element, which people select when they are ready.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-start="tour"><span data-ok-button-label>Start the tour</span></button>
<section id="inbox">
  <h2>Inbox</h2>
  <p>3 new messages</p>
</section>
<button type="button" id="compose" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Compose</span></button>

<div id="tour" data-ok-walktour data-ok-continuous data-ok-show-progress data-ok-disable-beacon>
  <div data-ok-backdrop data-ok-invisible data-ok-walktour-overlay popover="manual" aria-hidden="true">
    <svg data-ok-walktour-spotlight aria-hidden="true" focusable="false">
      <path data-ok-walktour-mask fill-rule="evenodd"></path>
      <path data-ok-walktour-hole></path>
    </svg>
  </div>
  <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" aria-haspopup="dialog" hidden>
    <span data-ok-walktour-beacon-inner></span>
  </button>
  <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="bottom"
    data-ok-target="#inbox" role="dialog" aria-labelledby="tour-1-title" aria-describedby="tour-1-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="tour-1-title">Your inbox</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
    </div>
    <div data-ok-walktour-content id="tour-1-content">New messages arrive here.</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (1/2)</span></span></button>
    </div>
  </div>
  <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="left-start"
    data-ok-target="#compose" role="dialog" aria-labelledby="tour-2-title" aria-describedby="tour-2-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="tour-2-title">Write</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
    </div>
    <div data-ok-walktour-content id="tour-2-content">Start a new message.</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (2/2)</span></span></button>
    </div>
  </div>
  <span data-ok-walktour-live aria-live="polite" aria-atomic="true" data-ok-format="Step {current} of {total}"></span>
</div>`,
    react: `import type { WalktourApi } from "@owlky/core";
import { Button, Walktour, type WalktourStep } from "@owlky/react";
import { useRef } from "react";

const steps: WalktourStep[] = [
  { target: "#inbox", title: "Your inbox", content: "New messages arrive here." },
  { target: "#compose", title: "Write", content: "Start a new message.", placement: "left" },
];

export function Tour() {
  const tour = useRef<WalktourApi>(null);
  return (
    <>
      <Button variant="outlined" onClick={() => tour.current?.reset(true)}>
        Start the tour
      </Button>
      <Walktour apiRef={tour} steps={steps} continuous showProgress disableBeacon />
    </>
  );
}`,
  },
  {
    id: "steps",
    title: "Describe the steps",
    body: "In React, pass the steps as data. Each step has a `target`, which is a CSS selector, an element, a ref or a function that returns the element. It also has its `content` and, usually, a `title` that names the dialog. `placement` puts the step on a side of the target, such as `bottom` or `left-start`. Use `auto` to pick the side with the most room, or `center` for a step in the middle of the screen with no target. A step can override most options of the tour, such as `disableBeacon`, `spotlightClicks` or `showSkipButton`. In HTML, write one step element per step. `data-ok-target` holds the selector, and an option attribute on a step overrides the tour's. The value `false` turns a tour option off for that step.",
    html: `<div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="left-start"
  data-ok-target="#compose" data-ok-spotlight-clicks
  data-ok-show-skip-button="false" role="dialog" aria-labelledby="tour-2-title" aria-describedby="tour-2-content">
  <span data-ok-popover-arrow aria-hidden="true"></span>
  <div data-ok-walktour-header>
    <h2 data-ok-walktour-title id="tour-2-title">Write</h2>
    <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
  </div>
  <div data-ok-walktour-content id="tour-2-content">Start a new message.</div>
  <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
    <span data-ok-linear-progress-bar="1"></span>
  </span>
  <div data-ok-walktour-footer>
    <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
    <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (2/2)</span></span></button>
  </div>
</div>`,
    react: `import { Button, Walktour, type WalktourStep } from "@owlky/react";
import { useRef } from "react";

export function ComposeTour() {
  const composeRef = useRef<HTMLButtonElement>(null);
  const steps: WalktourStep[] = [
    { target: "body", placement: "center", title: "Welcome", content: "A quick tour." },
    {
      target: composeRef,
      title: "Write",
      content: "Start a new message.",
      placement: "left-start",
      spotlightClicks: true,
      showSkipButton: false,
    },
  ];
  return (
    <>
      <Button ref={composeRef} variant="contained" color="primary">
        Compose
      </Button>
      <Walktour steps={steps} run continuous />
    </>
  );
}`,
  },
  {
    id: "run",
    title: "Run and control the tour",
    body: "The tour runs while `run` is `true`. Setting it to `false` pauses the tour, and setting it back resumes it. A tour that finished or was skipped starts over. `apiRef` gives you `start`, `stop`, `reset`, `next`, `prev`, `go`, `close`, `skip` and `open`. To control the current step yourself, pass `stepIndex` and update it from `onStepChange`. In HTML, `data-ok-run` runs the tour, a button with `data-ok-walktour-start` starts it over, and the instance has the same methods.",
    html: `<button type="button" data-ok-button data-ok-walktour-start="tour" data-ok-index="0">Start the tour</button>

<script type="module">
  // Or from code, once the runtime has started.
  const tour = window.Owlky.get(document.getElementById("tour"), "walktour");
  tour.start();
  tour.go(2);
</script>`,
    react: `import { Walktour, type WalktourStep } from "@owlky/react";
import { useState } from "react";

export function ControlledTour({ steps }: { steps: WalktourStep[] }) {
  const [run, setRun] = useState(true);
  const [step, setStep] = useState(0);
  return (
    <Walktour
      steps={steps}
      run={run}
      stepIndex={step}
      onStepChange={(index) => setStep(index)}
      onStatusChange={(status) => {
        if (status === "finished" || status === "skipped") setRun(false);
      }}
      continuous
    />
  );
}`,
  },
  {
    id: "beacons",
    title: "Use beacons",
    body: "Without `continuous`, the primary button reads **Close**: it closes the step and shows a beacon on the next target. People select the beacon to open that step. In a continuous tour, **Next** and **Back** go from step to step without beacons, and closing a step with the close button, Escape or the overlay shows the next step's beacon. `disableBeacon` opens steps at once, for the whole tour or for one step.",
    html: `<section id="inbox">
  <h2>Inbox</h2>
  <p>3 new messages</p>
</section>
<button type="button" id="compose" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Compose</span></button>

<div id="tour" data-ok-walktour data-ok-run data-ok-show-skip-button>
  <div data-ok-backdrop data-ok-invisible data-ok-walktour-overlay popover="manual" aria-hidden="true">
    <svg data-ok-walktour-spotlight aria-hidden="true" focusable="false">
      <path data-ok-walktour-mask fill-rule="evenodd"></path>
      <path data-ok-walktour-hole></path>
    </svg>
  </div>
  <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" aria-haspopup="dialog">
    <span data-ok-walktour-beacon-inner></span>
  </button>
  <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="bottom"
    data-ok-target="#inbox" role="dialog" aria-labelledby="tour-1-title" aria-describedby="tour-1-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="tour-1-title">Your inbox</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
    </div>
    <div data-ok-walktour-content id="tour-1-content">New messages arrive here.</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (1/2)</span></span></button>
    </div>
  </div>
  <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="left-start"
    data-ok-target="#compose" role="dialog" aria-labelledby="tour-2-title" aria-describedby="tour-2-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="tour-2-title">Write</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
    </div>
    <div data-ok-walktour-content id="tour-2-content">Start a new message.</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (2/2)</span></span></button>
    </div>
  </div>
  <span data-ok-walktour-live aria-live="polite" aria-atomic="true" data-ok-format="Step {current} of {total}"></span>
</div>`,
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  { target: "#inbox", title: "Your inbox", content: "New messages arrive here." },
  { target: "#compose", title: "Write", content: "Start a new message.", placement: "left" },
];

export function WalktourBeacons() {
  return <Walktour steps={steps} run showSkipButton />;
}`,
  },
  {
    id: "overlay",
    title: "Configure the overlay and the spotlight",
    body: "The overlay blocks the page while a step is open, so the step is a modal dialog. `spotlightClicks` lets people use the element in the spotlight, and `disableOverlay` removes the overlay: in both cases the step is no longer modal. `disableOverlayClose` keeps a click on the overlay from closing the step. `spotlightPadding` sets the space around the target and `spotlightRadius` the spotlight's corners, in pixels. `offset` sets the distance between the spotlight and the step, or the tip of its arrow: 8 pixels by default, and a step can set its own. When a target is out of view, the tour scrolls it into view and keeps `scrollOffset` pixels above it. `disableScrolling` turns that off, and `scrollToFirstStep` scrolls for the first step too.",
    html: `<section id="inbox">
  <h2>Inbox</h2>
  <p>3 new messages</p>
</section>
<button type="button" id="compose" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Compose</span></button>

<div id="tour" data-ok-walktour data-ok-spotlight-clicks data-ok-spotlight-padding="12"
  data-ok-spotlight-radius="16" data-ok-offset="16" data-ok-scroll-offset="80">
  <div data-ok-backdrop data-ok-invisible data-ok-walktour-overlay popover="manual" aria-hidden="true">
    <svg data-ok-walktour-spotlight aria-hidden="true" focusable="false">
      <path data-ok-walktour-mask fill-rule="evenodd"></path>
      <path data-ok-walktour-hole></path>
    </svg>
  </div>
  <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" aria-haspopup="dialog" hidden>
    <span data-ok-walktour-beacon-inner></span>
  </button>
  <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="bottom"
    data-ok-target="#inbox" role="dialog" aria-labelledby="tour-1-title" aria-describedby="tour-1-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="tour-1-title">Your inbox</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
    </div>
    <div data-ok-walktour-content id="tour-1-content">New messages arrive here.</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (1/2)</span></span></button>
    </div>
  </div>
  <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step data-ok-placement="left-start"
    data-ok-target="#compose" role="dialog" aria-labelledby="tour-2-title" aria-describedby="tour-2-content">
    <span data-ok-popover-arrow aria-hidden="true"></span>
    <div data-ok-walktour-header>
      <h2 data-ok-walktour-title id="tour-2-title">Write</h2>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm" data-ok-walktour-action="close" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"></path></svg></button>
    </div>
    <div data-ok-walktour-content id="tour-2-content">Start a new message.</div>
    <span role="progressbar" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="primary" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" aria-hidden="true">
      <span data-ok-linear-progress-bar="1"></span>
    </span>
    <div data-ok-walktour-footer>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="skip"><span data-ok-button-label>Skip</span></button>
      <button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="back"><span data-ok-button-label>Back</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md" data-ok-walktour-action="primary"><span data-ok-button-label>Next<span data-ok-walktour-progress> (2/2)</span></span></button>
    </div>
  </div>
  <span data-ok-walktour-live aria-live="polite" aria-atomic="true" data-ok-format="Step {current} of {total}"></span>
</div>`,
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  { target: "#inbox", title: "Your inbox", content: "New messages arrive here." },
  { target: "#compose", title: "Write", content: "Start a new message.", placement: "left" },
];

export function WalktourOverlay() {
  return (
    <Walktour
      steps={steps}
      spotlightClicks
      spotlightPadding={12}
      spotlightRadius={16}
      offset={16}
      scrollOffset={80}
    />
  );
}`,
  },
  {
    id: "hooks",
    title: "Run code before and after a step",
    body: "A step can point at an element that isn't on the page yet, such as an item in a closed menu. `before` runs when the step is about to show, before the tour looks for its target. Return a promise, and the tour waits for it before it shows the step, for up to `beforeTimeout` milliseconds (5000 by default, `0` for no limit). If the promise rejects or takes too long, the tour reports an `error` event and goes on. `after` runs once the step has ended, for example to close the menu again. The tour doesn't wait for it. Set both on the tour for every step, or on a step for that step only. In HTML, listen for `ok:walktour:beforestep` and pass a promise to `event.detail.waitUntil()`. For `after`, listen for the `step:after` event. The step that ends always reports `step:after` before the next step's `before` runs.",
    html: `<script type="module">
  const root = document.getElementById("tour");
  const menu = document.getElementById("menu");
  root.addEventListener("ok:walktour:beforestep", (event) => {
    // Step 2 points at an item in the menu: open the menu and wait for its animation.
    if (event.detail.index === 1) {
      menu.hidden = false;
      event.detail.waitUntil(new Promise((resolve) => setTimeout(resolve, 300)));
    }
  });
  root.addEventListener("ok:walktour:event", (event) => {
    if (event.detail.type === "step:after" && event.detail.index === 1) menu.hidden = true;
  });
</script>`,
    react: `import { Button, Walktour, type WalktourStep } from "@owlky/react";
import { useState } from "react";

export function MenuTour() {
  const [menuOpen, setMenuOpen] = useState(false);
  const steps: WalktourStep[] = [
    { target: "#menu-button", title: "Menu", content: "Your account lives here." },
    {
      target: "#settings-item",
      title: "Settings",
      content: "Change your preferences.",
      // Open the menu and wait for its animation before the step looks for its target.
      before: () => {
        setMenuOpen(true);
        return new Promise((resolve) => setTimeout(resolve, 300));
      },
      after: () => setMenuOpen(false),
    },
  ];
  return (
    <>
      <Button id="menu-button" variant="outlined" onClick={() => setMenuOpen(!menuOpen)}>
        Account
      </Button>
      {menuOpen && (
        <ul>
          <li id="settings-item">Settings</li>
        </ul>
      )}
      <Walktour steps={steps} run continuous disableBeacon />
    </>
  );
}`,
  },
  {
    id: "wait",
    title: "Wait for targets",
    body: "A step whose target isn't on the page yet waits for it for `targetWaitTimeout` milliseconds, 1000 by default. The tour looks for the target every 100 milliseconds and shows the step as soon as it appears, such as after a route change or a lazy load. If the target doesn't come, the step is skipped with an `error:target-not-found` event. Set `targetWaitTimeout` to `0` to skip such steps at once. Nothing shows while the tour waits, and the tour's `state.waiting` is `true`.",
    html: `<!-- Skip missing targets at once, but give the chart up to 3 seconds. -->
${htmlTour('data-ok-run data-ok-continuous data-ok-target-wait-timeout="0"', [
  htmlStep(1, 2, 'data-ok-target="#inbox"', "Your inbox", "New messages arrive here.", true),
  htmlStep(
    2,
    2,
    'data-ok-target="#chart" data-ok-target-wait-timeout="3000"',
    "Sales",
    "Your sales, week by week.",
    true,
  ),
])}`,
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  { target: "#inbox", title: "Your inbox", content: "New messages arrive here." },
  // The chart loads later: give it up to 3 seconds.
  { target: "#chart", title: "Sales", content: "Your sales, week by week.", targetWaitTimeout: 3000 },
];

export function WaitingTour() {
  return <Walktour steps={steps} run continuous targetWaitTimeout={0} />;
}`,
  },
  {
    id: "scroll-and-spotlight",
    title: "Scroll to and highlight other elements",
    body: "By default, a step scrolls its target into view and puts it in the spotlight. `scrollTarget` scrolls to another element instead, such as the section a small button sits in. `spotlightTarget` highlights another element instead, such as the whole card around a button. The tooltip and the beacon stay on the target. Scrolling takes `scrollDuration` milliseconds, 300 by default, and is instant at `0` or when the system asks for reduced motion. A target that doesn't move when the page scrolls, such as a fixed header, isn't scrolled to. The tour finds fixed elements on its own, and `isFixed` marks a target that it can't detect. In HTML, `data-ok-scroll-target` and `data-ok-spotlight-target` take CSS selectors.",
    html: htmlTour('data-ok-run data-ok-continuous data-ok-scroll-duration="600"', [
      htmlStep(
        1,
        2,
        'data-ok-target="#compose" data-ok-spotlight-target="#toolbar" data-ok-scroll-target="#mail"',
        "Write",
        "Start a new message from the toolbar.",
        true,
      ),
      htmlStep(
        2,
        2,
        'data-ok-target="#header" data-ok-is-fixed',
        "Search",
        "Find any message.",
        true,
      ),
    ]),
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  {
    target: "#compose",
    // Highlight the whole toolbar, and scroll to the section it sits in.
    spotlightTarget: "#toolbar",
    scrollTarget: "#mail",
    title: "Write",
    content: "Start a new message from the toolbar.",
  },
  { target: "#header", isFixed: true, title: "Search", content: "Find any message." },
];

export function ToolbarTour() {
  return <Walktour steps={steps} run continuous scrollDuration={600} />;
}`,
  },
  {
    id: "beacon-and-close",
    title: "Change the beacon and the close button",
    body: "`beaconTrigger` sets what opens a step from its beacon. `click` is the default. With `hover`, the step opens as soon as a mouse moves over the beacon, while keyboard and touch users still select it. `beaconPlacement` puts the beacon on another side of the target than the tooltip, such as `left` for a tooltip at the `bottom`. `closeButtonAction` sets what the close button does: `close` closes the step and shows the next step's beacon, and `skip` ends the tour, like **Skip**. All three can be set on the tour or on one step.",
    html: htmlTour(
      'data-ok-run data-ok-beacon-trigger="hover" data-ok-close-button-action="skip"',
      [
        htmlStep(
          1,
          2,
          'data-ok-target="#inbox" data-ok-beacon-placement="left"',
          "Your inbox",
          "New messages arrive here.",
        ),
        htmlStep(2, 2, 'data-ok-target="#compose"', "Write", "Start a new message."),
      ],
    ),
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  { target: "#inbox", beaconPlacement: "left", title: "Your inbox", content: "New messages arrive here." },
  { target: "#compose", title: "Write", content: "Start a new message." },
];

export function HoverTour() {
  return <Walktour steps={steps} run beaconTrigger="hover" closeButtonAction="skip" />;
}`,
  },
  {
    id: "step-identity",
    title: "Identify the steps in events",
    body: "Give a step an `id`, and any `data` your code needs, such as an analytics name. Every event and hook about that step receives them as `step.id` and `step.data`, so your code doesn't depend on the step's position in the tour. In React, set `id` and `data` on the step. In HTML, add `data-ok-step-id` and `data-ok-step-data` to the step, with the data as JSON.",
    html: `${htmlTour("data-ok-continuous", [
      htmlStep(
        1,
        2,
        `data-ok-target="#inbox" data-ok-step-id="inbox" data-ok-step-data='{"section":"mail"}'`,
        "Your inbox",
        "New messages arrive here.",
        true,
      ),
      htmlStep(
        2,
        2,
        'data-ok-target="#compose" data-ok-step-id="compose"',
        "Write",
        "Start a new message.",
        true,
      ),
    ])}

<script type="module">
  document.getElementById("tour").addEventListener("ok:walktour:event", (event) => {
    const { type, step } = event.detail;
    if (type === "step:after" && step) console.log("Seen:", step.id, step.data);
  });
</script>`,
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  {
    target: "#inbox",
    title: "Your inbox",
    content: "New messages arrive here.",
    id: "inbox",
    data: { section: "mail" },
  },
  { target: "#compose", title: "Write", content: "Start a new message.", id: "compose" },
];

export function WalktourStepIds() {
  return (
    <Walktour
      steps={steps}
      run
      continuous
      onEvent={(type, data) => {
        if (type === "step:after" && data.step) console.log("Seen:", data.step.id, data.step.data);
      }}
    />
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Options of the tour. In React, pass them as props. In HTML, write the attributes on the `data-ok-walktour` element. Every boolean option can also go on a step.",
  },
  {
    id: "step-options",
    title: "Step options",
    body: "Options of one step: React step fields, HTML attributes on the step element.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "Steps, texts and the tour's state.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "React reports changes with `onStepChange(index, details)`, `onStatusChange(status, details)` and `onEvent(type, data)`. `onEvent` receives every event of the tour in order: `tour:start`, `step:before-hook`, `step:before`, `beacon`, `tooltip`, `step:after`, `step:after-hook`, `tour:end`, `tour:status`, `error:target-not-found` and `error`. Each comes with the action, the control that asked for it, the step's index, the status and the number of steps. Events about a step with an `id` or `data` also carry them in `step`, and `error` events carry the `error`. In HTML, listen for `ok:walktour:change` (the new state), `ok:walktour:event` (the same events as `onEvent`), `ok:walktour:beforestep` (a step is about to show) and `ok:walktour:beforechange`, which you can cancel to keep the current step. A step whose target doesn't appear in time is skipped.",
    html: `<script type="module">
  const root = document.getElementById("tour");
  root.addEventListener("ok:walktour:event", (event) => {
    if (event.detail.type === "tour:end") console.log("Tour ended:", event.detail.status);
  });
</script>`,
    react: `import { Walktour, type WalktourStep } from "@owlky/react";

const steps: WalktourStep[] = [
  { target: "#inbox", title: "Your inbox", content: "New messages arrive here." },
  { target: "#compose", title: "Write", content: "Start a new message.", placement: "left" },
];

export function WalktourEvents() {
  return (
    <Walktour
      steps={steps}
      run
      onEvent={(type, data) => {
        if (type === "tour:end") console.log("Tour ended:", data.status);
      }}
    />
  );
}`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Keys while a step is open.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Each step is a dialog named by its title (or "Step 2 of 5" without one) and described by its content. While the overlay blocks the page, the step is modal: Tab stays inside it and the rest of the page is inert.
- \`disableFocusTrap\` lets Tab leave the step. The step is then no longer modal, so screen readers can reach the page too. Use it when the step asks people to use something outside it.
- \`beaconTrigger="hover"\` only adds a way to open a step: keyboard and touch users still select the beacon.
- Focus moves to the step's primary button when a step opens, to the beacon when a step closes to one, and back to where it was when the tour ends.
- A polite live region announces "Step 2 of 5" when a step opens.
- The beacon is a button named "Open the dialog". Change the text with \`locale.open\`.
- Escape closes a step unless \`disableCloseOnEsc\` is set. Keep it on: it is the quickest way out for keyboard users.
- The beacon's pulse stops when the system asks for reduced motion, and scrolling to a target is instant then.`,
  },
  apiReferenceSection(walktourApi),
];

const STEPS: WalktourStep[] = [
  {
    target: "#docs-tour-first",
    title: "First card",
    content: "Each step points at an element and explains it.",
  },
  {
    target: "#docs-tour-second",
    title: "Second card",
    placement: "top",
    content: "Next and Back move between steps.",
  },
];

function TourPreview() {
  const tour = useRef<WalktourApi>(null);
  return (
    <div className="sb-walktour">
      <Button variant="outlined" onClick={() => tour.current?.reset(true)}>
        Start the tour
      </Button>
      <div className="sb-walktour-dashboard">
        <section className="sb-walktour-card" id="docs-tour-first">
          <h3>First card</h3>
          <p className="sb-walktour-note">Some content.</p>
        </section>
        <section className="sb-walktour-card" id="docs-tour-second">
          <h3>Second card</h3>
          <p className="sb-walktour-note">More content.</p>
        </section>
      </div>
      <Walktour apiRef={tour} steps={STEPS} continuous showProgress disableBeacon />
    </div>
  );
}

const PREVIEWS = {
  overview: () => (
    <Preview>
      <TourPreview />
    </Preview>
  ),
  options: () => <OptionsTable schema={walktourOptions} />,
  "step-options": () => <OptionsTable schema={walktourStepOptions} />,
  props: () => (
    <PropsTable
      label="Walktour content props"
      rows={[
        {
          react: "steps",
          html: "one data-ok-walktour-step element per step",
          type: "WalktourStep[]",
          description: "`target`, `content`, `title`, `placement` and step overrides.",
        },
        {
          react: "step.target",
          html: "data-ok-target",
          type: "selector | element | ref | () => element",
          description: 'The element the step points at; `"body"` centers the step.',
        },
        {
          react: "step.scrollTarget / step.spotlightTarget",
          html: "data-ok-scroll-target / data-ok-spotlight-target",
          type: "selector | element | ref | () => element",
          description:
            "The element to scroll to, and the one to put in the spotlight, instead of the target.",
        },
        {
          react: "step.id / step.data",
          html: "data-ok-step-id / data-ok-step-data (JSON)",
          type: "string / unknown",
          description: "The step's identifier and your data, passed in events and hooks as `step`.",
        },
        {
          react: "before / step.before",
          html: "ok:walktour:beforestep, event.detail.waitUntil(promise)",
          type: "(data) => Promise | void",
          description:
            "Runs before a step shows; the tour waits for a returned promise. A step's replaces the tour's.",
        },
        {
          react: "after / step.after",
          html: "the step:after event",
          type: "(data) => void",
          description: "Runs after a step ended. Not awaited.",
        },
        {
          react: "step.stepProps",
          html: "attributes of the step element",
          type: "div props",
          description: 'Extra attributes, such as `data-ok-theme="dark"`.',
        },
        {
          react: "run",
          html: "data-ok-run, start(), stop()",
          type: "boolean",
          description: "Runs or pauses the tour. Default `false`.",
        },
        {
          react: "stepIndex / onStepChange",
          html: "go(), ok:walktour:beforechange",
          type: "number / (index, details) => void",
          description: "Controlled current step.",
        },
        {
          react: "initialStepIndex",
          html: "data-ok-step-index",
          type: "number",
          description: "The first step of an uncontrolled tour. Default 0.",
        },
        {
          react: "locale",
          html: "the text in the markup; data-ok-format on the live region",
          type: "Partial<WalktourLocale>",
          description:
            "`back`, `close`, `last`, `next`, `open`, `skip`, `progress` and `stepOf` texts.",
        },
        {
          react: "onStatusChange",
          html: "ok:walktour:change",
          type: "(status, details) => void",
          description: "`running`, `paused`, `finished`, `skipped` or `idle`.",
        },
        {
          react: "onEvent",
          html: "ok:walktour:event",
          type: "(type, data) => void",
          description: "Every tour event, in order.",
        },
        {
          react: "apiRef",
          html: 'runtime.get(root, "walktour")',
          type: "RefObject<WalktourApi>",
          description: "The tour's methods and its `state`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab / Shift + Tab", "Moves between the step's controls (stays inside a modal step)."],
        ["Enter / Space", "Activates the focused button or beacon."],
        ["Escape", "Closes the step and shows the next step's beacon."],
      ]}
    />
  ),
};

/** Walktour docs page (ADR-0019). */
export function WalktourDocs() {
  return <GuideDocs sections={walktourSections} previews={PREVIEWS} />;
}
