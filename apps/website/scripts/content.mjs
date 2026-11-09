// Loads the website's content modules (src/content/*.ts) in Node, for the build scripts: Node
// strips the types; this hook maps the `.js` specifiers of TypeScript sources to their `.ts` files.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const root = resolve(app, "../..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\.?\/.*\.js$/.test(specifier) && context.parentURL?.endsWith(".ts")) {
      const ts = new URL(specifier.replace(/\.js$/, ".ts"), context.parentURL);
      if (existsSync(fileURLToPath(ts))) return nextResolve(ts.href, context);
    }
    return nextResolve(specifier, context);
  },
});

/** A module of src/content/ (`site.ts`: `{ SITE, PAGES }`). */
export const loadContent = (file) => import(pathToFileURL(join(app, "src/content", file)).href);

/** Fails with a hint when the packages haven't been built (the website consumes `dist`). */
export function requireBuild() {
  for (const file of [
    "packages/html/dist/owlky.js",
    "packages/styles/dist/owlky.css",
    "packages/react/dist/index.js",
  ])
    if (!existsSync(join(root, file))) {
      console.error(`website: ${file} is missing. Run \`pnpm build\` first.`);
      process.exit(1);
    }
}
