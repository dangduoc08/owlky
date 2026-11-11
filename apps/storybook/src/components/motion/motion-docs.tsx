import {
  countdownOptions,
  countUpOptions,
  motionBorderOptions,
  motionGroupOptions,
  motionOptions,
  motionTextOptions,
} from "@owlky/core";
import motionApi from "@owlky/docs-content/api/motion.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  Button,
  Card,
  Countdown,
  CountUp,
  Motion,
  MotionBorder,
  MotionGroup,
  MotionText,
  Paper,
  Typography,
  useMotionValue,
  useSpring,
  useTransform,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { LayoutExpandDemo, LayoutHighlightDemo, LayoutReorderDemo } from "./layout-demo.js";

export const motionSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Motion animates its content in or out. By default, it plays when the content scrolls into view, so long pages reveal their sections as you read. The animation comes from the stylesheet. The script only decides when it plays. Without the script, the content shows as usual, so nothing stays hidden. Users who ask for reduced motion see the content appear at once.",
    html: `<!-- Load once per page: the styles and the script -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-motion data-ok-variant="fadeInUp">
  <h2>Plans for every team</h2>
</div>`,
    react: `import { Motion } from "@owlky/react";

export function PlansHeading() {
  return (
    <Motion variant="fadeInUp">
      <h2>Plans for every team</h2>
    </Motion>
  );
}`,
  },
  {
    id: "variants",
    title: "Choose an animation",
    body: `\`variant\` names the animation. Entrances end with the content in place, and exits end with it hidden.
- **Slide, fade, zoom and bounce:** \`slideInUp\`, \`fadeIn\`, \`zoomOutLeft\`, \`bounceInDown\` and more. \`Up\` and \`Down\` name the movement, \`Left\` and \`Right\` the side it comes from or goes to.
- **Flip, scale and rotate:** \`flipInX\`, \`flipOutY\`, \`scaleInX\`, \`scaleOutY\`, \`rotateIn\` and \`rotateOut\`.
- **Backgrounds:** \`kenburnsTop\` and the other Ken Burns directions zoom slowly into an image. \`panTop\` and the other pan directions move a gradient background. \`color2x\` to \`color5x\` paint text with a moving gradient. These loop until you pause them.

\`duration\` sets the length of an entrance in milliseconds (640 by default), \`delay\` waits before it starts, and \`distance\` sets how far directional animations travel in pixels.`,
    html: `<div data-ok-motion data-ok-variant="zoomInLeft" data-ok-duration="800" data-ok-distance="80">
  <h2 data-ok-typography data-ok-variant="h4">Welcome back</h2>
</div>`,
    react: `import { Motion, Typography } from "@owlky/react";

export function MotionVariants() {
  return (
    <Motion variant="zoomInLeft" duration={800} distance={80}>
      <Typography variant="h4" component="h2">
        Welcome back
      </Typography>
    </Motion>
  );
}`,
  },
  {
    id: "trigger",
    title: "Decide when it plays",
    body: `\`trigger\` decides when the animation plays:
- **\`inView\` (default):** when at least \`amount\` of the content is visible (0.3 by default). It plays once. Set \`once\` to \`false\` to play the exit when the content leaves the view and the entrance again when it comes back.
- **\`mount\`:** as soon as the page loads, for content that is visible from the start.
- **\`manual\`:** when you set \`in\`. Turning \`in\` off plays the animation backwards. In HTML, add or remove the \`data-ok-in\` attribute.

Changing \`variant\`, \`duration\` or \`distance\` plays an entered animation again. In HTML, \`replay()\` plays it again too. In React, change the \`key\`.`,
    html: `<div id="notice" data-ok-motion data-ok-variant="fadeInDown" data-ok-trigger="manual">Saved</div>

<script>
  // Show the notice; remove the attribute to hide it
  document.getElementById("notice").toggleAttribute("data-ok-in", true);
</script>`,
    react: `import { Motion } from "@owlky/react";

export function Notice({ saved }: { saved: boolean }) {
  return (
    <Motion variant="fadeInDown" trigger="manual" in={saved}>
      Saved
    </Motion>
  );
}`,
  },
  {
    id: "viewport",
    title: "Tune the viewport and react to it",
    body: `With the \`inView\` trigger, two options change what counts as the view:
- **\`viewportMargin\`:** grows the view, or shrinks it with negative values, before the visible part is measured. Write it like CSS margins in \`px\` or \`%\`. For example, \`0px 0px -100px\` plays the animation once the content is 100 pixels above the bottom edge. In HTML, use the \`data-ok-viewport-margin\` attribute.
- **\`viewportRoot\`:** a scrolling container that holds the content, used as the view instead of the browser window. In React, pass a ref to it. In HTML, write its \`id\` in \`data-ok-viewport-root\`.

\`onViewportEnter\` runs when the content enters the view, and \`onViewportLeave\` when it leaves. In HTML, listen for the \`ok:motion:enter\` and \`ok:motion:leave\` events. MotionGroup and MotionText have the same options and events. With \`once\` on (the default), only the first entrance is reported, so set \`once\` to \`false\` to hear every one.`,
    html: `<style>
  #feed { height: 240px; overflow: auto; }
</style>

<div id="feed" tabindex="0" aria-label="News feed">
  <section
    id="latest"
    data-ok-motion
    data-ok-variant="fadeInUp"
    data-ok-once="false"
    data-ok-viewport-root="feed"
    data-ok-viewport-margin="0px 0px -40px"
  >
    <h2>Latest news</h2>
  </section>
</div>

<script>
  // Mark the section as read while it is in view
  const latest = document.getElementById("latest");
  latest.addEventListener("ok:motion:enter", () => latest.classList.add("seen"));
  latest.addEventListener("ok:motion:leave", () => latest.classList.remove("seen"));
</script>`,
    react: `import { Motion } from "@owlky/react";
import { useRef, useState } from "react";

export function LatestNews() {
  const feed = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  return (
    <div ref={feed} tabIndex={0} aria-label="News feed" style={{ height: 240, overflow: "auto" }}>
      <Motion
        component="section"
        variant="fadeInUp"
        once={false}
        viewportRoot={feed}
        viewportMargin="0px 0px -40px"
        onViewportEnter={() => setSeen(true)}
        onViewportLeave={() => setSeen(false)}
        className={seen ? "seen" : undefined}
      >
        <h2>Latest news</h2>
      </Motion>
    </div>
  );
}`,
  },
  {
    id: "group",
    title: "Animate several items",
    body: "MotionGroup plays the Motions inside it together, one direct child after the other. `stagger` sets the time between two children, 50 milliseconds by default. The group's trigger replaces the trigger of its Motions.",
    html: `<ul data-ok-motion-group data-ok-stagger="80">
  <li data-ok-motion data-ok-variant="slideInUp">Design</li>
  <li data-ok-motion data-ok-variant="slideInUp">Develop</li>
  <li data-ok-motion data-ok-variant="slideInUp">Release</li>
</ul>`,
    react: `import { Motion, MotionGroup } from "@owlky/react";

export function Steps() {
  return (
    <MotionGroup stagger={80}>
      <Motion variant="slideInUp">Design</Motion>
      <Motion variant="slideInUp">Develop</Motion>
      <Motion variant="slideInUp">Release</Motion>
    </MotionGroup>
  );
}`,
  },
  {
    id: "text",
    title: "Animate text letter by letter",
    body: "MotionText animates each letter of a short text, 25 milliseconds apart by default. Screen readers read a hidden copy of the whole text, because separate letters would be read one by one. Put MotionText inside a heading or a paragraph. In HTML, you can write the text alone: the script adds the letters.",
    html: `<h2><span data-ok-motion-text data-ok-variant="fadeInUp">Owlky moves</span></h2>`,
    react: `import { MotionText } from "@owlky/react";

export function Title() {
  return (
    <h2>
      <MotionText variant="fadeInUp">Owlky moves</MotionText>
    </h2>
  );
}`,
  },
  {
    id: "component",
    title: "Render another element",
    body: "Motion renders a `div`, MotionGroup a `div` and MotionText a `span`. Set `component` to render another element, such as a `section`, a list or a heading, so the page keeps its structure without an extra wrapper. In HTML, put the attributes on the element you need. Transforms don't apply to inline elements such as `a`: give them `display: inline-block`.",
    html: `<ul data-ok-motion-group>
  <li data-ok-motion data-ok-variant="fadeInLeft">Design</li>
  <li data-ok-motion data-ok-variant="fadeInLeft">Develop</li>
</ul>
<h2 data-ok-motion-text data-ok-variant="fadeIn">Our process</h2>`,
    react: `import { Motion, MotionGroup, MotionText } from "@owlky/react";

export function Process() {
  return (
    <>
      <MotionGroup component="ul">
        <Motion component="li" variant="fadeInLeft">
          Design
        </Motion>
        <Motion component="li" variant="fadeInLeft">
          Develop
        </Motion>
      </MotionGroup>
      <MotionText component="h2" variant="fadeIn">
        Our process
      </MotionText>
    </>
  );
}`,
  },
  {
    id: "dialog",
    title: "Animate a dialog",
    body: "Set `transition` on a Dialog to open its paper with a Motion entrance, such as `slideInUp` or `zoomIn`. When the dialog closes, the entrance plays backwards before the dialog goes away. Without `transition`, the paper fades and scales in briefly, and out when it closes.",
    html: `<dialog id="share" data-ok-dialog data-ok-max-width="sm" aria-labelledby="share-title">
  <div data-ok-dialog-paper data-ok-motion data-ok-variant="slideInUp" data-ok-trigger="mount">
    <h2 id="share-title" data-ok-dialog-title>Share your location?</h2>
    <div data-ok-dialog-content>
      <p data-ok-dialog-content-text>Nearby stores show up first when you share your location.</p>
    </div>
    <div data-ok-dialog-actions>
      <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md" data-ok-dialog-close><span data-ok-button-label>Not now</span></button>
      <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-dialog-close><span data-ok-button-label>Share</span></button>
    </div>
  </div>
</dialog>`,
    react: `import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@owlky/react";
import { useState } from "react";

export function MotionDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Share location
      </Button>
      <Dialog open={open} onOpenChange={setOpen} transition="slideInUp" aria-labelledby="share-title">
        <DialogTitle id="share-title">Share your location?</DialogTitle>
        <DialogContent>
          <DialogContentText>Nearby stores show up first when you share your location.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Not now</Button>
          <Button variant="contained" color="primary" onClick={() => setOpen(false)}>
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}`,
  },
  {
    id: "pause",
    title: "Pause looping animations",
    body: "Ken Burns, pan and color animations keep moving. Give your users a way to pause them, because moving content that lasts more than five seconds distracts many people. Set `paused` from your own control, such as a switch or a button.",
    html: `<div id="hero" data-ok-motion data-ok-variant="kenburnsTop">
  <img src="hero.jpg" alt="Mountain lake at sunrise">
</div>

<script>
  // Your pause button toggles the attribute
  document.getElementById("hero").toggleAttribute("data-ok-paused", true);
</script>`,
    react: `import { Button, Motion } from "@owlky/react";
import { useState } from "react";

export function MotionPause() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <Motion variant="kenburnsTop" paused={paused}>
        <img src="hero.jpg" alt="Mountain lake at sunrise" />
      </Motion>
      <Button aria-pressed={paused} onClick={() => setPaused(!paused)}>
        {paused ? "Play" : "Pause"}
      </Button>
    </>
  );
}`,
  },
  {
    id: "effects",
    title: "Draw an icon or react to the pointer",
    body: `Two variants aren't entrances:
- **\`draw\`:** traces the strokes of an SVG, then fades its fill in. Give every shape \`pathLength="1"\`, so the stroke length is known.
- **\`interactive\`:** scales the content up on hover and down while it's pressed, such as a card or a button. The element shrinks to its content. Icon buttons and floating action buttons have their own \`animate\` option for the same effect.`,
    html: `<div data-ok-motion data-ok-variant="draw">
  <svg viewBox="0 0 24 24" role="img" aria-label="Check">
    <path pathLength="1" d="M4 12l5 5L20 6" fill="none" stroke="currentColor" />
  </svg>
</div>

<div data-ok-motion data-ok-variant="interactive">
  <button type="button" data-ok-button data-ok-variant="contained">Buy now</button>
</div>`,
    react: `import { Button, Motion } from "@owlky/react";

export function Effects() {
  return (
    <>
      <Motion variant="draw">
        <svg viewBox="0 0 24 24" role="img" aria-label="Check">
          <path pathLength={1} d="M4 12l5 5L20 6" fill="none" stroke="currentColor" />
        </svg>
      </Motion>
      <Motion variant="interactive">
        <Button variant="contained">Buy now</Button>
      </Motion>
    </>
  );
}`,
  },
  {
    id: "count-up",
    title: "Count up to a number",
    body: "CountUp counts from `start` (0 by default) to `end` when it scrolls into view, in 2 seconds by default. Set `decimals` for digits after the decimal point, and `prefix` or `suffix` for units. Screen readers read the end value from the start, because the changing digits are hidden from them. Digits keep the same width, so the text doesn't shake.",
    html: `<span data-ok-count-up data-ok-end="200">
  <span data-ok-count-up-label>200k</span>
  <span aria-hidden="true"><span data-ok-count-up-value>0</span>k</span>
</span>`,
    react: `import { CountUp } from "@owlky/react";

export function Users() {
  return <CountUp end={200} suffix="k" />;
}`,
  },
  {
    id: "countdown",
    title: "Count down to a date",
    body: `Countdown shows the days, hours, minutes and seconds left until \`date\`, or of a number of \`seconds\` when there is no date. It updates once per second and stops at 0.

- **Units:** \`largestUnit\` sets the largest unit shown. With \`seconds\`, a 90-second countdown shows 90 seconds instead of 1 minute and 30 seconds. Write the unit names in your language with \`labels\` in React, or as the text of each label in HTML.
- **Server rendering:** pass \`now\`, the time of the first render, so the server and the browser show the same time. Without it, a date countdown shows \`--\` until the page runs its script.
- **Pause:** \`paused\` stops the countdown. A seconds countdown keeps its time left. A date countdown shows the real time left when it resumes, because the date doesn't move. In HTML, a button with \`data-ok-countdown-toggle\` pauses and resumes the countdown it names, and \`data-ok-countdown-restart\` starts it over.
- **End:** \`onComplete\` (HTML: the \`ok:countdown:complete\` event) runs once at 0, and screen readers hear \`completeLabel\` ("Time's up" by default).`,
    html: `<span id="launch" data-ok-countdown role="timer" aria-label="Time until the launch" data-ok-largest-unit="days" data-ok-date="2027-01-01T00:00:00Z">
  <span data-ok-countdown-unit="days"><span data-ok-countdown-value>--</span> <span data-ok-countdown-label>days</span></span>
  <span data-ok-countdown-unit="hours"><span data-ok-countdown-value>--</span> <span data-ok-countdown-label>hours</span></span>
  <span data-ok-countdown-unit="minutes"><span data-ok-countdown-value>--</span> <span data-ok-countdown-label>minutes</span></span>
  <span data-ok-countdown-unit="seconds"><span data-ok-countdown-value>--</span> <span data-ok-countdown-label>seconds</span></span>
  <span data-ok-countdown-status role="status"></span>
</span>
<button type="button" data-ok-button data-ok-variant="outlined" data-ok-countdown-toggle="launch" aria-pressed="false">
  <span data-ok-button-label>Pause</span>
</button>

<script>
  document.getElementById("launch").addEventListener("ok:countdown:complete", () => {
    document.getElementById("launch-done").hidden = false;
  });
</script>
<p id="launch-done" hidden>We are live.</p>`,
    react: `import { Button, Countdown } from "@owlky/react";
import { useState } from "react";

export function Launch() {
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(false);
  return (
    <>
      <Countdown
        aria-label="Time until the launch"
        date="2027-01-01T00:00:00Z"
        paused={paused}
        onComplete={() => setLive(true)}
      />
      <Button variant="outlined" aria-pressed={paused} onClick={() => setPaused(!paused)}>
        Pause
      </Button>
      {live && <p>We are live.</p>}
    </>
  );
}`,
  },
  {
    id: "border",
    title: "Turn a border around content",
    body: `MotionBorder draws a moving border around its content, such as a logo, an avatar or a button.

- **Color:** \`multi\` (the default) turns several brand colors all around. \`inherit\` (the text color) or a palette color runs one light along a faint track of the same color.
- **Second light:** \`secondaryColor\` adds a light in another color that starts on the opposite side. It has no effect with \`multi\`.
- **Shape and size:** set \`shape\` to \`circle\` for round content, \`width\` for the border width in pixels and \`duration\` for one turn.
- **Edges and corners:** the border follows the element's CSS. Set \`border-width\` to \`0\` on a side to leave it out, and set \`border-radius\` per corner. Your rules win over the library's, because its selectors have zero specificity.

The inside is painted with the paper color, so put the border on a paper or a page background.`,
    html: `<div data-ok-motion-border data-ok-shape="circle" data-ok-color="primary" data-ok-secondary-color="warning">
  <img src="avatar.jpg" alt="Ana Silva" width="72" height="72">
</div>

<!-- Top and left edges only, with a rounded top-left corner. In your stylesheet:
  .corner { width: 96px; height: 96px; border-right-width: 0; border-bottom-width: 0; border-radius: 32px 0 0 0; } -->
<div class="corner" data-ok-motion-border data-ok-color="secondary" data-ok-width="4"></div>`,
    react: `import { Avatar, MotionBorder } from "@owlky/react";

// Top and left edges only, with a rounded top-left corner (in your CSS):
// .corner { width: 96px; height: 96px; border-right-width: 0; border-bottom-width: 0; border-radius: 32px 0 0 0; }
export function ActiveUser() {
  return (
    <>
      <MotionBorder shape="circle" color="primary" secondaryColor="warning">
        <Avatar src="avatar.jpg" alt="Ana Silva" size={72} />
      </MotionBorder>
      <MotionBorder className="corner" color="secondary" width={4} />
    </>
  );
}`,
  },
  {
    id: "keyframes",
    title: "Play your own keyframes",
    body: `Set \`keyframes\` to animate any CSS property along your own values, such as a ring that turns and rounds its corners. Give each property a target or a list of values. \`x\` and \`y\` move the content in pixels, \`rotate\` turns it in degrees and \`scale\` resizes it. Set \`transition\` to choose how the keyframes play:

- **Timing:** \`duration\`, \`delay\` and \`repeatDelay\` in milliseconds, \`ease\` (a CSS easing, a theme easing such as \`decelerate\`, or one easing per segment) and \`times\` (the position of each keyframe, from 0 to 1).
- **Repeats:** \`repeat\` plays the keyframes again (\`Infinity\` loops), and \`repeatType\` set to \`reverse\` plays every other repeat backwards.

The keyframes play when the Motion enters, from its trigger, and backwards when it exits. They replace the variant. In HTML, write both as JSON in \`data-ok-keyframes\` and \`data-ok-transition\`, and write \`"Infinity"\` as a string, because JSON has no infinity. Loops need a pause control (\`paused\`), and they don't run when users ask for reduced motion.`,
    html: `<div class="loader">
  <div data-ok-motion data-ok-trigger="mount"
    data-ok-keyframes='{"rotate": [0, 270, 270, 0], "borderRadius": ["25%", "50%", "50%", "25%"]}'
    data-ok-transition='{"duration": 3200, "ease": "linear", "repeat": "Infinity"}'
    class="ring"></div>
</div>`,
    react: `import { Motion } from "@owlky/react";

// The ring's size and border come from your CSS:
// .ring { width: 96px; height: 96px; border: 8px solid var(--ok-palette-primary-light); }
export function Loader() {
  return (
    <Motion
      trigger="mount"
      className="ring"
      keyframes={{ rotate: [0, 270, 270, 0], borderRadius: ["25%", "50%", "50%", "25%"] }}
      transition={{ duration: 3200, ease: "linear", repeat: Infinity }}
    />
  );
}`,
  },
  {
    id: "spring",
    title: "Move with a spring",
    body: `Set \`type\` to \`spring\` in \`transition\` to move between two keyframes with a physical spring instead of a fixed curve. Describe it in one of two ways:

- **How it feels:** \`duration\` (the time to reach the target, in milliseconds) and \`bounce\`, from \`0\` (no overshoot) to \`1\` (very bouncy).
- **Physics:** \`stiffness\`, \`damping\` and \`mass\`. A low damping bounces more.

The spring decides how long the animation lasts: it ends when the content rests. Browsers without \`linear()\` easing, such as Safari before version 17.2, play the same length with a smooth curve and no bounce.`,
    html: `<div data-ok-motion data-ok-trigger="mount"
  data-ok-keyframes='{"y": [40, 0], "opacity": [0, 1]}'
  data-ok-transition='{"type": "spring", "duration": 500, "bounce": 0.4}'>
  <p>Your order is on its way.</p>
</div>`,
    react: `import { Motion } from "@owlky/react";

export function OrderStatus() {
  return (
    <Motion
      trigger="mount"
      keyframes={{ y: [40, 0], opacity: [0, 1] }}
      transition={{ type: "spring", duration: 500, bounce: 0.4 }}
    >
      <p>Your order is on its way.</p>
    </Motion>
  );
}`,
  },
  {
    id: "animate",
    title: "Animate from JavaScript",
    body: `\`animate(element, keyframes, options)\` plays keyframes on any element, with the same keyframes and options as \`keyframes\` and \`transition\`. Import it from \`@owlky/html\` or \`@owlky/react\`.

- **Interruption:** a new animation of a property starts where the running one is, so quick changes never jump.
- **End state:** the final values stay on the element as inline styles.
- **Controls:** it returns \`finished\` (a promise), \`stop()\` (keep the current values), \`complete()\` (jump to the end), \`cancel()\` (go back to the element's own style), \`pause()\` and \`play()\`.

With reduced motion, the element jumps to the end and loops don't start.`,
    html: `<button type="button" id="like" data-ok-button data-ok-variant="outlined" data-ok-color="primary" data-ok-size="md">
  <span data-ok-button-label>Like</span>
</button>

<script type="module">
  // With a bundler: animate comes from the package
  import { animate } from "@owlky/html";

  const like = document.getElementById("like");
  like.addEventListener("click", () => {
    animate(like, { scale: [1, 1.2, 1] }, { duration: 400, ease: "easeOut" });
  });
</script>`,
    react: `import { animate, Button } from "@owlky/react";
import { useRef } from "react";

export function LikeButton() {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Button
      ref={ref}
      variant="outlined"
      color="primary"
      onClick={() => animate(ref.current, { scale: [1, 1.2, 1] }, { duration: 400, ease: "easeOut" })}
    >
      Like
    </Button>
  );
}`,
  },
  {
    id: "presence",
    title: "Play the exit before removing content",
    body: `Content that leaves the page usually disappears at once, so its exit never shows. Let it play first:

- **React:** wrap the content in \`MotionPresence\` and give each child a \`key\`. A removed child stays until the Motions inside it have played their exit. \`mode="wait"\` shows a new child only after the old one left, \`initial={false}\` skips the entrance of the children shown at first, and \`onExitComplete\` runs when every exit ended.
- **HTML:** call \`remove()\` or \`hide()\` on the Motion's instance. They play the exit, then remove the element or set \`hidden\`. \`exit()\` plays it alone. Each returns a promise.`,
    html: `<div id="notice" data-ok-motion data-ok-variant="fadeInUp" data-ok-trigger="mount">
  <p>Your changes are saved.</p>
  <button type="button" id="dismiss" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md">
    <span data-ok-button-label>Dismiss</span>
  </button>
</div>

<script>
  document.getElementById("dismiss").addEventListener("click", () => {
    const notice = document.getElementById("notice");
    // Plays the exit, then removes the notice
    window.Owlky.get(notice, "motion").remove();
  });
</script>`,
    react: `import { Button, Motion, MotionPresence } from "@owlky/react";
import { useState } from "react";

export function SavedNotice() {
  const [shown, setShown] = useState(true);
  return (
    <MotionPresence>
      {shown ? (
        <Motion key="notice" variant="fadeInUp" trigger="mount">
          <p>Your changes are saved.</p>
          <Button color="inherit" onClick={() => setShown(false)}>
            Dismiss
          </Button>
        </Motion>
      ) : null}
    </MotionPresence>
  );
}`,
  },
  {
    id: "drag",
    title: "Drag content",
    body: `Add \`drag\` to make a Motion follow the pointer. Without a value it moves on both axes. \`"x"\` or \`"y"\` keeps it on one axis, so the page still scrolls along the other one on touch screens.

- **Release:** it glides on in the direction it was thrown and slows down. Turn this off with \`dragMomentum\` set to \`false\`, or bring it back to where it started with \`dragSnapToOrigin\`.
- **Direction lock:** with \`dragDirectionLock\`, it moves only along the first axis the pointer moves on.
- **While dragged:** \`whileDrag\` takes keyframes, such as \`{ scale: 1.05 }\`, played while the pointer holds it.
- **Events:** \`onDragStart\`, \`onDrag\` and \`onDragEnd\` (HTML: \`ok:motion:dragstart\`, \`ok:motion:drag\` and \`ok:motion:dragend\`) report the pointer's \`point\`, \`offset\` from the press, \`delta\` and \`velocity\` in pixels per second.

Dragging needs a pointer, so give people another way to do what a drag does (WCAG 2.5.7). Make the Motion focusable with \`tabindex="0"\` and name it: the arrow keys then move it by 10 pixels, or 50 pixels with Shift, and report the same events. With reduced motion, the content still follows the pointer but stops at once when released.`,
    html: `<div data-ok-motion data-ok-trigger="mount" data-ok-drag
  data-ok-while-drag='{"scale": 1.05}'
  id="note" tabindex="0" role="group" aria-label="Movable note" aria-describedby="note-hint">
  <p>Drag me</p>
</div>
<p id="note-hint">Drag the note, or focus it and use the arrow keys.</p>

<script>
  document.getElementById("note").addEventListener("ok:motion:dragend", (event) => {
    // How far it moved from the press, in pixels
    console.log(event.detail.offset);
  });
</script>`,
    react: `import { Motion } from "@owlky/react";

export function MovableNote() {
  return (
    <>
      <Motion
        trigger="mount"
        drag
        whileDrag={{ scale: 1.05 }}
        tabIndex={0}
        role="group"
        aria-label="Movable note"
        aria-describedby="note-hint"
        onDragEnd={(_event, info) => console.log(info.offset)}
      >
        <p>Drag me</p>
      </Motion>
      <p id="note-hint">Drag the note, or focus it and use the arrow keys.</p>
    </>
  );
}`,
  },
  {
    id: "drag-constraints",
    title: "Keep a drag inside an area",
    body: `\`dragConstraints\` limits where the content can go:

- **A box:** pixels from where the content sits, such as \`{ left: -100, right: 100 }\`. In HTML, write it as JSON.
- **An element:** the content stays inside that element's box. In React, pass a ref or the element's \`id\`. In HTML, write the \`id\`.

\`dragElastic\` sets how far it can be pulled past the limits before it springs back: from \`0\` (not at all) to \`1\` (freely). The default is \`0.5\`. A number per side, such as \`{ left: 0, right: 0.5 }\`, also works. \`dragTransition\` tunes the glide after a release, such as \`power\` (how far it travels) and \`timeConstant\` (how long it slows down, in milliseconds).`,
    html: `<div id="board" data-ok-paper data-ok-variant="outlined">
  <div data-ok-motion data-ok-trigger="mount" data-ok-drag
    data-ok-drag-constraints="board" data-ok-drag-elastic="0.2"
    tabindex="0" role="group" aria-label="Sticky note">
    <p>Sticky note</p>
  </div>
</div>`,
    react: `import { Motion, Paper } from "@owlky/react";
import { useRef } from "react";

export function Board() {
  const board = useRef<HTMLElement>(null);
  return (
    <Paper ref={board} variant="outlined">
      <Motion
        trigger="mount"
        drag
        dragConstraints={board}
        dragElastic={0.2}
        tabIndex={0}
        role="group"
        aria-label="Sticky note"
      >
        <p>Sticky note</p>
      </Motion>
    </Paper>
  );
}`,
  },
  {
    id: "gestures",
    title: "React to hover, press and focus",
    body: `\`whileHover\`, \`whileTap\` and \`whileFocus\` take keyframes that play while the pointer is over the content, while it is pressed, and while it shows a keyboard focus ring. When the gesture ends, the content goes back to its own style.

- **Springs:** moves, turns and scales use a spring by default. \`transition\` changes it for every gesture, and a \`transition\` key inside one state changes it for that state only.
- **Keyboard:** a press also answers Enter and Space on the Motion or on a button inside it.
- **Touch:** hover states only follow a mouse or a pen, so a tap never leaves one behind.
- **Events:** \`onHoverStart\`, \`onHoverEnd\`, \`onTapStart\`, \`onTap\` and \`onTapCancel\` (HTML: \`ok:motion:hoverstart\` and the matching names).

With reduced motion, the states apply at once, without a bounce.`,
    html: `<div data-ok-motion data-ok-trigger="mount"
  data-ok-while-hover='{"scale": 1.05}'
  data-ok-while-tap='{"scale": 0.95}'
  data-ok-transition='{"type": "spring", "duration": 300, "bounce": 0.4}'>
  <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md">
    <span data-ok-button-label>Subscribe</span>
  </button>
</div>`,
    react: `import { Button, Motion } from "@owlky/react";

export function Subscribe() {
  return (
    <Motion
      trigger="mount"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", duration: 300, bounce: 0.4 }}
    >
      <Button variant="contained" color="primary">
        Subscribe
      </Button>
    </Motion>
  );
}`,
  },
  {
    id: "layout",
    title: "Animate layout changes",
    body: `Add \`layout\` to a Motion to animate it to its new place and size whenever the page around it changes: a list that is sorted, a card that grows, an item that is removed. Owlky measures the Motion before and after the change and plays the difference with a transform, so the page itself changes at once and stays correct.

- **What moves:** \`layout\` animates the position and the size. \`"position"\` animates only the position (the size changes at once), and \`"size"\` only the size.
- **Timing:** \`transition\` sets the timing, and a \`layout\` key inside it sets the timing of layout animations only, such as \`{ layout: { type: "spring", bounce: 0.2 } }\`.
- **When it measures:** in React, each time the Motion renders. Set \`layoutDependency\` to a value to measure only when that value changes. In HTML, the script watches the page: any change inside the Motion's parent animates it. For changes that leave the page untouched, such as a new stylesheet, call \`measure()\` before and \`animateLayout()\` after.
- **No entrance:** \`initial={false}\` (HTML: \`data-ok-initial="false"\`) shows the content as it is instead of playing an entrance.
- **Events:** \`onLayoutAnimationStart\` and \`onLayoutAnimationComplete\` (HTML: \`ok:motion:layoutanimationstart\` and \`ok:motion:layoutanimationcomplete\`).

A growing Motion stretches its content while it animates. A Motion with \`layout\` inside it keeps its own shape, so wrap text in one with \`layout="position"\`. Rounded corners in pixels keep their shape too. Owlky never moves the elements themselves, so a focused button keeps the focus when its item moves. With reduced motion, the content jumps to its new place.`,
    html: `<ul id="tasks">
  <li data-ok-motion data-ok-initial="false" data-ok-layout>Write the brief</li>
  <li data-ok-motion data-ok-initial="false" data-ok-layout>Review the design</li>
  <li data-ok-motion data-ok-initial="false" data-ok-layout>Ship the release</li>
</ul>
<button type="button" id="last-first" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md">
  <span data-ok-button-label>Move the last task to the top</span>
</button>

<script>
  document.getElementById("last-first").addEventListener("click", () => {
    const tasks = document.getElementById("tasks");
    // The script sees the move and animates every task to its new place
    tasks.prepend(tasks.lastElementChild);
  });
</script>`,
    react: `import { Button, Motion } from "@owlky/react";
import { useState } from "react";

export function Tasks() {
  const [tasks, setTasks] = useState(["Write the brief", "Review the design", "Ship the release"]);
  const lastFirst = () => setTasks((list) => [...list.slice(-1), ...list.slice(0, -1)]);
  return (
    <>
      <ul>
        {tasks.map((task) => (
          <Motion key={task} component="li" layout initial={false}>
            {task}
          </Motion>
        ))}
      </ul>
      <Button variant="outlined" color="inherit" onClick={lastFirst}>
        Move the last task to the top
      </Button>
    </>
  );
}`,
  },
  {
    id: "layout-id",
    title: "Move one element between places",
    body: `Give Motions in different places the same \`layoutId\` to make them one element on screen. When one with that id appears as another one leaves, such as the highlight of a selected button, the new one starts from the old one's place and size and moves to its own. In HTML, moving the element itself into its new place does the same.

Use \`initial={false}\` on these Motions, so the new one moves instead of playing an entrance. Pair the move with a state that assistive technology reads, such as \`aria-pressed\` or \`aria-selected\`: the highlight itself is decorative.`,
    html: `<div role="group" aria-label="Billing period" id="periods">
  <button type="button" aria-pressed="true" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md">
    <span data-ok-button-label><span data-ok-motion data-ok-initial="false" data-ok-layout-id="billing" aria-hidden="true" class="highlight"></span>Monthly</span>
  </button>
  <button type="button" aria-pressed="false" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md">
    <span data-ok-button-label>Yearly</span>
  </button>
</div>

<script>
  const periods = document.getElementById("periods");
  periods.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    for (const other of periods.querySelectorAll("button")) {
      other.setAttribute("aria-pressed", String(other === button));
    }
    // The highlight moves into the pressed button, from where it was
    button.querySelector("[data-ok-button-label]").prepend(periods.querySelector(".highlight"));
  });
</script>`,
    react: `import { Button, Motion } from "@owlky/react";
import { useState } from "react";

const periods = ["Monthly", "Yearly"];

// .highlight { position: absolute; inset: 0; z-index: -1; } comes from your CSS
export function BillingPeriod() {
  const [selected, setSelected] = useState("Monthly");
  return (
    <div role="group" aria-label="Billing period">
      {periods.map((period) => (
        <Button
          key={period}
          color="inherit"
          aria-pressed={period === selected}
          onClick={() => setSelected(period)}
        >
          {period === selected ? (
            <Motion
              component="span"
              className="highlight"
              layoutId="billing"
              initial={false}
              aria-hidden="true"
            />
          ) : null}
          {period}
        </Button>
      ))}
    </div>
  );
}`,
  },
  {
    id: "layout-group",
    title: "Animate siblings together",
    body: `In React, a Motion measures itself when it renders. Siblings that move because of it, but don't render themselves, jump to their new place. Wrap them in \`LayoutGroup\`: when one Motion inside it renders, all of them are measured, and they move together. Its \`id\` keeps the \`layoutId\`s of two groups apart.

In HTML, Motions with the same parent already move together. For Motions in different containers, such as the columns of a board, put \`data-ok-layout-group\` on a container around them.

In \`MotionPresence\`, \`mode="popLayout"\` takes a leaving child out of the layout while it exits, so the Motions with \`layout\` around it move into its place at once. The child's Motion must be its root element, and its parent must be positioned, such as with \`position: relative\`.`,
    html: `<div data-ok-layout-group="board" class="board">
  <ul aria-label="To do">
    <li data-ok-motion data-ok-initial="false" data-ok-layout>Write the brief</li>
  </ul>
  <ul aria-label="Done">
    <li data-ok-motion data-ok-initial="false" data-ok-layout>Ship the release</li>
  </ul>
</div>`,
    react: `import { LayoutGroup, Motion } from "@owlky/react";
import { useState } from "react";

function Question({ title, answer }: { title: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Motion layout initial={false}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}
      </button>
      {open ? <p>{answer}</p> : null}
    </Motion>
  );
}

export function Questions() {
  return (
    <LayoutGroup>
      <Question title="Can I cancel at any time?" answer="Yes, at the end of any month." />
      <Question title="Where is my data stored?" answer="In the region you pick." />
    </LayoutGroup>
  );
}`,
  },
  {
    id: "shared-values",
    title: "Share values without re-rendering",
    body: `A shared value holds a number or a string that changes often, such as a position, and tells its listeners when it changes, without rendering a component again. Import them from \`@owlky/react\` or \`@owlky/html\`.

- **Create:** \`useMotionValue(initial)\` in React, \`motionValue(initial)\` in HTML. Read it with \`get()\`, change it with \`set()\`, and listen with \`on("change", callback)\` (React: \`useMotionValueEvent\`).
- **Derive:** \`useTransform\` (HTML: \`transformValue\`) computes a value from others, with a function or by mapping ranges, such as \`[0, 100]\` to \`[1, 0]\`.
- **Smooth:** \`useSpring\` (HTML: \`springValue\`) follows another value, or the target you \`set()\`, with a spring.
- **Draw:** pass shared values in a Motion's \`style\`, such as \`style={{ x, opacity }}\`. In HTML, \`bindStyle(element, "x", value)\` does the same. \`x\` and \`y\` are pixels and \`rotate\` is degrees.

With reduced motion, springs jump to their target.`,
    html: `<input type="range" id="amount" min="0" max="100" value="0" aria-label="Amount">
<div id="bar" class="bar"></div>

<script type="module">
  import { bindStyle, motionValue, springValue, transformValue } from "@owlky/html";

  const amount = motionValue(0);
  const smooth = springValue(amount, { stiffness: 300, damping: 30 });
  const opacity = transformValue(smooth, [0, 100], [0.4, 1]);
  const bar = document.getElementById("bar");
  bindStyle(bar, "x", smooth);
  bindStyle(bar, "opacity", opacity);
  document.getElementById("amount").addEventListener("input", (event) => {
    amount.set(Number(event.target.value));
  });
</script>`,
    react: `import { Motion, useMotionValue, useSpring, useTransform } from "@owlky/react";

export function Amount() {
  const amount = useMotionValue(0);
  const smooth = useSpring(amount, { stiffness: 300, damping: 30 });
  const opacity = useTransform(smooth, [0, 100], [0.4, 1]);
  return (
    <>
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={0}
        aria-label="Amount"
        onChange={(event) => amount.set(Number(event.target.value))}
      />
      <Motion trigger="mount" className="bar" style={{ x: smooth, opacity }} />
    </>
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
    body: "These props aren't options, because HTML writes them as markup or reads them from the page.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:motion:end\`** fires on a Motion when its animation ends, with the state in \`detail.state\`: \`enter\` or \`exit\`.
- **\`ok:motion:enter\` and \`ok:motion:leave\`** fire on a Motion with the \`inView\` trigger when it enters or leaves the view, with the visible fraction in \`detail.ratio\`. MotionGroup and MotionText fire \`ok:motion-group:enter\`, \`ok:motion-text:enter\` and the matching \`leave\` events. A Motion inside a group fires none: the group reports for it.
- **Instance:** \`runtime.get(element, "motion")\` returns \`{ state, replay(), exit(), hide(), remove(), measure(), animateLayout() }\`. \`replay()\` plays the entrance again. \`exit()\` plays the exit, and \`hide()\` and \`remove()\` then hide or remove the element. Each of these three returns a promise that resolves to \`true\` when the exit ended, or \`false\` when \`replay()\` interrupted it. \`measure()\` and \`animateLayout()\` animate a layout change the script can't see. MotionGroup (\`"motion-group"\`) and MotionText (\`"motion-text"\`) have \`{ state, replay() }\`.
- **\`ok:countdown:tick\`** fires on a Countdown each time its value changes, with the whole seconds left in \`detail.remaining\`. **\`ok:countdown:complete\`** fires once when it reaches 0. \`runtime.get(element, "countdown")\` returns \`{ remaining, paused, pause(), resume(), restart() }\`. In React, use \`onTick\` and \`onComplete\`, and change the \`key\` to start over.
- **Gestures:** \`ok:motion:dragstart\`, \`ok:motion:drag\` and \`ok:motion:dragend\` carry \`point\`, \`delta\`, \`offset\` and \`velocity\` in \`detail\`. \`ok:motion:directionlock\` carries the locked \`axis\`, and \`ok:motion:dragtransitionend\` fires when the glide after a release stops. \`ok:motion:hoverstart\` and \`ok:motion:hoverend\` follow the pointer, and \`ok:motion:tapstart\`, \`ok:motion:tap\` and \`ok:motion:tapcancel\` follow a press, with its \`point\`.
- **Layout:** \`ok:motion:layoutanimationstart\` and \`ok:motion:layoutanimationcomplete\` fire when a layout animation of the Motion starts and ends. An animation that another one interrupts doesn't fire \`layoutanimationcomplete\`.
- **React:** use \`onAnimationEnd\`, \`onViewportEnter\` and \`onViewportLeave\` (they receive the \`IntersectionObserverEntry\`), and change the \`key\` to play the entrance again. Gesture callbacks receive the event first, then the information, such as \`onDrag(event, info)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: `Motion isn't interactive, except for its gestures. Links and buttons inside it work as usual, also while they move.

- **Arrow keys:** move a draggable Motion that has the focus by 10 pixels. Hold Shift to move it by 50 pixels.
- **Enter and Space:** press a Motion with \`whileTap\` when it, or a button inside it, has the focus.`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Content never depends on the animation: without the script, it shows, and with reduced motion it appears at once.
- Looping animations, turning borders and looping keyframes stop with reduced motion. Provide a pause control for them anyway (WCAG 2.2.2). Other keyframes and \`animate()\` jump to their end.
- CountUp exposes its end value to assistive technologies, and hides the changing digits.
- Countdown has the \`timer\` role, which isn't announced as it changes. A visually hidden status region announces the time left at each whole hour while an hour or more is left, at each whole minute while a minute or more is left, at 30 and 10 seconds, and at the end. Announcing every second would keep screen readers from reading anything else. Name the countdown with \`aria-label\`, and give people a pause control when it runs next to other content (WCAG 2.2.2).
- MotionText keeps the text readable: assistive technologies read a visually hidden copy, and the letters are hidden from them.
- Avoid animations on content that people need to read right away, such as errors.
- Dragging needs a pointer. Anything a drag does needs another way that works with a keyboard or a single tap (WCAG 2.5.7 and 2.1.1), such as the arrow keys on a focusable draggable Motion, or buttons. Give a draggable Motion a name and a visible hint.
- Owlky doesn't make content focusable for you: put \`whileTap\` on content around a button, or make it focusable yourself.
- Hover states only decorate. Never put information in them that a touch screen can't show.
- Directional animations start outside the content's box. Clip the container (\`overflow: clip\`) if they would widen the page on small screens.`,
  },
  apiReferenceSection(motionApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Motion variant="fadeInUp" trigger="mount">
        <strong>Plans for every team</strong>
      </Motion>
    </Preview>
  ),
  group: () => (
    <Preview>
      <MotionGroup trigger="mount" stagger={80}>
        <Motion variant="slideInUp">Design</Motion>
        <Motion variant="slideInUp">Develop</Motion>
        <Motion variant="slideInUp">Release</Motion>
      </MotionGroup>
    </Preview>
  ),
  text: () => (
    <Preview>
      <strong>
        <MotionText variant="fadeInUp" trigger="mount">
          Owlky moves
        </MotionText>
      </strong>
    </Preview>
  ),
  component: () => (
    <Preview>
      <MotionGroup component="ul" trigger="mount">
        <Motion component="li" variant="fadeInLeft">
          Design
        </Motion>
        <Motion component="li" variant="fadeInLeft">
          Develop
        </Motion>
      </MotionGroup>
    </Preview>
  ),
  "count-up": () => (
    <Preview>
      <strong>
        <CountUp end={200} suffix="k" trigger="mount" />
      </strong>
    </Preview>
  ),
  countdown: () => (
    <Preview>
      <Countdown
        aria-label="Time until the launch"
        date="2027-01-01T00:00:00Z"
        now="2026-11-09T09:30:15Z"
      />
    </Preview>
  ),
  keyframes: () => (
    <Preview>
      <Motion
        trigger="mount"
        className="sb-motion-logo-ring sb-motion-logo-ring-preview"
        keyframes={{ rotate: [0, 270, 270, 0], borderRadius: ["25%", "50%", "50%", "25%"] }}
        transition={{ duration: 3200, ease: "linear", repeat: Infinity }}
      />
    </Preview>
  ),
  spring: () => (
    <Preview>
      <Motion
        trigger="mount"
        keyframes={{ y: [40, 0], opacity: [0, 1] }}
        transition={{ type: "spring", duration: 500, bounce: 0.4 }}
      >
        <p>Your order is on its way.</p>
      </Motion>
    </Preview>
  ),
  border: () => (
    <Preview>
      <div className="sb-row">
        <MotionBorder color="primary" secondaryColor="warning" className="sb-motion-tile" />
        <MotionBorder
          color="secondary"
          width={4}
          className="sb-motion-tile sb-motion-edges-top-left"
        />
      </div>
    </Preview>
  ),
  gestures: () => (
    <Preview>
      <Motion
        trigger="mount"
        className="sb-gesture-press"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", duration: 300, bounce: 0.4 }}
      >
        <Button variant="contained" color="primary">
          Subscribe
        </Button>
      </Motion>
    </Preview>
  ),
  drag: () => (
    <Preview>
      <Motion
        trigger="mount"
        className="sb-gesture-item"
        drag
        dragConstraints={{ left: -80, right: 80, top: -20, bottom: 20 }}
        whileDrag={{ scale: 1.05 }}
        tabIndex={0}
        role="group"
        aria-label="Movable note"
      >
        <Card className="sb-motion-card">
          <Typography variant="subtitle2">Drag me</Typography>
        </Card>
      </Motion>
    </Preview>
  ),
  layout: () => (
    <Preview>
      <LayoutReorderDemo />
    </Preview>
  ),
  "layout-id": () => (
    <Preview>
      <LayoutHighlightDemo />
    </Preview>
  ),
  "layout-group": () => (
    <Preview>
      <LayoutExpandDemo />
    </Preview>
  ),
  "shared-values": () => (
    <Preview>
      <AmountPreview />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={motionOptions} />
      <OptionsTable schema={motionGroupOptions} />
      <OptionsTable schema={motionTextOptions} />
      <OptionsTable schema={countUpOptions} />
      <OptionsTable schema={countdownOptions} />
      <OptionsTable schema={motionBorderOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Motion content and behavior"
      rows={[
        {
          react: "children",
          html: "content",
          type: "ReactNode",
          description: "What moves. MotionText takes a string.",
        },
        {
          react: "component",
          html: "the element",
          type: "ElementType",
          description: "The element to render. Default: a `div` (MotionText: a `span`).",
        },
        {
          react: "keyframes",
          html: "data-ok-keyframes",
          type: "object · JSON",
          description: "Your own keyframes, played instead of the variant.",
        },
        {
          react: "transition",
          html: "data-ok-transition",
          type: "object · JSON",
          description: "How the keyframes play: timing, repeats or a spring.",
        },
        {
          react: "viewportMargin",
          html: "data-ok-viewport-margin",
          type: "string",
          description: "In view: grows or shrinks the view, like CSS margins in px or %.",
        },
        {
          react: "viewportRoot",
          html: "data-ok-viewport-root",
          type: "RefObject<Element> · id",
          description: "In view: the scrolling container used as the view.",
        },
        {
          react: "onViewportEnter",
          html: "ok:motion:enter",
          type: "event",
          description: "The content entered the view.",
        },
        {
          react: "onViewportLeave",
          html: "ok:motion:leave",
          type: "event",
          description: "The content left the view (with `once` off).",
        },
        {
          react: "onAnimationEnd",
          html: "ok:motion:end",
          type: "event",
          description: "The entrance or the exit ended.",
        },
        {
          react: "drag",
          html: "data-ok-drag",
          type: 'boolean · "x" · "y"',
          description: "Makes it draggable on both axes, or on one.",
        },
        {
          react: "dragConstraints",
          html: "data-ok-drag-constraints",
          type: "object · RefObject · id",
          description: "A box in pixels, or an element to stay inside.",
        },
        {
          react: "dragElastic",
          html: "data-ok-drag-elastic",
          type: "number · boolean · object",
          description: "How far it can be pulled past its constraints, 0 to 1. Default `0.5`.",
        },
        {
          react: "dragMomentum",
          html: "data-ok-drag-momentum",
          type: "boolean",
          description: 'Glides on after a release. Default `true` (HTML: `"false"` turns it off).',
        },
        {
          react: "dragSnapToOrigin",
          html: "data-ok-drag-snap-to-origin",
          type: "boolean",
          description: "Springs back to where it started when released.",
        },
        {
          react: "dragDirectionLock",
          html: "data-ok-drag-direction-lock",
          type: "boolean",
          description: "Moves only along the first axis the pointer moves on.",
        },
        {
          react: "dragTransition",
          html: "data-ok-drag-transition",
          type: "object · JSON",
          description: "The glide after a release, such as `power` and `timeConstant`.",
        },
        {
          react: "whileHover",
          html: "data-ok-while-hover",
          type: "object · JSON",
          description: "Keyframes while a mouse or pen pointer is over it.",
        },
        {
          react: "whileTap",
          html: "data-ok-while-tap",
          type: "object · JSON",
          description: "Keyframes while it is pressed, also with Enter or Space.",
        },
        {
          react: "whileFocus",
          html: "data-ok-while-focus",
          type: "object · JSON",
          description: "Keyframes while it shows a keyboard focus ring.",
        },
        {
          react: "whileDrag",
          html: "data-ok-while-drag",
          type: "object · JSON",
          description: "Keyframes while it is dragged.",
        },
        {
          react: "onDragStart, onDrag, onDragEnd",
          html: "ok:motion:dragstart, drag, dragend",
          type: "event",
          description: "A drag started, moved or ended, with the pointer's offset and velocity.",
        },
        {
          react: "onHoverStart, onHoverEnd",
          html: "ok:motion:hoverstart, hoverend",
          type: "event",
          description: "A mouse or pen pointer entered or left it.",
        },
        {
          react: "onTapStart, onTap, onTapCancel",
          html: "ok:motion:tapstart, tap, tapcancel",
          type: "event",
          description: "A press started, ended on it, or ended elsewhere.",
        },
        {
          react: "layout",
          html: "data-ok-layout",
          type: 'boolean · "position" · "size"',
          description: "Animates changes of its position and size.",
        },
        {
          react: "layoutId",
          html: "data-ok-layout-id",
          type: "string",
          description: "One element on screen: a new Motion with the id moves from the old one.",
        },
        {
          react: "layoutDependency",
          html: "measure(), animateLayout()",
          type: "any · methods",
          description:
            "React: measures only when the value changes. HTML: changes the script can't see.",
        },
        {
          react: "LayoutGroup",
          html: "data-ok-layout-group",
          type: "component · id",
          description: "Motions that animate together. Its `id` keeps `layoutId`s apart.",
        },
        {
          react: "onLayoutAnimationStart, onLayoutAnimationComplete",
          html: "ok:motion:layoutanimationstart, layoutanimationcomplete",
          type: "event",
          description: "A layout animation started or ended.",
        },
        {
          react: "style",
          html: "bindStyle()",
          type: "object · function",
          description: "Shared values and the shorthands `x`, `y`, `scale` and `rotate`.",
        },
        {
          react: "key",
          html: "replay()",
          type: "—",
          description: "Plays the entrance again.",
        },
        {
          react: "date",
          html: "data-ok-date",
          type: "Date · string · number",
          description: "Countdown: the time to count down to. Wins over `seconds`.",
        },
        {
          react: "now",
          html: "data-ok-now",
          type: "Date · string · number",
          description: "Countdown: the time of the first render. The clock runs from it.",
        },
        {
          react: "labels",
          html: "data-ok-countdown-label",
          type: "object · text",
          description: "Countdown: the unit names. Default `days`, `hours`, `minutes`, `seconds`.",
        },
        {
          react: "completeLabel",
          html: "data-ok-complete-label",
          type: "string",
          description: 'Countdown: announced at the end. Default "Time\'s up".',
        },
        {
          react: "onTick",
          html: "ok:countdown:tick",
          type: "event",
          description: "Countdown: the value changed, with the whole seconds left.",
        },
        {
          react: "onComplete",
          html: "ok:countdown:complete",
          type: "event",
          description: "Countdown: it reached 0.",
        },
      ]}
    />
  ),
};

/** Shared values: a range input drives a bar through a spring. */
function AmountPreview() {
  const amount = useMotionValue(0);
  const smooth = useSpring(amount, { stiffness: 300, damping: 30 });
  const opacity = useTransform(smooth, [0, 100], [0.4, 1]);
  return (
    <div className="sb-layout-amount">
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={0}
        aria-label="Amount"
        onChange={(event) => amount.set(Number(event.target.value))}
      />
      <Motion trigger="mount" initial={false} style={{ x: smooth, opacity }}>
        <Paper className="sb-layout-amount-bar" elevation={2} />
      </Motion>
    </div>
  );
}

/** Motion docs page (ADR-0019). */
export function MotionDocs() {
  return <GuideDocs sections={motionSections} previews={PREVIEWS} />;
}
