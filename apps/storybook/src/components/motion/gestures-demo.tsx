import { Button, Card, Motion, Paper, Typography } from "@owlky/react";

/**
 * Gestures (roadmap 5.3): every draggable card is focusable and moves with the arrow keys too
 * (WCAG 2.5.7, 2.1.1). Constraints name their stage by id, so React and HTML write the same
 * markup. `.sb-gesture-*` classes are story-only layout.
 */
export function GestureDragDemo() {
  return (
    <div className="sb-gesture">
      <Paper id="gesture-drag-stage" className="sb-motion-stage sb-gesture-stage" elevation={0}>
        <Motion
          className="sb-gesture-item"
          drag
          dragConstraints="gesture-drag-stage"
          whileDrag={{ scale: 1.05 }}
          tabIndex={0}
          role="group"
          aria-label="Movable card"
          aria-describedby="gesture-drag-hint"
        >
          <Card className="sb-motion-card">
            <Typography variant="subtitle2">Drag me</Typography>
          </Card>
        </Motion>
      </Paper>
      <Typography id="gesture-drag-hint" variant="body2" color="textSecondary">
        Drag the card, or focus it and use the arrow keys. Hold Shift to move it further.
      </Typography>
    </div>
  );
}

/** Axis lock and direction lock: the page still scrolls along the free axis. */
export function GestureAxisDemo() {
  return (
    <Paper id="gesture-axis-stage" className="sb-motion-stage sb-gesture-stage" elevation={0}>
      <Motion
        className="sb-gesture-item"
        drag="x"
        dragConstraints="gesture-axis-stage"
        tabIndex={0}
        role="group"
        aria-label="Card that moves left and right"
      >
        <Card className="sb-motion-card">
          <Typography variant="subtitle2">Left and right</Typography>
        </Card>
      </Motion>
      <Motion
        className="sb-gesture-item"
        drag="y"
        dragConstraints="gesture-axis-stage"
        tabIndex={0}
        role="group"
        aria-label="Card that moves up and down"
      >
        <Card className="sb-motion-card">
          <Typography variant="subtitle2">Up and down</Typography>
        </Card>
      </Motion>
      <Motion
        className="sb-gesture-item"
        drag
        dragDirectionLock
        dragConstraints="gesture-axis-stage"
        tabIndex={0}
        role="group"
        aria-label="Card that keeps its first direction"
      >
        <Card className="sb-motion-card">
          <Typography variant="subtitle2">First direction</Typography>
        </Card>
      </Motion>
    </Paper>
  );
}

/** Elastic constraints and a spring back to the start. */
export function GestureSnapDemo() {
  return (
    <Paper className="sb-motion-stage sb-gesture-stage" elevation={0}>
      <Motion
        className="sb-gesture-item"
        drag
        dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
        dragElastic={0.2}
        tabIndex={0}
        role="group"
        aria-label="Card on a short elastic leash"
      >
        <Card className="sb-motion-card">
          <Typography variant="subtitle2">Elastic</Typography>
        </Card>
      </Motion>
      <Motion
        className="sb-gesture-item"
        drag
        dragSnapToOrigin
        whileDrag={{ scale: 1.1 }}
        tabIndex={0}
        role="group"
        aria-label="Card that springs back"
      >
        <Card className="sb-motion-card">
          <Typography variant="subtitle2">Springs back</Typography>
        </Card>
      </Motion>
    </Paper>
  );
}

/** Spring hover, tap and focus states: Enter and Space press the buttons too. */
export function GestureHoverTapDemo() {
  return (
    <div className="sb-row">
      <Motion className="sb-gesture-press" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button variant="contained">Spring</Button>
      </Motion>
      <Motion
        className="sb-gesture-press"
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", bounce: 0.5, duration: 400 }}
      >
        <Button variant="outlined">Bouncy</Button>
      </Motion>
      <Motion className="sb-gesture-press" whileHover={{ rotate: 4 }} whileFocus={{ scale: 1.08 }}>
        <Button variant="soft">Focus me</Button>
      </Motion>
    </div>
  );
}
