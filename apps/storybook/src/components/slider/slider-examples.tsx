import { sliderOptions } from "@owlky/core";
import { Slider, type SliderColor } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

const celsius = (value: number) => `${value}°C`;

/** Non-linear scale: the value is a power of two, shown as a size in bytes ("1 KB"). */
export const storageScale = (value: number) => 2 ** value;
export function bytes(value: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size} ${units[unit]}`;
}
const TEMPERATURES = [
  { value: 0, label: "0°C" },
  { value: 20, label: "20°C" },
  { value: 37, label: "37°C" },
  { value: 100, label: "100°C" },
];
const COLORS: SliderColor[] = [
  "inherit",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];

/**
 * Story groups — the same examples as `packages/html/src/components/slider/examples/`. The
 * `div.sb-slider-*` wrappers are story-only demo markup (`.storybook/preview.css`).
 * `data-ok-label-value` lets the HTML runtime write the same value text as `getAriaValueText`.
 */
export const sliderStories: Record<string, ReactGroup[]> = {
  volume: [
    {
      title: "Volume",
      content: (
        <div className="sb-slider-volume">
          <DemoIcon name="volumeDown" />
          <Slider aria-label="Volume" defaultValue={30} />
          <DemoIcon name="volumeUp" />
        </div>
      ),
    },
  ],
  disabled: [
    { title: "Disabled", content: <Slider aria-label="Disabled" defaultValue={30} disabled /> },
  ],
  "non-linear": [
    {
      title: "Non-linear scale",
      content: (
        <Slider
          aria-label="Storage"
          defaultValue={10}
          min={5}
          max={30}
          scale={storageScale}
          valueLabelDisplay="auto"
          valueLabelFormat={bytes}
          getAriaValueText={bytes}
        />
      ),
    },
  ],
  temperature: [
    {
      title: "Temperature",
      content: (
        <Slider
          aria-label="Temperature"
          defaultValue={30}
          step={10}
          marks
          valueLabelDisplay="auto"
          valueLabelFormat={celsius}
          getAriaValueText={celsius}
          data-ok-label-value="{value}°C"
        />
      ),
    },
  ],
  sizes: [
    {
      title: "Sizes",
      content: (
        <>
          <Slider aria-label="Small" size="small" defaultValue={30} valueLabelDisplay="auto" />
          <Slider aria-label="Medium" defaultValue={30} valueLabelDisplay="auto" />
        </>
      ),
    },
  ],
  "small-steps": [
    {
      title: "Small steps",
      content: (
        <Slider
          aria-label="Small steps"
          defaultValue={0.00000005}
          step={0.00000001}
          marks
          min={-0.00000005}
          max={0.0000001}
          valueLabelDisplay="auto"
        />
      ),
    },
  ],
  "custom-marks": [
    {
      title: "Custom marks",
      content: (
        <Slider
          aria-label="Custom marks"
          defaultValue={20}
          step={10}
          marks={TEMPERATURES}
          valueLabelDisplay="auto"
          valueLabelFormat={celsius}
          getAriaValueText={celsius}
          data-ok-label-value="{value}°C"
        />
      ),
    },
  ],
  restricted: [
    {
      title: "Restricted values",
      content: (
        <Slider
          aria-label="Restricted values"
          defaultValue={20}
          step={null}
          marks={TEMPERATURES}
          valueLabelDisplay="auto"
          valueLabelFormat={celsius}
          getAriaValueText={celsius}
          data-ok-label-value="{value}°C"
        />
      ),
    },
  ],
  vertical: [
    {
      title: "Vertical",
      content: (
        <div className="sb-slider-vertical">
          <Slider
            aria-label="Temperature"
            orientation="vertical"
            color="inherit"
            size="small"
            defaultValue={30}
            marks={TEMPERATURES}
            getAriaValueText={celsius}
            data-ok-label-value="{value}°C"
          />
          <Slider
            aria-label="Temperature range"
            orientation="vertical"
            defaultValue={[20, 37]}
            marks={TEMPERATURES}
            getAriaValueText={celsius}
            data-ok-label-value="{value}°C"
          />
        </div>
      ),
    },
  ],
  colors: [
    {
      title: "Colors",
      content: COLORS.map((color) => (
        <Slider
          key={color}
          aria-label={`${color} slider`}
          color={color}
          size="small"
          defaultValue={30}
          step={10}
          marks
        />
      )),
    },
  ],
};

export const SLIDER_FILES: Record<string, GroupFiles> = {
  ...Object.fromEntries(
    Object.entries(sliderStories).map(([story, groups]) => [
      story,
      groups.map((group) => [group.title, "group"] as const),
    ]),
  ),
  range: [["Range", "group"]],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const SLIDER_CONTROLS = {
  schema: sliderOptions,
  keys: ["size", "color", "disabled"],
} as const;
