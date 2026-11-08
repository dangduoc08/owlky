import { Editor, FormControlLabel, Switch } from "@owlky/react";
import { common, createLowlight } from "lowlight";
import { useState } from "react";
import { EDITOR_CONTENT } from "./editor-content.js";

// Syntax highlighting: lowlight with highlight.js's common languages.
const highlighter = createLowlight(common);

/** An editor with a "Full item" switch and a live, read-only preview of its content. */
export function EditorDemo() {
  const [fullItem, setFullItem] = useState(true);
  const [value, setValue] = useState(EDITOR_CONTENT);
  return (
    <div className="sb-editor-demo">
      <FormControlLabel
        control={<Switch id="editor-full-item" checked={fullItem} onChange={setFullItem} />}
        label="Full item"
      />
      <div className="sb-editor-columns">
        <Editor
          aria-label="Content"
          fullItem={fullItem}
          value={value}
          onChange={setValue}
          highlighter={highlighter}
        />
        <section className="sb-editor-preview" aria-labelledby="editor-preview-title">
          <h3 id="editor-preview-title">Preview</h3>
          <Editor
            aria-labelledby="editor-preview-title"
            editable={false}
            value={value}
            highlighter={highlighter}
          />
        </section>
      </div>
    </div>
  );
}
