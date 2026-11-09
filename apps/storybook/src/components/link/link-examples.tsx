import { type LinkColor, linkOptions } from "@owlky/core";
import { Link, Typography } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/*
 * The same markup, in the same order, as
 * `packages/html/src/components/link/examples/<story>-<file>.html`.
 */

export const basicGroups: ReactGroup[] = [
  {
    title: "Basic links",
    content: (
      <>
        <Link href="#basic-default">Default link</Link>
        <Link href="#basic-inherit" color="inherit">
          Link in the parent's color
        </Link>
        <Link href="#basic-body2" variant="body2">
          Link in the body2 style
        </Link>
      </>
    ),
  },
];

export const underlineGroups: ReactGroup[] = [
  {
    title: "Underline",
    content: (
      <>
        <Link href="#underline-none" underline="none">
          No underline
        </Link>
        <Link href="#underline-hover" underline="hover">
          Underline on hover
        </Link>
        <Link href="#underline-always" underline="always">
          Underline always
        </Link>
      </>
    ),
  },
];

const COLORS: [LinkColor, string][] = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["info", "Info"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["error", "Error"],
  ["textPrimary", "Text primary"],
  ["textSecondary", "Text secondary"],
  ["inherit", "Inherit"],
];

export const colorGroups: ReactGroup[] = [
  {
    title: "Colors",
    content: (
      <>
        {COLORS.map(([color, label]) => (
          <Link key={color} href={`#color-${color}`} color={color}>
            {`${label} link`}
          </Link>
        ))}
      </>
    ),
  },
];

export const accessibilityGroups: ReactGroup[] = [
  {
    title: "Link in text",
    content: (
      <Typography variant="body2" color="textSecondary" className="sb-link-text">
        {
          "Links in a sentence keep their underline, so you can tell them apart without color. Read the "
        }
        <Link href="#accessibility-guide">accessibility guide</Link>
        {" or the "}
        <Link href="#accessibility-checklist" color="inherit">
          release checklist
        </Link>
        .
      </Typography>
    ),
  },
  {
    title: "Button link",
    content: (
      <Link component="button" variant="body2">
        Show more details
      </Link>
    ),
  },
  {
    title: "New tab",
    content: (
      <Link
        href="https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context"
        target="_blank"
        aria-label="Link purpose in context (opens in a new tab)"
      >
        Link purpose in context
      </Link>
    ),
  },
];

/** Options that change every example at once (Basic links). */
export const LINK_CONTROLS = {
  schema: linkOptions,
  keys: ["color", "underline"],
} as const;

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

export const ACCESSIBILITY_FILES: GroupFiles = [
  ["Link in text", "text"],
  ["Button link", "button"],
  ["New tab", "new-tab"],
];
