import type { ToastPosition } from "@owlky/core";
import { Button, Toaster, toast } from "@owlky/react";
import { useState } from "react";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Default: a message, and a message with a description. */
export function DefaultDemo() {
  return (
    <>
      <Button variant="contained" onClick={() => toast("Event has been created")}>
        Default
      </Button>
      <Button
        variant="contained"
        onClick={() =>
          toast.message("Event has been created", { description: "Monday at 6:00 PM" })
        }
      >
        Message
      </Button>
      <Toaster closeButton />
    </>
  );
}

/** Status: one toast per type, and a promise that resolves after 2 seconds. */
export function StatusDemo() {
  return (
    <>
      <Button
        variant="contained"
        color="info"
        onClick={() => toast.info("Arrive 10 minutes early")}
      >
        Info
      </Button>
      <Button
        variant="contained"
        color="success"
        onClick={() => toast.success("Event has been created")}
      >
        Success
      </Button>
      <Button
        variant="contained"
        color="warning"
        onClick={() => toast.warning("Events can't start before 8 AM")}
      >
        Warning
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => toast.error("Event has not been created")}
      >
        Error
      </Button>
      <Button
        variant="outlined"
        onClick={() =>
          toast.promise(wait(2000), {
            loading: "Loading…",
            success: "Loading succeeded",
            error: "Loading failed",
          })
        }
      >
        Promise
      </Button>
      <Toaster closeButton />
    </>
  );
}

/** Custom: an action button, your own buttons, and rich content. */
export function CustomDemo() {
  return (
    <>
      <Button
        variant="outlined"
        onClick={() =>
          toast("Event has been created", { action: { label: "Undo", onClick: () => {} } })
        }
      >
        Action
      </Button>
      <Button
        variant="outlined"
        onClick={() => {
          const id = toast.warning("Title", {
            description: "Description",
            action: (
              <>
                <Button size="sm" color="warning" onClick={() => toast.dismiss(id)}>
                  Action
                </Button>
                <Button size="sm" onClick={() => toast.dismiss(id)}>
                  Dismiss
                </Button>
              </>
            ),
          });
        }}
      >
        Custom action
      </Button>
      <Button
        variant="outlined"
        onClick={() =>
          toast.success(<strong>Event has been created</strong>, {
            description: <em>Monday at 6:00 PM</em>,
          })
        }
      >
        Custom
      </Button>
      <Toaster closeButton />
    </>
  );
}

const POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

/** Anchor origin: the toaster moves to the chosen corner or edge. */
export function AnchorOriginDemo() {
  const [position, setPosition] = useState<ToastPosition>("top-right");
  return (
    <>
      {POSITIONS.map((value) => (
        <Button
          key={value}
          variant="outlined"
          onClick={() => {
            setPosition(value);
            toast(`Shown at ${value}`);
          }}
        >
          {value}
        </Button>
      ))}
      <Toaster position={position} closeButton />
    </>
  );
}
