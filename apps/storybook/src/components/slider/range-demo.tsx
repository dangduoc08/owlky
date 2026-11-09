import { Slider, Typography } from "@owlky/react";
import { useState } from "react";

const MARKS = [0, 250, 500, 750, 1000].map((value) => ({ value, label: `$${value}` }));
const price = (value: number) => `$${value}`;

/** A price range with its bounds shown below. */
export function RangeDemo() {
  const [value, setValue] = useState<number | number[]>([200, 370]);
  const [low, high] = value as number[];
  return (
    <div className="sb-slider-range">
      <Slider
        getAriaLabel={(index) => (index === 0 ? "Minimum price" : "Maximum price")}
        value={value}
        onChange={setValue}
        min={0}
        max={1000}
        step={10}
        marks={MARKS}
        valueLabelDisplay="on"
        valueLabelFormat={price}
        getAriaValueText={price}
        data-ok-label-value={"$" + "{value}"}
      />
      <Typography
        variant="subtitle2"
        component="p"
      >{`Min: ${price(low as number)} · Max: ${price(high as number)}`}</Typography>
    </div>
  );
}
