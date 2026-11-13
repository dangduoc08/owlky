import {
  Card,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemExpandIcon,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@owlky/react";
import { useState } from "react";
import { SolarIcon } from "../../helpers/solar-icons.js";

/** A nested list that the Inbox button opens and closes (open at first). */
export function NestedDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <List
        aria-labelledby="list-nested-subheader"
        subheader={<ListSubheader id="list-nested-subheader">Nested list items</ListSubheader>}
      >
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <SolarIcon name="plain-linear" />
            </ListItemIcon>
            <ListItemText primary="Sent mail" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <SolarIcon name="letter-linear" />
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
              <SolarIcon name="inbox-linear" />
            </ListItemIcon>
            <ListItemText primary="Inbox" />
            <ListItemExpandIcon />
          </ListItemButton>
          <Collapse component={List} id="list-nested-inbox" in={open} timeout="auto" disablePadding>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <SolarIcon name="star-linear" />
                </ListItemIcon>
                <ListItemText primary="Starred" />
              </ListItemButton>
            </ListItem>
          </Collapse>
        </ListItem>
      </List>
    </Card>
  );
}
