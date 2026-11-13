import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "vite";

// Builds the CDN files. The npm ESM output comes from tsc.
// `vite build` → owlky.js (IIFE: the runtime, the light components and the loader, ADR-0068);
// `--mode modules` → modules/<name>.js (the lazy modules owlky.js loads, ES modules with shared
// chunks in modules/chunks/); `--mode esm` → owlky.mjs (owlky.js as one ES module, for `<script
// type="module">` pages). owlky.mjs is built on its own: built with the modules, it would pull
// the light components it shares with them into the shared chunks (about 11 kB gzip more in
// the chunks that owlky.js pages download, ADR-0068 S6 note).
// The Code editor (ADR-0034): `--mode monaco` → monaco/monaco.js + monaco.css (the engine, an ES
// module the Code editor's loader imports on demand), `--mode monaco-workers` → monaco/*.worker.js.
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

/** The lazy modules of `owlky.js` (ADR-0068): one ES module per `src/modules/*.ts`, shared chunks. */
const MODULES = Object.fromEntries(
  readdirSync(local("src/modules"))
    .filter((file) => file.endsWith(".ts"))
    .map((file) => [file.slice(0, -3), local(`src/modules/${file}`)]),
);

export default defineConfig(({ mode }): UserConfig => {
  if (mode === "modules")
    return {
      resolve: {
        alias: [
          // Tiptap's Suggestion only positions with Floating UI in a helper the mention list
          // doesn't use (ADR-0050): about 6 kB gzip less.
          { find: /^@floating-ui\/dom$/, replacement: local("src/floating-ui-stub.ts") },
          // The Code editor's loader imports Monaco from `paths.vs` at runtime (ADR-0034).
          { find: /^monaco-editor(\/.*)?$/, replacement: local("src/monaco-stub.ts") },
          // Modules join the runtime of the owlky.js that loaded them: no second `createRuntime`
          // (ADR-0068 S5).
          {
            find: /^\.\.\/runtime\/global\.js$/,
            replacement: local("src/runtime/global-module.ts"),
          },
        ],
      },
      build: {
        outDir: "dist/modules",
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
        target: TARGET,
        lib: { entry: MODULES, formats: ["es"], fileName: (_format, name) => `${name}.js` },
        rollupOptions: {
          output: { minify: true, chunkFileNames: "chunks/[name]-[hash].js" },
        },
      },
    };
  if (mode === "esm")
    return {
      build: {
        outDir: "dist",
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
        target: TARGET,
        lib: { entry: "src/cdn-module.ts", formats: ["es"], fileName: () => "owlky.mjs" },
        // Library builds keep whitespace by default; this is a shipped file.
        rollupOptions: { output: { minify: true } },
      },
    };
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
