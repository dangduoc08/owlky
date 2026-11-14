import { type TextFieldVariant, textFieldOptions } from "@owlky/core";
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const CURRENCIES = [
  ["USD", "$"],
  ["EUR", "€"],
  ["BTC", "฿"],
  ["JPY", "¥"],
] as const;

const NAMES: Record<TextFieldVariant, string> = {
  outlined: "Outlined",
  filled: "Filled",
  standard: "Standard",
};

/**
 * The password field's end button. In HTML the script shows or hides the password; in React the
 * app keeps `type` in state (see the docs page). Stories render the markup only.
 */
const revealButton = (
  <InputAdornment position="end">
    <IconButton edge="end" aria-label="Show password" aria-pressed={false}>
      <SolarIcon name="eye-linear" />
    </IconButton>
  </InputAdornment>
);

const options = CURRENCIES.map(([value, label]) => (
  <option key={value} value={value}>
    {label}
  </option>
));

/** The listbox Select's options (the reference's "Select" and "Form control select"). */
const menuItems = CURRENCIES.map(([value, label]) => (
  <MenuItem key={value} value={value}>
    {label}
  </MenuItem>
));

/** The groups of one variant story, as in `<variant>-<group>.html`. */
export function variantGroups(variant: TextFieldVariant): ReactGroup[] {
  const base = { variant, fullWidth: true } as const;
  return [
    {
      title: "General",
      content: [
        <TextField key="1" {...base} label="Inactive" />,
        <TextField key="2" {...base} label="Activated" required defaultValue="Hello world" />,
        <TextField
          key="3"
          {...base}
          label="Password"
          type="password"
          defaultValue="Hello world"
          autoComplete="current-password"
        />,
        <TextField key="4" {...base} label="Disabled" defaultValue="Hello world" disabled />,
        <TextField
          key="5"
          {...base}
          placeholder={`${NAMES[variant]} input`}
          aria-label={`${NAMES[variant]} input`}
        />,
      ],
    },
    {
      title: "With adornments",
      content: [
        <TextField
          key="1"
          {...base}
          label="Enabled"
          startAdornment={
            <InputAdornment position="start">
              <SolarIcon name="user-rounded-bold" />
            </InputAdornment>
          }
        />,
        <TextField
          key="2"
          {...base}
          label="Disabled"
          defaultValue="Default value"
          disabled
          startAdornment={
            <InputAdornment position="start">
              <SolarIcon name="user-rounded-bold" />
            </InputAdornment>
          }
          helperText={
            <>
              <SolarIcon name="info-circle-linear" />
              Helper text
            </>
          }
        />,
        <TextField
          key="3"
          {...base}
          label="With normal TextField"
          startAdornment={<InputAdornment position="start">Kg</InputAdornment>}
          endAdornment={
            <InputAdornment position="end">
              <Button variant="contained" size="sm">
                Action
              </Button>
            </InputAdornment>
          }
        />,
        <TextField
          key="4"
          {...base}
          placeholder="End adornment"
          aria-label="Weight"
          endAdornment={<InputAdornment position="end">Kg</InputAdornment>}
          helperText="Weight"
        />,
        <TextField
          key="5"
          {...base}
          label="Password"
          type="password"
          autoComplete="new-password"
          endAdornment={revealButton}
          startAdornment={
            <InputAdornment position="start">
              <SolarIcon name="user-rounded-bold" />
            </InputAdornment>
          }
        />,
      ],
    },
    {
      title: "With helper text",
      content: [
        <TextField
          key="1"
          {...base}
          label="Helper text"
          defaultValue="Hello world"
          helperText={
            <>
              <SolarIcon name="info-circle-linear" />
              Helper text
            </>
          }
        />,
        <TextField
          key="2"
          {...base}
          label="Error"
          defaultValue="Hello world"
          error
          helperText="Error text"
        />,
      ],
    },
    {
      title: "Type",
      content: [
        <TextField
          key="1"
          {...base}
          label="Password"
          type="password"
          autoComplete="current-password"
        />,
        <TextField key="2" {...base} label="Search" type="search" />,
      ],
    },
    {
      title: "Sizes",
      content: [
        <TextField key="1" {...base} label="Size" size="small" defaultValue="Small" />,
        <TextField key="2" {...base} label="Size" defaultValue="Medium" />,
      ],
    },
    {
      title: "Select",
      content: [
        <TextField
          key="1"
          {...base}
          id={`${variant}-select`}
          select
          selectProps={{ native: false }}
          label="Select"
          defaultValue="EUR"
          helperText="Please select your currency"
        >
          {menuItems}
        </TextField>,
        <TextField
          key="2"
          {...base}
          select
          size="small"
          label="Native select"
          defaultValue="EUR"
          helperText="Please select your currency"
        >
          {options}
        </TextField>,
        <FormControl key="3" variant={variant} size="small" fullWidth>
          <InputLabel id={`${variant}-form-select-label`} htmlFor={`${variant}-form-select`}>
            Form control select
          </InputLabel>
          <Select
            labelId={`${variant}-form-select-label`}
            id={`${variant}-form-select`}
            label="Form control select"
            defaultValue="EUR"
          >
            {menuItems}
          </Select>
        </FormControl>,
        <TextField
          key="4"
          {...base}
          select
          size="small"
          label="Form control select (native)"
          defaultValue="EUR"
        >
          {options}
        </TextField>,
      ],
    },
    {
      title: "Multiline",
      content: [
        <TextField
          key="1"
          {...base}
          multiline
          maxRows={4}
          label="Multiline"
          defaultValue="Controlled"
        />,
        <TextField
          key="2"
          {...base}
          multiline
          label="Multiline placeholder"
          placeholder="Placeholder"
        />,
        <TextField
          key="3"
          {...base}
          multiline
          rows={4}
          label="Multiline"
          defaultValue="Default value"
        />,
        <TextField
          key="4"
          {...base}
          multiline
          rows={4}
          placeholder="No label"
          aria-label="Notes"
        />,
      ],
    },
  ];
}

/** Group title ↔ snippet file suffix, in story order. */
export const GROUP_FILES: GroupFiles = [
  ["General", "general"],
  ["With adornments", "adornments"],
  ["With helper text", "helper"],
  ["Type", "type"],
  ["Sizes", "sizes"],
  ["Select", "select"],
  ["Multiline", "multiline"],
];

/** Story Controls (ADR-0015): options that change every example at once. */
export const TEXT_FIELD_CONTROLS = {
  schema: textFieldOptions,
  keys: ["size", "color", "error", "margin", "shrink", "disabled"],
} as const;
