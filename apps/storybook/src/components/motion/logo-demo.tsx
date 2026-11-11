import { Motion } from "@owlky/react";
import { OwlLogo } from "./owl-logo.js";

/** The rings' shape-morphing loop: turn and grow while the corners round, then come back. */
const RING_RADIUS = ["25%", "25%", "50%", "50%", "25%"];
const LOOP = { duration: 3200, ease: "linear", repeat: Infinity } as const;

/**
 * Motion story "Logo" (the reference's animated logos, ADR-0062): custom keyframes played by the
 * engine. A pulsing logo inside two turning rings that morph between a rounded square and a
 * circle, and a small logo over a turning gradient disc. No hooks: the story's Controls and the
 * snippet generator expand it.
 */
export function MotionLogoDemo() {
  return (
    <div className="sb-row">
      <div className="sb-motion-logo-stage">
        <Motion
          trigger="mount"
          keyframes={{ scale: [1, 0.9, 0.9, 1, 1], opacity: [1, 0.48, 0.48, 1, 1] }}
          transition={{ duration: 2000, repeatDelay: 1000, repeat: Infinity, ease: "easeInOut" }}
        >
          <OwlLogo size={64} label="Owlky logo" />
        </Motion>
        <Motion
          trigger="mount"
          className="sb-motion-logo-ring sb-motion-logo-ring-outer"
          keyframes={{
            scale: [1, 1.2, 1.2, 1, 1],
            rotate: [0, 270, 270, 0, 0],
            opacity: [1, 0.25, 0.25, 0.25, 1],
            borderRadius: RING_RADIUS,
          }}
          transition={LOOP}
        />
        <Motion
          trigger="mount"
          className="sb-motion-logo-ring sb-motion-logo-ring-inner"
          keyframes={{
            scale: [1.6, 1, 1, 1.6, 1.6],
            rotate: [270, 0, 0, 270, 270],
            opacity: [0.25, 1, 1, 1, 0.25],
            borderRadius: RING_RADIUS,
          }}
          transition={LOOP}
        />
      </div>
      <div className="sb-motion-logo-stage sb-motion-logo-stage-small">
        <OwlLogo size={40} label="Owlky logo, small" />
        <Motion
          trigger="mount"
          className="sb-motion-logo-disc"
          keyframes={{ rotate: [0, 360] }}
          transition={{ duration: 10000, ease: "linear", repeat: Infinity }}
        />
      </div>
    </div>
  );
}
