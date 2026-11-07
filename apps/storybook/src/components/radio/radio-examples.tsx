import { radioOptions, type SelectionControlColor } from "@owlky/core";
import { FormControlLabel, Radio, RadioGroup } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

const COLORS: SelectionControlColor[] = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);

/**
 * The same markup, in the same order, as
 * `packages/html/src/components/radio/examples/<story>-group.html`.
 */
export const basicGroups: ReactGroup[] = [
  {
    title: "Basic",
    content: (
      <RadioGroup row name="basic" defaultValue="a" aria-label="Basic">
        <Radio value="a" aria-label="Option A" />
        <Radio value="b" aria-label="Option B" />
        <Radio value="c" aria-label="Option C" disabled />
      </RadioGroup>
    ),
  },
];

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: (
      <RadioGroup row name="sizes" defaultValue="medium" aria-label="Sizes">
        <FormControlLabel label="Medium" control={<Radio value="medium" />} />
        <FormControlLabel label="Small" control={<Radio value="small" size="small" />} />
      </RadioGroup>
    ),
  },
];

export const placementGroups: ReactGroup[] = [
  {
    title: "Placement",
    content: (
      <RadioGroup row name="placement" defaultValue="top" aria-label="Placement">
        {(["top", "start", "bottom", "end"] as const).map((placement) => (
          <FormControlLabel
            key={placement}
            label={capitalize(placement)}
            labelPlacement={placement}
            control={<Radio value={placement} />}
          />
        ))}
      </RadioGroup>
    ),
  },
];

export const colorGroups: ReactGroup[] = [
  {
    title: "Colors",
    content: [
      // Story-only text until a FormLabel component exists (docs/roadmap.md → Pending integrations).
      <span key="label" id="radio-colors-label">
        Colors
      </span>,
      <RadioGroup key="group" name="colors" aria-labelledby="radio-colors-label">
        {COLORS.map((color) => (
          <FormControlLabel
            key={color}
            label={capitalize(color)}
            control={<Radio value={color} color={color} />}
          />
        ))}
        <FormControlLabel
          label="Disabled"
          control={<Radio value="disabled" color="error" disabled />}
        />
      </RadioGroup>,
    ],
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const RADIO_CONTROLS = {
  schema: radioOptions,
  keys: ["color", "size", "disabled"],
} as const;
