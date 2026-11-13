# ADR-0034: Code editor — Monaco behind opt-in entries, self-hosted, with its own CSP

**Status:** Accepted (2026-11-08, auto-approved in `/component`).

**Note (2026-11-13, ADR-0068 S6):** `owlky-code-editor.js` was removed before 0.1.0. On a CDN page, `owlky.js` loads this component from its lazy module (`modules/code-editor.js`) when the page holds one; the text below keeps the original decision.

## Context
The reference (`https://monaco-react.surenatoyan.com/`) is the demo of `@monaco-editor/react`
(MIT): an `Editor` and a `DiffEditor` around Monaco (the editor of VS Code, MIT), a `useMonaco`
hook and a `loader` that fetches Monaco from a CDN (`@monaco-editor/loader`, jsDelivr by
default). Monaco itself is framework-free, so it is the upstream HTML version too; the owner chose
to build both implementations from it (2026-11-08). A code editor (tokenizer, model, view,
language workers) can't be written again. Monaco is large (about 1 MB gzip for the editor, more
for the TypeScript worker), needs web workers, injects `<style>` elements and creates Trusted
Types policies, so it needs the Editor's treatment (ADR-0023) and more.

## Decision
1. **`monaco-editor` is a dependency of `@owlky/core`**, pinned exactly (0.57.0, the newest
   release at least 14 days old; `marked` and `dompurify` come with it). Renovate bumps it.
2. **One controller pair in core**, entry `@owlky/core/code-editor` (not re-exported from
   `@owlky/core`): `createCodeEditorController` / `createDiffEditorController` mount Monaco on
   the content part with `@monaco-editor/react`'s model rules (`path` names a model, view states
   per path, `value` as an undoable edit, markers → `onValidate`, `keepCurrent*Model`). React
   (`CodeEditor`, `DiffEditor`, `useMonaco`, `loader`) and the HTML runtimes (`code-editor`,
   `diff-editor`) are thin owners. React doesn't use `@monaco-editor/react`; no source is copied.
3. **Loader without a CDN.** `loader` mirrors `@monaco-editor/loader` (`config`, `init` →
   cancelable promise, `getMonaco`) but never fetches from a third party by default:
   - npm (bundlers): `import("monaco-editor")`, a lazy chunk. Workers: Monaco 0.57 wires them
     for bundlers itself; `loader.config({ getWorker })` takes the bundler's own worker imports
     (Vite: `?worker`) when that wiring doesn't fit.
   - `paths.vs` (the `@monaco-editor/loader` name): a folder of **Owlky's Monaco build**,
     `@owlky/html/dist/monaco/` — `monaco.js` (ES module + lazy language chunks), `monaco.css`
     (fonts and images inlined as `data:`), `editor|json|css|html|typescript.worker.js` (module
     workers) and `nls/<lang>.js`. Consumers self-host that folder (same origin: workers can't
     be cross-origin). `owlky-code-editor.js` uses the `monaco/` folder next to itself, or the
     script's `data-ok-monaco-path`.
   - `monaco`: an instance already imported. `"vs/nls"`: Monaco's UI language.
4. **Separate entries.** `@owlky/html/code-editor` and `owlky-code-editor.js` register both
   definitions; they are not in `components` (`OPT_IN`), `owlky.js` or `@owlky/html/auto`.
   `owlky-code-editor.js` holds no Monaco (the build aliases `monaco-editor` to a stub): it imports
   `monaco.js` on demand. Each gets its own size budget.
5. **Globals (exception to ADR-0007).** Monaco reads `globalThis.MonacoEnvironment` (workers,
   Trusted Types) and `_VSCODE_NLS_*` (messages). The loader writes `MonacoEnvironment.getWorker`
   only when the page has no `getWorker` / `getWorkerUrl` of its own; the message files set the
   `_VSCODE_NLS_*` globals. Nothing else is global; view states and the theme registry are
   module-scoped.
6. **Themes.** `theme="auto"` (default; upstream's default is `"light"`) applies `owlky-light` /
   `owlky-dark`, built at mount from the `--ok-*` tokens of the editor's scope (a probe with
   `data-ok-theme` reads each scheme, presets included; syntax colors are the AA `-text` tones).
   Monaco has **one theme per page**: the editor focused, mounted or re-themed last picks it, and
   changes of `data-ok-theme`, `data-ok-preset`, `.dark` on the root and the system scheme re-apply
   it. Nested scopes therefore work for one editor at a time (documented). Other names
   (`vs-dark`, `light`, themes defined in `beforeMount`) go to Monaco unchanged.
7. **CSP and Trusted Types.** Owlky's own code sets no style strings and uses no HTML sinks; the
   worker URLs go through an `owlky-code-editor` policy that only accepts files under `paths.vs`.
   Monaco needs, and the docs list: `style-src 'unsafe-inline'` (its theme and decorations are
   `<style>` text, no nonce support), `font-src` / `img-src data:` (inlined codicon font),
   `worker-src 'self'`, and the Trusted Types policy names `owlky-code-editor
   defaultWorkerFactory diffEditorWidget diffReview domLineBreaksComputer editorGhostText
   editorViewLayer richScreenReaderContent standaloneColorizer stickyScrollViewLayer
   tokenizeToString dompurify 'allow-duplicates'`. `examples/csp/code-editor.html` checks that
   policy (e2e); the strict page (`examples/csp/index.html`) stays without the code editor.
8. **No JavaScript, failures.** The markup carries the value in a `<textarea>` (the form value,
   and the editor without JavaScript); if Monaco can't load, the status becomes `error` and the
   textarea is shown again (`onError`, `ok:code-editor:error`).

## Consequences
- Every `@owlky/core` install pulls `monaco-editor` (about 100 MB unpacked; only code editor
  pages load it). The HTML package ships the `monaco/` folder (about 13 MB, 1 MB gzip for the
  editor and 1.4 MB for the TypeScript worker), loaded only on demand.
- Parity compares Owlky's anatomy, not Monaco's DOM (instance ids, measured layout); pixels are
  compared with Monaco's cursor hidden.
- Monaco's look inside the canvas (widgets, codicons) is Monaco's, colored by the Owlky themes.
- Monaco doesn't support mobile browsers officially: touch works for reading and simple edits.
