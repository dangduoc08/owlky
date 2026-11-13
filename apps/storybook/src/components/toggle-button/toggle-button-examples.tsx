import { toggleButtonOptions } from "@owlky/core";
import {
  ToggleButton,
  type ToggleButtonColor,
  ToggleButtonGroup,
  type ToggleButtonSize,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const COLORS: ToggleButtonColor[] = [
  "standard",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const SIZES = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
] as const;

function Alignment({
  label,
  size,
  disabled,
  justify = false,
}: {
  label: string;
  size?: ToggleButtonSize;
  disabled?: boolean;
  justify?: boolean;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      defaultValue="left"
      size={size}
      disabled={disabled}
      aria-label={label}
    >
      <ToggleButton value="left" aria-label="Left">
        <SolarIcon name="align-left-linear" />
      </ToggleButton>
      <ToggleButton value="center" aria-label="Center">
        <SolarIcon name="align-horizontal-center-linear" />
      </ToggleButton>
      <ToggleButton value="right" aria-label="Right">
        <SolarIcon name="align-right-linear" />
      </ToggleButton>
      {justify && (
        <ToggleButton value="justify" aria-label="Justify" disabled>
          <SolarIcon name="align-horizontal-spacing-linear" />
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
}

function View({
  label,
  color,
  vertical = false,
}: {
  label: string;
  color?: ToggleButtonColor;
  vertical?: boolean;
}) {
  return (
    <ToggleButtonGroup
      exclusive
      defaultValue="list"
      color={color}
      orientation={vertical ? "vertical" : undefined}
      aria-label={label}
    >
      <ToggleButton value="list" aria-label="List">
        <SolarIcon name="list-linear" />
      </ToggleButton>
      <ToggleButton value="module" aria-label="Module">
        <SolarIcon name="widget-linear" />
      </ToggleButton>
      <ToggleButton value="quilt" aria-label="Quilt">
        <SolarIcon name="widget-4-linear" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

/**
 * Story groups — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/toggle-button/examples/<story>-<file>.html`.
 */
export const toggleStories: Record<string, ReactGroup[]> = {
  exclusive: [
    {
      title: "Exclusive selection",
      content: <Alignment label="Text alignment" justify />,
    },
  ],
  multiple: [
    {
      title: "Multiple selection",
      content: (
        <ToggleButtonGroup defaultValue={["bold", "italic"]} aria-label="Text formatting">
          <ToggleButton value="bold" aria-label="Bold">
            <SolarIcon name="text-bold-linear" />
          </ToggleButton>
          <ToggleButton value="italic" aria-label="Italic">
            <SolarIcon name="text-italic-linear" />
          </ToggleButton>
          <ToggleButton value="underline" aria-label="Underline">
            <SolarIcon name="text-underline-linear" />
          </ToggleButton>
        </ToggleButtonGroup>
      ),
    },
  ],
  sizes: [
    {
      title: "Standalone",
      content: SIZES.map(([size, label]) => (
        <ToggleButton key={size} size={size} aria-label={label}>
          <SolarIcon name="check-linear" />
        </ToggleButton>
      )),
    },
    {
      title: "Groups",
      content: SIZES.map(([size, label]) => (
        <Alignment key={size} size={size} label={`${label} alignment`} />
      )),
    },
  ],
  disabled: [
    {
      title: "Disabled",
      content: (
        <>
          <ToggleButton aria-label="Disabled" disabled>
            <SolarIcon name="check-linear" />
          </ToggleButton>
          <ToggleButton aria-label="Disabled pressed" disabled defaultSelected>
            <SolarIcon name="check-linear" />
          </ToggleButton>
          <Alignment label="Disabled alignment" disabled />
        </>
      ),
    },
  ],
  colors: [
    {
      title: "Groups",
      content: COLORS.map((color) => (
        <View key={color} color={color} label={`${capitalize(color)} view`} />
      )),
    },
    {
      title: "Standalone",
      content: COLORS.map((color) => (
        <ToggleButton key={color} color={color} defaultSelected aria-label={capitalize(color)}>
          <SolarIcon name="check-linear" />
        </ToggleButton>
      )),
    },
  ],
  vertical: [
    {
      title: "Vertical & standalone",
      content: (
        <>
          <View label="View" vertical />
          <ToggleButton defaultSelected>
            <SolarIcon name="check-linear" />
            Label
          </ToggleButton>
        </>
      ),
    },
  ],
};

export const TOGGLE_FILES: Record<string, GroupFiles> = {
  exclusive: [["Exclusive selection", "group"]],
  multiple: [["Multiple selection", "group"]],
  sizes: [
    ["Standalone", "standalone"],
    ["Groups", "groups"],
  ],
  disabled: [["Disabled", "group"]],
  colors: [
    ["Groups", "groups"],
    ["Standalone", "standalone"],
  ],
  vertical: [["Vertical & standalone", "group"]],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const TOGGLE_CONTROLS = {
  schema: toggleButtonOptions,
  keys: ["size", "color", "fullWidth", "disabled"],
} as const;
