import { Autocomplete } from "@owlky/react";
import { useEffect, useState } from "react";

const FILMS = [
  "Alien",
  "Amélie",
  "Casablanca",
  "City of God",
  "Inception",
  "Parasite",
  "Spirited Away",
  "The Matrix",
];

/** Waits like a request to a server would. */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Loads the options the first time the list opens, and shows "Loading…" meanwhile. */
export function LoadOnOpenDemo() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const loading = open && options.length === 0;

  useEffect(() => {
    if (!loading) return;
    let active = true;
    wait(1000).then(() => {
      if (active) setOptions(FILMS);
    });
    return () => {
      active = false;
    };
  }, [loading]);

  return (
    <div className="sb-autocomplete">
      <Autocomplete
        id="ac-async"
        label="Asynchronous"
        options={options}
        loading={loading}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
