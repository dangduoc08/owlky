import { selectOptions } from "@owlky/core";
import {
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { CheckmarksDemo, DialogDemo, OpenStateDemo } from "./select-demos.js";

/*
 * The same markup as `packages/html/src/components/select/examples/<story>-<file>.html`
 * (generated from these examples by `apps/storybook/scripts/select-snippets.mjs`, which adds the
 * HTML-only templates of `SELECT_TEMPLATES`). Examples are uncontrolled (`defaultValue`), so the
 * story stays stateless; the docs page shows the controlled pattern.
 */

const AGES = [
  [10, "Ten"],
  [20, "Twenty"],
  [30, "Thirty"],
] as const;

const ageItems = (none = false) => [
  ...(none
    ? [
        <MenuItem key="none" value="">
          <em>None</em>
        </MenuItem>,
      ]
    : []),
  ...AGES.map(([value, label]) => (
    <MenuItem key={value} value={value}>
      {label}
    </MenuItem>
  )),
];

export const NAMES = [
  "Oliver Hansen",
  "Van Henry",
  "April Tucker",
  "Ralph Hubbard",
  "Omar Alexander",
  "Carlos Abbott",
  "Miriam Wagner",
  "Bradley Wilkerson",
  "Virginia Andrews",
  "Kelly Snyder",
];

/** Long lists scroll in a shorter menu (MUI's demos cap the paper at 4.5 items). */
const MENU = { paperProps: { className: "sb-select-menu" } };

export const basicGroups: ReactGroup[] = [
  {
    title: "Basic select",
    content: (
      <FormControl fullWidth>
        <InputLabel id="select-basic-label" htmlFor="select-basic">
          Age
        </InputLabel>
        <Select labelId="select-basic-label" id="select-basic" label="Age" defaultValue="">
          {ageItems()}
        </Select>
      </FormControl>
    ),
  },
];

export const variantGroups: ReactGroup[] = [
  {
    title: "Filled and standard variants",
    content: [
      <FormControl key="standard" variant="standard" className="sb-select">
        <InputLabel id="select-standard-label" htmlFor="select-standard">
          Age
        </InputLabel>
        <Select labelId="select-standard-label" id="select-standard" label="Age" defaultValue="">
          {ageItems(true)}
        </Select>
      </FormControl>,
      <FormControl key="filled" variant="filled" className="sb-select">
        <InputLabel id="select-filled-label" htmlFor="select-filled">
          Age
        </InputLabel>
        <Select labelId="select-filled-label" id="select-filled" defaultValue="">
          {ageItems(true)}
        </Select>
      </FormControl>,
    ],
  },
];

export const helperGroups: ReactGroup[] = [
  {
    title: "Labels and helper text",
    content: [
      <FormControl key="label" className="sb-select">
        <InputLabel id="select-helper-label" htmlFor="select-helper">
          Age
        </InputLabel>
        <Select
          labelId="select-helper-label"
          id="select-helper"
          label="Age"
          defaultValue=""
          aria-describedby="select-helper-text"
        >
          {ageItems(true)}
        </Select>
        <FormHelperText id="select-helper-text">With label + helper text</FormHelperText>
      </FormControl>,
      <FormControl key="empty" className="sb-select">
        <Select
          id="select-empty"
          defaultValue=""
          displayEmpty
          aria-label="Without label"
          aria-describedby="select-empty-text"
        >
          {ageItems(true)}
        </Select>
        <FormHelperText id="select-empty-text">Without label</FormHelperText>
      </FormControl>,
    ],
  },
];

export const autoWidthGroups: ReactGroup[] = [
  {
    title: "Auto width",
    content: (
      <FormControl className="sb-select-auto">
        <InputLabel id="select-autowidth-label" htmlFor="select-autowidth">
          Age
        </InputLabel>
        <Select
          labelId="select-autowidth-label"
          id="select-autowidth"
          label="Age"
          defaultValue=""
          autoWidth
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Twenty</MenuItem>
          <MenuItem value={21}>Twenty one</MenuItem>
          <MenuItem value={22}>Twenty one and a half</MenuItem>
        </Select>
      </FormControl>
    ),
  },
];

export const smallGroups: ReactGroup[] = [
  {
    title: "Small size",
    content: (
      <FormControl size="small" className="sb-select">
        <InputLabel id="select-small-label" htmlFor="select-small">
          Age
        </InputLabel>
        <Select labelId="select-small-label" id="select-small" label="Age" defaultValue="">
          {ageItems(true)}
        </Select>
      </FormControl>
    ),
  },
];

export const otherGroups: ReactGroup[] = [
  {
    title: "Other props",
    content: [
      <FormControl key="disabled" disabled className="sb-select">
        <InputLabel id="select-disabled-label" htmlFor="select-disabled">
          Age
        </InputLabel>
        <Select
          labelId="select-disabled-label"
          id="select-disabled"
          label="Age"
          defaultValue=""
          aria-describedby="select-disabled-text"
        >
          {ageItems(true)}
        </Select>
        <FormHelperText id="select-disabled-text">Disabled</FormHelperText>
      </FormControl>,
      <FormControl key="error" error className="sb-select">
        <InputLabel id="select-error-label" htmlFor="select-error">
          Age
        </InputLabel>
        <Select
          labelId="select-error-label"
          id="select-error"
          label="Age"
          defaultValue={10}
          aria-describedby="select-error-text"
        >
          {ageItems(true)}
        </Select>
        <FormHelperText id="select-error-text">Error</FormHelperText>
      </FormControl>,
      <FormControl key="read-only" className="sb-select">
        <InputLabel id="select-readonly-label" htmlFor="select-readonly">
          Age
        </InputLabel>
        <Select
          labelId="select-readonly-label"
          id="select-readonly"
          label="Age"
          defaultValue={10}
          readOnly
          aria-describedby="select-readonly-text"
        >
          {ageItems(true)}
        </Select>
        <FormHelperText id="select-readonly-text">Read only</FormHelperText>
      </FormControl>,
      <FormControl key="required" required className="sb-select">
        <InputLabel id="select-required-label" htmlFor="select-required">
          Age
        </InputLabel>
        <Select
          labelId="select-required-label"
          id="select-required"
          label="Age"
          defaultValue=""
          aria-describedby="select-required-text"
        >
          {ageItems(true)}
        </Select>
        <FormHelperText id="select-required-text">Required</FormHelperText>
      </FormControl>,
    ],
  },
];

export const nativeGroups: ReactGroup[] = [
  {
    title: "Native select",
    content: (
      <FormControl fullWidth>
        <InputLabel htmlFor="select-native">Age</InputLabel>
        <Select native variant="standard" id="select-native" name="age" defaultValue="30">
          {AGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormControl>
    ),
  },
];

export const multipleGroups: ReactGroup[] = [
  {
    title: "Default",
    content: (
      <FormControl className="sb-select-wide">
        <InputLabel id="select-multiple-label" htmlFor="select-multiple">
          Name
        </InputLabel>
        <Select
          labelId="select-multiple-label"
          id="select-multiple"
          label="Name"
          multiple
          defaultValue={["Oliver Hansen", "April Tucker"]}
          menuProps={MENU}
        >
          {NAMES.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
  },
];

export const checkmarkGroups: ReactGroup[] = [
  { title: "Selection indicators", content: <CheckmarksDemo /> },
];

export const openGroups: ReactGroup[] = [
  { title: "Controlling the open state", content: <OpenStateDemo /> },
];

export const dialogGroups: ReactGroup[] = [{ title: "With a dialog", content: <DialogDemo /> }];

export const chipGroups: ReactGroup[] = [
  {
    title: "Chip",
    content: (
      <FormControl className="sb-select-wide">
        <InputLabel id="select-chip-label" htmlFor="select-chip">
          Chip
        </InputLabel>
        <Select
          labelId="select-chip-label"
          id="select-chip"
          label="Chip"
          multiple
          defaultValue={["Oliver Hansen", "Van Henry"]}
          renderValue={(selected) =>
            (selected as string[]).map((value) => <Chip key={value} size="small" label={value} />)
          }
          menuProps={MENU}
        >
          {NAMES.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
  },
];

export const placeholderGroups: ReactGroup[] = [
  {
    title: "Placeholder",
    content: (
      <FormControl className="sb-select-wide">
        <Select
          id="select-placeholder"
          multiple
          displayEmpty
          defaultValue={[]}
          aria-label="Names"
          renderValue={(selected) =>
            (selected as string[]).length === 0 ? (
              <em>Placeholder</em>
            ) : (
              (selected as string[]).join(", ")
            )
          }
          menuProps={MENU}
        >
          <MenuItem disabled value="">
            <em>Placeholder</em>
          </MenuItem>
          {NAMES.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
  },
];

export const nativeMultipleGroups: ReactGroup[] = [
  {
    title: "Native",
    content: (
      <FormControl className="sb-select-wide">
        <InputLabel shrink htmlFor="select-multiple-native">
          Native
        </InputLabel>
        <Select native multiple id="select-multiple-native" label="Native" defaultValue={[]}>
          {NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </FormControl>
    ),
  },
];

export const groupingGroups: ReactGroup[] = [
  {
    title: "Grouping",
    content: [
      <FormControl key="native" className="sb-select-group">
        <InputLabel htmlFor="select-grouped-native">Grouping</InputLabel>
        <Select native id="select-grouped-native" label="Grouping" defaultValue="">
          <option aria-label="None" value="" />
          <optgroup label="Category 1">
            <option value={1}>Option 1</option>
            <option value={2}>Option 2</option>
          </optgroup>
          <optgroup label="Category 2">
            <option value={3}>Option 3</option>
            <option value={4}>Option 4</option>
          </optgroup>
        </Select>
      </FormControl>,
      <FormControl key="listbox" className="sb-select-group">
        <InputLabel id="select-grouped-label" htmlFor="select-grouped">
          Grouping
        </InputLabel>
        <Select labelId="select-grouped-label" id="select-grouped" label="Grouping" defaultValue="">
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <ListSubheader>Category 1</ListSubheader>
          <MenuItem value={1}>Option 1</MenuItem>
          <MenuItem value={2}>Option 2</MenuItem>
          <ListSubheader>Category 2</ListSubheader>
          <MenuItem value={3}>Option 3</MenuItem>
          <MenuItem value={4}>Option 4</MenuItem>
        </Select>
      </FormControl>,
    ],
  },
];

/** Every story's groups, keyed by story (`<story>-<file>.html`). */
export const selectStories: Record<string, ReactGroup[]> = {
  basic: basicGroups,
  variants: variantGroups,
  helper: helperGroups,
  "auto-width": autoWidthGroups,
  small: smallGroups,
  other: otherGroups,
  native: nativeGroups,
  multiple: multipleGroups,
  checkmarks: checkmarkGroups,
  chip: chipGroups,
  placeholder: placeholderGroups,
  "native-multiple": nativeMultipleGroups,
  open: openGroups,
  dialog: dialogGroups,
  grouping: groupingGroups,
};

/** Snippet files per story, in group order. */
export const SELECT_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.entries(selectStories).map(([story, groups]) => [
    story,
    groups.map((group) => [group.title, "group"] as const),
  ]),
);

/**
 * HTML-only templates the generator adds as the first children of a story's select roots (by
 * the trigger's `id`): a Chip for each value, or the placeholder of an empty value.
 */
export const SELECT_TEMPLATES: Record<string, { chip?: true; placeholder?: string }> = {
  "select-chip": { chip: true },
  "select-placeholder": { placeholder: "<em>Placeholder</em>" },
};

/** Story Controls (ADR-0015): options that change every example at once. */
export const SELECT_CONTROLS = {
  schema: selectOptions,
  keys: ["size", "color", "fullWidth"],
} as const;
