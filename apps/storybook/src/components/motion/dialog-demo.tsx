import type { DialogTransition } from "@owlky/react";
import { AlertDialogDemo } from "../dialog/dialog-demos.js";

const DEMOS: [DialogTransition, string, "info" | "success" | "warning" | "error"][] = [
  ["slideInUp", "Slide in up", "info"],
  ["zoomIn", "Zoom in", "success"],
  ["bounceInDown", "Bounce in down", "warning"],
  ["flipInX", "Flip in X", "error"],
];

/** Dialog: each button opens a dialog whose paper plays a Motion entrance (`transition`). */
export function MotionDialogDemo() {
  return (
    <div className="sb-row">
      {DEMOS.map(([transition, label, color]) => (
        <AlertDialogDemo
          key={transition}
          id={`motion-dialog-${transition}`}
          label={label}
          color={color}
          transition={transition}
        />
      ))}
    </div>
  );
}
