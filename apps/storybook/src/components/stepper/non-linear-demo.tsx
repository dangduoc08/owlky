import { Button, Paper, Step, StepButton, Stepper, Typography } from "@owlky/react";
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

/** A non-linear stepper: every step is a button, so steps can be visited in any order. */
export function NonLinearDemo() {
  const [active, setActive] = useState(0);
  return (
    <div className="sb-stepper-demo">
      <Stepper nonLinear activeStep={active} aria-label="Project setup">
        {STEPS.map((step, index) => (
          <Step key={step.label}>
            <StepButton optional={step.optional} onClick={() => setActive(index)}>
              {step.label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <Paper elevation={0} className="sb-stepper-panel">
        {active < STEPS.length ? (
          <Typography variant="body2">{STEPS[active]?.text}</Typography>
        ) : (
          <div>
            <Typography variant="body2">All steps visited. Your project is ready.</Typography>
            <Button color="inherit" onClick={() => setActive(0)}>
              Reset
            </Button>
          </div>
        )}
      </Paper>
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
