import { type BadgeColor, badgeOptions } from "@owlky/core";
import { Avatar, Badge } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const COLORS: BadgeColor[] = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];
const mail = (
  <span role="img" aria-label="Messages">
    <SolarIcon name="letter-linear" />
  </span>
);
const text = <span>Typography</span>;

/** The same markup, in the same order, as `packages/html/src/components/badge/examples/<story>-group.html`. */
export const standardGroups: ReactGroup[] = [
  {
    title: "Standard",
    content: [
      ...COLORS.map((color) => (
        <Badge key={color} color={color} badgeContent={4}>
          {mail}
        </Badge>
      )),
      <Badge key="text" color="info" badgeContent={4}>
        {text}
      </Badge>,
    ],
  },
];

export const dotGroups: ReactGroup[] = [
  {
    title: "Dot",
    content: [
      ...COLORS.map((color) => (
        <Badge key={color} variant="dot" color={color}>
          {mail}
        </Badge>
      )),
      <Badge key="text" variant="dot" color="info">
        {text}
      </Badge>,
    ],
  },
];

export const statusGroups: ReactGroup[] = [
  {
    title: "Status",
    content: (["always", "online", "busy", "offline", "invisible"] as const).map((status) => (
      <Badge
        key={status}
        variant={status}
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Avatar role="img" aria-label="User">
          {""}
        </Avatar>
      </Badge>
    )),
  },
];

export const maximumGroups: ReactGroup[] = [
  {
    title: "Maximum value",
    content: [
      <Badge key="99" color="error" badgeContent={99}>
        {mail}
      </Badge>,
      <Badge key="100" color="error" badgeContent={100}>
        {mail}
      </Badge>,
      <Badge key="1000" color="error" badgeContent={1000} max={999}>
        {mail}
      </Badge>,
    ],
  },
];

const shape = (variant: "square" | "circular") => (
  <Avatar
    variant={variant}
    color="warning"
    role="img"
    aria-label={variant === "square" ? "Square" : "Circle"}
  >
    {""}
  </Avatar>
);
export const overlapGroups: ReactGroup[] = [
  {
    title: "Badge overlap",
    content: [
      <Badge key="1" color="info" badgeContent=" ">
        {shape("square")}
      </Badge>,
      <Badge key="2" color="info" variant="dot">
        {shape("square")}
      </Badge>,
      <Badge key="3" color="info" badgeContent=" " overlap="circular">
        {shape("circular")}
      </Badge>,
      <Badge key="4" color="info" variant="dot" overlap="circular">
        {shape("circular")}
      </Badge>,
    ],
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const BADGE_CONTROLS = {
  schema: badgeOptions,
  keys: ["overlap", "invisible"],
} as const;
