import { buttonGroupOptions } from "@owlky/core";
import { Button, ButtonGroup } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const LABELS = ["Day", "Week", "Month"];

const htmlGroup = (groupAttrs: string, buttonAttrs: string) =>
  `<div role="group" data-ok-button-group ${groupAttrs} aria-label="Range">
${LABELS.map(
  (label) =>
    `  <button type="button" data-ok-button ${buttonAttrs}>\n    <span data-ok-button-label>${label}</span>\n  </button>`,
).join("\n")}
</div>`;

// Buttons in a group have no elevation unless the group sets disableElevation to false.
const OUTLINED =
  'data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-disable-elevation';

export const buttonGroupSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A button group joins related buttons into one control, such as the range picker of a chart. The buttons keep their own actions; the group only lines them up and shares their style. When the buttons should stay pressed to show a choice, use a **Toggle button** group instead.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

${htmlGroup('data-ok-orientation="horizontal"', OUTLINED)}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Button, ButtonGroup } from "@owlky/react";

export function RangePicker() {
  return (
    <ButtonGroup aria-label="Range">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  );
}`,
  },
  {
    id: "style",
    title: "Style every button at once",
    body: "In React, set `variant`, `color`, `size`, `disabled` and `disableElevation` on the group: it passes them to every direct child button, and a prop on a child wins. In HTML, write the same attributes on each button. The default variant is `outlined`.",
    html: htmlGroup(
      'data-ok-orientation="horizontal"',
      'data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" data-ok-disable-elevation',
    ),
    react: `import { Button, ButtonGroup } from "@owlky/react";

export function ButtonGroupStyle() {
  return (
    <ButtonGroup variant="contained" color="primary" aria-label="Range">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  );
}`,
  },
  {
    id: "orientation",
    title: "Stack the buttons",
    body: "Set `orientation` to `vertical` to stack the buttons, for example on narrow screens, where a horizontal group doesn't wrap. Set `fullWidth` to stretch the group to its container.",
    html: htmlGroup('data-ok-orientation="vertical"', OUTLINED),
    react: `import { Button, ButtonGroup } from "@owlky/react";

export function ButtonGroupOrientation() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Range">
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
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
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Each button in the group is a native button, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The group has \`role="group"\`. Give it an \`aria-label\` when the buttons need a shared context, such as "Range".
- Each button keeps its own name from its label.
- A focused button is drawn above its neighbors, so its focus outline is never hidden.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <ButtonGroup aria-label="Range">
        {LABELS.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </ButtonGroup>
    </Preview>
  ),
  style: () => (
    <Preview className="flex-col items-start!">
      {(["contained", "soft", "text"] as const).map((variant) => (
        <ButtonGroup
          key={variant}
          variant={variant}
          color="primary"
          aria-label={`Range, ${variant}`}
        >
          {LABELS.map((label) => (
            <Button key={label}>{label}</Button>
          ))}
        </ButtonGroup>
      ))}
    </Preview>
  ),
  orientation: () => (
    <Preview>
      <ButtonGroup orientation="vertical" aria-label="Range">
        {LABELS.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </ButtonGroup>
    </Preview>
  ),
  options: () => <OptionsTable schema={buttonGroupOptions} />,
  props: () => (
    <PropsTable
      label="Button group content props"
      rows={[
        {
          react: "children",
          html: "<button data-ok-button> inside",
          type: "ReactNode",
          description: "The buttons. Only direct children receive the group's props.",
        },
        {
          react: "aria-label",
          html: "aria-label",
          type: "string",
          description: "Name of the group.",
        },
        {
          react: "ref",
          type: "HTMLDivElement",
          description: "Forwarded to the group element.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the next button in the group."],
        ["Enter / Space", "Activates the focused button."],
      ]}
    />
  ),
};

/** Button group docs page (ADR-0019). */
export function ButtonGroupDocs() {
  return <GuideDocs sections={buttonGroupSections} previews={PREVIEWS} />;
}
