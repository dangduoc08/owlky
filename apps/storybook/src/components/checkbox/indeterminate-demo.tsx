import { selectAllState } from "@owlky/core";
import { Checkbox, FormControlLabel } from "@owlky/react";
import { useId, useState } from "react";

/** A parent checkbox that checks or clears its children and shows mixed in between. */
export function IndeterminateDemo() {
  const id = useId();
  const [children, setChildren] = useState([true, false]);
  const { checked, indeterminate } = selectAllState(
    children.filter(Boolean).length,
    children.length,
  );
  return (
    <>
      <FormControlLabel
        label="Parent"
        control={
          <Checkbox
            aria-controls={children.map((_, i) => `${id}-${i}`).join(" ")}
            checked={checked}
            indeterminate={indeterminate}
            onChange={(next) => setChildren(children.map(() => next))}
          />
        }
      />
      <div>
        {children.map((value, i) => (
          <FormControlLabel
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of two children.
            key={i}
            label={`Child ${i + 1}`}
            control={
              <Checkbox
                id={`${id}-${i}`}
                checked={value}
                onChange={(next) => setChildren(children.map((c, j) => (j === i ? next : c)))}
              />
            }
          />
        ))}
      </div>
    </>
  );
}
