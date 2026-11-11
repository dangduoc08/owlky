import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "vite";

// Builds only the IIFE bundles for <script> / CDN use. The npm ESM output comes from tsc.
// `vite build` → owlky.js (runtime + components); `vite build --mode editor` → owlky-editor.js
// (the Editor and Tiptap, ADR-0023; loaded after owlky.js, it shares its runtime).
// `--mode markdown` → owlky-markdown.js (Markdown and unified, ADR-0035; loaded after owlky.js).
// `--mode phone` → owlky-phone.js (the phone input and libphonenumber-js, ADR-0061; after owlky.js).
// `--mode illustrations` → owlky-illustrations.js (the illustration set and its runtime, ADR-0041).
// `--mode map` → owlky-map.js (the Map and MapLibre, ADR-0025; loaded after owlky.js too).
// The Code editor (ADR-0034): `--mode code-editor` → owlky-code-editor.js (the runtime definitions
// and the loader, without Monaco), `--mode monaco` → monaco/monaco.js + monaco.css (the engine, an
// ES module the loader imports on demand), `--mode monaco-workers` → monaco/*.worker.js.
const TARGET = ["chrome114", "edge114", "firefox128", "safari17"];
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const iife = (entry: string, name: string, file: string, extra: UserConfig = {}): UserConfig => ({
  ...extra,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    target: TARGET,
    lib: { entry, formats: ["iife"], name, fileName: () => file },
  },
});

export default defineConfig(({ mode }): UserConfig => {
  if (mode === "editor")
    return iife("src/cdn-editor.ts", "OwlkyEditorBundle", "owlky-editor.js", {
      // Tiptap's Suggestion only positions with Floating UI in a helper the mention list doesn't
      // use (ADR-0050): about 6 kB gzip less.
      resolve: {
        alias: [{ find: /^@floating-ui\/dom$/, replacement: local("src/floating-ui-stub.ts") }],
      },
    });
  if (mode === "markdown")
    return iife("src/cdn-markdown.ts", "OwlkyMarkdownBundle", "owlky-markdown.js");
  if (mode === "phone") return iife("src/cdn-phone.ts", "OwlkyPhoneBundle", "owlky-phone.js");
  if (mode === "illustrations")
    return iife("src/cdn-illustrations.ts", "OwlkyIllustrationsBundle", "owlky-illustrations.js");
  if (mode === "map")
    return iife("src/cdn-map.ts", "OwlkyMapBundle", "owlky-map.js", {
      // MapLibre finds its worker from `import.meta.url`, which an IIFE lacks: cdn-map.ts sets the
      // worker URL from the script's own URL instead.
      define: { "import.meta.url": "undefined" },
    });
  if (mode === "code-editor")
    return iife("src/cdn-code-editor.ts", "OwlkyCodeEditorBundle", "owlky-code-editor.js", {
      // The loader imports Monaco from `paths.vs` at runtime: keep the package out of this file.
      resolve: {
        alias: [{ find: /^monaco-editor(\/.*)?$/, replacement: local("src/monaco-stub.ts") }],
      },
    });
  if (mode === "monaco" || mode === "monaco-workers") {
    const workers = mode === "monaco-workers";
    return {
      // Monaco's own worker wiring (`new Worker(new URL(…))`) is replaced by the loader's
      // `getWorker` (the files below): don't bundle it a second time.
      plugins: [
        {
          name: "owlky-monaco-workers",
          transform(code, id) {
            if (!/monaco-editor[\\/]esm[\\/]/.test(id)) return null;
            const next = code
              .replace(
                /new Worker\(new URL\((['"])[^'"]+\.worker\.js\1, import\.meta\.url\)(, \{[^}]*\})?\)/g,
                "null /* Owlky: MonacoEnvironment.getWorker */",
              )
              .replace(
                /new URL\((['"])[^'"]*editorWebWorkerMain\.js\1, import\.meta\.url\)/g,
                "undefined /* Owlky: MonacoEnvironment.getWorker */",
              );
            return next === code ? null : { code: next, map: null };
          },
        },
      ],
      build: {
        outDir: "dist/monaco",
        emptyOutDir: false,
        sourcemap: false,
        // Library builds keep whitespace by default; this is a shipped asset.
        minify: true,
        target: TARGET,
        cssCodeSplit: false,
        lib: workers
          ? {
              entry: {
                "editor.worker": local("node_modules/monaco-editor/esm/vs/editor/editor.worker.js"),
                "json.worker": local(
                  "node_modules/monaco-editor/esm/vs/language/json/json.worker.js",
                ),
                "css.worker": local("node_modules/monaco-editor/esm/vs/language/css/css.worker.js"),
                "html.worker": local(
                  "node_modules/monaco-editor/esm/vs/language/html/html.worker.js",
                ),
                "typescript.worker": local(
                  "node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
                ),
              },
              formats: ["es"],
              fileName: (_format, name) => `${name}.js`,
            }
          : {
              entry: "src/monaco.ts",
              formats: ["es"],
              fileName: () => "monaco.js",
              cssFileName: "monaco",
            },
        rollupOptions: {
          output: {
            minify: true,
            chunkFileNames: workers ? "workers/[name]-[hash].js" : "chunks/[name]-[hash].js",
            // Library builds inline fonts and images (data: URLs); the one CSS file is monaco.css.
            assetFileNames: "[name][extname]",
          },
        },
      },
    };
  }
  return iife("src/cdn.ts", "OwlkyBundle", "owlky.js");
});
