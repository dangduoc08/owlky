import { defineConfig } from "vite";

// Builds only the IIFE bundle for <script> / CDN use. The npm ESM output comes from tsc.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    target: ["chrome114", "edge114", "firefox128", "safari17"],
    lib: {
      entry: "src/cdn.ts",
      formats: ["iife"],
      name: "OwlkyBundle",
      fileName: () => "owlky.js",
    },
  },
});
