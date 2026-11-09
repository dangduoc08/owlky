import { Button, Step, StepLabel, Stepper, Typography } from "@owlky/react";
import { useState } from "react";

const STEPS = [
  { label: "Choose a plan", text: "Pick the plan and the billing period that suit your team." },
  {
    label: "Add details",
    optional: "Optional",
    text: "Name the project and invite the people who will work on it.",
  },
  { label: "Review and confirm", text: "Check the summary, then confirm to create the project." },
];

/** A linear stepper: Next completes the current step, Back returns to the previous one. */
export function HorizontalDemo({ alternativeLabel = false }: { alternativeLabel?: boolean }) {
  const [active, setActive] = useState(0);
  return (
    <div className="sb-stepper-demo">
      <Stepper activeStep={active} alternativeLabel={alternativeLabel} aria-label="Project setup">
        {STEPS.map((step) => (
          <Step key={step.label}>
            <StepLabel optional={step.optional}>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className="sb-stepper-panel">
        {active < STEPS.length ? (
          <Typography variant="body2">{STEPS[active]?.text}</Typography>
        ) : (
          <div>
            <Typography variant="body2">All steps completed. Your project is ready.</Typography>
            <Button color="inherit" onClick={() => setActive(0)}>
              Reset
            </Button>
          </div>
        )}
      </div>
      <div className="sb-stepper-actions">
        <Button color="inherit" disabled={active === 0} onClick={() => setActive(active - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          color="inherit"
          onClick={() => setActive(Math.min(active + 1, STEPS.length))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
