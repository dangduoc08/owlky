import { Radio, RadioGroup, Typography } from "@owlky/react";
import { useState } from "react";

const COLORS = [
  { name: "Orange", value: "#FF9800" },
  { name: "Deep purple", value: "#673AB7" },
  { name: "Light green", value: "#8BC34A" },
  { name: "Teal", value: "#009688" },
  { name: "Indigo", value: "#3F51B5" },
  { name: "Light blue", value: "#03A9F4" },
];

/** A single color picker: radio swatches, each named after its color. */
export function ColorPickerDemo() {
  const [color, setColor] = useState("#FF9800");
  return (
    <div className="sb-color-picker">
      <RadioGroup row name="color" aria-label="Color" value={color} onChange={setColor}>
        {COLORS.map(({ name, value }) => (
          <Radio key={value} value={value} swatch={value} aria-label={name} />
        ))}
      </RadioGroup>
      <Typography variant="body2" id="color-picker-value">
        {color}
      </Typography>
    </div>
  );
}
