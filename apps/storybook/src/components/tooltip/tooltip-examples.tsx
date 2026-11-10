import { type Placement, tooltipOptions } from "@owlky/core";
import { Button, Fab, IconButton, Tooltip } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

const LONG =
  "Tooltips wrap their text at 300px by default. Set a wider maximum for longer help, or turn wrapping off for short labels that must stay on one line.";

/**
 * The same markup as `packages/html/src/components/tooltip/examples/<story>-group.html`. Icon
 * buttons are named by their tooltip (`aria-labelledby`); buttons with text are described by it
 * (`describeChild`).
 */
export const simpleGroups: ReactGroup[] = [
  {
    title: "Simple",
    content: (
      <div>
        <Tooltip id="tooltip-delete" title="Delete">
          <IconButton>
            <DemoIcon name="trash" />
          </IconButton>
        </Tooltip>
        <Tooltip id="tooltip-add" title="Add">
          <Fab color="primary">
            <DemoIcon name="plus" />
          </Fab>
        </Tooltip>
        <Tooltip id="tooltip-delete-info" title="Delete">
          <IconButton color="info">
            <DemoIcon name="trash" />
          </IconButton>
        </Tooltip>
        <Tooltip id="tooltip-add-info" title="Add">
          <Fab color="info">
            <DemoIcon name="plus" />
          </Fab>
        </Tooltip>
        <Tooltip id="tooltip-button" title="Adds an item" describeChild>
          <Button variant="outlined" color="info">
            Button
          </Button>
        </Tooltip>
      </div>
    ),
  },
];

export const arrowGroups: ReactGroup[] = [
  {
    title: "Arrow",
    content: (
      <div>
        <Tooltip id="tooltip-arrow" title="Add" arrow>
          <Fab color="primary">
            <DemoIcon name="plus" />
          </Fab>
        </Tooltip>
      </div>
    ),
  },
];

export const widthGroups: ReactGroup[] = [
  {
    title: "Variable width",
    content: (
      <div>
        <Tooltip id="tooltip-width-default" title={LONG} describeChild>
          <Button>Default width [300px]</Button>
        </Tooltip>
        <Tooltip id="tooltip-width-custom" title={LONG} describeChild>
          <Button>Custom width [500px]</Button>
        </Tooltip>
        <Tooltip id="tooltip-width-none" title={LONG} describeChild>
          <Button>No wrapping</Button>
        </Tooltip>
      </div>
    ),
  },
];

export const transitionGroups: ReactGroup[] = [
  {
    title: "Transitions",
    content: (
      <div>
        <Tooltip id="tooltip-grow" title="Grows in" describeChild>
          <Button>Grow</Button>
        </Tooltip>
        <Tooltip id="tooltip-fade" title="Fades in" transition="fade" describeChild>
          <Button>Fade</Button>
        </Tooltip>
        <Tooltip id="tooltip-zoom" title="Zooms in" transition="zoom" describeChild>
          <Button>Zoom</Button>
        </Tooltip>
      </div>
    ),
  },
];

const POSITIONED: [Placement, "primary" | "secondary" | "warning" | "info"][] = [
  ["top-start", "primary"],
  ["top", "primary"],
  ["top-end", "primary"],
  ["bottom-start", "secondary"],
  ["bottom", "secondary"],
  ["bottom-end", "secondary"],
  ["left-start", "warning"],
  ["left", "warning"],
  ["left-end", "warning"],
  ["right-start", "info"],
  ["right", "info"],
  ["right-end", "info"],
];

export const positionedGroups: ReactGroup[] = [
  {
    title: "Positioned",
    content: (
      <div>
        {POSITIONED.map(([placement, color]) => (
          <Tooltip
            key={placement}
            id={`tooltip-${placement}`}
            title={`Placement ${placement}`}
            placement={placement}
            describeChild
          >
            <Button variant="contained" color={color}>
              {placement}
            </Button>
          </Tooltip>
        ))}
      </div>
    ),
  },
];

export const followCursorGroups: ReactGroup[] = [
  {
    title: "Follow cursor",
    content: (
      <div>
        <Tooltip
          id="tooltip-follow"
          title="The tooltip follows the pointer"
          followCursor
          describeChild
        >
          <Button variant="outlined" size="lg">
            Move the pointer over this button
          </Button>
        </Tooltip>
        <Tooltip
          id="tooltip-next"
          title="Opens sooner after another tooltip"
          enterDelay={500}
          enterNextDelay={100}
          describeChild
        >
          <Button variant="outlined" size="lg">
            Slow to open
          </Button>
        </Tooltip>
      </div>
    ),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const TOOLTIP_CONTROLS = { schema: tooltipOptions, keys: ["arrow"] } as const;
