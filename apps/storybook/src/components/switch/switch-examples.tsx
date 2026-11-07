import { switchOptions } from "@owlky/core";
import { FormControlLabel, Switch } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { CONTROL_COLORS } from "../checkbox/checkbox-examples.js";
import type { GroupFiles } from "../shared/snippets.js";

const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);

/**
 * The same markup, in the same order, as
 * `packages/html/src/components/switch/examples/<story>-<group>.html`.
 */
export const basicGroups: ReactGroup[] = [
  {
    title: "Basic",
    content: [
      <Switch key="1" aria-label="Checked" defaultChecked />,
      <Switch key="2" aria-label="Unchecked" />,
      <Switch key="3" aria-label="Disabled" disabled />,
      <Switch key="4" aria-label="Disabled checked" defaultChecked disabled />,
      <Switch key="5" aria-label="Default color" color="default" defaultChecked />,
    ],
  },
];

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: [
      <FormControlLabel key="s" label="Small" control={<Switch size="small" />} />,
      <FormControlLabel key="m" label="Medium" control={<Switch />} />,
    ],
  },
];

export const placementGroups: ReactGroup[] = [
  {
    title: "Placements",
    content: (["top", "start", "bottom", "end"] as const).map((placement) => (
      <FormControlLabel
        key={placement}
        label={capitalize(placement)}
        labelPlacement={placement}
        control={<Switch />}
      />
    )),
  },
];

const colorList = (disabled: boolean) => [
  ...CONTROL_COLORS.map((color) => (
    <FormControlLabel
      key={color}
      label={capitalize(color)}
      control={<Switch color={color} defaultChecked disabled={disabled} />}
    />
  )),
  <FormControlLabel
    key="unchecked"
    label="Unchecked"
    control={<Switch color="error" disabled={disabled} />}
  />,
];

export const colorGroups: ReactGroup[] = [
  { title: "Default", content: colorList(false) },
  { title: "Disabled", content: colorList(true) },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];
export const COLOR_FILES: GroupFiles = [
  ["Default", "default"],
  ["Disabled", "disabled"],
];

/** Story Controls (ADR-0015): options that change every example at once. */
export const SWITCH_CONTROLS = {
  schema: switchOptions,
  keys: ["color", "size", "disabled"],
} as const;
