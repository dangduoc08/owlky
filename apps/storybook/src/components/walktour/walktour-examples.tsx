import { type WalktourApi, walktourOptions } from "@owlky/core";
import {
  Avatar,
  Button,
  Card,
  FormControlLabel,
  Image,
  Paper,
  Switch,
  TextField,
  Typography,
  Walktour,
  type WalktourStep,
} from "@owlky/react";
import { createRef } from "react";

/*
 * Walktour stories. The dashboard cards are Cards with Typography (`sb-walktour-*` classes in
 * `.storybook/preview.css` lay them out); the featured card's picture is an Image, like the reference's (its
 * step pictures are plain `img`); the settings of step 4 sit on an outlined Paper. Pictures are the original artwork of the Carousel and Avatar stories,
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
        <Typography variant="body2" className="sb-walktour-text">
          {TEXT}
        </Typography>
        <img className="sb-walktour-image" src="carousel/slide-2.svg" alt="Abstract waves" />
      </>
    ),
  },
  {
    target: "#tour-balance",
    title: "Step 3",
    content: (
      <>
        <Typography variant="body2" className="sb-walktour-text">
          Weekly magic on your inbox
        </Typography>
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
        <Typography variant="body2" className="sb-walktour-text">
          {TEXT}
        </Typography>
        <Paper variant="outlined" className="sb-walktour-settings">
          {SETTINGS.map((setting) => (
            <FormControlLabel
              key={setting.label}
              label={setting.label}
              labelPlacement="start"
              control={<Switch defaultChecked={setting.checked} />}
            />
          ))}
        </Paper>
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
        <Typography variant="body2" className="sb-walktour-text">
          {TEXT}
        </Typography>
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
      <Card component="section" className="sb-walktour-card sb-walktour-welcome" id="tour-welcome">
        <Avatar src="avatars/avatar-3.svg" alt="" />
        <Typography variant="subtitle2" component="h3">
          Congratulations, Ana Lima!
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Best seller of the month: you sold 57.6% more today.
        </Typography>
        <Button variant="contained" color="primary">
          Go now
        </Button>
      </Card>
      <Card
        component="section"
        className="sb-walktour-card sb-walktour-featured"
        id="tour-featured"
      >
        <Image src="carousel/slide-1.svg" alt="" ratio="4/3" />
        <Typography variant="subtitle2" component="h3">
          Trail Runner Sneakers
        </Typography>
        <Button variant="contained" color="primary" size="sm">
          Buy now
        </Button>
      </Card>
      <Card component="section" className="sb-walktour-card" id="tour-sold">
        <Typography variant="subtitle2" component="h3">
          Product sold
        </Typography>
        <Typography variant="h4" component="p">
          765
        </Typography>
      </Card>
      <Card component="section" className="sb-walktour-card" id="tour-balance">
        <Typography variant="subtitle2" component="h3">
          Total balance
        </Typography>
        <Typography variant="h4" component="p">
          18,765
        </Typography>
      </Card>
      <Card component="section" className="sb-walktour-card" id="tour-profit">
        <Typography variant="subtitle2" component="h3">
          Sales profit
        </Typography>
        <Typography variant="h4" component="p">
          4,876
        </Typography>
      </Card>
      <Card component="section" className="sb-walktour-card sb-walktour-wide" id="tour-sales">
        <Typography variant="subtitle2" component="h3">
          Yearly sales
        </Typography>
        <Typography variant="body2" color="textSecondary">
          (+43%) than last year
        </Typography>
      </Card>
      <Card component="section" className="sb-walktour-card" id="tour-products">
        <Typography variant="subtitle2" component="h3">
          Latest products
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          component="ul"
          className="sb-walktour-list"
        >
          <li>Trail Runner Sneakers · $83.74</li>
          <li>Harbor Leather Loafers · $97.14</li>
          <li>Summit Hiking Boots · $68.71</li>
        </Typography>
      </Card>
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
        <Card component="section" className="sb-walktour-card" id="tour-b-actions">
          <Typography variant="subtitle2" component="h3">
            Quick actions
          </Typography>
          <div className="sb-walktour-actions">
            <Button variant="contained">Request</Button>
            <Button variant="soft" color="primary">
              Transfer
            </Button>
          </div>
        </Card>
        <Card component="section" className="sb-walktour-card" id="tour-b-notes">
          <Typography variant="subtitle2" component="h3">
            Notes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Write down what you want to remember.
          </Typography>
        </Card>
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
