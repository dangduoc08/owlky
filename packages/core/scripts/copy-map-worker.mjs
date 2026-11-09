// Copies MapLibre's worker into dist/map/worker.js (ADR-0025), the file `@owlky/core/map-worker.js`
// exports. Its source map isn't shipped, so the comment that points at it is dropped.
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const worker = join(
  dirname(require.resolve("maplibre-gl/package.json")),
  "dist",
  "maplibre-gl-worker.mjs",
);
const code = (await readFile(worker, "utf8")).replace(/\n\/\/# sourceMappingURL=\S+\s*$/, "\n");
await writeFile(join(root, "dist", "map", "worker.js"), code);
console.log("core: copied the MapLibre worker");
