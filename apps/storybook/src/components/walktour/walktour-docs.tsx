import { type WalktourApi, walktourOptions, walktourStepOptions } from "@owlky/core";
import walktourApi from "@owlky/docs-content/api/walktour.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Button, Walktour, type WalktourStep } from "@owlky/react";
import { useRef } from "react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

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
    body: "The overlay blocks the page while a step is open, so the step is a modal dialog. `spotlightClicks` lets people use the element in the spotlight, and `disableOverlay` removes the overlay: in both cases the step is no longer modal. `disableOverlayClose` keeps a click on the overlay from closing the step. `spotlightPadding` sets the space around the target and `spotlightRadius` the spotlight's corners, in pixels. When a target is out of view, the tour scrolls it into view and keeps `scrollOffset` pixels above it. `disableScrolling` turns that off, and `scrollToFirstStep` scrolls for the first step too.",
    html: `<section id="inbox">
  <h2>Inbox</h2>
  <p>3 new messages</p>
</section>
<button type="button" id="compose" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Compose</span></button>

<div id="tour" data-ok-walktour data-ok-spotlight-clicks data-ok-spotlight-padding="12"
  data-ok-spotlight-radius="16" data-ok-scroll-offset="80">
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
    <Walktour steps={steps} spotlightClicks spotlightPadding={12} spotlightRadius={16} scrollOffset={80} />
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
    body: "React reports changes with `onStepChange(index, details)`, `onStatusChange(status, details)` and `onEvent(type, data)`. `onEvent` receives every event of the tour in order: `tour:start`, `step:before`, `beacon`, `tooltip`, `step:after`, `tour:end`, `tour:status` and `error:target-not-found`. Each comes with the action, the control that asked for it, the step, the status and the number of steps. In HTML, listen for `ok:walktour:change` (the new state), `ok:walktour:event` (the same events as `onEvent`) and `ok:walktour:beforechange`, which you can cancel to keep the current step. A step whose target isn't in the page is skipped.",
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
