import { codeEditorLanguages, codeEditorThemes } from "@owlky/core";
import { Button, CodeEditor, type CodeEditorOptions, TextField, Typography } from "@owlky/react";
import { useState } from "react";
import { EDITOR_OPTIONS, EDITOR_SAMPLE, OPTIONS_EDITOR } from "./code-editor-content.js";

/** An editor with settings: its language, its theme and Monaco options written as JSON. */
export function CodeEditorDemo() {
  const [language, setLanguage] = useState("typescript");
  const [theme, setTheme] = useState("auto");
  const [draft, setDraft] = useState(EDITOR_OPTIONS);
  const [options, setOptions] = useState<CodeEditorOptions>(() => JSON.parse(EDITOR_OPTIONS));
  const [invalid, setInvalid] = useState(false);
  const apply = () => {
    try {
      setOptions(JSON.parse(draft));
      setInvalid(false);
    } catch {
      setInvalid(true);
    }
  };
  return (
    <div className="sb-code-editor-demo">
      <CodeEditor
        aria-label="Source"
        height={480}
        defaultPath="file:///tasks.ts"
        defaultValue={EDITOR_SAMPLE}
        language={language}
        theme={theme}
        options={options}
      />
      <section className="sb-code-editor-settings" aria-labelledby="code-editor-settings">
        <Typography variant="h6" component="h4" id="code-editor-settings">
          Settings
        </Typography>
        <TextField
          id="code-editor-language"
          select
          label="Language"
          size="small"
          fullWidth
          value={language}
          onChange={setLanguage}
        >
          {codeEditorLanguages.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </TextField>
        <TextField
          id="code-editor-theme"
          select
          label="Theme"
          size="small"
          fullWidth
          value={theme}
          onChange={setTheme}
        >
          {codeEditorThemes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </TextField>
        <CodeEditor
          aria-label="Options"
          height={240}
          language="json"
          value={draft}
          onChange={setDraft}
          options={OPTIONS_EDITOR}
        />
        {invalid ? (
          <Typography variant="body2" color="error" className="sb-code-editor-error" role="alert">
            The options aren't valid JSON.
          </Typography>
        ) : null}
        <Button id="code-editor-apply" variant="contained" fullWidth onClick={apply}>
          Apply
        </Button>
      </section>
    </div>
  );
}
