import { type TypographyColor, typographyOptions } from "@owlky/core";
import { Typography } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

const TEXT =
  "Owlky sets every step of the type scale from tokens, so headings and body text stay in proportion on every screen.";

/*
 * The same markup, in the same order, as
 * `packages/html/src/components/typography/examples/<story>-<file>.html`. The wrappers are
 * story-only demo markup (`.storybook/preview.css`).
 */

export const usageGroups: ReactGroup[] = [
  {
    title: "Usage",
    content: (
      <div className="sb-typography">
        <Typography variant="h1" gutterBottom>
          h1. Heading
        </Typography>
        <Typography variant="h2" gutterBottom>
          h2. Heading
        </Typography>
        <Typography variant="h3" gutterBottom>
          h3. Heading
        </Typography>
        <Typography variant="h4" gutterBottom>
          h4. Heading
        </Typography>
        <Typography variant="h5" gutterBottom>
          h5. Heading
        </Typography>
        <Typography variant="h6" gutterBottom>
          h6. Heading
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {`subtitle1. ${TEXT}`}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {`subtitle2. ${TEXT}`}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {`body1. ${TEXT}`}
        </Typography>
        <Typography variant="body2" gutterBottom>
          {`body2. ${TEXT}`}
        </Typography>
        <Typography variant="button" component="div" gutterBottom>
          button text
        </Typography>
        <Typography variant="caption" component="div" gutterBottom>
          caption text
        </Typography>
        <Typography variant="overline" component="div" gutterBottom>
          overline text
        </Typography>
      </div>
    ),
  },
];

/** Theme keys: plain markup styled with the variant's tokens, without the component. */
export const themeKeysGroups: ReactGroup[] = [
  {
    title: "Theme keys",
    content: <div className="sb-typography-theme-keys">This div uses the button text style.</div>,
  },
];

export const semanticGroups: ReactGroup[] = [
  {
    title: "Changing the semantic element",
    content: (
      <div className="sb-typography">
        <Typography variant="h4" component="h2" gutterBottom>
          An h2 element in the h4 style
        </Typography>
        <Typography variant="subtitle1" component="p" gutterBottom>
          A paragraph in the subtitle1 style
        </Typography>
        <Typography variant="body2" variantMapping={{ body2: "div" }}>
          A div in the body2 style, through the variant mapping
        </Typography>
      </div>
    ),
  },
];

const COLORS: [TypographyColor, string][] = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["info", "Info"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["error", "Error"],
  ["textPrimary", "Text primary"],
  ["textSecondary", "Text secondary"],
  ["textDisabled", "Text disabled"],
];

export const colorGroups: ReactGroup[] = [
  {
    title: "Colors",
    content: (
      <div className="sb-typography">
        {COLORS.map(([color, label]) => (
          <Typography key={color} color={color}>
            {label}
          </Typography>
        ))}
      </div>
    ),
  },
];

export const alignmentGroups: ReactGroup[] = [
  {
    title: "Align",
    content: (
      <div className="sb-typography">
        <Typography align="left" gutterBottom>
          Left
        </Typography>
        <Typography align="center" gutterBottom>
          Center
        </Typography>
        <Typography align="right" gutterBottom>
          Right
        </Typography>
        <Typography align="justify">{TEXT}</Typography>
      </div>
    ),
  },
  {
    title: "No wrap",
    content: (
      <div className="sb-typography-narrow">
        <Typography noWrap>{TEXT}</Typography>
      </div>
    ),
  },
];

/** Options that change every example at once (Usage). */
export const TYPOGRAPHY_CONTROLS = {
  schema: typographyOptions,
  keys: ["color", "align", "noWrap"],
} as const;

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];
