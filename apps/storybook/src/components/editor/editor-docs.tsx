import { editorOptions } from "@owlky/core";
import editorApi from "@owlky/docs-content/api/editor.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Editor } from "@owlky/react";
import bubbleGroup from "../../../../../packages/html/src/components/editor/examples/bubble-menu-group.html?raw";
import editorGroup from "../../../../../packages/html/src/components/editor/examples/editor-group.html?raw";
import mentionsGroup from "../../../../../packages/html/src/components/editor/examples/mentions-group.html?raw";
import tableGroup from "../../../../../packages/html/src/components/editor/examples/table-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";

const EDITOR = snippetElement(editorGroup, "data-ok-editor data-ok-full-item");

/** The CDN setup: owlky.js loads the editor's module when the page holds one. */
const CDN_EDITOR = `<!-- Load once per page: owlky.js loads the editor when the page holds one -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>`;

/** `editor` with the hidden form input as its last child. */
function withInput(editor: string, name: string) {
  const lines = editor.split("\n");
  lines.splice(lines.length - 1, 0, `  <input type="hidden" data-ok-editor-input name="${name}">`);
  return lines.join("\n");
}

/** The full editor of the snippet, with its own ids, label, root attributes and content. */
function htmlEditor({
  id,
  label,
  attrs = "data-ok-full-item",
  content = "<p>Write your notes here.</p>",
  helper,
}: {
  id: string;
  label: string;
  attrs?: string;
  content?: string;
  helper?: string;
}) {
  const lines = EDITOR.replaceAll('id="editor-', `id="${id}-`)
    .replaceAll('"editor-', `"${id}-`)
    .replace("<div data-ok-editor data-ok-full-item>", `<div data-ok-editor ${attrs}>`)
    .replace(
      'aria-label="Content">',
      `aria-label="${label}"${helper ? ` aria-describedby="${id}-help"` : ""}>`,
    )
    .split("\n");
  const open = lines.findIndex((line) => line.includes("data-ok-editor-content"));
  const indent = (lines[open] as string).search(/\S/);
  const close = lines.findIndex(
    (line, i) => i > open && line.startsWith(`${" ".repeat(indent)}</div>`),
  );
  lines.splice(open + 1, close - open - 1, `${" ".repeat(indent + 2)}${content}`);
  const body = lines.findIndex((line) => line.includes("data-ok-editor-body"));
  const bodyEnd = lines.findIndex((line, i) => i > body && line.startsWith("  </div>"));
  if (helper)
    lines.splice(bodyEnd + 1, 0, `  <p data-ok-editor-helper id="${id}-help">${helper}</p>`);
  return lines.join("\n");
}

