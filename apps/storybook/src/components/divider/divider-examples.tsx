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
import type { GroupFiles } from "../shared/snippets.js";

const P =
  "Owlky lines up content with dividers between sections, so related items read as one group.";

/** Toolbar icons (decorative, same SVG as the HTML snippets). */
function LinesIcon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
LinesIcon.displayName = "LinesIcon";

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
 * reference, the list sits on an outlined Paper and the icon group on an outlined Card; the
 * `sb-divider-*` classes are story-only layout (`.storybook/preview.css`). In a list, a divider
 * sits in its own `<li>`: a list may only hold list items.
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
      <div className="sb-divider-row">
        <Word text="Inbox" />
        <Divider orientation="vertical" />
        <Word text="Drafts" />
        <Divider orientation="vertical" />
        <Word text="Trash" />
      </div>
    ),
  },
];

export const flexItemGroups: ReactGroup[] = [
  {
    title: "Flex item",
    content: (
      <div className="sb-divider-row">
        <Word text="Left" />
        <Divider orientation="vertical" flexItem />
        <Word text="Center" />
        <Divider variant="middle" orientation="vertical" flexItem />
        <Word text="Right" />
      </div>
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
          <LinesIcon d="M4 6h16M4 12h10M4 18h16" />
        </IconButton>
        <IconButton aria-label="Align center">
          <LinesIcon d="M4 6h16M7 12h10M4 18h16" />
        </IconButton>
        <IconButton aria-label="Align right">
          <LinesIcon d="M4 6h16M10 12h10M4 18h16" />
        </IconButton>
        <Divider variant="middle" orientation="vertical" flexItem />
        <IconButton aria-label="Bold">
          <LinesIcon d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" />
        </IconButton>
      </Card>
    ),
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls (ADR-0015): options that change every example at once. */
export const DIVIDER_CONTROLS = { schema: dividerOptions, keys: ["variant"] } as const;
