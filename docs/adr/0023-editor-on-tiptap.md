# ADR-0023: Editor — Tiptap as the first runtime dependency, behind its own entry points

**Status:** Accepted (2026-11-08).

## Context
The reference's "Editor" page is a rich text editor built on Tiptap (ProseMirror). A
contenteditable editor (schema, transactions, selection, input handling, undo history, paste
rules) is far too large and subtle to write again. Tiptap 3 is MIT licensed and framework-free:
`@tiptap/core` runs in plain JavaScript, and `@tiptap/react` is only a wrapper. The owner asked to
use the upstream component when it has a framework-free version (2026-11-08). Owlky had no runtime
dependency so far (AGENTS.md: none without an ADR).

## Decision
1. **Tiptap is a dependency of `@owlky/core`**, pinned exactly (`@tiptap/core`, `pm`,
   `starter-kit`, `extension-code-block`, `extension-text-align`, `extension-image`,
   `extensions`; 3.32.0, the newest release at least 14 days old). Renovate bumps them together.
2. **One controller in core** (`createEditorController`, entry `@owlky/core/editor`) mounts Tiptap
   on the content element itself (`element: { mount }`), so React and HTML render the same DOM.
   React doesn't use `@tiptap/react`. The controller reports state; owners render the toolbar.
3. **Separate entry points.** `@owlky/core/editor` is not re-exported from `@owlky/core`; the HTML
   `editor` definition is not in `components` (not in `@owlky/html/auto` or `owlky.js`). Pages opt
   in with `@owlky/html/editor` or `owlky-editor.js` (an IIFE loaded after `owlky.js`, registered on
   the same runtime). React's `Editor` is tree-shaken when unused (`sideEffects: false`).
4. **CSP and Trusted Types.** Tiptap's injected `<style>` (written with `innerHTML`) is turned off;
   its rules live in `editor.css`. HTML content is parsed from the DOM, not from a string. String
   values (React `value`, `setValue`) go through Tiptap's `DOMParser` use: documented for pages
   that enforce Trusted Types.
5. **No grammar bundled.** Syntax highlighting takes a lowlight-compatible `highlighter` from the
   consumer (Owlky's own decoration plugin and language menu), like ADR-0022's adapters.
6. **URLs are checked by Owlky** (`safeEditorUrl`) on top of Tiptap's link validation.

## Consequences
- Every Owlky install pulls ProseMirror (about 125 kB gzip when bundled), but only editor pages
  load it. `owlky-editor.js` gets its own size budget.
- Tiptap's release cadence is fast: young transitive releases are held back with scoped
  `overrides` (removal dates noted), as for other dependencies.
- Tiptap's schema decides what content survives (a sanitizer by construction); new toolbar
  features mean new extensions here, React and HTML at once.
