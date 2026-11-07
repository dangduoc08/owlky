import { type AvatarColor, avatarOptions } from "@owlky/core";
import { Avatar, AvatarGroup, Badge } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { FolderIcon, PEOPLE, portrait } from "./display-icons.js";

const PALETTE: AvatarColor[] = ["primary", "secondary", "info", "success", "warning", "error"];
const CYCLE: AvatarColor[] = ["default", ...PALETTE];
const person = (i: number, size?: number) => (
  <Avatar key={`${i}-${size}`} src={portrait(i)} alt={PEOPLE[i - 1]} size={size} />
);

/** The same markup, in the same order, as `packages/html/src/components/avatar/examples/<story>-group.html`. */
export const imageGroups: ReactGroup[] = [
  { title: "Image", content: [1, 2, 3, 4, 5].map((i) => person(i)) },
];

export const iconGroups: ReactGroup[] = [
  {
    title: "Icon",
    content: CYCLE.map((color) => (
      <Avatar key={color} color={color} role="img" aria-label="Folder">
        <FolderIcon />
      </Avatar>
    )),
  },
];

const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "1", "@", "#"];
export const letterGroups: ReactGroup[] = [
  {
    title: "Letter",
    content: LETTERS.map((letter, i) => (
      <Avatar key={letter} color={CYCLE[i % CYCLE.length]}>
        {letter}
      </Avatar>
    )),
  },
];

export const variantGroups: ReactGroup[] = [
  {
    title: "Variant",
    content: (["circular", "rounded", "square"] as const).map((variant) => (
      <Avatar
        key={variant}
        variant={variant}
        color="primary"
        role="img"
        aria-label={`${variant[0]?.toUpperCase()}${variant.slice(1)} folder`}
      >
        <FolderIcon />
      </Avatar>
    )),
  },
];

const letterGroup = (size: number) => (
  <AvatarGroup key={size} total={8} max={4}>
    <Avatar color="secondary" size={size}>
      D
    </Avatar>
    <Avatar color="error" size={size}>
      H
    </Avatar>
    <Avatar color="info" size={size}>
      R
    </Avatar>
    <Avatar size={size}>T</Avatar>
  </AvatarGroup>
);
const imageGroup = (size: number) => (
  <AvatarGroup key={size} total={8} max={4}>
    {[1, 2, 3, 4].map((i) => person(i, size))}
  </AvatarGroup>
);
export const groupedGroups: ReactGroup[] = [
  { title: "Grouped", content: [letterGroup(28), letterGroup(36), imageGroup(44), imageGroup(52)] },
];

const STATUSES = ["online", "always", "busy", "offline", "invisible"] as const;
export const withBadgeGroups: ReactGroup[] = [
  {
    title: "With badge",
    content: [
      <Badge
        key="avatar"
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        badgeContent={<Avatar src={portrait(2)} alt={PEOPLE[1]} size={20} />}
      >
        {person(1)}
      </Badge>,
      ...STATUSES.map((status, i) => (
        <Badge
          key={status}
          variant={status}
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          {person(3 + (i % 5))}
        </Badge>
      )),
    ],
  },
];

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: [24, 32, 48, 56, 64, 80, 128].map((size, i) => person((i % 7) + 1, size)),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const AVATAR_CONTROLS = { schema: avatarOptions, keys: ["variant"] } as const;
