import { dividerOptions } from "@owlky/core";
import {
  Card,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const P =
  "Owlky lines up content with dividers between sections, so related items read as one group.";

/** A one-line, non-interactive list row (Variants). */
function TextRow({ text }: { text: string }) {
  return (
    <ListItem>
      <ListItemText primary={text} />
    </ListItem>
  );
}
TextRow.displayName = "TextRow";

/** A word between vertical dividers (Orientation, Flex item). */
function Word({ text }: { text: string }) {
  return (
    <Typography variant="body2" component="span" color="textSecondary">
      {text}
    </Typography>
  );
}
Word.displayName = "Word";

/** A paragraph between dividers (With children). */
function Paragraph() {
  return (
    <Typography variant="body2" color="textSecondary">
      {P}
    </Typography>
  );
}
Paragraph.displayName = "Paragraph";

/**
 * The same markup as `packages/html/src/components/divider/examples/<story>-group.html`. As in the
 * reference, the list sits on an outlined Paper and the icon group on an outlined Card; the rows
 * of words sit on outlined Papers too. The `sb-divider-*` classes are story-only layout
 * (`.storybook/preview.css`). In a list, a divider sits in its own `<li>`: a list may only hold
 * list items.
 */
export const variantGroups: ReactGroup[] = [
  {
    title: "Variants",
    content: (
      <Paper variant="outlined">
        <List>
          <TextRow text="Full width variant below" />
          <li>
            <Divider />
          </li>
          <TextRow text="Inset variant below" />
          <li>
            <Divider variant="inset" />
          </li>
          <TextRow text="Middle variant below" />
          <li>
            <Divider variant="middle" />
          </li>
          <TextRow text="List item" />
        </List>
      </Paper>
    ),
  },
];

export const orientationGroups: ReactGroup[] = [
  {
    title: "Orientation",
    content: (
      <Paper variant="outlined" className="sb-divider-row">
        <Word text="Inbox" />
        <Divider orientation="vertical" />
        <Word text="Drafts" />
        <Divider orientation="vertical" />
        <Word text="Trash" />
      </Paper>
    ),
  },
];

export const flexItemGroups: ReactGroup[] = [
  {
    title: "Flex item",
    content: (
      <Paper variant="outlined" className="sb-divider-row">
        <Word text="Left" />
        <Divider orientation="vertical" flexItem />
        <Word text="Center" />
        <Divider variant="middle" orientation="vertical" flexItem />
        <Word text="Right" />
      </Paper>
    ),
  },
];

export const childrenGroups: ReactGroup[] = [
  {
    title: "With children",
    content: (
      <div className="sb-divider-text">
        <Paragraph />
        <Divider>Center</Divider>
        <Paragraph />
        <Divider textAlign="left">Left</Divider>
        <Paragraph />
        <Divider textAlign="right">Right</Divider>
        <Paragraph />
        <Divider>
          <Chip label="Chip" size="small" />
        </Divider>
        <Paragraph />
      </div>
    ),
  },
];

export const iconGroups: ReactGroup[] = [
  {
    title: "Icon grouping",
    content: (
      <Card
        variant="outlined"
        className="sb-divider-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <IconButton aria-label="Align left">
          <SolarIcon name="align-left-linear" />
        </IconButton>
        <IconButton aria-label="Align center">
          <SolarIcon name="align-horizontal-center-linear" />
        </IconButton>
        <IconButton aria-label="Align right">
          <SolarIcon name="align-right-linear" />
        </IconButton>
        <Divider variant="middle" orientation="vertical" flexItem />
        <IconButton aria-label="Bold">
          <SolarIcon name="text-bold-linear" />
        </IconButton>
      </Card>
    ),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const DIVIDER_CONTROLS = { schema: dividerOptions, keys: ["variant"] } as const;
