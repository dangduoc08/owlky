import { collapseOptions } from "@owlky/core";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { CollapseDemo } from "./collapse-demo.js";

export const collapseSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A collapse shows or hides its content by animating its height from 0 to the height of the content. Use it for content that opens in place, such as a nested list, the details of a row or an advanced section of a form. The element carries `hidden` while it is closed, so the content is hidden even before JavaScript runs. In the example, the switch opens four collapses: two animate their height and two their width, with and without a collapsed size.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<label data-ok-form-control-label data-ok-label-placement="end">
  <span data-ok-switch data-ok-color="primary" data-ok-size="medium">
    <!-- The switch opens the collapse while it is checked -->
    <input type="checkbox" role="switch" data-ok-switch-input data-ok-collapse-toggle="details">
    <span data-ok-switch-track aria-hidden="true"></span>
    <span data-ok-switch-thumb aria-hidden="true"></span>
  </span>
  <span data-ok-form-control-label-text>Show details</span>
</label>
<div id="details" data-ok-collapse hidden>
  <p>Shipping takes two to four working days.</p>
</div>`,
    react: `import { Collapse, FormControlLabel, Switch } from "@owlky/react";
import { useState } from "react";

export function Details() {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <FormControlLabel
        control={<Switch checked={checked} onChange={setChecked} />}
        label="Show details"
      />
      <Collapse in={checked}>
        <p>Shipping takes two to four working days.</p>
      </Collapse>
    </>
  );
}`,
  },
  {
    id: "toggle",
    title: "Open and close a collapse",
    body: `A collapse is open while it has no \`hidden\` attribute. Change that state, and the collapse animates to it.

- **HTML:** give a checkbox or a switch \`data-ok-collapse-toggle\` with the collapse's \`id\`: the collapse is open while the box is checked. On a button, the attribute toggles the collapse and keeps \`aria-expanded\` on the button up to date. One trigger can name several collapses, separated by spaces. You can also call \`show()\`, \`hide()\` or \`toggle()\` on the instance, or set \`hidden\` yourself.
- **React:** set \`in\` from your state. Give the button that opens it \`aria-expanded\` and \`aria-controls\` with the collapse's \`id\`.`,
    html: `<button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md"
  aria-expanded="false" aria-controls="advanced" data-ok-collapse-toggle="advanced">
  <span data-ok-button-label>Advanced settings</span>
</button>
<div id="advanced" data-ok-collapse hidden>
  <p>Proxy, cache and logging settings.</p>
</div>`,
    react: `import { Button, Collapse } from "@owlky/react";
import { useState } from "react";

export function AdvancedSettings() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button aria-expanded={open} aria-controls="advanced" onClick={() => setOpen(!open)}>
        Advanced settings
      </Button>
      <Collapse id="advanced" in={open}>
        <p>Proxy, cache and logging settings.</p>
      </Collapse>
    </>
  );
}`,
  },
  {
    id: "orientation",
    title: "Collapse horizontally or to a size",
    body: "Set `orientation` to `horizontal` to animate the width instead of the height. Its children sit in a row and keep their width while it animates. Set `collapsedSize` to keep part of the content visible while the collapse is closed, such as the first 40px of a long text. It takes a number in pixels or a CSS length, such as `2.5rem`. Content in the visible part stays reachable, so don't hide controls there.",
    html: `<div id="preview" data-ok-collapse data-ok-collapsed-size="40" hidden>
  <p>The first lines of the article stay visible while the collapse is closed.</p>
</div>
<div id="panel" data-ok-collapse data-ok-orientation="horizontal" hidden>
  <nav aria-label="Filters">Filters</nav>
</div>`,
    react: `import { Collapse } from "@owlky/react";

export function Article({ expanded }: { expanded: boolean }) {
  return (
    <Collapse in={expanded} collapsedSize={40}>
      <p>The first lines of the article stay visible while the collapse is closed.</p>
    </Collapse>
  );
}`,
  },
  {
    id: "timing",
    title: "Set the duration and the easing",
    body: "By default, a collapse animates over 300 ms (`--ok-duration-standard`) with the standard easing (`--ok-easing-standard`). Set `timeout` to a number of milliseconds, or to `auto` to derive the duration from the distance: about 300 ms for 120px and longer for tall content. Set `easing` to any CSS easing, such as `var(--ok-easing-decelerate)`. In React, `timeout` and `easing` also take `{ enter, exit }`; in HTML, add `data-ok-timeout-exit` and `data-ok-easing-exit`. When people turn on reduced motion in their system settings, a collapse opens and closes at once. Set `disablePrefersReducedMotion` only for an animation that carries meaning.",
    html: `<div id="faq" data-ok-collapse data-ok-timeout="auto" data-ok-easing="var(--ok-easing-decelerate)" hidden>
  <p>Answers open with a duration that follows their height.</p>
</div>`,
    react: `import { Collapse } from "@owlky/react";

export function Answer({ open }: { open: boolean }) {
  return (
    <Collapse in={open} timeout="auto" easing={{ enter: "var(--ok-easing-decelerate)", exit: "var(--ok-easing-accelerate)" }}>
      <p>Answers open with a duration that follows their height.</p>
    </Collapse>
  );
}`,
  },
  {
    id: "compose",
    title: "Collapse another component",
    body: "A collapse can be another element instead of a `div`, so it adds no wrapper. In React, pass the element or the component in `component`, along with that component's props. In HTML, add `data-ok-collapse` to the element itself. Lists use it for nested lists, tree views for the groups of child items, and vertical steppers for the content of each step. Put padding and borders on a child of the collapse, not on the collapse itself: they stay visible while it is closed. In React, `mountOnEnter` renders the children only once the collapse first opens, and `unmountOnExit` removes them once it has closed.",
    html: `<ul id="inbox-folders" data-ok-collapse data-ok-timeout="auto" data-ok-list data-ok-disable-padding>
  <li data-ok-list-item>Starred</li>
</ul>`,
    react: `import { Collapse, List, ListItem } from "@owlky/react";

export function Folders({ open }: { open: boolean }) {
  return (
    <Collapse component={List} id="inbox-folders" in={open} timeout="auto" disablePadding>
      <ListItem>Starred</ListItem>
    </Collapse>
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
    body: "These props set the content, the timing and the rendering. Some are React only, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:collapse:enter\`**, **\`ok:collapse:entering\`** and **\`ok:collapse:entered\`** fire on the collapse as it opens: before the animation, when it starts and when it ends.
- **\`ok:collapse:exit\`**, **\`ok:collapse:exiting\`** and **\`ok:collapse:exited\`** fire the same way as it closes. \`detail.in\` tells whether it is open.
- **Instance:** \`runtime.get(element, "collapse")\` returns \`{ in, status, show(), hide(), toggle(force?) }\`. \`status\` is \`entering\`, \`entered\`, \`exiting\` or \`exited\`.
- **React:** \`onEnter\`, \`onEntering\`, \`onEntered\`, \`onExit\`, \`onExiting\` and \`onExited\` get the element.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "A collapse has no keyboard interaction. The button or switch that opens it handles the keys: Enter and Space on a button, Space on a switch.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A closed collapse carries \`hidden\`, so screen readers skip its content and Tab doesn't reach it. A collapsed size is the exception: the visible part stays reachable.
- Give the button that opens a collapse \`aria-expanded\` and \`aria-controls\` with the collapse's \`id\`. The HTML trigger keeps \`aria-expanded\` up to date on buttons.
- The animation honors the reduced motion setting: the collapse opens and closes at once.
- When content opens below the button, focus stays on the button. Move focus into the content only when people asked for it, such as after a search.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <CollapseDemo id="docs-collapse" />
    </Preview>
  ),
  options: () => <OptionsTable schema={collapseOptions} />,
  props: () => (
    <PropsTable
      label="Collapse content props"
      rows={[
        {
          react: "children",
          html: "content of data-ok-collapse",
          type: "ReactNode",
          description: "The content that opens and closes.",
        },
        {
          react: "component",
          html: "the element that carries data-ok-collapse",
          type: "ElementType",
          description: "The element or component to render. Default `div`.",
        },
        {
          react: "timeout",
          html: "data-ok-timeout / data-ok-timeout-exit",
          type: 'number | "auto" | { enter, exit }',
          description: "Duration in milliseconds, or `auto` from the distance.",
        },
        {
          react: "easing",
          html: "data-ok-easing / data-ok-easing-exit",
          type: "string | { enter, exit }",
          description: "A CSS easing. Default `--ok-easing-standard`.",
        },
        {
          react: "mountOnEnter",
          html: "—",
          type: "boolean",
          description: "Renders the children only once the collapse first opens.",
        },
        {
          react: "unmountOnExit",
          html: "—",
          type: "boolean",
          description: "Removes the children once the collapse has closed.",
        },
        {
          react: "onEnter … onExited",
          html: "ok:collapse:enter … ok:collapse:exited",
          type: "(element) => void",
          description: "Report each phase of the animation.",
        },
      ]}
    />
  ),
};

/** Collapse docs page (ADR-0019). */
export function CollapseDocs() {
  return <GuideDocs sections={collapseSections} previews={PREVIEWS} />;
}
