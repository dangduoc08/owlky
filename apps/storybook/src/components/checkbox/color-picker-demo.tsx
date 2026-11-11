import { Checkbox, FormGroup, Typography } from "@owlky/react";
import { useState } from "react";

const COLORS = [
  { name: "Orange", value: "#FF9800" },
  { name: "Deep purple", value: "#673AB7" },
  { name: "Light green", value: "#8BC34A" },
  { name: "Teal", value: "#009688" },
  { name: "Indigo", value: "#3F51B5" },
  { name: "Light blue", value: "#03A9F4" },
  { name: "Blue grey", value: "#607D8B" },
  { name: "Green", value: "#4CAF50" },
  { name: "Cyan", value: "#00BCD4" },
  { name: "Lime", value: "#CDDC39" },
  { name: "Pink", value: "#E91E63" },
  { name: "Amber", value: "#FFC107" },
  { name: "Purple", value: "#9C27B0" },
  { name: "Deep orange", value: "#FF5722" },
  { name: "Brown", value: "#795548" },
  { name: "Blue", value: "#2196F3" },
];

/** A multiple color picker: checkbox swatches, each named after its color. */
export function ColorPickerDemo() {
  const [colors, setColors] = useState(["#4CAF50", "#00BCD4"]);
  return (
    <div className="sb-color-picker">
      <FormGroup row role="group" aria-label="Colors" className="sb-color-picker-swatches">
        {COLORS.map(({ name, value }) => (
          <Checkbox
            key={value}
            name="colors"
            value={value}
            swatch={value}
            aria-label={name}
            checked={colors.includes(value)}
            onChange={(checked) =>
              // Keep the palette's order, as the form submits the values.
              setColors(
                COLORS.map((color) => color.value).filter((color) =>
                  color === value ? checked : colors.includes(color),
                ),
              )
            }
          />
        ))}
      </FormGroup>
      <Typography variant="body2" id="color-picker-values">
        {colors.join(", ")}
      </Typography>
    </div>
  );
}
