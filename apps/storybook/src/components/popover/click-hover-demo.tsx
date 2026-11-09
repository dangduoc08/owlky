import { Button, Popover, Typography } from "@owlky/react";
import { useState } from "react";

/** A popover opened by a click, and one shown while the pointer (or focus) is on its trigger. */
export function ClickHoverDemo() {
  const [clicked, setClicked] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        variant="contained"
        aria-haspopup="dialog"
        aria-expanded={clicked !== null}
        aria-controls="popover-click"
        onClick={(event) => setClicked(clicked ? null : event.currentTarget)}
      >
        Click popover
      </Button>
      <Popover
        id="popover-click"
        role="dialog"
        aria-labelledby="popover-click-title"
        open={clicked !== null}
        anchorEl={clicked}
        onOpenChange={() => setClicked(null)}
      >
        <div>
          <Typography variant="subtitle1" id="popover-click-title">
            Quarterly summary
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Revenue grew in every region this quarter. Open the report for the details.
          </Typography>
        </div>
      </Popover>
      <Button
        variant="outlined"
        aria-expanded={hovered !== null}
        aria-controls="popover-hover"
        onPointerEnter={(event) => setHovered(event.currentTarget)}
        onPointerLeave={() => setHovered(null)}
        onFocus={(event) => setHovered(event.currentTarget)}
        onBlur={() => setHovered(null)}
      >
        Hover popover
      </Button>
      <Popover
        id="popover-hover"
        open={hovered !== null}
        anchorEl={hovered}
        disableAutoFocus
        disableRestoreFocus
      >
        <div>
          <Typography variant="subtitle1">Shown on hover</Typography>
          <Typography variant="body2" color="textSecondary">
            This popover follows the pointer and keyboard focus on its trigger.
          </Typography>
        </div>
      </Popover>
    </>
  );
}
