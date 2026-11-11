import { type TypographyColor, typographyOptions } from "@owlky/core";
import { Link, Typography } from "@owlky/react";
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

const LONG_TEXT =
  "Owlky clamps long text to a fixed number of lines, so cards and lists keep the same height. The last visible line ends with an ellipsis, and the full text stays in the page for screen readers and search.";

/** Text max line: one group per line count, a link, and persistent short text. */
export const maxLineGroups: ReactGroup[] = [
  ...([1, 2, 3, 4] as const).map((lines) => ({
    title: lines === 1 ? "1 line" : `${lines} lines`,
    content: (
      <div className="sb-typography-narrow">
        <Typography maxLines={lines}>{LONG_TEXT}</Typography>
      </div>
    ),
  })),
  {
    title: "As link",
    content: (
      <div className="sb-typography-narrow">
        <Link href="#text-max-line-link" variant="body1" underline="hover" maxLines={3}>
          {LONG_TEXT}
        </Link>
      </div>
    ),
  },
  {
    title: "Persistent",
    content: (
      <div className="sb-typography-narrow">
        <Typography variant="h6" component="p" maxLines={3} persistent>
          Short text keeps the height of three lines.
        </Typography>
      </div>
    ),
  },
];

/** Snippet files of the Text max line story, in group order. */
export const MAX_LINE_FILES: GroupFiles = [
  ["1 line", "1-line"],
  ["2 lines", "2-lines"],
  ["3 lines", "3-lines"],
  ["4 lines", "4-lines"],
  ["As link", "as-link"],
  ["Persistent", "persistent"],
];

/** Options that change every example at once (Usage). */
export const TYPOGRAPHY_CONTROLS = {
  schema: typographyOptions,
  keys: ["color", "align", "noWrap"],
} as const;

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];
