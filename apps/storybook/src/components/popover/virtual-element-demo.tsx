import { Popover, type PopoverVirtualAnchor, Typography } from "@owlky/react";
import { useEffect, useRef, useState } from "react";

/** Select text in the paragraph: a popover opens next to the selection, a virtual anchor. */
export function VirtualElementDemo() {
  const text = useRef<HTMLElement>(null);
  const [anchor, setAnchor] = useState<PopoverVirtualAnchor | null>(null);
  useEffect(() => {
    // The selected range, when it lies in the paragraph.
    const selected = () => {
      const selection = document.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const inside =
        range && !range.collapsed && text.current?.contains(range.commonAncestorContainer);
      return inside ? range : null;
    };
    // Open once the selection is made, close as soon as it is gone.
    const onSelected = () => {
      const range = selected();
      setAnchor(range ? { getBoundingClientRect: () => range.getBoundingClientRect() } : null);
    };
    const onChange = () => {
      if (!selected()) setAnchor(null);
    };
    document.addEventListener("pointerup", onSelected);
    document.addEventListener("keyup", onSelected);
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("pointerup", onSelected);
      document.removeEventListener("keyup", onSelected);
      document.removeEventListener("selectionchange", onChange);
    };
  }, []);
  return (
    <>
      <Typography ref={text} variant="body2">
        Select some words of this sentence: a popover opens next to the selection.
      </Typography>
      <Popover
        id="popover-selection"
        open={anchor !== null}
        anchorEl={anchor}
        placement="top"
        arrow
        disableAutoFocus
        disableRestoreFocus
      >
        <Typography variant="body2">You selected some text.</Typography>
      </Popover>
    </>
  );
}
