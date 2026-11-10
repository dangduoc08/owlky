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
  <p data-ok-typography data-ok-variant="body2">3 orders are waiting for shipping.</p>
</div>`,
    react: `import { Button, Popover, Typography } from "@owlky/react";
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
        <Typography variant="body2">3 orders are waiting for shipping.</Typography>
      </Popover>
    </>
  );
}`,
  },
  {
    id: "placement",
    title: "Place the popover",
    body: "Set `placement` to a side of the anchor (`top`, `bottom`, `left` or `right`) and, optionally, an alignment (`-start` or `-end`). The default is `bottom`, centered. Add `arrow` to point at the anchor. The arrow sits on the side that faces the anchor and follows the anchor's center, even after a flip. For example, `bottom-start` opens the popover below its anchor with the arrow at the top left, and `top-end` opens it above with the arrow at the bottom right.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  aria-expanded="false" aria-controls="info" data-ok-popover-open="info">
  <span data-ok-button-label>Info</span>
</button>
<div id="info" popover="manual" data-ok-popover data-ok-placement="right-start" data-ok-arrow>
  <span data-ok-popover-arrow aria-hidden="true"></span>
  <p data-ok-typography data-ok-variant="body2">Prices include taxes.</p>
</div>`,
    react: `import { Button, Popover, Typography } from "@owlky/react";
import { useState } from "react";

export function PriceInfo() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button variant="outlined" onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}>
        Info
      </Button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        placement="right-start"
        arrow
        onOpenChange={() => setAnchor(null)}
      >
        <Typography variant="body2">Prices include taxes.</Typography>
      </Popover>
    </>
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
<div id="hint" popover="manual" data-ok-popover data-ok-placement="bottom">
  <p data-ok-typography data-ok-variant="body2">The popover follows the pointer and the focus.</p>
</div>`,
    react: `import { Button, Popover, Typography } from "@owlky/react";
import { useState } from "react";

export function PopoverHover() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
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
        <Typography variant="body2">The popover follows the pointer and the focus.</Typography>
      </Popover>
    </>
  );
}`,
  },
  {
    id: "anchor-position",
    title: "Open the popover at a point",
    body: 'Set `anchorReference` to `anchorPosition` and give the point in `anchorPosition`, in pixels from the top left corner of the viewport. In HTML, write the point as `data-ok-anchor-position="top,left"`. Use it for context menus that open where the user pressed. With `anchorReference="none"`, the popover isn\'t positioned at all, so your own CSS places it. `marginThreshold` keeps the popover that many pixels inside the viewport (16 by default).',
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md"
  aria-haspopup="dialog" aria-expanded="false" aria-controls="point" data-ok-popover-open="point">
  <span data-ok-button-label>Open at a point</span>
</button>
<div id="point" popover="manual" data-ok-popover data-ok-placement="bottom-start"
  data-ok-anchor-reference="anchorPosition" data-ok-anchor-position="200,400" data-ok-margin-threshold="8"
  role="dialog" aria-label="Point">
  <p data-ok-typography data-ok-variant="body2">This popover opens 200px from the top and 400px from the left.</p>
</div>`,
    react: `import { Button, Popover, Typography } from "@owlky/react";
import { useState } from "react";

export function PopoverAtPoint() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(!open)}>
        Open at a point
      </Button>
      <Popover
        role="dialog"
        aria-label="Point"
        open={open}
        anchorEl={null}
        anchorReference="anchorPosition"
        anchorPosition={{ top: 200, left: 400 }}
        marginThreshold={8}
        placement="bottom-start"
        onOpenChange={() => setOpen(false)}
      >
        <Typography variant="body2">This popover opens 200px from the top and 400px from the left.</Typography>
      </Popover>
    </>
  );
}`,
  },
  {
    id: "virtual-element",
    title: "Anchor the popover to a virtual element",
    body: "The anchor doesn't have to be an element. Any object with a `getBoundingClientRect()` method works, such as a text selection's range. In React, pass it as `anchorEl`. In HTML, pass it to the instance's `open()` method. The popover reads the rectangle again when the page scrolls or resizes.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<p data-ok-typography data-ok-variant="body2" id="text">Select some words of this sentence.</p>
<div id="selection" popover="manual" data-ok-popover data-ok-placement="top" data-ok-disable-auto-focus
  data-ok-disable-restore-focus>
  <p data-ok-typography data-ok-variant="body2">You selected some text.</p>
</div>
<script type="module">
  import { getRuntime } from "@owlky/html";

  // Open the popover next to the selection once it is made.
  const text = document.getElementById("text");
  document.addEventListener("pointerup", () => {
    const popover = getRuntime().get(document.getElementById("selection"), "popover");
    const range = document.getSelection().rangeCount ? document.getSelection().getRangeAt(0) : null;
    popover.close();
    if (range && !range.collapsed && text.contains(range.commonAncestorContainer)) {
      popover.open({ getBoundingClientRect: () => range.getBoundingClientRect() });
    }
  });
</script>`,
    react: `import { Popover, type PopoverVirtualAnchor, Typography } from "@owlky/react";
import { useEffect, useRef, useState } from "react";

export function SelectionPopover() {
  const text = useRef<HTMLElement>(null);
  const [anchor, setAnchor] = useState<PopoverVirtualAnchor | null>(null);
  useEffect(() => {
    // Open the popover next to the selection once it is made.
    const onPointerUp = () => {
      const selection = document.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const inside = range && !range.collapsed && text.current?.contains(range.commonAncestorContainer);
      setAnchor(inside ? { getBoundingClientRect: () => range.getBoundingClientRect() } : null);
    };
    document.addEventListener("pointerup", onPointerUp);
    return () => document.removeEventListener("pointerup", onPointerUp);
  }, []);
  return (
    <>
      <Typography ref={text} variant="body2">
        Select some words of this sentence.
      </Typography>
      <Popover open={anchor !== null} anchorEl={anchor} placement="top" disableAutoFocus disableRestoreFocus>
        <Typography variant="body2">You selected some text.</Typography>
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
          html: "the trigger, or open(anchor)",
          type: "Element | PopoverVirtualAnchor | (() => Element)",
          description:
            "What the popover points at: an element, or an object with `getBoundingClientRect()`.",
        },
        {
          react: "anchorPosition",
          html: "data-ok-anchor-position",
          type: "{ top: number; left: number }",
          description:
            'The point used with `anchorReference="anchorPosition"`, in px from the viewport\'s top left corner. HTML: `"top,left"`.',
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
