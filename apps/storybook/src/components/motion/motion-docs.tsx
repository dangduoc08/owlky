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
import { Countdown, CountUp, Motion, MotionBorder, MotionGroup, MotionText } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

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
    body: "Set `transition` on a Dialog to open its paper with a Motion entrance, such as `slideInUp` or `zoomIn`. Without it, the paper fades and scales in briefly.",
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
- **Instance:** \`runtime.get(element, "motion")\` returns \`{ state, replay() }\`. MotionGroup (\`"motion-group"\`) and MotionText (\`"motion-text"\`) have the same instance. \`replay()\` plays the entrance again.
- **\`ok:countdown:tick\`** fires on a Countdown each time its value changes, with the whole seconds left in \`detail.remaining\`. **\`ok:countdown:complete\`** fires once when it reaches 0. \`runtime.get(element, "countdown")\` returns \`{ remaining, paused, pause(), resume(), restart() }\`. In React, use \`onTick\` and \`onComplete\`, and change the \`key\` to start over.
- **React:** use \`onAnimationEnd\`, \`onViewportEnter\` and \`onViewportLeave\` (they receive the \`IntersectionObserverEntry\`), and change the \`key\` to play the entrance again.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Motion isn't interactive. Links and buttons inside it work as usual, also while they move.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Content never depends on the animation: without the script, it shows, and with reduced motion it appears at once.
- Looping animations and turning borders stop with reduced motion. Provide a pause control for them anyway (WCAG 2.2.2).
- CountUp exposes its end value to assistive technologies, and hides the changing digits.
- Countdown has the \`timer\` role, which isn't announced as it changes. A visually hidden status region announces the time left at each whole hour while an hour or more is left, at each whole minute while a minute or more is left, at 30 and 10 seconds, and at the end. Announcing every second would keep screen readers from reading anything else. Name the countdown with \`aria-label\`, and give people a pause control when it runs next to other content (WCAG 2.2.2).
- MotionText keeps the text readable: assistive technologies read a visually hidden copy, and the letters are hidden from them.
- Avoid animations on content that people need to read right away, such as errors.
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

/** Motion docs page (ADR-0019). */
export function MotionDocs() {
  return <GuideDocs sections={motionSections} previews={PREVIEWS} />;
}
