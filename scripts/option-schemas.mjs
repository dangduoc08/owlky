// The option schemas of the built @owlky/core with their descriptions (ADR-0068 §4): the built
// schemas carry none at run time, so the docs come from dist/option-docs.json. Run after
// `pnpm build`. Read by spec-options.mjs, api-reference.mjs, manifest.mjs and size-report.mjs.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "../packages/core/dist");
const core = await import(pathToFileURL(join(dist, "index.js")).href);

/** `@owlky/core/option-docs.json`: descriptions by schema name and option key. */
export const optionDocs = JSON.parse(readFileSync(join(dist, "option-docs.json"), "utf8"));

/** Core's `optionSchemas`, each with its descriptions. */
export const optionSchemas = Object.fromEntries(
  Object.entries(core.optionSchemas).map(([key, schema]) => [
    key,
    core.describeOptions(schema, optionDocs),
  ]),
);
