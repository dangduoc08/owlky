import { defineConfig } from "vite";

// Builds only the IIFE bundles for <script> / CDN use. The npm ESM output comes from tsc.
// `vite build` → owlky.js (runtime + components); `vite build --mode editor` → owlky-editor.js
// (the Editor and Tiptap, ADR-0023; loaded after owlky.js, it shares its runtime).
export default defineConfig(({ mode }) => {
  const editor = mode === "editor";
  return {
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: true,
      target: ["chrome114", "edge114", "firefox128", "safari17"],
      lib: {
        entry: editor ? "src/cdn-editor.ts" : "src/cdn.ts",
        formats: ["iife"],
        name: editor ? "OwlkyEditorBundle" : "OwlkyBundle",
        fileName: () => (editor ? "owlky-editor.js" : "owlky.js"),
      },
    },
  };
});
