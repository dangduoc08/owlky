/**
 * Stands in for the `monaco-editor` package in `owlky-code-editor.js` (vite.config.ts): the CDN
 * file loads Monaco from `paths.vs` (`dist/monaco/`), so importing the package means the loader
 * was configured without a path.
 */
export default undefined;
throw new Error("owlky-code-editor.js loads Monaco from paths.vs (dist/monaco/).");
