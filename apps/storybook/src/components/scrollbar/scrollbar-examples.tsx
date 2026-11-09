import { scrollbarOptions } from "@owlky/core";
import { Alert, Scrollbar, Typography } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import text from "./scrollbar-text.json" with { type: "json" };

/**
 * The same markup as `packages/html/src/components/scrollbar/examples/<story>-group.html`.
 * The frame, the wide paragraphs and the Layout regions are story-only demo styling
 * (`.storybook/preview.css`).
 */
const paragraphs = [...text, ...text];

export const verticalGroups: ReactGroup[] = [
  {
    title: "Vertical",
    content: (
      <Scrollbar>
        {paragraphs.map((p, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static demo text repeats.
          <p key={i}>{p}</p>
        ))}
      </Scrollbar>
    ),
  },
];

export const horizontalGroups: ReactGroup[] = [
  {
    title: "Horizontal",
    content: (
      <Scrollbar>
        {text.map((p) => (
          <p key={p} className="sb-wide">
            {p}
          </p>
        ))}
      </Scrollbar>
    ),
  },
];

export const layoutGroups: ReactGroup[] = [
  {
    title: "Layout",
    content: (
      <div className="sb-layout">
        <div className="sb-layout-top">Top</div>
        <div className="sb-layout-left">Left</div>
        <div className="sb-layout-main">
          <Alert severity="success">Your changes were saved.</Alert>
          <Scrollbar>
            <Typography variant="h6" component="h4">
              Scrolling inside a page layout
            </Typography>
            {paragraphs.map((p, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static demo text repeats.
              <p key={i}>{p}</p>
            ))}
          </Scrollbar>
        </div>
        <div className="sb-layout-right">Right</div>
        <div className="sb-layout-bottom">Bottom</div>
      </div>
    ),
  },
];

export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const SCROLLBAR_CONTROLS = {
  schema: scrollbarOptions,
  keys: ["autoHide"],
} as const;
