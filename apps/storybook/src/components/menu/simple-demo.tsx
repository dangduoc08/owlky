import { Button, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";

/** A button that opens a menu below it. */
export function SimpleMenuDemo() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        id="menu-simple-button"
        variant="outlined"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls="menu-simple"
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Open menu
      </Button>
      <Menu
        id="menu-simple"
        aria-labelledby="menu-simple-button"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        <MenuItem>Profile</MenuItem>
        <MenuItem>My account</MenuItem>
        <MenuItem>Logout</MenuItem>
      </Menu>
    </>
  );
}
