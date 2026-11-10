import { MenuItem, MenuList, Paper } from "@owlky/react";

/** A menu always on screen: a MenuList on a Paper, without a popover. */
export function MenuListDemo() {
  return (
    <Paper>
      <MenuList aria-label="Account" variant="menu">
        <MenuItem>Profile</MenuItem>
        <MenuItem selected>My account</MenuItem>
        <MenuItem disabled>Billing</MenuItem>
        <MenuItem>Logout</MenuItem>
      </MenuList>
    </Paper>
  );
}
