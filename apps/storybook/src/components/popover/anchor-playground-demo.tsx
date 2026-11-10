import {
  Button,
  FormControlLabel,
  Popover,
  type PopoverAnchorReference,
  Radio,
  RadioGroup,
  Typography,
} from "@owlky/react";
import { useState } from "react";

/** One popover, positioned by its anchor element or by a point in the viewport. */
export function AnchorPlaygroundDemo() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [reference, setReference] = useState<PopoverAnchorReference>("anchorEl");
  return (
    <>
      <RadioGroup
        row
        name="anchor-reference"
        aria-label="Anchor reference"
        value={reference}
        onChange={(value) => setReference(value as PopoverAnchorReference)}
      >
        <FormControlLabel value="anchorEl" control={<Radio />} label="Anchor element" />
        <FormControlLabel value="anchorPosition" control={<Radio />} label="Anchor position" />
      </RadioGroup>
      <Button
        variant="contained"
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        aria-controls="popover-playground"
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Open popover
      </Button>
      <Popover
        id="popover-playground"
        role="dialog"
        aria-label="Playground"
        placement="bottom-start"
        anchorReference={reference}
        anchorPosition={{ top: 200, left: 400 }}
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        <Typography variant="body2">
          With an anchor position, the popover opens 200px from the top and 400px from the left.
        </Typography>
      </Popover>
    </>
  );
}
