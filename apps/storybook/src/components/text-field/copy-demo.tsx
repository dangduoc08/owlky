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
import { SolarIcon } from "../../helpers/solar-icons.js";

const TEXT =
  "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed aliquam, nisi quis porttitor congue, elit erat euismod orci, ac placerat dolor lectus quis orci. Cras non dolor.";

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
              <SolarIcon name="copy-linear" />
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
        <SolarIcon name="copy-linear" />
      </IconButton>
    </>
  );
}
