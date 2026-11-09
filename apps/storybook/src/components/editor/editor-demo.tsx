import { Card, Editor, FormControlLabel, Markdown, Switch, Typography } from "@owlky/react";
import { common, createLowlight } from "lowlight";
import { useState } from "react";
import { EDITOR_CONTENT } from "./editor-content.js";

// Syntax highlighting: lowlight with highlight.js's common languages.
const highlighter = createLowlight(common);

/**
 * An editor with a "Full item" switch and a live preview of its HTML, rendered by Markdown in an
 * outlined Card.
 */
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
        <Card
          component="section"
          variant="outlined"
          className="sb-editor-preview"
          aria-labelledby="editor-preview-title"
        >
          <Typography variant="h6" component="h3" id="editor-preview-title">
            Preview
          </Typography>
          <Markdown rawHtml externalLinks highlighter={highlighter}>
            {value}
          </Markdown>
        </Card>
      </div>
    </div>
  );
}
