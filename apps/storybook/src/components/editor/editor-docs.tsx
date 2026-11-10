import { editorOptions } from "@owlky/core";
import editorApi from "@owlky/docs-content/api/editor.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Editor } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const editorSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "The editor lets people write formatted text: headings, bold and italic text, lists, alignment, quotes, code, links and images. It is built on Tiptap, a framework-free editing engine, so both versions share the same behavior and markup. A toolbar sits above a text box that people type in, and the content is HTML.\n\nThe editor is a separate script so that pages without one don't download the editing engine. Load `owlky-editor.js` after `owlky.js`, or import `@owlky/html/editor` after `@owlky/html/auto`.",
    html: `<!-- Load once per page: the styles, the runtime, then the editor -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>
<script src="${CDN}/owlky-editor.js" defer></script>

<div data-ok-editor data-ok-full-item>
  <!-- Dims the page while the editor is fullscreen -->
  <div data-ok-backdrop></div>
  <div data-ok-editor-toolbar role="toolbar" aria-label="Formatting" aria-controls="notes-content">
    <!-- The heading menu, then one group of buttons per tool (copy them from the snippet) -->
  </div>
  <div data-ok-editor-body>
    <div data-ok-editor-content id="notes-content" role="textbox" aria-multiline="true" aria-label="Notes">
      <p>The initial content is the markup inside this element.</p>
    </div>
  </div>
  <!-- The heading menu, link and image popovers -->
</div>`,
    react: `import { Editor } from "@owlky/react";
import { useState } from "react";

export function Notes() {
  const [value, setValue] = useState("<p>Hello</p>");
  return <Editor aria-label="Notes" fullItem value={value} onChange={setValue} />;
}`,
  },
  {
    id: "content",
    title: "Read and set the content",
    body: 'The value is an HTML string, and an empty editor has the value `""`. In React, use `value` and `onChange` to control it, or `defaultValue` to only set the initial content. A new `value` replaces the content, but the editor does not undo an edit that you ignore in `onChange`, because rich text cannot be held back key by key. In HTML, write the initial content inside the content element, listen to `ok:editor:change`, and call `setValue(html)` on the instance to replace it.\n\nThe editor keeps only what its toolbar can make, plus text transforms. Pasted or loaded HTML loses scripts, event handler attributes and unknown elements, and links only keep `http`, `https`, `mailto`, `tel` and relative URLs.',
    html: `<script type="module">
  import { getRuntime } from "@owlky/html";

  const element = document.querySelector("[data-ok-editor]");
  element.addEventListener("ok:editor:change", (event) => {
    console.log(event.detail.value);
  });
  // Replace the content (no event)
  getRuntime().get(element, "editor").setValue("<p>New content</p>");
</script>`,
    react: `import { Editor } from "@owlky/react";
import { useState } from "react";

export function Post() {
  const [html, setHtml] = useState("");
  return <Editor aria-label="Post" value={html} onChange={setHtml} />;
}`,
  },
  {
    id: "toolbar",
    title: "Choose the toolbar",
    body: "The default toolbar has the heading menu, text styles, lists, alignment, links, images, line breaks, clear formatting and fullscreen. Turn on `fullItem` to add code, code blocks, quotes, horizontal rules, undo and redo.\n\nThe Fullscreen button makes the editor fill the window over a backdrop that dims the page. While it is fullscreen, the page doesn't scroll and Tab stays inside the editor. Press Escape or the button again to leave. In React, `onFullscreenChange` reports the change. In HTML, listen to `ok:editor:fullscreen`, and put a `div[data-ok-backdrop]` first in the editor so that the page is dimmed.",
    html: `<div data-ok-editor data-ok-full-item>…</div>`,
    react: `import { Editor } from "@owlky/react";

export function EditorToolbar() {
  return <Editor aria-label="Article" fullItem />;
}`,
  },
  {
    id: "text-transform",
    title: "Change the case of text",
    body: 'A text transform shows text in capitals, lower case or with each word capitalized, without changing the letters people typed. The content keeps it as `<span style="text-transform: uppercase">`. Markup written in HTML can use `data-ok-text-transform` instead, because pages with a strict Content Security Policy refuse `style` attributes in their markup. The toolbar has no button for it: run the `textTransform` action of the controller with `uppercase`, `lowercase`, `capitalize`, or `null` to remove it.',
    html: `<div data-ok-editor-content role="textbox" aria-multiline="true" aria-label="Notes">
  <p>Ship it <span data-ok-text-transform="uppercase">today</span>.</p>
</div>

<script type="module">
  import { getRuntime } from "@owlky/html";

  // Capitalize the selected words
  const element = document.querySelector("[data-ok-editor]");
  getRuntime().get(element, "editor").controller.run("textTransform", { textTransform: "capitalize" });
</script>`,
    react: `import { Editor } from "@owlky/react";

export function Notes() {
  return (
    <Editor
      aria-label="Notes"
      defaultValue={'<p>Ship it <span style="text-transform: uppercase">today</span>.</p>'}
    />
  );
}`,
  },
  {
    id: "highlight",
    title: "Highlight code",
    body: "Code blocks show plain text unless you give the editor a highlighter, because syntax grammars are large. Pass a lowlight instance, which uses the highlight.js grammars. Each code block then gets colors and a **Language** menu.",
    html: `<script type="module">
  import { createEditor, getRuntime } from "@owlky/html";
  import { common, createLowlight } from "lowlight";

  // Register this editor instead of loading owlky-editor.js
  getRuntime().register(createEditor({ highlighter: createLowlight(common) })).start();
</script>`,
    react: `import { Editor } from "@owlky/react";
import { common, createLowlight } from "lowlight";

// Create the highlighter once, outside the component
const highlighter = createLowlight(common);

export function Snippet() {
  return <Editor aria-label="Snippet" fullItem highlighter={highlighter} />;
}`,
  },
  {
    id: "states",
    title: "Show errors and read-only content",
    body: "Set `error` for a red border and red helper text, and `helperText` for the text under the editor. The helper text describes the text box for screen readers. Set `editable` to `false` to show content without the toolbar, for example a preview.",
    html: `<div data-ok-editor data-ok-error>
  …
  <div data-ok-editor-body>
    <div data-ok-editor-content role="textbox" aria-multiline="true" aria-label="Summary" aria-describedby="summary-help" aria-invalid="true">…</div>
  </div>
  <p data-ok-editor-helper id="summary-help">Write at least one sentence.</p>
</div>

<div data-ok-editor data-ok-editable="false">…</div>`,
    react: `import { Editor } from "@owlky/react";

export function EditorStates() {
  return (
    <>
      <Editor aria-label="Summary" error helperText="Write at least one sentence." />
      <Editor aria-label="Preview" editable={false} value={html} />
    </>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the text box. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:editor:change\`** fires on the editor after every change, with the HTML in \`detail.value\`.
- **\`ok:editor:fullscreen\`** fires when fullscreen mode changes, with \`detail.fullscreen\`.
- **Instance:** \`runtime.get(element, "editor")\` returns \`{ value, setValue(html), fullscreen, setFullscreen(on), setEditable(on), focus(), controller }\`. \`controller.editor\` is the Tiptap editor.
- **React:** \`onChange(value)\` and \`onFullscreenChange(fullscreen)\`.
- **Trusted Types:** \`setValue\` and the React \`value\` prop parse an HTML string with the browser's \`DOMParser\`. Pages that enforce Trusted Types need a policy for it. Content written in the markup needs none.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The toolbar is one stop in the Tab order: the arrow keys move between its buttons. In the text box, the usual shortcuts format text. On macOS, use Command instead of Ctrl.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Name the text box with \`aria-label\` or \`aria-labelledby\`. Without a name, it is called "Editor".
- Toolbar buttons have names and report their state with \`aria-pressed\`, so people hear whether bold or a list is on. Their keyboard shortcuts are announced through \`aria-keyshortcuts\`.
- The link and image forms are dialogs named by their title. Escape closes them and returns focus to their button.
- Images need a text alternative: fill in **Alt text**, or leave it empty only for decoration.
- Fullscreen mode can always be left with Escape. While it is on, Tab moves between the toolbar and the text box only, so focus never reaches controls hidden behind the editor.`,
  },
  apiReferenceSection(editorApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Editor
        aria-label="Notes"
        fullItem
        defaultValue="<h5>Meeting notes</h5><p>Select text, then use the toolbar to <strong>format</strong> it.</p>"
      />
    </Preview>
  ),
  states: () => (
    <Preview>
      <Editor aria-label="Summary" error helperText="Write at least one sentence." />
    </Preview>
  ),
  options: () => <OptionsTable schema={editorOptions} />,
  props: () => (
    <PropsTable
      label="Editor content props"
      rows={[
        {
          react: "value / defaultValue / onChange",
          html: "markup in [data-ok-editor-content] · ok:editor:change",
          type: "string",
          description: 'The content as HTML; `""` is empty.',
        },
        {
          react: "placeholder",
          html: "data-ok-placeholder",
          type: "string",
          description: 'Shown while the editor is empty. Default "Write something awesome...".',
        },
        {
          react: "helperText",
          html: "p[data-ok-editor-helper] + aria-describedby",
          type: "ReactNode",
          description: "Text under the editor that describes the text box.",
        },
        {
          react: "highlighter",
          html: "createEditor({ highlighter })",
          type: "EditorHighlighter",
          description: "Syntax highlighting for code blocks, for example lowlight.",
        },
        {
          react: "aria-label / aria-labelledby",
          html: "on [data-ok-editor-content]",
          type: "string",
          description: 'The name of the text box (default "Editor").',
        },
        {
          react: "onFullscreenChange",
          html: "ok:editor:fullscreen",
          type: "(fullscreen: boolean) => void",
          description: "Fullscreen mode changed.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves into the toolbar (one stop), then into the text box."],
        ["Left arrow / Right arrow", "Moves between toolbar buttons."],
        ["Home / End", "Moves to the first or last toolbar button."],
        ["Ctrl+B / Ctrl+I / Ctrl+U", "Bold, italic, underline."],
        ["Ctrl+Shift+S", "Strikethrough."],
        ["Ctrl+Shift+7 / Ctrl+Shift+8", "Ordered list, bullet list."],
        ["Ctrl+Shift+L / E / R / J", "Align left, center, right, justify."],
        ["Ctrl+E / Ctrl+Alt+C", "Code, code block."],
        ["Ctrl+Shift+B", "Blockquote."],
        ["Shift+Enter", "Line break."],
        ["Ctrl+Shift+X", "Clear formatting."],
        ["Ctrl+Z / Ctrl+Shift+Z", "Undo, redo."],
        [
          "Tab / Shift+Tab (fullscreen)",
          "Stays inside the editor, wrapping from the last stop to the first.",
        ],
        ["Escape", "Leaves fullscreen mode."],
      ]}
    />
  ),
};

/** Editor docs page (ADR-0019). */
export function EditorDocs() {
  return <GuideDocs sections={editorSections} previews={PREVIEWS} />;
}
