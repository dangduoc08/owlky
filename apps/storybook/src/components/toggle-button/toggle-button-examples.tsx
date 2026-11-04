import { toggleButtonOptions } from "@minimal-tailwind/core";
import {
  ToggleButton,
  type ToggleButtonColor,
  ToggleButtonGroup,
  type ToggleButtonSize,
} from "@minimal-tailwind/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
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
        <DemoIcon name="alignLeft" />
      </ToggleButton>
      <ToggleButton value="center" aria-label="Center">
        <DemoIcon name="alignCenter" />
      </ToggleButton>
      <ToggleButton value="right" aria-label="Right">
        <DemoIcon name="alignRight" />
      </ToggleButton>
      {justify && (
        <ToggleButton value="justify" aria-label="Justify" disabled>
          <DemoIcon name="alignJustify" />
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
        <DemoIcon name="viewList" />
      </ToggleButton>
      <ToggleButton value="module" aria-label="Module">
        <DemoIcon name="viewModule" />
      </ToggleButton>
      <ToggleButton value="quilt" aria-label="Quilt">
        <DemoIcon name="viewQuilt" />
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
            <DemoIcon name="bold" />
          </ToggleButton>
          <ToggleButton value="italic" aria-label="Italic">
            <DemoIcon name="italic" />
          </ToggleButton>
          <ToggleButton value="underline" aria-label="Underline">
            <DemoIcon name="underline" />
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
          <DemoIcon name="check" />
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
            <DemoIcon name="check" />
          </ToggleButton>
          <ToggleButton aria-label="Disabled pressed" disabled defaultSelected>
            <DemoIcon name="check" />
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
          <DemoIcon name="check" />
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
            <DemoIcon name="check" />
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
