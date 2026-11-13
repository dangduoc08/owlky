import { tooltipOptions } from "@owlky/core";
import tooltipApi from "@owlky/docs-content/api/tooltip.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Fab, IconButton, Tooltip } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { SolarIcon, solarMarkup } from "../../helpers/solar-icons.js";

export const tooltipSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A tooltip shows a short text label when you hover over, focus or long-press an element. Use it to name icon-only buttons or to add a short description. Keep the text brief and never put controls in it.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="md" aria-labelledby="delete-tip">
  ${solarMarkup("trash-bin-trash-linear")}
</button>
<div id="delete-tip" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom">Delete</div>`,
    react: `import { IconButton, Tooltip } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import trashBinTrashLinear from "@iconify-icons/solar/trash-bin-trash-linear";

export function DeleteButton() {
  return (
    <Tooltip title="Delete">
      <IconButton>
        <Icon icon={trashBinTrashLinear} aria-hidden="true" />
      </IconButton>
    </Tooltip>
  );
}`,
  },
  {
    id: "name",
    title: "Name or describe the trigger",
    body: "By default the tooltip names its trigger (`aria-labelledby`): use this for icon-only buttons, which have no visible text. For a trigger that already has a name, such as a button with text, set `describeChild`: the tooltip then describes it (`aria-describedby`) instead.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="info" data-ok-size="md"
  aria-describedby="save-tip">
  <span data-ok-button-label>Save</span>
</button>
<div id="save-tip" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom">Saves a draft</div>`,
    react: `import { Button, Tooltip } from "@owlky/react";

export function TooltipName() {
  return (
    <Tooltip title="Saves a draft" describeChild>
      <Button variant="outlined" color="info">Save</Button>
    </Tooltip>
  );
}`,
  },
  {
    id: "placement",
    title: "Place the tooltip",
    body: "Set `placement` to a side and an optional alignment, such as `top-start`. Add `arrow` to point at the trigger. Choose the opening animation with `transition`: `grow` (default), `fade` or `zoom`.",
    html: `<div id="tip" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="top" data-ok-arrow data-ok-transition="fade">
  <span data-ok-tooltip-arrow aria-hidden="true"></span>
  Add
</div>`,
    react: `import { Fab, Tooltip } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import addLinear from "@iconify-icons/solar/add-linear";

export function TooltipPlacement() {
  return (
    <Tooltip title="Add" placement="top" arrow transition="fade">
      <Fab color="primary">
        <Icon icon={addLinear} aria-hidden="true" />
      </Fab>
    </Tooltip>
  );
}`,
  },
  {
    id: "timing",
    title: "Change the timing",
    body: "A tooltip opens 100 ms after the pointer enters its trigger (`enterDelay`) and closes when it leaves (`leaveDelay`, 0 ms). Keyboard focus opens it at once. On touch screens, a press held for 700 ms opens it, and it closes 1.5 seconds after you lift your finger. The pointer can move onto the tooltip without closing it.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" aria-describedby="tip">
  <span data-ok-button-label>Add</span>
</button>
<div id="tip" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom"
  data-ok-enter-delay="500" data-ok-leave-delay="200"><span data-ok-tooltip-arrow aria-hidden="true"></span>Add to the cart</div>`,
    react: `import { Button, Tooltip } from "@owlky/react";

export function TooltipTiming() {
  return (
    <Tooltip title="Add to the cart" enterDelay={500} leaveDelay={200}>
      <Button variant="outlined">Add</Button>
    </Tooltip>
  );
}`,
  },
  {
    id: "next-delay",
    title: "Open the next tooltip sooner",
    body: "When another tooltip shows, or closed less than 800 ms ago, `enterNextDelay` replaces `enterDelay`. Moving the pointer along a toolbar then shows each tooltip quickly, while the first one still waits. Without `enterNextDelay`, every tooltip waits for `enterDelay`.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" aria-describedby="bold-tip">
  <span data-ok-button-label>Bold</span>
</button>
<div id="bold-tip" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom"
  data-ok-enter-delay="500" data-ok-enter-next-delay="100"><span data-ok-tooltip-arrow aria-hidden="true"></span>Bold text</div>`,
    react: `import { Button, Tooltip } from "@owlky/react";

export function ToolbarTooltip() {
  return (
    <Tooltip title="Bold text" enterDelay={500} enterNextDelay={100}>
      <Button variant="outlined">Bold</Button>
    </Tooltip>
  );
}`,
  },
  {
    id: "follow-cursor",
    title: "Follow the pointer",
    body: "With `followCursor`, the tooltip opens at the pointer and moves with it while the pointer stays on the trigger. Keyboard focus and touch still place it next to the trigger. Use it on large triggers, such as a disabled area that explains why it is disabled.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="lg" aria-describedby="follow-tip">
  <span data-ok-button-label>Upgrade</span>
</button>
<div id="follow-tip" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom"
  data-ok-follow-cursor><span data-ok-tooltip-arrow aria-hidden="true"></span>Available on the Pro plan</div>`,
    react: `import { Button, Tooltip } from "@owlky/react";

export function FollowTooltip() {
  return (
    <Tooltip title="Available on the Pro plan" followCursor describeChild>
      <Button variant="outlined" size="lg">
        Upgrade
      </Button>
    </Tooltip>
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
    body: "These props set the content and the state. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:tooltip:open\`** (\`detail.trigger\`) and **\`ok:tooltip:close\`** fire on the tooltip.
- **Instance:** \`runtime.get(element, "tooltip")\` returns \`{ isOpen, show(trigger?), hide() }\`.
- **React:** \`open\` and \`onOpenChange(open)\` control it.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The trigger keeps its own keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The tooltip has \`role="tooltip"\`, and its trigger points at it with \`aria-labelledby\` or \`aria-describedby\`.
- It appears on keyboard focus, not only on hover, and Escape closes it without moving focus.
- You can move the pointer onto the tooltip to read it: it stays open while hovered.
- The text is white on dark grey, with a contrast ratio well above 4.5:1.
- Don't put links or buttons in a tooltip: it closes when focus moves. Use a Popover instead.`,
  },
  apiReferenceSection(tooltipApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Tooltip title="Delete">
        <IconButton>
          <SolarIcon name="trash-bin-trash-linear" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Add" arrow>
        <Fab color="primary">
          <SolarIcon name="add-linear" />
        </Fab>
      </Tooltip>
    </Preview>
  ),
  options: () => <OptionsTable schema={tooltipOptions} />,
  props: () => (
    <PropsTable
      label="Tooltip content props"
      rows={[
        { react: "title", html: "the tooltip's text", type: "ReactNode", description: "The text." },
        {
          react: "children",
          html: "the trigger",
          type: "ReactElement",
          description: "One element that takes focus and pointer events.",
        },
        {
          react: "describeChild",
          html: "aria-describedby",
          type: "boolean",
          description: "Describe the trigger instead of naming it (`aria-labelledby`).",
        },
        {
          react: "open / onOpenChange",
          type: "boolean / (open) => void",
          description: "Controlled open state.",
        },
        {
          react: "enterTouchDelay / leaveTouchDelay",
          type: "number",
          description: "Touch timing in ms (700 / 1500).",
        },
        {
          react: "disableHoverListener / disableFocusListener / disableTouchListener",
          type: "boolean",
          description: "Ignore that way of opening it.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moving focus to the trigger opens the tooltip; moving away closes it."],
        ["Escape", "Closes the tooltip. Focus stays on the trigger."],
      ]}
    />
  ),
};

/** Tooltip docs page (ADR-0019). */
export function TooltipDocs() {
  return <GuideDocs sections={tooltipSections} previews={PREVIEWS} />;
}
