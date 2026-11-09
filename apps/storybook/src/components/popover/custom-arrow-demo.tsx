import type { Placement } from "@owlky/core";
import { Button, Popover, Typography } from "@owlky/react";
import { useState } from "react";

/**
 * Each button is named after where its arrow sits on the popover: `top-left` puts the arrow on
 * the top edge, near the left, so the popover opens below the button (`placement="bottom-start"`).
 */
const ARROWS: [string, [arrow: string, placement: Placement][]][] = [
  [
    "top",
    [
      ["top-left", "bottom-start"],
      ["top-center", "bottom"],
      ["top-right", "bottom-end"],
    ],
  ],
  [
    "bottom",
    [
      ["bottom-left", "top-start"],
      ["bottom-center", "top"],
      ["bottom-right", "top-end"],
    ],
  ],
  [
    "left",
    [
      ["left-top", "right-start"],
      ["left-center", "right"],
      ["left-bottom", "right-end"],
    ],
  ],
  [
    "right",
    [
      ["right-top", "left-start"],
      ["right-center", "left"],
      ["right-bottom", "left-end"],
    ],
  ],
];

/** Every arrow position: the popover opens on the opposite side of its button. */
export function CustomArrowDemo() {
  const [open, setOpen] = useState<{ arrow: string; anchor: HTMLElement } | null>(null);
  const all = ARROWS.flatMap(([, items]) => items);
  return (
    <>
      {ARROWS.map(([side, items]) => (
        <div key={side}>
          {items.map(([arrow]) => (
            <Button
              key={arrow}
              variant="outlined"
              aria-haspopup="dialog"
              aria-expanded={open?.arrow === arrow}
              aria-controls={`popover-arrow-${arrow}`}
              onClick={(event) =>
                setOpen(open?.arrow === arrow ? null : { arrow, anchor: event.currentTarget })
              }
            >
              {arrow}
            </Button>
          ))}
        </div>
      ))}
      {all.map(([arrow, placement]) => (
        <Popover
          key={arrow}
          id={`popover-arrow-${arrow}`}
          role="dialog"
          aria-label={`Arrow ${arrow}`}
          placement={placement}
          arrow
          open={open?.arrow === arrow}
          anchorEl={open?.arrow === arrow ? open.anchor : null}
          onOpenChange={() => setOpen(null)}
        >
          <div>
            <Typography variant="subtitle1">Arrow {arrow}</Typography>
            <Typography variant="body2" color="textSecondary">
              The arrow points at the button that opened this popover.
            </Typography>
          </div>
        </Popover>
      ))}
    </>
  );
}
