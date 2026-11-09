import { defineConfig } from "vite";

// Builds only the IIFE bundles for <script> / CDN use. The npm ESM output comes from tsc.
// `vite build` → owlky.js (runtime + components); `vite build --mode editor` → owlky-editor.js
// (the Editor and Tiptap, ADR-0023) and `--mode map` → owlky-map.js (the Map and MapLibre,
// ADR-0025): loaded after owlky.js, they share its runtime.
const ENTRIES: Record<string, [entry: string, name: string, file: string]> = {
  editor: ["src/cdn-editor.ts", "OwlkyEditorBundle", "owlky-editor.js"],
  map: ["src/cdn-map.ts", "OwlkyMapBundle", "owlky-map.js"],
};

export default defineConfig(({ mode }) => {
  const [entry, name, file] = ENTRIES[mode] ?? ["src/cdn.ts", "OwlkyBundle", "owlky.js"];
  return {
    // MapLibre finds its worker from `import.meta.url`, which an IIFE lacks: cdn-map.ts sets the
    // worker URL from the script's own URL instead.
    define: mode === "map" ? { "import.meta.url": "undefined" } : {},
    build: {
      outDir: "dist",
      emptyOutDir: false,
      sourcemap: true,
      target: ["chrome114", "edge114", "firefox128", "safari17"],
      lib: {
        entry,
        formats: ["iife"],
        name,
        fileName: () => file,
      },
    },
  };
});
