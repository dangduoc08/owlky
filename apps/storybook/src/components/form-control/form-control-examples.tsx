import { formControlOptions } from "@owlky/core";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/*
 * The same markup as `packages/html/src/components/form-control/examples/<story>-<file>.html`
 * (generated from these examples by `apps/storybook/scripts/form-control-snippets.mjs`). Groups of
 * controls are a `fieldset` FormControl with a `legend` FormLabel; helper texts are referenced by
 * `aria-describedby`.
 */

const PEOPLE = [
  ["gilad", "Gilad Gray"],
  ["jason", "Jason Killian"],
  ["antoine", "Antoine Llorca"],
] as const;

export const radioGroups: ReactGroup[] = [
  {
    title: "Radio group",
    content: (
      <FormControl component="fieldset">
        <FormLabel component="legend" id="fc-gender-label">
          Gender
        </FormLabel>
        <RadioGroup name="fc-gender" defaultValue="female" aria-labelledby="fc-gender-label">
          <FormControlLabel label="Female" control={<Radio value="female" />} />
          <FormControlLabel label="Male" control={<Radio value="male" />} />
          <FormControlLabel label="Other" control={<Radio value="other" />} />
        </RadioGroup>
      </FormControl>
    ),
  },
];

export const checkboxGroups: ReactGroup[] = [
  {
    title: "Checkbox group",
    content: [
      <FormControl key="assign" component="fieldset" aria-describedby="fc-assign-helper">
        <FormLabel component="legend">Assign responsibility</FormLabel>
        <FormGroup>
          {PEOPLE.map(([name, label]) => (
            <FormControlLabel
              key={name}
              label={label}
              control={<Checkbox name={name} defaultChecked={name === "gilad"} />}
            />
          ))}
        </FormGroup>
        <FormHelperText id="fc-assign-helper">Be careful</FormHelperText>
      </FormControl>,
      <FormControl key="pick" component="fieldset" required error aria-describedby="fc-pick-helper">
        <FormLabel component="legend">Pick two</FormLabel>
        <FormGroup>
          {PEOPLE.map(([name, label]) => (
            <FormControlLabel
              key={name}
              label={label}
              control={
                <Checkbox name={name} defaultChecked={name === "gilad"} aria-invalid="true" />
              }
            />
          ))}
        </FormGroup>
        <FormHelperText id="fc-pick-helper">You can display an error</FormHelperText>
      </FormControl>,
    ],
  },
];

export const switchGroups: ReactGroup[] = [
  {
    title: "Switch group",
    content: (
      <FormControl component="fieldset" aria-describedby="fc-switches-helper">
        <FormLabel component="legend">Assign responsibility</FormLabel>
        <FormGroup>
          {PEOPLE.map(([name, label]) => (
            <FormControlLabel
              key={name}
              label={label}
              control={<Switch name={name} defaultChecked={name !== "jason"} />}
            />
          ))}
        </FormGroup>
        <FormHelperText id="fc-switches-helper">Be careful</FormHelperText>
      </FormControl>
    ),
  },
];

export const errorGroups: ReactGroup[] = [
  {
    title: "Show error",
    content: (
      <FormControl component="fieldset" error>
        <FormLabel component="legend" id="fc-quiz-label">
          Pop quiz: a radio group lets you pick…
        </FormLabel>
        <RadioGroup
          name="fc-quiz"
          defaultValue="many"
          aria-labelledby="fc-quiz-label"
          aria-describedby="fc-quiz-helper"
          aria-invalid="true"
        >
          <FormControlLabel label="Exactly one option" control={<Radio value="one" />} />
          <FormControlLabel label="Many options" control={<Radio value="many" />} />
        </RadioGroup>
        <FormHelperText id="fc-quiz-helper">Sorry, wrong answer!</FormHelperText>
      </FormControl>
    ),
  },
];

export const stateGroups: ReactGroup[] = [
  {
    title: "Disabled",
    content: (
      <FormControl component="fieldset" disabled aria-describedby="fc-disabled-helper">
        <FormLabel component="legend">Notifications</FormLabel>
        <FormGroup>
          <FormControlLabel label="Email" control={<Checkbox name="email" defaultChecked />} />
          <FormControlLabel label="Push" control={<Checkbox name="push" />} />
        </FormGroup>
        <FormHelperText id="fc-disabled-helper">Managed by your organization</FormHelperText>
      </FormControl>
    ),
  },
  {
    title: "Required",
    content: (
      <FormControl component="fieldset" required>
        <FormLabel component="legend" id="fc-plan-label">
          Plan
        </FormLabel>
        <RadioGroup
          name="fc-plan"
          row
          aria-labelledby="fc-plan-label"
          aria-describedby="fc-plan-helper"
          aria-required="true"
        >
          <FormControlLabel label="Free" control={<Radio value="free" />} />
          <FormControlLabel label="Pro" control={<Radio value="pro" />} />
        </RadioGroup>
        <FormHelperText id="fc-plan-helper">Choose a plan to continue</FormHelperText>
      </FormControl>
    ),
  },
  {
    title: "Focused",
    content: (
      <FormControl component="fieldset" focused color="primary">
        <FormLabel component="legend">Theme</FormLabel>
        <FormGroup row>
          <FormControlLabel label="Dark mode" control={<Switch name="dark" />} />
          <FormControlLabel label="Compact" control={<Switch name="compact" defaultChecked />} />
        </FormGroup>
      </FormControl>
    ),
  },
];

export const standaloneGroups: ReactGroup[] = [
  {
    title: "Standalone control",
    content: (
      <FormControl>
        <FormLabel htmlFor="fc-mentions">Email notifications</FormLabel>
        <Switch id="fc-mentions" defaultChecked aria-describedby="fc-mentions-helper" />
        <FormHelperText id="fc-mentions-helper">
          Get an email when someone mentions you.
        </FormHelperText>
      </FormControl>
    ),
  },
];

/** Every story's groups, keyed by story (`<story>-<file>.html`). */
export const formControlStories: Record<string, ReactGroup[]> = {
  radios: radioGroups,
  checkboxes: checkboxGroups,
  switches: switchGroups,
  "show-error": errorGroups,
  states: stateGroups,
  standalone: standaloneGroups,
};

/** Snippet files per story, in group order. */
export const FORM_CONTROL_FILES: Record<string, GroupFiles> = {
  radios: [["Radio group", "group"]],
  checkboxes: [["Checkbox group", "group"]],
  switches: [["Switch group", "group"]],
  "show-error": [["Show error", "group"]],
  states: [
    ["Disabled", "disabled"],
    ["Required", "required"],
    ["Focused", "focused"],
  ],
  standalone: [["Standalone control", "group"]],
};

/** Story Controls (ADR-0015): options that change every example at once. */
export const FORM_CONTROL_CONTROLS = {
  schema: formControlOptions,
  keys: ["color", "focused", "error", "margin", "fullWidth"],
} as const;
