import {
  List,
  ListItem,
  ListItemButton,
  ListItemExpandIcon,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

/** A nested list that the Inbox button opens and closes (open at first). */
export function NestedDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <List
        aria-labelledby="list-nested-subheader"
        subheader={<ListSubheader id="list-nested-subheader">Nested list items</ListSubheader>}
      >
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <DemoIcon name="send" />
            </ListItemIcon>
            <ListItemText primary="Sent mail" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <DemoIcon name="mail" />
            </ListItemIcon>
            <ListItemText primary="Drafts" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            aria-expanded={open ? "true" : "false"}
            aria-controls="list-nested-inbox"
            onClick={() => setOpen(!open)}
          >
            <ListItemIcon>
              <DemoIcon name="inbox" />
            </ListItemIcon>
            <ListItemText primary="Inbox" />
            <ListItemExpandIcon />
          </ListItemButton>
          <List id="list-nested-inbox" disablePadding hidden={!open}>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <DemoIcon name="star" />
                </ListItemIcon>
                <ListItemText primary="Starred" />
              </ListItemButton>
            </ListItem>
          </List>
        </ListItem>
      </List>
    </div>
  );
}
