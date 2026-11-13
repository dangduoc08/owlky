/**
 * Stands in for the `monaco-editor` package in the Code editor's lazy module,
 * `modules/code-editor.js` (vite.config.ts): the CDN file loads Monaco from `paths.vs`
 * (`dist/monaco/`), so importing the package means the loader was configured without a path.
 */
export default undefined;
throw new Error("The code editor module loads Monaco from paths.vs (dist/monaco/).");
