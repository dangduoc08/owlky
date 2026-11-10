import { Button, Menu, MenuItem, MenuSubmenu } from "@owlky/react";
import { useState } from "react";

/** A menu whose items open submenus: arrows, hover or a click open them. */
export function NestedMenuDemo() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        id="menu-nested-button"
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls="menu-nested"
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Open menu
      </Button>
      <Menu
        id="menu-nested"
        aria-labelledby="menu-nested-button"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        <MenuItem>New file</MenuItem>
        <MenuSubmenu id="menu-nested-recent" label="Open recent">
          <MenuItem>report.pdf</MenuItem>
          <MenuItem>notes.txt</MenuItem>
          <MenuSubmenu id="menu-nested-archive" label="Archive">
            <MenuItem>2024.zip</MenuItem>
            <MenuItem>2023.zip</MenuItem>
          </MenuSubmenu>
        </MenuSubmenu>
        <MenuSubmenu id="menu-nested-share" label="Share">
          <MenuItem>Email</MenuItem>
          <MenuItem>Message</MenuItem>
          <MenuItem>Copy link</MenuItem>
        </MenuSubmenu>
        <MenuItem>Delete</MenuItem>
      </Menu>
    </>
  );
}
