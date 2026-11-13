import { IconButton, Menu, MenuItem } from "@owlky/react";
import { useState } from "react";
import { SolarIcon } from "../../helpers/solar-icons.js";

const MOONS = [
  "None",
  "Ariel",
  "Callisto",
  "Deimos",
  "Europa",
  "Ganymede",
  "Io",
  "Miranda",
  "Oberon",
  "Phobos",
  "Rhea",
  "Titan",
  "Triton",
];

/** A long menu that scrolls: 4.5 items tall, opened by an icon button. */
export function MaxHeightMenuDemo() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        aria-controls="menu-long"
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        <SolarIcon name="menu-dots-vertical-linear" />
      </IconButton>
      <Menu
        id="menu-long"
        aria-label="Moons"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        {MOONS.map((moon) => (
          <MenuItem key={moon} selected={moon === "Phobos"}>
            {moon}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
