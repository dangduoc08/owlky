import { type WalktourApi, walktourOptions } from "@owlky/core";
import {
  Avatar,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Walktour,
  type WalktourStep,
} from "@owlky/react";
import { createRef } from "react";

/*
 * Walktour stories. The dashboard cards are story-only demo markup (`sb-walktour-*` classes in
 * `.storybook/preview.css`); pictures are the original artwork of the Carousel and Avatar stories,
 * referenced relatively so they work under the e2e server's sub-path. People and products are
 * invented. The HTML snippets are generated from these examples
 * (`node apps/storybook/scripts/walktour-snippets.mjs`).
 */

const TEXT =
  "Aenean posuere, tortor sed cursus feugiat, nunc augue blandit nunc, eu sollicitudin urna dolor sagittis lacus.";

/** The restart buttons reach the tours through module refs: the examples stay stateless. */
export const basicApi = createRef<WalktourApi>();
export const beaconsApi = createRef<WalktourApi>();

const SETTINGS = [
  { label: "Wi-Fi", checked: true },
  { label: "Bluetooth", checked: true },
  { label: "Airbuds", checked: false },
  { label: "Alarm", checked: false },
];

const BASIC_STEPS: WalktourStep[] = [
  {
    target: "#tour-welcome",
    title: "Let's begin our journey!",
    content: TEXT,
  },
  {
    target: "#tour-featured",
    title: "Step 2",
    placement: "left-start",
    content: (
      <>
        <p className="sb-walktour-text">{TEXT}</p>
        <img className="sb-walktour-image" src="carousel/slide-2.svg" alt="Abstract waves" />
      </>
    ),
  },
  {
    target: "#tour-balance",
    title: "Step 3",
    content: (
      <>
        <p className="sb-walktour-text">Weekly magic on your inbox</p>
        <TextField
          variant="filled"
          type="email"
          label="Email"
          placeholder="example@gmail.com"
          fullWidth
          endAdornment={
            <Button variant="soft" size="sm">
              Send
            </Button>
          }
        />
      </>
    ),
  },
  {
    target: "#tour-sales",
    title: "Step 4",
    placement: "left",
    content: (
      <>
        <p className="sb-walktour-text">{TEXT}</p>
        <div className="sb-walktour-settings">
          {SETTINGS.map((setting) => (
            <FormControlLabel
              key={setting.label}
              label={setting.label}
              labelPlacement="start"
              control={<Switch defaultChecked={setting.checked} />}
            />
          ))}
        </div>
      </>
    ),
  },
  {
    target: "#tour-products",
    title: "Step 5",
    placement: "left",
    width: 480,
    stepProps: { "data-ok-theme": "dark" } as Record<string, string>,
    content: (
      <>
        <p className="sb-walktour-text">{TEXT}</p>
        <div className="sb-walktour-gallery">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <img key={n} src={`carousel/slide-${n}.svg`} alt={`Artwork ${n}`} />
          ))}
        </div>
      </>
    ),
  },
];

/** Story-only dashboard: the cards the tour points at. */
function Dashboard() {
  return (
    <div className="sb-walktour-dashboard">
      <section className="sb-walktour-card sb-walktour-welcome" id="tour-welcome">
        <Avatar src="avatars/avatar-3.svg" alt="" />
        <h3>Congratulations, Ana Lima!</h3>
        <p className="sb-walktour-note">Best seller of the month: you sold 57.6% more today.</p>
        <Button variant="contained" color="primary">
          Go now
        </Button>
      </section>
      <section className="sb-walktour-card sb-walktour-featured" id="tour-featured">
        <img src="carousel/slide-1.svg" alt="" />
        <h3>Trail Runner Sneakers</h3>
        <Button variant="contained" color="primary" size="sm">
          Buy now
        </Button>
      </section>
      <section className="sb-walktour-card" id="tour-sold">
        <h3>Product sold</h3>
        <p className="sb-walktour-figure">765</p>
      </section>
      <section className="sb-walktour-card" id="tour-balance">
        <h3>Total balance</h3>
        <p className="sb-walktour-figure">18,765</p>
      </section>
      <section className="sb-walktour-card" id="tour-profit">
        <h3>Sales profit</h3>
        <p className="sb-walktour-figure">4,876</p>
      </section>
      <section className="sb-walktour-card sb-walktour-wide" id="tour-sales">
        <h3>Yearly sales</h3>
        <p className="sb-walktour-note">(+43%) than last year</p>
      </section>
      <section className="sb-walktour-card" id="tour-products">
        <h3>Latest products</h3>
        <ul className="sb-walktour-note">
          <li>Trail Runner Sneakers · $83.74</li>
          <li>Harbor Leather Loafers · $97.14</li>
          <li>Summit Hiking Boots · $68.71</li>
        </ul>
      </section>
    </div>
  );
}

/** The reference's demo: a continuous tour of a dashboard, with progress and a Skip button. */
export function WalktourDemo() {
  return (
    <div className="sb-walktour">
      <Button
        variant="outlined"
        aria-controls="tour-basic"
        onClick={() => basicApi.current?.reset(true)}
      >
        Restart the tour
      </Button>
      <Dashboard />
      <Walktour
        id="tour-basic"
        apiRef={basicApi}
        steps={BASIC_STEPS}
        run
        continuous
        showProgress
        showSkipButton
        disableBeacon
        spotlightPadding={12}
        locale={{ last: "Done" }}
      />
    </div>
  );
}

const BEACON_STEPS: WalktourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome",
    content: "This tour shows a beacon on each target. Select a beacon to open its step.",
    disableBeacon: true,
  },
  {
    target: "#tour-b-actions",
    title: "Try it",
    placement: "auto",
    spotlightClicks: true,
    content: "The spotlight lets you use the buttons while the step is open.",
  },
  {
    target: "#tour-b-notes",
    title: "No overlay",
    placement: "top",
    disableOverlay: true,
    content: "This step leaves the page usable: there is no overlay.",
  },
];

/** Beacons, a centered step, `auto` placement, spotlight clicks and a step without overlay. */
export function BeaconsDemo() {
  return (
    <div className="sb-walktour">
      <Button
        variant="outlined"
        aria-controls="tour-beacons"
        onClick={() => beaconsApi.current?.reset(true)}
      >
        Restart the tour
      </Button>
      <div className="sb-walktour-dashboard">
        <section className="sb-walktour-card" id="tour-b-actions">
          <h3>Quick actions</h3>
          <div className="sb-walktour-actions">
            <Button variant="contained">Request</Button>
            <Button variant="soft" color="primary">
              Transfer
            </Button>
          </div>
        </section>
        <section className="sb-walktour-card" id="tour-b-notes">
          <h3>Notes</h3>
          <p className="sb-walktour-note">Write down what you want to remember.</p>
        </section>
      </div>
      <Walktour id="tour-beacons" apiRef={beaconsApi} steps={BEACON_STEPS} run showSkipButton />
    </div>
  );
}

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const WALKTOUR_CONTROLS = {
  schema: walktourOptions,
  keys: [
    "showProgress",
    "showSkipButton",
    "hideBackButton",
    "hideCloseButton",
    "disableOverlay",
    "disableOverlayClose",
    "disableCloseOnEsc",
    "spotlightClicks",
    "spotlightPadding",
    "spotlightRadius",
  ],
} as const;
