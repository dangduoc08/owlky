import {
  Button,
  Divider,
  MobileStepper,
  type MobileStepperVariant,
  Paper,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

const STEPS = [
  { label: "Choose a plan", text: "Pick the plan and the billing period that suit your team." },
  { label: "Add details", text: "Name the project and invite the people who will work on it." },
  { label: "Review and confirm", text: "Check the summary, then confirm to create the project." },
];

/** An outlined Paper with a compact stepper below a divider: Back, the progress, Next. */
export function MobileDemo({ variant }: { variant: MobileStepperVariant }) {
  const [active, setActive] = useState(0);
  return (
    <Paper variant="outlined" className="sb-mobile-card">
      <div className="sb-mobile-card-body">
        <Typography variant="subtitle1">{STEPS[active]?.label}</Typography>
        <Typography variant="body2" color="textSecondary">
          {STEPS[active]?.text}
        </Typography>
      </div>
      <Divider />
      <MobileStepper
        variant={variant}
        position="static"
        steps={STEPS.length}
        activeStep={active}
        backButton={
          <Button
            size="sm"
            color="inherit"
            startIcon={<DemoIcon name="chevronLeft" />}
            disabled={active === 0}
            onClick={() => setActive(active - 1)}
          >
            Back
          </Button>
        }
        nextButton={
          <Button
            size="sm"
            color="inherit"
            endIcon={<DemoIcon name="chevronRight" />}
            disabled={active === STEPS.length - 1}
            onClick={() => setActive(active + 1)}
          >
            Next
          </Button>
        }
      />
    </Paper>
  );
}
