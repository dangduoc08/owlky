import { type ChipColor, type ChipVariant, chipOptions } from "@owlky/core";
import { Avatar, Chip } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { CheckIcon, FaceIcon, PEOPLE, portrait, TrashIcon } from "../avatar/display-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const COLORS: ChipColor[] = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
  "black",
  "white",
];
const noop = () => {};
const m = () => <Avatar>M</Avatar>;

/** The groups of one variant story, as in `<variant>-<group>.html`. */
export function variantGroups(variant: ChipVariant): ReactGroup[] {
  return [
    {
      title: "Colors",
      content: COLORS.flatMap((color) => [
        <Chip
          key={`${color}-c`}
          variant={variant}
          color={color}
          avatar={m()}
          label="Clickable"
          onClick={noop}
        />,
        <Chip
          key={`${color}-d`}
          variant={variant}
          color={color}
          avatar={m()}
          label="Deletable"
          onDelete={noop}
        />,
      ]),
    },
    {
      title: "Custom icons",
      content: [
        <Chip
          key="1"
          variant={variant}
          icon={<FaceIcon />}
          label="Custom icon"
          onDelete={noop}
          deleteIcon={<CheckIcon />}
        />,
        <Chip
          key="2"
          variant={variant}
          color="info"
          avatar={m()}
          label="Custom icon"
          onDelete={noop}
          deleteIcon={<TrashIcon />}
        />,
      ],
    },
    {
      title: "Disabled",
      content: [
        <Chip
          key="1"
          variant={variant}
          icon={<FaceIcon />}
          label="Disabled"
          onClick={noop}
          onDelete={noop}
          disabled
        />,
        <Chip
          key="2"
          variant={variant}
          avatar={<Avatar src={portrait(4)} alt={PEOPLE[3]} />}
          label="Disabled"
          onClick={noop}
          onDelete={noop}
          disabled
        />,
        <Chip
          key="3"
          variant={variant}
          avatar={m()}
          label="Disabled"
          onClick={noop}
          onDelete={noop}
          disabled
        />,
      ],
    },
    {
      title: "Sizes",
      content: [
        <Chip
          key="s"
          variant={variant}
          color="info"
          size="small"
          avatar={m()}
          label="Small"
          onDelete={noop}
        />,
        <Chip
          key="m"
          variant={variant}
          color="info"
          icon={<FaceIcon />}
          label="Medium"
          onDelete={noop}
        />,
      ],
    },
  ];
}

/** The "Clickable link" story (MUI's demo): chips whose action is a link. */
export function linkGroups(): ReactGroup[] {
  return [
    {
      title: "Clickable link",
      content: [
        <Chip key="f" label="Clickable link" href="#clickable-link" />,
        <Chip key="o" variant="outlined" label="Clickable link" href="#clickable-link" />,
        <Chip
          key="s"
          variant="soft"
          color="primary"
          avatar={m()}
          label="Deletable link"
          href="#clickable-link"
          onDelete={noop}
        />,
      ],
    },
  ];
}

/** Group title ↔ snippet file suffix of the link story (`link-clickable.html`). */
export const LINK_GROUP_FILES: GroupFiles = [["Clickable link", "clickable"]];

/** The link story's Controls: `disabled` is `aria-disabled` on links (no native attribute to write). */
export const CHIP_LINK_CONTROLS = { schema: chipOptions, keys: ["size"] } as const;

/** Group title ↔ snippet file suffix, in story order. */
export const GROUP_FILES: GroupFiles = [
  ["Colors", "colors"],
  ["Custom icons", "custom-icons"],
  ["Disabled", "disabled"],
  ["Sizes", "sizes"],
];

/** Story Controls (ADR-0015): options that change every example at once. */
export const CHIP_CONTROLS = { schema: chipOptions, keys: ["size", "disabled"] } as const;
