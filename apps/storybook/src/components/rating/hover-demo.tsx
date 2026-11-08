import { Rating } from "@owlky/react";
import { useState } from "react";

const LABELS: Record<number, string> = {
  0.5: "Useless",
  1: "Useless+",
  1.5: "Poor",
  2: "Poor+",
  2.5: "Ok",
  3: "Ok+",
  3.5: "Good",
  4: "Good+",
  4.5: "Excellent",
  5: "Excellent+",
};

/** Shows the label of the value under the pointer, else of the chosen value. */
export function HoverDemo() {
  const [value, setValue] = useState<number | null>(2);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <div className="sb-rating-feedback">
      <Rating
        name="rating-hover"
        value={value}
        precision={0.5}
        onChange={setValue}
        onChangeActive={setHover}
        getLabelText={(v) => `${v} Star${v !== 1 ? "s" : ""}, ${LABELS[v]}`}
      />
      {shown !== null && <span>{LABELS[shown]}</span>}
    </div>
  );
}
