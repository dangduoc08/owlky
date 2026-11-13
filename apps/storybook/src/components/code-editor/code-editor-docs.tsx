import { codeEditorOptions, diffEditorOptions } from "@owlky/core";
import { CodeEditor } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import "./monaco-workers.js";
import codeEditorApi from "@owlky/docs-content/api/code-editor.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";

export const codeEditorSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "The code editor lets people write and read source code with syntax highlighting, completion, error markers, find and replace, and a diff view. It is built on Monaco, the editor of Visual Studio Code, so both versions share the same engine and markup. A frame holds the editor, a loading message and a text area with the value.\n\nMonaco is large, so it loads only when an editor appears. On a CDN page, `owlky.js` loads the code editor when the page holds one, and the code editor loads Monaco from the `monaco/` folder next to `owlky.js`. With a bundler, import `@owlky/html/code-editor` or use the React components, and Monaco becomes a separate chunk of your app.",
    html: `<!-- Load once per page: owlky.js loads the code editor when the page holds one -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<div data-ok-code-editor data-ok-language="javascript" data-ok-height="240">
  <textarea data-ok-code-editor-value aria-label="Script" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">console.log("Hello");</textarea>
  <div data-ok-code-editor-loading role="status">Loading</div>
  <div data-ok-code-editor-content></div>
</div>`,
    react: `import { CodeEditor } from "@owlky/react";

export function Script() {
  return (
    <CodeEditor
      aria-label="Script"
      height={240}
      defaultLanguage="javascript"
      defaultValue={'console.log("Hello");'}
    />
  );
}`,
  },
  {
    id: "value",
    title: "Read and set the value",
    body: "In React, use `defaultValue` for the first value, or `value` and `onChange` to control it. A new `value` replaces the content as one step that people can undo, and it doesn't call `onChange`. The editor keeps what people type even when you ignore `onChange`, because Monaco can't hold back keystrokes.\n\nIn HTML, the text area holds the value. It is the editor while JavaScript loads or when Monaco can't load, and its value follows the editor, so a `name` on it sends the code with a form. Listen to `ok:code-editor:change` and call `setValue()` on the instance to replace the value.",
    html: `<form>
  <div data-ok-code-editor data-ok-language="sql" data-ok-height="200">
    <textarea data-ok-code-editor-value name="query" aria-label="Query" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">SELECT 1;</textarea>
    <div data-ok-code-editor-loading role="status">Loading</div>
    <div data-ok-code-editor-content></div>
  </div>
</form>

<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("[data-ok-code-editor]");
  element.addEventListener("ok:code-editor:change", (event) => {
    console.log(event.detail.value);
  });
  // Replace the value (no event)
  getRuntime().get(element, "code-editor").setValue("SELECT 2;");
</script>`,
    react: `import { CodeEditor } from "@owlky/react";
import { useState } from "react";

export function Query() {
  const [sql, setSql] = useState("SELECT 1;");
  return (
    <CodeEditor aria-label="Query" height={200} language="sql" value={sql} onChange={setSql} />
  );
}`,
  },
  {
    id: "models",
    title: "Edit several files",
    body: "Each `path` is its own model: a file with its text, language, undo history and cursor. Change `path` to switch files. The editor creates a model the first time it sees a path, from `defaultValue` and `defaultLanguage`, and keeps it when you switch back. Turn off `saveViewState` to forget the cursor and scroll position of each file, and turn on `keepCurrentModel` to keep the model when the editor goes away.\n\nIn HTML, put each file's first text in a `<template data-ok-code-editor-model>` with its `data-ok-path` and `data-ok-language`, then change `data-ok-path` on the editor.",
    html: `<div data-ok-code-editor data-ok-path="file:///script.js" data-ok-language="javascript">
  <textarea data-ok-code-editor-value aria-label="File" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">console.log("script");</textarea>
  <div data-ok-code-editor-loading role="status">Loading</div>
  <div data-ok-code-editor-content></div>
  <template data-ok-code-editor-model data-ok-path="file:///style.css" data-ok-language="css">h1 { color: teal; }</template>
</div>

<script type="module">
  const editor = document.querySelector("[data-ok-code-editor]");
  // Switch to the style sheet
  editor.setAttribute("data-ok-language", "css");
  editor.setAttribute("data-ok-path", "file:///style.css");
</script>`,
    react: `import { CodeEditor } from "@owlky/react";
import { useState } from "react";

const files = {
  "script.js": { language: "javascript", value: 'console.log("script");' },
  "style.css": { language: "css", value: "h1 { color: teal; }" },
};

export function Files() {
  const [name, setName] = useState<keyof typeof files>("script.js");
  return (
    <>
      <button type="button" onClick={() => setName("style.css")}>style.css</button>
      <CodeEditor
        aria-label="File"
        path={\`file:///\${name}\`}
        defaultLanguage={files[name].language}
        defaultValue={files[name].value}
      />
    </>
  );
}`,
  },
  {
    id: "diff",
    title: "Compare two versions",
    body: "The diff editor shows an original and a modified text side by side, with the changes highlighted. People can edit the modified side. Set `original` and `modified`, a `language` for both or `originalLanguage` and `modifiedLanguage`, and model paths when the texts are files. Set the option `renderSideBySide` to `false` for one column, for example on narrow screens. Set `line` (HTML: `data-ok-line`) to scroll both sides to a line of the modified text, such as the first change. A new value scrolls again.",
    html: `<div data-ok-diff-editor data-ok-language="markdown" data-ok-height="320" data-ok-line="1">
  <textarea data-ok-diff-editor-original aria-label="Original" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off"># Notes</textarea>
  <textarea data-ok-diff-editor-modified aria-label="Modified" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off"># Release notes</textarea>
  <div data-ok-diff-editor-loading role="status">Loading</div>
  <div data-ok-diff-editor-content></div>
</div>`,
    react: `import { DiffEditor } from "@owlky/react";

export function Changes() {
  return (
    <DiffEditor
      height={320}
      language="markdown"
      line={1}
      original="# Notes"
      modified="# Release notes"
    />
  );
}`,
  },
  {
    id: "validation",
    title: "Show problems",
    body: "JSON, CSS, HTML, JavaScript and TypeScript are checked as people type, and the editor underlines the problems. `onValidate` receives the current model's markers after every check, for example to list them or to block saving. In HTML, listen to `ok:code-editor:validate`. Other languages get markers only when you add them with `monaco.editor.setModelMarkers()`.",
    html: `<script type="module">
  const editor = document.querySelector("[data-ok-code-editor]");
  editor.addEventListener("ok:code-editor:validate", (event) => {
    for (const marker of event.detail.markers) {
      console.log(marker.startLineNumber, marker.message);
    }
  });
</script>`,
    react: `import { CodeEditor, type CodeEditorMarker } from "@owlky/react";
import { useState } from "react";

export function Settings() {
  const [problems, setProblems] = useState<CodeEditorMarker[]>([]);
  return (
    <>
      <CodeEditor aria-label="Settings" defaultLanguage="json" onValidate={setProblems} />
      <p>{problems.length} problems</p>
    </>
  );
}`,
  },
  {
    id: "monaco",
    title: "Use Monaco directly",
    body: "Everything Monaco offers stays available. `beforeMount` receives the Monaco API before the editor exists, which is the place to register languages, completion providers and themes. `onMount` receives the editor itself, and `useMonaco()` returns the Monaco API anywhere in React once it has loaded. Pass Monaco's editor settings in `options`, such as `minimap`, `wordWrap` or `readOnly`; in HTML, write them as JSON in `data-ok-options`.\n\nIn HTML, listen to `ok:code-editor:beforemount` and `ok:code-editor:mount`, or register the editor yourself with `createCodeEditor({ beforeMount, onMount })`.",
    html: `<div data-ok-code-editor data-ok-language="javascript" data-ok-options='{"minimap":{"enabled":false},"wordWrap":"on"}'>
  <textarea data-ok-code-editor-value aria-label="Notes" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">console.log("notes");</textarea>
  <div data-ok-code-editor-loading role="status">Loading</div>
  <div data-ok-code-editor-content></div>
</div>

<script type="module">
  document.addEventListener("ok:code-editor:beforemount", (event) => {
    const { monaco } = event.detail;
    monaco.languages.register({ id: "notes" });
  });
  document.addEventListener("ok:code-editor:mount", (event) => {
    event.detail.editor.focus();
  });
</script>`,
    react: `import { CodeEditor, useMonaco } from "@owlky/react";
import { useEffect } from "react";

export function Notes() {
  const monaco = useMonaco();
  useEffect(() => {
    monaco?.languages.register({ id: "notes" });
  }, [monaco]);
  return (
    <CodeEditor
      aria-label="Notes"
      options={{ minimap: { enabled: false }, wordWrap: "on" }}
      onMount={(editor) => editor.focus()}
    />
  );
}`,
  },
  {
    id: "themes",
    title: "Match the theme",
    body: "With the default `theme` of `auto`, the editor uses Owlky's light or dark theme, whichever its scope uses through `data-ok-theme`. The colors come from your tokens and presets: the paper background, the text colors, and syntax colors that keep a contrast ratio of at least 4.5:1. The editor follows when the theme or preset changes.\n\nMonaco shows one theme on a page at a time. When editors sit in scopes with different themes, the editor that people used last decides. Set `theme` to a Monaco theme such as `vs-dark` or `hc-black`, or to a theme you define in `beforeMount`, to use it instead.",
    html: `<div data-ok-theme="dark">
  <div data-ok-code-editor data-ok-language="javascript" data-ok-height="160">
    <textarea data-ok-code-editor-value aria-label="Dark script" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">console.log("dark");</textarea>
    <div data-ok-code-editor-loading role="status">Loading</div>
    <div data-ok-code-editor-content></div>
  </div>
</div>

<div data-ok-code-editor data-ok-language="javascript" data-ok-height="160" data-ok-monaco-theme="hc-black">
  <textarea data-ok-code-editor-value aria-label="High contrast script" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off">console.log("high contrast");</textarea>
  <div data-ok-code-editor-loading role="status">Loading</div>
  <div data-ok-code-editor-content></div>
</div>`,
    react: `import { CodeEditor } from "@owlky/react";

export function CodeEditorThemes() {
  return (
    <>
      <div data-ok-theme="dark">
        <CodeEditor aria-label="Dark editor" />
      </div>

      <CodeEditor aria-label="High contrast" theme="hc-black" />
    </>
  );
}`,
  },
  {
    id: "loading",
    title: "Host Monaco and set up loading",
    body: "Owlky never loads Monaco from another site. On a CDN page, the code editor loads it from the `monaco/` folder next to `owlky.js`. To serve that folder somewhere else, copy `@owlky/html/dist/monaco/` to your server and set `data-ok-monaco-path` on the `owlky.js` script. The folder must be on the same origin as the page, because browsers run web workers only from there.\n\nWith a bundler, Monaco is imported from the `monaco-editor` package. If your bundler doesn't find Monaco's workers by itself, pass them to `loader.config({ getWorker })`. `loader.config()` also takes `paths.vs` for your own copy of the `monaco/` folder, a `monaco` instance you already imported, and the UI language. Call it before the first editor appears.\n\nUntil Monaco is ready, the frame shows `loading` (default \"Loading...\"). If Monaco can't load, the text area comes back so that people can still edit the value, and `onError` or `ok:code-editor:error` reports the reason.",
    html: `<!-- Your own copy of the monaco/ folder, in German -->
<script src="/assets/owlky.js" data-ok-monaco-path="/assets/monaco/" defer></script>

<script type="module">
  // With a bundler: import "@owlky/html/code-editor" instead
  import { loader } from "@owlky/html/code-editor";

  loader.config({ paths: { vs: "/assets/monaco/" }, "vs/nls": { availableLanguages: { "*": "de" } } });
</script>`,
    react: `import { CodeEditor, loader, type Monaco } from "@owlky/react";
// Vite: Monaco's workers as worker modules
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";

loader.config({
  getWorker: (label) => (label === "json" ? new JsonWorker() : new EditorWorker()),
});

export function Config() {
  return <CodeEditor aria-label="Config" defaultLanguage="json" loading="Loading the editor" />;
}`,
  },
  {
    id: "csp",
    title: "Set up a content security policy",
    body: "Owlky's own code sets styles only through the CSS object model and creates no HTML from strings. Monaco needs more than the rest of Owlky, so pages with a content security policy allow it for code editor pages:\n\n- **Styles:** `style-src 'self' 'unsafe-inline'`, because Monaco writes its theme and decorations into `<style>` elements.\n- **Fonts and images:** `font-src 'self' data:` and `img-src 'self' data:`, because Monaco's style sheet embeds its icon font.\n- **Workers:** `worker-src 'self'`.\n- **Trusted Types:** the policies `owlky-code-editor`, `defaultWorkerFactory`, `diffEditorWidget`, `diffReview`, `domLineBreaksComputer`, `editorGhostText`, `editorViewLayer`, `richScreenReaderContent`, `standaloneColorizer`, `stickyScrollViewLayer`, `tokenizeToString` and `dompurify`, with `'allow-duplicates'`. The `owlky-code-editor` policy accepts only worker files from the `monaco/` folder.",
    html: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; worker-src 'self'; require-trusted-types-for 'script'; trusted-types owlky-code-editor defaultWorkerFactory diffEditorWidget diffReview domLineBreaksComputer editorGhostText editorViewLayer richScreenReaderContent standaloneColorizer stickyScrollViewLayer tokenizeToString dompurify 'allow-duplicates'">`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. The first table is the code editor, the second the diff editor.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content, the loading message and Monaco itself. They aren't options, because HTML writes them as markup or passes them in JavaScript.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:code-editor:change\`** fires after every edit, with \`detail.value\` and Monaco's \`detail.event\` (\`null\` when people type in the text area because Monaco couldn't load).
- **\`ok:code-editor:validate\`** fires when the current model's markers change, with \`detail.markers\`.
- **\`ok:code-editor:beforemount\`** and **\`ok:code-editor:mount\`** fire with \`detail.monaco\` (and \`detail.editor\`) before and after Monaco creates the editor. The diff editor fires \`ok:diff-editor:beforemount\` and \`ok:diff-editor:mount\`.
- **\`ok:code-editor:error\`** and **\`ok:diff-editor:error\`** fire when Monaco can't load, with \`detail.error\`.
- **Instance:** \`runtime.get(element, "code-editor")\` returns \`{ status, value, setValue(value), updateOptions(options), focus(), editor, monaco }\`. The diff editor's instance has \`original\`, \`modified\`, \`setOriginal()\`, \`setModified()\` and \`updateOptions()\`.
- **React:** \`onChange(value, event)\`, \`onValidate(markers)\`, \`beforeMount(monaco)\`, \`onMount(editor, monaco)\` and \`onError(error)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The editor uses the keyboard shortcuts of Visual Studio Code. Tab indents the code, so it doesn't leave the editor until you switch Tab to move focus. On macOS, use Command instead of Ctrl where the table says Ctrl.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name the editor with \`aria-label\` in React (default "Code editor"), or with an \`aria-label\` on the text area in HTML. Monaco uses that name for its text box.
- Tab inserts a tab character. Press **Ctrl+M** (macOS: **Ctrl+Shift+M**) to make Tab and Shift+Tab move focus out of the editor, and again to switch back. Tell people about it near the editor, or set the option \`tabFocusMode\`.
- Press **Alt+F1** (macOS: **Option+F1**) for Monaco's accessibility help. Screen readers are detected automatically; set the option \`accessibilitySupport\` to \`"on"\` to turn the screen reader mode on yourself.
- The loading message is a status that screen readers announce, and the text area keeps the value editable when Monaco can't load.
- Syntax colors keep a contrast ratio of at least 4.5:1 with the editor background in Owlky's themes.`,
  },
  apiReferenceSection(codeEditorApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <CodeEditor
        aria-label="Script"
        height={200}
        defaultLanguage="javascript"
        defaultValue={
          '// Type here: Monaco suggests as you go\nconst greeting = "Hello";\nconsole.log(greeting);\n'
        }
        options={{ minimap: { enabled: false } }}
      />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={codeEditorOptions} />
      <OptionsTable schema={diffEditorOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Code editor content props"
      rows={[
        {
          react: "value / defaultValue / onChange",
          html: "textarea[data-ok-code-editor-value] · ok:code-editor:change",
          type: "string",
          description: "The value of the current model.",
        },
        {
          react: "defaultLanguage / defaultPath",
          html: "data-ok-language / data-ok-path (first values)",
          type: "string",
          description: "The language and path of the first model.",
        },
        {
          react: "loading",
          html: "[data-ok-code-editor-loading] content",
          type: "ReactNode",
          description: 'Shown until Monaco is ready. Default "Loading...".',
        },
        {
          react: "options",
          html: "data-ok-options (JSON)",
          type: "IStandaloneEditorConstructionOptions",
          description: "Monaco's editor settings, such as `minimap`, `wordWrap` or `readOnly`.",
        },
        {
          react: "overrideServices",
          html: "createCodeEditor({ overrideServices })",
          type: "IEditorOverrideServices",
          description: "Monaco service overrides, when the editor is created.",
        },
        {
          react: "beforeMount / onMount",
          html: "ok:code-editor:beforemount / ok:code-editor:mount",
          type: "(monaco) => void / (editor, monaco) => void",
          description: "Monaco before the editor exists, and the editor once it does.",
        },
        {
          react: "onValidate",
          html: "ok:code-editor:validate",
          type: "(markers: IMarker[]) => void",
          description: "The current model's markers after every check.",
        },
        {
          react: "onError",
          html: "ok:code-editor:error",
          type: "(error: unknown) => void",
          description: "Monaco couldn't load; the text area is shown instead.",
        },
        {
          react: "className / wrapperProps",
          html: "on [data-ok-code-editor-content] / on the root",
          type: "string / HTMLAttributes",
          description: "The class of the element Monaco mounts on, and props of the frame.",
        },
        {
          react: "aria-label",
          html: "aria-label on the text area",
          type: "string",
          description: 'The name of the editor (default "Code editor").',
        },
        {
          react: "original / modified (DiffEditor)",
          html: "textarea[data-ok-diff-editor-original] / textarea[data-ok-diff-editor-modified]",
          type: "string",
          description: "The two texts of the diff editor; a new `modified` is one undoable edit.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab / Shift+Tab", "Indents or outdents (moves focus when Tab moves focus is on)."],
        ["Ctrl+M", "Turns Tab moves focus on or off (macOS: Ctrl+Shift+M)."],
        ["Alt+F1", "Opens the accessibility help (macOS: Option+F1)."],
        ["F1", "Opens the command palette."],
        ["Ctrl+Space", "Shows suggestions."],
        ["Ctrl+F / Ctrl+H", "Find, replace."],
        ["Ctrl+Z / Ctrl+Shift+Z", "Undo, redo."],
        ["Ctrl+/", "Comments or uncomments the line."],
        ["Alt+Up arrow / Alt+Down arrow", "Moves the line up or down."],
        ["F8", "Goes to the next problem."],
        ["Escape", "Closes suggestions, find and other widgets."],
      ]}
    />
  ),
};

/** Code editor docs page (ADR-0019). */
export function CodeEditorDocs() {
  return <GuideDocs sections={codeEditorSections} previews={PREVIEWS} />;
}
