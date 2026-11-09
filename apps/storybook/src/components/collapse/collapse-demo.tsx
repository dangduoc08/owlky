import { Collapse, FormControlLabel, Paper, Switch } from "@owlky/react";
import { useState } from "react";

/** A raised Paper with a triangle: the content each collapse shows. */
function Shape() {
  return (
    <Paper className="sb-collapse-paper" elevation={4}>
      <svg aria-hidden="true" width="100" height="100" viewBox="0 0 100 100">
        <polygon points="0,100 50,0 100,100" />
      </svg>
    </Paper>
  );
}

/** Collapse: one switch opens four collapses, vertical and horizontal, with and without a collapsed size. */
export function CollapseDemo({ id = "collapse" }: { id?: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="sb-collapse-demo">
      <FormControlLabel control={<Switch checked={checked} onChange={setChecked} />} label="Show" />
      <div className="sb-collapse-row">
        <Collapse id={`${id}-1`} in={checked}>
          <Shape />
        </Collapse>
        <Collapse id={`${id}-2`} in={checked} collapsedSize={40}>
          <Shape />
        </Collapse>
      </div>
      <div className="sb-collapse-row">
        <div className="sb-collapse-half">
          <Collapse id={`${id}-3`} orientation="horizontal" in={checked}>
            <Shape />
          </Collapse>
        </div>
        <div className="sb-collapse-half">
          <Collapse id={`${id}-4`} orientation="horizontal" in={checked} collapsedSize={40}>
            <Shape />
          </Collapse>
        </div>
      </div>
    </div>
  );
}