export const editorSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "The editor lets people write formatted text: headings, bold and italic text, lists, alignment, quotes, code, links and images. It is built on Tiptap, a framework-free editing engine, so both versions share the same behavior and markup. A toolbar sits above a text box that people type in, and the content is HTML.\n\nPages without an editor don't download the editing engine. On a CDN page, `owlky.js` loads the editor when the page holds one. With a bundler, import `@owlky/html/editor` after `@owlky/html/auto`.",
    html: `${CDN_EDITOR}

${htmlEditor({ id: "notes", label: "Notes", content: "<p>The initial content is the markup inside this element.</p>" })}`,
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
    html: htmlEditor({ id: "article", label: "Article" }),
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

  // In a bundled app, register this editor instead of importing "@owlky/html/editor"
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
    html: `${htmlEditor({ id: "summary", label: "Summary", attrs: "data-ok-full-item data-ok-error", content: "<p></p>", helper: "Write at least one sentence." })}

${htmlEditor({ id: "preview", label: "Preview", attrs: 'data-ok-full-item data-ok-editable="false"', content: "<p>The release ships on Monday.</p>" })}`,
    react: `import { Editor } from "@owlky/react";

export function EditorStates() {
  return (
    <>
      <Editor aria-label="Summary" error helperText="Write at least one sentence." />
      <Editor aria-label="Preview" editable={false} value="<p>The release ships on Monday.</p>" />
    </>
  );
}`,
  },
  {
    id: "bubble-menu",
    title: "Show a menu over selected text",
    body: 'A bubble menu is a small toolbar that appears over the text people select, so they can format it without moving to the main toolbar. In React, set `bubbleMenu` to `true` for bold, italic, underline, strikethrough, code and link, or pass `{ actions }` to choose the buttons. `placement` puts it on another side of the selection, `updateDelay` sets how long it waits after the selection stops changing (250 milliseconds by default), and `shouldShow` decides when it appears. In HTML, add the bubble menu\'s markup to the editor: a popover with the toolbar buttons, marked `data-ok-runtime="off"` because the editor runs it. Keyboard users press Alt+F10 in the text to move to the menu, and Escape to come back with the selection unchanged.',
    html: `${CDN_EDITOR}

${snippetElement(bubbleGroup, 'id="bubble-editor"')}`,
    react: `import { Editor } from "@owlky/react";

export function Notes() {
  return (
    <Editor
      aria-label="Notes"
      defaultValue="<p>Select some text to format it.</p>"
      bubbleMenu={{ actions: ["bold", "italic", "link"], placement: "bottom" }}
    />
  );
}`,
  },
  {
    id: "tables",
    title: "Add tables",
    body: "`tables` adds tables to the editor, with a **Table** button in the toolbar. Its menu inserts a table of three rows and three columns with a header row. It also adds and deletes rows and columns, turns the header row or column on and off, merges and splits cells, and deletes the table. Items that can't run where the caret is are disabled. Tab and Shift+Tab move between cells. Without `tables`, table markup in the content is dropped, as before.",
    html: `${CDN_EDITOR}

${snippetElement(tableGroup, 'id="table-editor"')}`,
    react: `import { Editor } from "@owlky/react";

const PLAN =
  "<table><tbody><tr><th><p>Phase</p></th><th><p>Owner</p></th></tr>" +
  "<tr><td><p>Design</p></td><td><p>Ada</p></td></tr></tbody></table>";

export function Plan() {
  return <Editor aria-label="Plan" tables defaultValue={PLAN} />;
}`,
  },
  {
    id: "mentions",
    title: "Mention people",
    body: 'Mentions turn a name typed after `@` into a link-like token. In React, pass `mentions` with an `items(query)` function that returns the matching items, each with an `id` and a `label`, or a promise of them. `char` changes the trigger character. While people type, a list of suggestions opens under the text. The arrow keys move through it, Enter or Tab picks an item, and Escape closes it. The chosen item becomes `<span data-type="mention" data-id="…" data-label="…">` in the HTML. In HTML, add the list\'s markup and a `<template data-ok-editor-mention-items>` with one `[data-ok-value]` element per item. The editor shows the items whose text contains the query. To look items up elsewhere, such as on a server, listen for `ok:editor:mentionsearch` and pass the items, or a promise of them, to `event.detail.respondWith()`.',
    html: `${CDN_EDITOR}

${snippetElement(mentionsGroup, 'id="mention-editor"')}

<script type="module">
  // Look people up on the server instead of in the template.
  const editor = document.getElementById("mention-editor");
  editor.addEventListener("ok:editor:mentionsearch", (event) => {
    const { query, respondWith } = event.detail;
    respondWith(
      fetch(\`/api/people?q=\${encodeURIComponent(query)}\`).then((response) => response.json()),
    );
  });
</script>`,
    react: `import { Editor, type EditorMentionItem } from "@owlky/react";

async function findPeople(query: string): Promise<EditorMentionItem[]> {
  const response = await fetch(\`/api/people?q=\${encodeURIComponent(query)}\`);
  return response.json();
}

export function Comment() {
  return <Editor aria-label="Comment" mentions={{ items: findPeople }} />;
}`,
  },
  {
    id: "tiptap",
    title: "Configure Tiptap",
    body: "The editor runs on Tiptap, and you can pass Tiptap's settings through. `extensions` adds Tiptap extensions after the built-in ones, such as a character count. An extension with the name of a built-in one, such as `image`, replaces it. Extensions can accept new kinds of content, so only add ones you trust. `editorProps` passes ProseMirror props, merged with the editor's own, and `parseOptions` sets how content is parsed, such as keeping whitespace. These three are read when the editor starts: in React, change the component's `key` to start it again with new ones. In HTML, pass them to `createEditor()`. `autofocus` puts the caret in the editor when it starts, `textDirection` sets `ltr`, `rtl` or `auto`, and `enableInputRules` and `enablePasteRules` turn off the Markdown-like shortcuts, such as `# ` for a heading.",
    html: `${htmlEditor({ id: "draft", label: "Draft", attrs: 'data-ok-full-item data-ok-autofocus="end" data-ok-text-direction="auto" data-ok-enable-input-rules="false"' })}

<script type="module">
  import { createEditor, getRuntime } from "@owlky/html";
  import { CharacterCount } from "@tiptap/extensions";

  getRuntime()
    .register(
      createEditor({
        extensions: [CharacterCount.configure({ limit: 500 })],
        editorProps: { attributes: { spellcheck: "false" } },
        parseOptions: { preserveWhitespace: "full" },
      }),
    )
    .start();
</script>`,
    react: `import { Editor } from "@owlky/react";
import { CharacterCount } from "@tiptap/extensions";

const extensions = [CharacterCount.configure({ limit: 500 })];

export function Draft() {
  return (
    <Editor
      aria-label="Draft"
      extensions={extensions}
      editorProps={{ attributes: { spellcheck: "false" } }}
      autofocus="end"
      textDirection="auto"
      enableInputRules={false}
    />
  );
}`,
  },
  {
    id: "tiptap-events",
    title: "Use the Tiptap editor and its events",
    body: `You can reach the Tiptap editor itself for anything the component doesn't offer, such as its commands, \`isEmpty\` or \`on()\`. In React, pass \`editorRef\`: it receives the editor once it exists and \`null\` when it is destroyed. \`onCreate\` also receives it when the editor is ready. In HTML, the instance's \`editor\` is the Tiptap editor. \`getJSON()\` and \`getText()\` return the content as ProseMirror JSON and as plain text.

Tiptap's events reach you as props in React and as \`ok:editor:*\` events in HTML:
- **Life cycle:** \`onBeforeCreate\`, \`onCreate\` and \`onDestroy\`. In HTML, \`ok:editor:beforecreate\`, \`ok:editor:create\` and \`ok:editor:destroy\`.
- **Focus:** \`onEditorFocus\` and \`onEditorBlur\` fire when the focus enters or leaves the text. The root's \`onFocus\` and \`onBlur\` fire for every part, such as the toolbar. In HTML, \`ok:editor:focus\` and \`ok:editor:blur\`.
- **Changes:** \`onSelectionUpdate\`, \`onTransaction\` and \`onDelete\`. In HTML, \`ok:editor:selectionupdate\`, \`ok:editor:transaction\` and \`ok:editor:delete\`. For the content as HTML, use \`onChange\` and \`ok:editor:change\`.
- **Clipboard and dragging:** \`onEditorPaste\` and \`onEditorDrop\`. In HTML, \`ok:editor:paste\` and \`ok:editor:drop\`, with the pasted or dropped text in \`detail.text\`.
- **Invalid content:** with \`enableContentCheck\`, content that the editor doesn't support calls \`onContentError\` (HTML: \`ok:editor:contenterror\`, with \`detail.message\`). The initial content loads without the parts it doesn't support, and a new value with such parts is refused. Without the check, those parts are dropped silently.

React handlers receive Tiptap's own arguments. HTML events carry plain values instead, such as positions and text.`,
    html: `${htmlEditor({ id: "notes", label: "Notes", attrs: "data-ok-full-item data-ok-enable-content-check" })}
<p id="notes-status" aria-live="polite"></p>

<script>
  const notes = document.getElementById("notes-content").closest("[data-ok-editor]");
  const status = document.getElementById("notes-status");
  // Count the characters when the editor is ready and when the focus leaves the text
  const count = () => {
    const editor = window.Owlky.get(notes, "editor");
    status.textContent = \`\${editor.getText().length} characters\`;
  };
  notes.addEventListener("ok:editor:create", count);
  notes.addEventListener("ok:editor:blur", count);
  notes.addEventListener("ok:editor:contenterror", (event) => {
    status.textContent = \`Some content isn't supported: \${event.detail.message}\`;
  });
</script>`,
    react: `import { Editor, type TiptapEditor } from "@owlky/react";
import { useRef, useState } from "react";

export function Notes() {
  const editorRef = useRef<TiptapEditor | null>(null);
  const [status, setStatus] = useState("");
  const count = () => setStatus(\`\${editorRef.current?.getText().length ?? 0} characters\`);
  return (
    <>
      <Editor
        aria-label="Notes"
        fullItem
        editorRef={editorRef}
        enableContentCheck
        onCreate={count}
        onEditorBlur={count}
        onContentError={({ error }) => setStatus(\`Some content isn't supported: \${error.message}\`)}
      />
      <p aria-live="polite">{status}</p>
    </>
  );
}`,
  },
  {
    id: "form",
    title: "Submit the content with a form",
    body: '`name` lets the editor take part in a form: a hidden input with that name holds the content as HTML, kept up to date after every change. In HTML, add `<input type="hidden" data-ok-editor-input name="…">` as the last child of the editor. Check the HTML on the server before you store or show it, as you would for any form field.',
    html: `<form method="post" action="/posts">
${withInput(htmlEditor({ id: "post", label: "Post" }), "body")
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n")}
  <button type="submit" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Publish</span></button>
</form>`,
    react: `import { Button, Editor } from "@owlky/react";

export function NewPost() {
  return (
    <form method="post" action="/posts">
      <Editor aria-label="Post" name="body" fullItem />
      <Button type="submit" variant="contained" color="primary">
        Publish
      </Button>
    </form>
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
- **\`ok:editor:mentionsearch\`** fires when the mention list needs items, with \`detail.query\`, \`detail.char\`, the template's matches in \`detail.items\` and \`detail.respondWith(items)\`.
- **Tiptap's events:** \`ok:editor:beforecreate\`, \`create\` (\`detail.value\`), \`focus\` and \`blur\` (\`detail.event\`), \`selectionupdate\` (\`detail.from\`, \`detail.to\`, \`detail.empty\`), \`transaction\` (\`detail.docChanged\`), \`paste\` (\`detail.text\`), \`drop\` (\`detail.text\`, \`detail.moved\`), \`delete\` (\`detail.type\`, \`detail.name\`, \`detail.from\`, \`detail.to\`, \`detail.partial\`), \`contenterror\` (\`detail.message\`) and \`destroy\`.
- **Instance:** \`runtime.get(element, "editor")\` returns \`{ value, setValue(html), fullscreen, setFullscreen(on), setEditable(on), focus(), getJSON(), getText(), editor, controller }\`. \`editor\` is the Tiptap editor.
- **React:** \`onChange(value)\`, \`onFullscreenChange(fullscreen)\`, \`editorRef\` and Tiptap's events as props: \`onBeforeCreate\`, \`onCreate\`, \`onEditorFocus\`, \`onEditorBlur\`, \`onSelectionUpdate\`, \`onTransaction\`, \`onEditorPaste\`, \`onEditorDrop\`, \`onDelete\`, \`onContentError\` and \`onDestroy\`.
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
- Fullscreen mode can always be left with Escape. While it is on, Tab moves between the toolbar and the text box only, so focus never reaches controls hidden behind the editor.
- Alt+F10 moves from the text to the bubble menu when it shows, else to the toolbar, so keyboard users reach the formatting buttons without a pointer.
- The mention list is a listbox. Focus stays in the text while people choose, and the text box points at the highlighted item with \`aria-activedescendant\`, so screen readers read it.`,
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
        {
          react: "bubbleMenu",
          html: "div[data-ok-editor-bubble-menu] (data-ok-placement, data-ok-update-delay)",
          type: "boolean | { actions, placement, updateDelay, shouldShow, label }",
          description: "A toolbar over selected text.",
        },
        {
          react: "mentions",
          html: "div[data-ok-editor-mentions] (data-ok-char) · template[data-ok-editor-mention-items]",
          type: "{ items(query), char, allowSpaces, label }",
          description: "Suggestions after `@`; the chosen item becomes a mention.",
        },
        {
          react: "extensions / editorProps / parseOptions",
          html: "createEditor({ extensions, editorProps, parseOptions })",
          type: "Tiptap extensions / ProseMirror props / parse options",
          description: "Tiptap settings, read when the editor starts.",
        },
        {
          react: "name",
          html: "input[type=hidden][data-ok-editor-input][name]",
          type: "string",
          description: "Submits the HTML value with the form.",
        },
        {
          react: "editorRef / onCreate",
          html: "instance editor · ok:editor:create",
          type: "Ref<TiptapEditor | null>",
          description: "The Tiptap editor, once it exists.",
        },
        {
          react: "onEditorFocus / onEditorBlur / onSelectionUpdate / onTransaction / onDelete",
          html: "ok:editor:focus · blur · selectionupdate · transaction · delete",
          type: "(props) => void",
          description: "Tiptap's events, with Tiptap's arguments.",
        },
        {
          react: "onEditorPaste / onEditorDrop / onBeforeCreate / onDestroy",
          html: "ok:editor:paste · drop · beforecreate · destroy",
          type: "(props) => void",
          description: "Pasted or dropped content, and the editor's life cycle.",
        },
        {
          react: "onContentError",
          html: "ok:editor:contenterror",
          type: "(props) => void",
          description: "Content the editor doesn't support, with `enableContentCheck`.",
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
        ["Alt+F10", "Moves from the text to the bubble menu when it shows, else to the toolbar."],
        ["Escape (bubble menu)", "Goes back to the text, keeping the selection."],
        ["Down arrow / Up arrow (mention list)", "Moves through the suggestions."],
        ["Enter / Tab (mention list)", "Inserts the highlighted suggestion."],
        ["Escape (mention list)", "Closes the suggestions."],
        ["Tab / Shift+Tab (table)", "Moves to the next or previous cell."],
      ]}
    />
  ),
};

/** Editor docs page (ADR-0019). */
export function EditorDocs() {
  return <GuideDocs sections={editorSections} previews={PREVIEWS} />;
}
