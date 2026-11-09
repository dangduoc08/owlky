import { paperOptions } from "@owlky/core";
import { Paper } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/** The levels the Elevation story shows. */
const LEVELS = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24];

/**
 * The same markup as `packages/html/src/components/paper/examples/<story>-group.html`. The
 * `sb-paper-*` classes are story-only demo sizes (`.storybook/preview.css`): Paper has no size.
 */
export const basicGroups: ReactGroup[] = [
  {
    title: "Basic",
    content: (
      <>
        <Paper className="sb-paper-box" elevation={0} />
        <Paper className="sb-paper-box" />
        <Paper className="sb-paper-box" elevation={3} />
      </>
    ),
  },
];

export const elevationGroups: ReactGroup[] = [
  {
    title: "Elevation",
    content: (
      <>
        <div className="sb-paper-levels" data-ok-theme="light">
          {LEVELS.map((level) => (
            <Paper key={level} elevation={level}>{`elevation=${level}`}</Paper>
          ))}
        </div>
        <div className="sb-paper-levels" data-ok-theme="dark">
          {LEVELS.map((level) => (
            <Paper key={level} elevation={level}>{`elevation=${level}`}</Paper>
          ))}
        </div>
      </>
    ),
  },
];

export const variantGroups: ReactGroup[] = [
  {
    title: "Variants",
    content: (
      <>
        <Paper className="sb-paper-demo" variant="elevation">
          Default variant
        </Paper>
        <Paper className="sb-paper-demo" variant="outlined">
          Outlined variant
        </Paper>
      </>
    ),
  },
];

export const cornerGroups: ReactGroup[] = [
  {
    title: "Corners",
    content: (
      <>
        <Paper className="sb-paper-demo">Rounded corners</Paper>
        <Paper className="sb-paper-demo" square>
          Square corners
        </Paper>
      </>
    ),
  },
];

export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const PAPER_CONTROLS = { schema: paperOptions, keys: ["variant", "square"] } as const;
