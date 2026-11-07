import { checkboxOptions, type SelectionControlColor } from "@owlky/core";
import { Checkbox, FormControlLabel } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { IndeterminateDemo } from "./indeterminate-demo.js";

/** Colors in the order of the examples. */
export const CONTROL_COLORS: SelectionControlColor[] = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);

const HEART =
  "M12 20s-7.5-4.6-7.5-10A4.25 4.25 0 0 1 12 7.4 4.25 4.25 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z";
const BOOKMARK = "M6.5 4.5h11v15l-5.5-4-5.5 4z";

/** Demo icon, outlined or filled (decorative, same SVG as the HTML snippets). */
function DemoIcon({ d, filled = false }: { d: string; filled?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {filled ? (
        <path d={d} fill="currentColor" />
      ) : (
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}
DemoIcon.displayName = "DemoIcon";

/**
 * The same markup, in the same order, as
 * `packages/html/src/components/checkbox/examples/<story>-<group>.html`.
 */
export const basicGroups: ReactGroup[] = [
  {
    title: "Basic",
    content: [
      <Checkbox key="1" aria-label="Unchecked" />,
      <Checkbox key="2" aria-label="Checked" defaultChecked />,
      <Checkbox key="3" aria-label="Indeterminate" defaultChecked indeterminate />,
      <Checkbox key="4" aria-label="Disabled" disabled />,
      <Checkbox key="5" aria-label="Disabled checked" defaultChecked disabled />,
      <Checkbox key="6" aria-label="Disabled indeterminate" indeterminate disabled />,
    ],
  },
];

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: [
      <FormControlLabel key="m" label="Medium" control={<Checkbox defaultChecked />} />,
      <FormControlLabel key="s" label="Small" control={<Checkbox size="small" defaultChecked />} />,
    ],
  },
];

export const customIconGroups: ReactGroup[] = [
  {
    title: "Custom icons",
    content: [
      <FormControlLabel
        key="heart"
        label="Custom icon"
        control={
          <Checkbox
            color="info"
            size="small"
            icon={<DemoIcon d={HEART} />}
            checkedIcon={<DemoIcon d={HEART} filled />}
          />
        }
      />,
      <FormControlLabel
        key="bookmark"
        label="Custom icon"
        control={
          <Checkbox
            color="error"
            size="small"
            icon={<DemoIcon d={BOOKMARK} />}
            checkedIcon={<DemoIcon d={BOOKMARK} filled />}
          />
        }
      />,
    ],
  },
];

export const placementGroups: ReactGroup[] = [
  {
    title: "Placement",
    content: (["top", "start", "bottom", "end"] as const).map((placement) => (
      <FormControlLabel
        key={placement}
        label={capitalize(placement)}
        labelPlacement={placement}
        control={<Checkbox />}
      />
    )),
  },
];

const colorList = (indeterminate: boolean) => [
  ...CONTROL_COLORS.map((color) => (
    <FormControlLabel
      key={color}
      label={capitalize(color)}
      control={<Checkbox color={color} defaultChecked indeterminate={indeterminate} />}
    />
  )),
  <FormControlLabel
    key="disabled"
    label="Disabled"
    control={<Checkbox color="error" defaultChecked indeterminate={indeterminate} disabled />}
  />,
];

export const colorGroups: ReactGroup[] = [
  { title: "Checked", content: colorList(false) },
  { title: "Indeterminate", content: colorList(true) },
];

export const indeterminateGroups: ReactGroup[] = [
  { title: "Indeterminate", content: <IndeterminateDemo /> },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];
export const COLOR_FILES: GroupFiles = [
  ["Checked", "checked"],
  ["Indeterminate", "indeterminate"],
];

/** Story Controls (ADR-0015): options that change every example at once. */
export const CHECKBOX_CONTROLS = {
  schema: checkboxOptions,
  keys: ["color", "size", "disabled"],
} as const;
