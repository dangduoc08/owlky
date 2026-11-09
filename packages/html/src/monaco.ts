/**
 * The engine module of `dist/monaco/` (ADR-0034): Monaco, built as one ES module with its CSS in
 * `monaco.css`. The Code editor's loader imports it from `paths.vs` on demand; never imported by
 * the npm entries (they import the `monaco-editor` package).
 */
export * from "monaco-editor";
