import { popoverOptions } from "@owlky/core";
import popoverApi from "@owlky/docs-content/api/popover.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { ClickHoverDemo } from "./click-hover-demo.js";

export const popoverSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A popover shows content next to the element that opened it, its anchor. It sits in the browser's top layer, so no container clips it, and it flips to the other side of the anchor when there is no room. A press outside or Escape asks it to close, and focus moves into it and back to the anchor.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" data-ok-button data-ok-variant="contained" data-ok-color="inherit" data-ok-size="md"
  aria-haspopup="dialog" aria-expanded="false" aria-controls="summary" data-ok-popover-open="summary">
  <span data-ok-button-label>Show summary</span>
</button>
<div id="summary" popover="manual" data-ok-popover data-ok-placement="bottom" role="dialog" aria-label="Summary">
  …
</div>`,
    react: `import { Button, Popover } from "@owlky/react";
import { useState } from "react";

export function Summary() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        variant="contained"
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Show summary
      </Button>
      <Popover
        role="dialog"
        aria-label="Summary"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        …
      </Popover>
    </>
  );
}`,
  },
  {
    id: "placement",
    title: "Place the popover",
    body: "Set `placement` to a side of the anchor (`top`, `bottom`, `left` or `right`) and, optionally, an alignment (`-start` or `-end`). The default is `bottom`, centered. Add `arrow` to point at the anchor. The arrow sits on the side that faces the anchor and follows the anchor's center, even after a flip. For example, `bottom-start` opens the popover below its anchor with the arrow at the top left, and `top-end` opens it above with the arrow at the bottom right.",
    html: `<div id="info" popover="manual" data-ok-popover data-ok-placement="right-start" data-ok-arrow>
  <span data-ok-popover-arrow aria-hidden="true"></span>
  …
</div>`,
    react: `import { Popover } from "@owlky/react";

export function PopoverPlacement() {
  return (
    <Popover open={open} anchorEl={anchor} placement="right-start" arrow>
      …
    </Popover>
  );
}`,
  },
  {
    id: "hover",
    title: "Show a popover on hover",
    body: "In HTML, point `data-ok-popover-hover` at the popover instead of `data-ok-popover-open`: it opens while the pointer or keyboard focus is on the trigger, and focus stays on the trigger. In React, set the anchor from the pointer and focus events, and add `disableAutoFocus` and `disableRestoreFocus`.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  aria-expanded="false" aria-controls="hint" data-ok-popover-hover="hint">
  <span data-ok-button-label>Hover me</span>
</button>
<div id="hint" popover="manual" data-ok-popover data-ok-placement="bottom">…</div>`,
    react: `import { Button, Popover } from "@owlky/react";

export function PopoverHover() {
  return (
    <>
      <Button
        variant="outlined"
        onPointerEnter={(event) => setAnchor(event.currentTarget)}
        onPointerLeave={() => setAnchor(null)}
        onFocus={(event) => setAnchor(event.currentTarget)}
        onBlur={() => setAnchor(null)}
      >
        Hover me
      </Button>
      <Popover open={anchor !== null} anchorEl={anchor} disableAutoFocus disableRestoreFocus>
        …
      </Popover>
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
    body: "These props set the content and the state. They aren't options, because HTML writes them as markup or triggers.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:popover:beforeopen\`** (cancelable) and **\`ok:popover:open\`** fire on the popover, with \`detail.anchor\`.
- **\`ok:popover:beforeclose\`** (cancelable) and **\`ok:popover:close\`** fire with \`detail.reason\`: \`escape\`, \`backdrop\` (a press outside), \`trigger\`, \`select\` (a menu item), \`tab\` or \`api\`.
- **Instance:** \`runtime.get(element, "popover")\` returns \`{ isOpen, open(anchor), close(reason?), toggle(anchor) }\`.
- **React:** \`onOpenChange(false, reason)\` reports \`escape\` or \`backdrop\`. Set \`open\` to close it.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The trigger is a native button. Inside the popover, Tab moves between its controls.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give an interactive popover \`role="dialog"\` and a name (\`aria-label\` or \`aria-labelledby\`), and its trigger \`aria-haspopup="dialog"\`. The HTML runtime keeps the trigger's \`aria-expanded\` up to date.
- Focus moves into the popover when it opens and back to the trigger when it closes. Hover popovers leave focus on the trigger.
- Escape closes the top popover first, so nested popovers close one at a time.
- Popovers that only appear on hover also open on keyboard focus.`,
  },
  apiReferenceSection(popoverApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <ClickHoverDemo />
    </Preview>
  ),
  options: () => <OptionsTable schema={popoverOptions} />,
  props: () => (
    <PropsTable
      label="Popover content props"
      rows={[
        {
          react: "open",
          html: "data-ok-popover-open trigger",
          type: "boolean",
          description: "Shows the popover. React keeps it in state.",
        },
        {
          react: "anchorEl",
          html: "the trigger",
          type: "Element | (() => Element)",
          description: "The element the popover points at.",
        },
        {
          react: "onOpenChange",
          html: "ok:popover:beforeclose",
          type: "(open, reason) => void",
          description: "The user asked to close: `escape` or `backdrop`.",
        },
        {
          react: "initialFocus",
          type: "() => HTMLElement",
          description: "Where focus goes on open; default: the first focusable element.",
        },
        {
          react: "children",
          type: "ReactNode",
          description: "The content.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Enter / Space", "On the trigger: opens or closes the popover."],
        ["Escape", "Closes the popover and moves focus back to the trigger."],
        ["Tab", "Moves between the controls inside the popover."],
      ]}
    />
  ),
};

/** Popover docs page (ADR-0019). */
export function PopoverDocs() {
  return <GuideDocs sections={popoverSections} previews={PREVIEWS} />;
}
