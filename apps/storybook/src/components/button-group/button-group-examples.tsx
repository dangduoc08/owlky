import { buttonGroupOptions } from "@owlky/core";
import { Button, ButtonGroup, type ButtonVariant, type ColorName } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const COLORS: ColorName[] = [
  "inherit",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const LABELS = ["One", "Two", "Three"];
const VARIANTS: ButtonVariant[] = ["contained", "outlined", "text", "soft"];

const buttons = () => LABELS.map((label) => <Button key={label}>{label}</Button>);

/**
 * Groups of one variant story — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/button-group/examples/<variant>-<file>.html`.
 */
export function buttonGroupGroups(variant: ButtonVariant): ReactGroup[] {
  return [
    {
      title: "Colors",
      content: COLORS.map((color) => (
        <ButtonGroup key={color} variant={variant} color={color} aria-label={capitalize(color)}>
          {buttons()}
        </ButtonGroup>
      )),
    },
    {
      title: "Black & white",
      content: (
        <>
          <div data-ok-theme="light">
            <ButtonGroup variant={variant} color="black" aria-label="Black">
              {buttons()}
            </ButtonGroup>
          </div>
          <div data-ok-theme="dark">
            <ButtonGroup variant={variant} color="white" aria-label="White">
              {buttons()}
            </ButtonGroup>
          </div>
        </>
      ),
    },
    {
      title: "Disabled",
      content: (
        <ButtonGroup variant={variant} disabled aria-label="Disabled">
          {buttons()}
        </ButtonGroup>
      ),
    },
  ];
}

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: (["sm", "md", "lg"] as const).map((size) => (
      <ButtonGroup key={size} variant="contained" size={size} aria-label={`Size ${size}`}>
        {buttons()}
      </ButtonGroup>
    )),
  },
];

export const orientationGroups: ReactGroup[] = [
  {
    title: "Vertical",
    content: (
      <>
        {VARIANTS.map((variant) => (
          <ButtonGroup
            key={variant}
            orientation="vertical"
            variant={variant}
            aria-label={capitalize(variant)}
          >
            {buttons()}
          </ButtonGroup>
        ))}
        <ButtonGroup orientation="vertical" variant="contained" disabled aria-label="Disabled">
          {buttons()}
        </ButtonGroup>
      </>
    ),
  },
];

export const BUTTON_GROUP_FILES: GroupFiles = [
  ["Colors", "colors"],
  ["Black & white", "black-white"],
  ["Disabled", "disabled"],
];
export const SIZE_FILES: GroupFiles = [["Sizes", "group"]];
export const ORIENTATION_FILES: GroupFiles = [["Vertical", "group"]];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const BUTTON_GROUP_CONTROLS = {
  schema: buttonGroupOptions,
  keys: ["orientation", "size", "fullWidth", "disabled"],
} as const;
