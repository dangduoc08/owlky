import type { CopyResult } from "@owlky/core";
import {
  IconButton,
  InputAdornment,
  TextField,
  Toaster,
  Typography,
  toast,
  useCopyToClipboard,
} from "@owlky/react";
import { useState } from "react";

const TEXT =
  "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci. Cras non dolor.";

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3.5" y="7.5" width="12" height="13" rx="2.5" fill="currentColor" />
      <path
        d="M8.5 4.5h8a3 3 0 0 1 3 3v9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A toast after each copy: its polite live region announces the result. */
function notify(result: CopyResult) {
  if (result.ok) toast.success("Copied!");
  else toast.error("Couldn't copy. Select the text and copy it yourself.");
}

/** A copy button in the field's end adornment copies what the field holds. */
export function CopyButtonDemo() {
  const [value, setValue] = useState("https://www.npmjs.com/package/@owlky/react");
  const { copy } = useCopyToClipboard();
  return (
    <>
      <TextField
        id="copy-link"
        fullWidth
        label="Link"
        value={value}
        onChange={setValue}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              edge="end"
              aria-label="Copy"
              onClick={async () => notify(await copy(value))}
            >
              <CopyIcon />
            </IconButton>
          </InputAdornment>
        }
      />
      <Toaster closeButton />
    </>
  );
}

/** A double click copies the paragraph; the button does the same from the keyboard. */
export function CopyDoubleClickDemo() {
  const { copy } = useCopyToClipboard();
  return (
    <>
      <Typography id="copy-text" onDoubleClick={async () => notify(await copy(TEXT))}>
        {TEXT}
      </Typography>
      <IconButton aria-label="Copy text" onClick={async () => notify(await copy(TEXT))}>
        <CopyIcon />
      </IconButton>
    </>
  );
}
