import { Button, Paper, Step, StepContent, StepLabel, Stepper, Typography } from "@owlky/react";
import { useState } from "react";

const STEPS = [
  { label: "Choose a plan", text: "Pick the plan and the billing period that suit your team." },
  { label: "Add details", text: "Name the project and invite the people who will work on it." },
  {
    label: "Review and confirm",
    optional: "Last step",
    text: "Check the summary, then confirm to create the project.",
  },
];

/** A vertical stepper: the active step shows its content and its own buttons. */
export function VerticalDemo() {
  const [active, setActive] = useState(0);
  return (
    <div className="sb-stepper-demo">
      <Stepper activeStep={active} orientation="vertical" aria-label="Project setup">
        {STEPS.map((step, index) => (
          <Step key={step.label}>
            <StepLabel optional={step.optional}>{step.label}</StepLabel>
            <StepContent>
              <Typography variant="body2">{step.text}</Typography>
              <div className="sb-stepper-actions">
                <Button variant="contained" color="inherit" onClick={() => setActive(active + 1)}>
                  {index === STEPS.length - 1 ? "Finish" : "Continue"}
                </Button>
                <Button
                  color="inherit"
                  disabled={active === 0}
                  onClick={() => setActive(active - 1)}
                >
                  Back
                </Button>
              </div>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {active === STEPS.length && (
        <Paper elevation={0} className="sb-stepper-panel">
          <Typography variant="body2">All steps completed. Your project is ready.</Typography>
          <Button color="inherit" onClick={() => setActive(0)}>
            Reset
          </Button>
        </Paper>
      )}
    </div>
  );
}
