import { CodeEditor, type CodeEditorMarker } from "@owlky/react";
import { useState } from "react";
import { INVALID_JSON } from "./code-editor-content.js";

/** JSON checked as you type: `onValidate` lists the model's markers under the editor. */
export function ValidationDemo() {
  const [markers, setMarkers] = useState<CodeEditorMarker[]>([]);
  return (
    <div className="sb-code-editor-validation">
      <CodeEditor
        aria-label="package.json"
        height={260}
        defaultPath="file:///package.json"
        defaultLanguage="json"
        defaultValue={INVALID_JSON}
        onValidate={setMarkers}
      />
      <section aria-labelledby="code-editor-problems">
        <h4 id="code-editor-problems" className="sb-code-editor-title">
          Problems
        </h4>
        <ul className="sb-code-editor-problems">
          {markers.length === 0 ? (
            <li>No problems.</li>
          ) : (
            markers.map((marker) => (
              <li key={`${marker.startLineNumber}:${marker.startColumn}:${marker.message}`}>
                {`Line ${marker.startLineNumber}, column ${marker.startColumn}: ${marker.message}`}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
