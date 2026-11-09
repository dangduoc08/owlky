import { CodeEditor, TextField } from "@owlky/react";
import { useState } from "react";
import { FILES, type FileName } from "./code-editor-content.js";

const NAMES = Object.keys(FILES) as FileName[];

/** Three files, one model each: switching the path keeps every file's text, cursor and undo. */
export function MultiModelDemo() {
  const [name, setName] = useState<FileName>("script.js");
  const file = FILES[name];
  return (
    <div className="sb-code-editor-files">
      <TextField
        id="code-editor-file"
        select
        label="File"
        size="small"
        value={name}
        onChange={(next) => setName(next as FileName)}
      >
        {NAMES.map((each) => (
          <option key={each} value={each}>
            {each}
          </option>
        ))}
      </TextField>
      <CodeEditor
        aria-label="File content"
        height={320}
        path={`file:///${name}`}
        defaultLanguage={file.language}
        defaultValue={file.value}
      />
    </div>
  );
}
