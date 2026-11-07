import { type TextFieldVariant, textFieldOptions } from "@owlky/core";
import { Button, IconButton, InputAdornment, TextField } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/** Demo icons (decorative, same SVG as the HTML snippets). */
export function PersonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="7.5" r="3.5" fill="currentColor" />
      <path d="M5 19.5c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5z" fill="currentColor" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

PersonIcon.displayName = "PersonIcon";
EyeIcon.displayName = "EyeIcon";
InfoIcon.displayName = "InfoIcon";

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
      <EyeIcon />
    </IconButton>
  </InputAdornment>
);

const options = CURRENCIES.map(([value, label]) => (
  <option key={value} value={value}>
    {label}
  </option>
));

/** The groups of one variant story, as in `<variant>-<group>.html`. */
export function variantGroups(variant: TextFieldVariant): ReactGroup[] {
  const base = { variant, fullWidth: true } as const;
  return [
    {
      title: "General",
      content: [
        <TextField key="1" {...base} label="Inactive" />,
        <TextField key="2" {...base} label="Activated" required defaultValue="2Minimal" />,
        <TextField
          key="3"
          {...base}
          label="Password"
          type="password"
          defaultValue="2Minimal"
          autoComplete="current-password"
        />,
        <TextField key="4" {...base} label="Disabled" defaultValue="2Minimal" disabled />,
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
              <PersonIcon />
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
              <PersonIcon />
            </InputAdornment>
          }
          helperText={
            <>
              <InfoIcon />
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
              <PersonIcon />
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
          defaultValue="2Minimal"
          helperText={
            <>
              <InfoIcon />
              Helper text
            </>
          }
        />,
        <TextField
          key="2"
          {...base}
          label="Error"
          defaultValue="2Minimal"
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
          select
          label="Select"
          defaultValue="EUR"
          helperText="Please select your currency"
        >
          {options}
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
        <TextField
          key="3"
          {...base}
          select
          size="small"
          label="Form control select"
          defaultValue="EUR"
        >
          {options}
        </TextField>,
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
