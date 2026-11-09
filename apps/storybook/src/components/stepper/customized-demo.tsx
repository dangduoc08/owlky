import { Button, Step, StepLabel, Stepper, Typography } from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

const STEPS = [
  { label: "Choose a plan", icon: "settings", text: "Pick the plan that suits your team." },
  { label: "Add details", icon: "userPlus", text: "Invite the people who will work on it." },
  { label: "Review and confirm", icon: "monitor", text: "Check the summary, then confirm." },
] as const;

/** Two looks of the same steps: dots, and large icon circles. */
export function CustomizedDemo() {
  const [active, setActive] = useState(0);
  return (
    <div className="sb-stepper-demo">
      <Stepper activeStep={active} alternativeLabel variant="dot" aria-label="Project setup">
        {STEPS.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Stepper
        activeStep={active}
        alternativeLabel
        variant="circle"
        aria-label="Project setup with icons"
      >
        {STEPS.map((step) => (
          <Step key={step.label}>
            <StepLabel icon={<DemoIcon name={step.icon} />}>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className="sb-stepper-panel">
        <Typography variant="body2">
          {active < STEPS.length ? STEPS[active]?.text : "All steps completed."}
        </Typography>
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
