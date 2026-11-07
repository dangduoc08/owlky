import { List, ListItem, ListItemButton, ListItemText, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";

const OPTIONS = [
  "Choose what to show",
  "Show all notification content",
  "Hide sensitive notification content",
  "Hide all notification content",
];

/** A setting whose value is picked from a menu; the menu opens on the current choice. */
export function SelectedMenuDemo() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [selected, setSelected] = useState(1);
  return (
    <>
      <List aria-label="Device settings">
        <ListItem disablePadding>
          <ListItemButton
            id="menu-selected-button"
            aria-haspopup="menu"
            aria-expanded={anchor !== null}
            aria-controls="menu-selected"
            onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
          >
            <ListItemText primary="When device is locked" secondary={OPTIONS[selected]} />
          </ListItemButton>
        </ListItem>
      </List>
      <Menu
        id="menu-selected"
        aria-labelledby="menu-selected-button"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        {OPTIONS.map((option, index) => (
          <MenuItem
            key={option}
            disabled={index === 0}
            selected={index === selected}
            onClick={() => setSelected(index)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
