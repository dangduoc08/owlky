import { Backdrop, Button, CircularProgress } from "@owlky/react";
import { useState } from "react";

/** Example: a loader over the page. A click anywhere on the backdrop closes it. */
export function ExampleBackdropDemo({ id = "backdrop-example" }: { id?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Show backdrop</Button>
      <Backdrop id={id} open={open} onClick={() => setOpen(false)}>
        <CircularProgress color="inherit" aria-label="Loading" />
      </Backdrop>
    </div>
  );
}
