import {
  countUpOptions,
  motionBorderOptions,
  motionGroupOptions,
  motionOptions,
  motionTextOptions,
} from "@owlky/core";
import motionApi from "@owlky/docs-content/api/motion.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CountUp, Motion, MotionBorder, MotionGroup, MotionText } from "@owlky/react";
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
    html: `<div data-ok-motion data-ok-variant="zoomInLeft" data-ok-duration="800" data-ok-distance="80">…</div>`,
    react: `import { Motion } from "@owlky/react";

export function MotionVariants() {
  return (
    <Motion variant="zoomInLeft" duration={800} distance={80}>…</Motion>
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
    id: "dialog",
    title: "Animate a dialog",
    body: "Set `transition` on a Dialog to open its paper with a Motion entrance, such as `slideInUp` or `zoomIn`. Without it, the paper fades and scales in briefly.",
    html: `<dialog id="share" data-ok-dialog data-ok-max-width="sm" aria-labelledby="share-title">
  <div data-ok-dialog-paper data-ok-motion data-ok-variant="slideInUp" data-ok-trigger="mount">
    <h2 id="share-title" data-ok-dialog-title>Share your location?</h2>
    …
  </div>
</dialog>`,
    react: `import { Dialog } from "@owlky/react";

export function MotionDialog() {
  return (
    <Dialog open={open} onOpenChange={setOpen} transition="slideInUp">…</Dialog>
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
    react: `import { Motion } from "@owlky/react";

export function MotionPause() {
  return (
    <Motion variant="kenburnsTop" paused={paused}>
      <img src="hero.jpg" alt="Mountain lake at sunrise" />
    </Motion>
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
- **Instance:** \`runtime.get(element, "motion")\` returns \`{ state, replay() }\`. MotionGroup (\`"motion-group"\`) and MotionText (\`"motion-text"\`) have the same instance. \`replay()\` plays the entrance again.
- **React:** use \`onAnimationEnd\`, and change the \`key\` to play the entrance again.`,
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
  "count-up": () => (
    <Preview>
      <strong>
        <CountUp end={200} suffix="k" trigger="mount" />
      </strong>
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
      ]}
    />
  ),
};

/** Motion docs page (ADR-0019). */
export function MotionDocs() {
  return <GuideDocs sections={motionSections} previews={PREVIEWS} />;
}
