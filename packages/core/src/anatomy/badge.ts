import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  style,
} from "../options/define.js";
import { avatarColors } from "./avatar.js";

// --- Badge ------------------------------------------------------------------------------------

export const badgeVariants = [
  "standard",
  "dot",
  "online",
  "always",
  "busy",
  "offline",
  "invisible",
] as const;
export const badgeOverlaps = ["rectangular", "circular"] as const;
export const badgeVerticals = ["top", "bottom"] as const;
export const badgeHorizontals = ["right", "left"] as const;
export type BadgeVariant = (typeof badgeVariants)[number];
export type BadgeColor = (typeof avatarColors)[number];
export type BadgeOverlap = (typeof badgeOverlaps)[number];
export interface BadgeAnchorOrigin {
  vertical: (typeof badgeVerticals)[number];
  horizontal: (typeof badgeHorizontals)[number];
}

export const badgeOptions = defineOptions("badge", "data-ok-badge", {
  variant: style(
    "data-ok-variant",
    badgeVariants,
    "standard",
    "A count, a dot, or a presence status (`online` `always` `busy` `offline` `invisible`).",
  ),
  color: style("data-ok-color", avatarColors, "default", "Badge color (standard and dot)."),
  overlap: style(
    "data-ok-overlap",
    badgeOverlaps,
    "rectangular",
    "Shape it sits on: `circular` moves it in, onto the circle's edge.",
  ),
  vertical: style("data-ok-vertical", badgeVerticals, "top", "React: `anchorOrigin.vertical`."),
  horizontal: style(
    "data-ok-horizontal",
    badgeHorizontals,
    "right",
    "React: `anchorOrigin.horizontal`.",
  ),
  invisible: flag("data-ok-invisible", "Hides the badge (it shrinks away)."),
});

export interface BadgeAnatomyOptions {
  variant?: BadgeVariant | undefined;
  color?: BadgeColor | undefined;
  overlap?: BadgeOverlap | undefined;
  anchorOrigin?: Partial<BadgeAnchorOrigin> | undefined;
  invisible?: boolean | undefined;
}

/** `data-ok-*` attributes of a badge's wrapper. */
export const badgeAttributes = (options: BadgeAnatomyOptions = {}): DataAttributes =>
  optionAttributes(badgeOptions, {
    ...options,
    vertical: options.anchorOrigin?.vertical,
    horizontal: options.anchorOrigin?.horizontal,
  });

/** What a standard badge shows: hidden for 0 (unless `showZero`), capped at `max` ("99+"). */
export function badgeContent(
  content: unknown,
  options: { max?: number | undefined; showZero?: boolean | undefined } = {},
): { content: unknown; invisible: boolean } {
  const max = typeof options.max === "number" && Number.isFinite(options.max) ? options.max : 99;
  if (typeof content === "number") {
    if (content === 0 && options.showZero !== true) return { content, invisible: true };
    return { content: content > max ? `${max}+` : content, invisible: false };
  }
  return { content, invisible: content === undefined || content === null || content === "" };
}
