import { fabOptions } from "@minimal-tailwind/core";
import { Fab, type FabColor, type FabVariant } from "@minimal-tailwind/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { MailIcon } from "../button/button-examples.js";
import type { GroupFiles } from "../shared/snippets.js";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const COLORS: FabColor[] = [
  "default",
  "inherit",
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

/**
 * Groups of one variant story — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/fab/examples/<variant>-<file>.html`.
 */
export function fabGroups(variant: FabVariant): ReactGroup[] {
  return [
    {
      title: "Round",
      content: COLORS.map((color) => (
        <Fab key={color} variant={variant} color={color} aria-label={capitalize(color)}>
          <MailIcon />
        </Fab>
      )),
    },
    {
      title: "Extended",
      content: COLORS.map((color) => (
        <Fab key={color} variant={variant} color={color} extended>
          <MailIcon />
          {capitalize(color)}
        </Fab>
      )),
    },
    {
      title: "Sizes",
      content: (
        <>
          {SIZES.map(([size, label]) => (
            <Fab key={size} variant={variant} color="info" size={size} aria-label={label}>
              <MailIcon />
            </Fab>
          ))}
          {SIZES.map(([size, label]) => (
            <Fab key={`x-${size}`} variant={variant} color="info" size={size} extended>
              <MailIcon />
              {label}
            </Fab>
          ))}
        </>
      ),
    },
    {
      title: "Disabled",
      content: (
        <>
          <Fab variant={variant} color="info" disabled aria-label="Disabled">
            <MailIcon />
          </Fab>
          <Fab variant={variant} color="info" disabled extended>
            <MailIcon />
            Disabled
          </Fab>
        </>
      ),
    },
  ];
}

export const animateGroups: ReactGroup[] = [
  {
    title: "With animate",
    content: SIZES.map(([size, label]) => (
      <Fab key={size} variant="soft" color="info" size={size} extended animate>
        <MailIcon />
        {label}
      </Fab>
    )),
  },
];

export const FAB_FILES: GroupFiles = [
  ["Round", "round"],
  ["Extended", "extended"],
  ["Sizes", "sizes"],
  ["Disabled", "disabled"],
];
export const FAB_ANIMATE_FILES: GroupFiles = [["With animate", "group"]];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const FAB_CONTROLS = { schema: fabOptions, keys: ["size", "disabled", "animate"] } as const;
