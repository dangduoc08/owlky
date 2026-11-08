import { Button, Chart } from "@owlky/react";
import { useState } from "react";
import { LIVE_POINTS, liveLabel, liveValue } from "./chart-data.js";

/** The first steps shown, then one more per "Add a point". */
const first = () => Array.from({ length: LIVE_POINTS }, (_, step) => step);

export function LiveChart() {
  // The steps on screen: a sliding window of the last points.
  const [steps, setSteps] = useState(first);
  const add = () =>
    setSteps((current) => [...current, (current.at(-1) as number) + 1].slice(-LIVE_POINTS));
  return (
    <>
      <Chart
        label="Requests per second"
        type="area"
        height={240}
        categories={steps.map(liveLabel)}
        series={[{ name: "Requests", data: steps.map(liveValue) }]}
      />
      <div className="sb-chart-actions">
        <Button variant="outlined" color="inherit" onClick={add}>
          Add a point
        </Button>
        <Button variant="text" color="inherit" onClick={() => setSteps(first())}>
          Reset
        </Button>
      </div>
    </>
  );
}
