import { formControlLabelOptions, switchOptions } from "@owlky/core";
import { FormControlLabel, Switch } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const htmlSwitch = (root: string, input: string, label: string, placement = "end") =>
  `<label data-ok-form-control-label data-ok-label-placement="${placement}">
  <span data-ok-switch ${root}>
    <input type="checkbox" role="switch" data-ok-switch-input${input}>
    <span data-ok-switch-track aria-hidden="true"></span>
    <span data-ok-switch-thumb aria-hidden="true"></span>
  </span>
  <span data-ok-form-control-label-text>${label}</span>
</label>`;

export const switchSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A switch turns one setting on or off, and the change applies at once, such as dark mode or notifications. For choices that a form submits later, use a **Checkbox**.

A switch is a native checkbox with \`role="switch"\`, so forms submit it and assistive technology announces "on" or "off". It needs no JavaScript. Put it in a **form control label**, so the text names it.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

${htmlSwitch('data-ok-color="primary" data-ok-size="medium"', ' name="notifications" checked', "Notifications")}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { FormControlLabel, Switch } from "@owlky/react";
import { useState } from "react";

export function Notifications() {
  const [on, setOn] = useState(true);
  return (
    <FormControlLabel label="Notifications" control={<Switch name="notifications" checked={on} onChange={setOn} />} />
  );
}`,
  },
  {
    id: "colors",
    title: "Choose a color and size",
    body: "The color fills the track when the switch is on. The default is `primary`. Use `default` for the text color, or another palette color to match the context. The `small` size has a 26 × 16px track, and the default `medium` size has a 34 × 20px track.",
    html: htmlSwitch('data-ok-color="info" data-ok-size="small"', " checked", "Info, small"),
    react: `import { FormControlLabel, Switch } from "@owlky/react";

export function SwitchColors() {
  return (
    <FormControlLabel
      label="Info, small"
      control={<Switch color="info" size="small" defaultChecked />}
    />
  );
}`,
  },
  {
    id: "placement",
    title: "Place the label",
    body: "By default, the text follows the switch (`end`). Set `labelPlacement` to `start`, `top` or `bottom` to move it. Without a label, for example at the end of a list row, set `edge` to `start` or `end` to line the track up with the content.",
    html: htmlSwitch('data-ok-color="primary" data-ok-size="medium"', "", "Start", "start"),
    react: `import { FormControlLabel, Switch } from "@owlky/react";

export function SwitchPlacement() {
  return <FormControlLabel label="Start" labelPlacement="start" control={<Switch />} />;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. The form control label has its own options.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **HTML:** the input fires the native \`change\` event when the user toggles it. Read \`input.checked\`.
- **React:** \`onChange(checked)\` is called with the new state. Use \`checked\` to control the switch, or \`defaultChecked\` to let it keep its own state.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The switch is a native input, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Every switch needs a name: a form control label, or \`aria-label\` / \`aria-labelledby\` on the input. Name the setting, not the state ("Notifications", not "Turn on").
- \`role="switch"\` makes screen readers announce "on" and "off".
- Focus is shown with a 2px ring around the track. The target is at least 24px high.
- The off track follows the design: a light grey with a contrast ratio of about 1.6:1 on white. The white thumb and its shadow show the switch's shape. Brand colors of the on track follow the design too.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <FormControlLabel label="Notifications" control={<Switch defaultChecked />} />
    </Preview>
  ),
  colors: () => (
    <Preview>
      <FormControlLabel label="Default" control={<Switch color="default" defaultChecked />} />
      <FormControlLabel
        label="Info, small"
        control={<Switch color="info" size="small" defaultChecked />}
      />
    </Preview>
  ),
  placement: () => (
    <Preview>
      {(["top", "start", "bottom", "end"] as const).map((placement) => (
        <FormControlLabel
          key={placement}
          label={placement}
          labelPlacement={placement}
          control={<Switch />}
        />
      ))}
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={switchOptions} />
      <OptionsTable schema={formControlLabelOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Switch content props"
      rows={[
        {
          react: "onChange",
          html: "change event",
          type: "(checked: boolean) => void",
          description: "Called with the new checked state.",
        },
        {
          react: "name / value / required / id",
          html: "on the input",
          type: "string / boolean",
          description: "Native form attributes, passed to the input.",
        },
        {
          react: "ref",
          type: "HTMLInputElement",
          description: "The input itself.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the switch."],
        ["Space", "Turns it on or off."],
      ]}
    />
  ),
};

/** Switch docs page (ADR-0019). */
export function SwitchDocs() {
  return <GuideDocs sections={switchSections} previews={PREVIEWS} />;
}
